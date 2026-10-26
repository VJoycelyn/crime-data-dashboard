import express, { type Request, type Response } from "express";
import { createServer as createViteServer } from "vite";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  AS_OF,
  DATA_START,
  FilterValidationError,
  type Filters,
  summarize,
  validateFilters,
} from "../shared/data.js";

const PORT = Number(process.env.PORT ?? 3000);
const HOST = "0.0.0.0";
const MODEL = "gpt-6-luna";
const AI_TIMEOUT_MS = 40_000;
const RATE_WINDOW_MS = 60 * 60 * 1000;
const RATE_LIMIT = 15;
const CACHE_TTL_MS = 10 * 60 * 1000;
const CACHE_LIMIT = 100;
const MAX_ACTIVE_AI = 2;

type Insight = {
  generatedAt: string;
  model: string;
  summary: string;
  observation: string;
  caveat: string;
  cached: boolean;
};

type CacheEntry = { createdAt: number; value: Insight };
const insightCache = new Map<string, CacheEntry>();
const requestTimes = new Map<string, number[]>();
let activeAi = 0;

function noStore(response: Response): void {
  response.setHeader("Cache-Control", "no-store");
}

function clientKey(request: Request): string {
  return request.ip || request.socket.remoteAddress || "unknown";
}

function consumeRateLimit(key: string): number | null {
  const now = Date.now();
  const current = (requestTimes.get(key) ?? []).filter(
    (timestamp) => now - timestamp < RATE_WINDOW_MS,
  );
  if (current.length >= RATE_LIMIT) {
    requestTimes.set(key, current);
    return Math.max(1, Math.ceil((current[0] + RATE_WINDOW_MS - now) / 1000));
  }
  current.push(now);
  requestTimes.set(key, current);
  return null;
}

function cacheKey(filters: Filters): string {
  return JSON.stringify(filters);
}

function getCached(key: string): Insight | null {
  const entry = insightCache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.createdAt >= CACHE_TTL_MS) {
    insightCache.delete(key);
    return null;
  }
  insightCache.delete(key);
  insightCache.set(key, entry);
  return { ...entry.value, cached: true };
}

function setCached(key: string, value: Insight): void {
  insightCache.delete(key);
  insightCache.set(key, { createdAt: Date.now(), value });
  while (insightCache.size > CACHE_LIMIT) {
    const oldest = insightCache.keys().next().value;
    if (oldest === undefined) break;
    insightCache.delete(oldest);
  }
}

function extractContent(payload: unknown): string | null {
  if (!payload || typeof payload !== "object") return null;
  const choices = (payload as { choices?: unknown }).choices;
  if (!Array.isArray(choices) || !choices[0] || typeof choices[0] !== "object")
    return null;
  const message = (choices[0] as { message?: unknown }).message;
  if (!message || typeof message !== "object") return null;
  const content = (message as { content?: unknown }).content;
  return typeof content === "string" && content.trim() ? content.trim() : null;
}

function parseJsonObject(content: string): Record<string, unknown> | null {
  const withoutFence = content
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "")
    .trim();
  try {
    const parsed: unknown = JSON.parse(withoutFence);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : null;
  } catch {
    const start = withoutFence.indexOf("{");
    const end = withoutFence.lastIndexOf("}");
    if (start < 0 || end <= start) return null;
    try {
      const parsed: unknown = JSON.parse(withoutFence.slice(start, end + 1));
      return parsed && typeof parsed === "object" && !Array.isArray(parsed)
        ? (parsed as Record<string, unknown>)
        : null;
    } catch {
      return null;
    }
  }
}

function validText(value: unknown, maximum: number): value is string {
  return (
    typeof value === "string" &&
    value.trim().length > 0 &&
    value.length <= maximum
  );
}

function contextFor(filters: Filters) {
  const summary = summarize(filters);
  return {
    scope: {
      from: filters.from,
      to: filters.to,
      category: filters.category,
      district: filters.district,
      severity: filters.severity,
      status: filters.status,
      searchApplied: Boolean(filters.search),
    },
    totals: {
      total: summary.total,
      closed: summary.closed,
      closureRate: summary.closureRate,
      open: summary.open,
      critical: summary.critical,
      previousTotal: summary.previousTotal,
      delta: summary.delta,
    },
    categories: summary.categories.map(({ name, count }) => ({ name, count })),
    districts: summary.districts,
    severity: summary.severity,
    statuses: summary.statuses,
    trend: summary.trend,
  };
}

function requestBody(
  context: ReturnType<typeof contextFor>,
  withSchema: boolean,
): Record<string, unknown> {
  const body: Record<string, unknown> = {
    model: MODEL,
    reasoning: { effort: "low" },
    max_completion_tokens: 1300,
    messages: [
      {
        role: "system",
        content: `You are an operations analyst for a fictional Northbridge crime dashboard. Use only the supplied aggregate counts; never invent facts, people, locations, causes, demographics, predictions, or individual guilt. Write plain text with no markdown. Return a concise 2-3 sentence summary, one short observation, and one short caveat. Explicitly say this is synthetic demo data and records are not convictions; do not recommend predictive policing or individual risk scoring. Mention that October 2026 is a partial month when the selected range ends at ${AS_OF}.`,
      },
      {
        role: "user",
        content: `Analyze this aggregate context. The data scope is synthetic and bounded to ${DATA_START} through ${AS_OF}.\n${JSON.stringify(context)}`,
      },
    ],
  };
  if (withSchema) {
    body.response_format = {
      type: "json_schema",
      json_schema: {
        name: "crime_dashboard_insight",
        strict: true,
        schema: {
          type: "object",
          properties: {
            summary: { type: "string" },
            observation: { type: "string" },
            caveat: { type: "string" },
          },
          required: ["summary", "observation", "caveat"],
          additionalProperties: false,
        },
      },
    };
  }
  return body;
}

async function callModel(
  body: Record<string, unknown>,
  timeoutMs: number,
): Promise<Record<string, unknown>> {
  const baseUrl = process.env.MANUS_API_URL?.replace(/\/+$/, "");
  const apiKey = process.env.MANUS_API_KEY;
  if (!baseUrl || !apiKey) throw new Error("AI service unavailable");
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(`${baseUrl}/v1/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    const text = await response.text();
    let payload: unknown;
    try {
      payload = JSON.parse(text);
    } catch {
      throw new Error("AI service returned invalid data");
    }
    if (
      !response.ok ||
      (payload && typeof payload === "object" && "error" in payload)
    )
      throw new Error("AI service rejected the request");
    return payload as Record<string, unknown>;
  } finally {
    clearTimeout(timer);
  }
}

async function generateInsight(
  filters: Filters,
  context: ReturnType<typeof contextFor>,
): Promise<Insight> {
  const deadline = Date.now() + AI_TIMEOUT_MS;
  let payload: Record<string, unknown>;
  try {
    payload = await callModel(
      requestBody(context, true),
      Math.max(1000, deadline - Date.now()),
    );
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError")
      throw new Error("AI service timed out");
    throw new Error("AI service unavailable");
  }
  let content = extractContent(payload);
  if (!content && Date.now() < deadline) {
    try {
      const retry = await callModel(
        requestBody(context, false),
        Math.max(1000, deadline - Date.now()),
      );
      content = extractContent(retry);
    } catch {
      throw new Error("AI service returned no insight");
    }
  }
  if (!content) throw new Error("AI service returned no insight");
  const parsed = parseJsonObject(content);
  if (
    !parsed ||
    !validText(parsed.summary, 1800) ||
    !validText(parsed.observation, 700) ||
    !validText(parsed.caveat, 1000)
  ) {
    throw new Error("AI service returned an invalid insight");
  }
  const partialMonth = filters.to === AS_OF;
  const requiredCaveat = `Synthetic demo data only; records are not convictions. No predictive policing, individual guilt, risk, or demographic analysis is supported.${partialMonth ? " October 2026 is a partial month through the selected cutoff and is not comparable with a full October." : ""}`;
  return {
    generatedAt: new Date().toISOString(),
    model: MODEL,
    summary: parsed.summary.trim(),
    observation: parsed.observation.trim(),
    caveat: `${parsed.caveat.trim()} ${requiredCaveat}`,
    cached: false,
  };
}

async function createApp() {
  const app = express();
  app.disable("x-powered-by");
  app.use(express.json({ limit: "12kb", strict: true }));

  app.get("/api/health", (_request, response) => {
    noStore(response);
    response.status(200).json({ ok: true });
  });

  app.post("/api/insights", async (request, response) => {
    noStore(response);
    const retryAfter = consumeRateLimit(clientKey(request));
    if (retryAfter !== null) {
      response.setHeader("Retry-After", String(retryAfter));
      response
        .status(429)
        .json({ error: "Insight rate limit exceeded", retryAfter });
      return;
    }
    try {
      const raw = request.body as { filters?: unknown };
      if (!raw || typeof raw !== "object" || !("filters" in raw)) {
        response
          .status(400)
          .json({ error: "Request body must include filters" });
        return;
      }
      const filters = validateFilters(raw.filters);
      const context = contextFor(filters);
      if (context.totals.total === 0) {
        response
          .status(400)
          .json({
            error:
              "No records match these filters; broaden the date or filter selection.",
          });
        return;
      }
      const key = cacheKey(filters);
      const cached = getCached(key);
      if (cached) {
        response.status(200).json(cached);
        return;
      }
      if (activeAi >= MAX_ACTIVE_AI) {
        response.setHeader("Retry-After", "10");
        response
          .status(429)
          .json({
            error: "Insight generation is busy; retry shortly",
            retryAfter: 10,
          });
        return;
      }
      activeAi += 1;
      try {
        const insight = await generateInsight(filters, context);
        setCached(key, insight);
        response.status(200).json(insight);
      } catch {
        response
          .status(503)
          .json({
            error:
              "AI insights are temporarily unavailable. Please retry shortly.",
          });
      } finally {
        activeAi -= 1;
      }
    } catch (error) {
      if (error instanceof FilterValidationError) {
        response.status(400).json({ error: error.message });
        return;
      }
      response.status(400).json({ error: "Invalid JSON request" });
    }
  });

  app.use("/api", (_request, response) => {
    noStore(response);
    response.status(404).json({ error: "API route not found" });
  });

  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
  if (process.env.NODE_ENV === "production") {
    const dist = path.join(root, "dist");
    app.use(express.static(dist));
    app.get("*", (_request, response) =>
      response.sendFile(path.join(dist, "index.html")),
    );
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true, host: HOST },
      appType: "spa",
    });
    app.use(vite.middlewares);
  }
  return app;
}

const app = await createApp();
app.listen(PORT, HOST, () => {
  console.log(`Caseview server listening on ${HOST}:${PORT}`);
});
