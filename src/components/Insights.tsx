import { useEffect, useRef, useState } from "react";
import {
  ArrowUpRight,
  CheckCheck,
  LoaderCircle,
  RefreshCw,
  Sparkles,
  TrendingUp,
  ShieldCheck,
  MapPin,
  AlertCircle,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import { type Filters, type Summary } from "../../shared/data";
import { number, SectionTitle } from "./UI";

const AI_API_BASE_URL = (import.meta.env.VITE_AI_API_BASE_URL ?? "").replace(
  /\/+$/,
  "",
);

export interface InsightResult {
  generatedAt: string;
  model: string;
  summary: string;
  observation: string;
  caveat: string;
  cached: boolean;
}
export function useAIInsights(filters: Filters) {
  const [result, setResult] = useState<InsightResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const controller = useRef<AbortController | null>(null);
  const signature = JSON.stringify(filters);
  const context = useRef(signature);
  useEffect(() => {
    controller.current?.abort();
    context.current = signature;
    setResult(null);
    setLoading(false);
    setError("");
    return () => controller.current?.abort();
  }, [signature]);
  async function generate() {
    if (loading) return;
    const requestContext = signature;
    controller.current?.abort();
    const request = new AbortController();
    controller.current = request;
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`${AI_API_BASE_URL}/api/insights`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filters }),
        signal: request.signal,
      });
      const body = await response.json();
      if (!response.ok)
        throw new Error(
          typeof body.error === "string"
            ? body.error
            : "AI briefing is temporarily unavailable. Try again shortly.",
        );
      if (!body.summary || !body.observation || !body.caveat || !body.model)
        throw new Error("No usable briefing was returned. Please try again.");
      if (context.current === requestContext) setResult(body as InsightResult);
    } catch (caught) {
      if (
        caught instanceof Error &&
        caught.name !== "AbortError" &&
        context.current === requestContext
      )
        setError(caught.message);
    } finally {
      if (context.current === requestContext) setLoading(false);
    }
  }
  return { result, loading, error, generate };
}
export type InsightState = ReturnType<typeof useAIInsights>;

export function BriefingCard({
  summary,
  ai,
  expanded = false,
  openAnalyst,
}: {
  summary: Summary;
  ai: InsightState;
  expanded?: boolean;
  openAnalyst?: () => void;
}) {
  const leading = [...summary.categories].sort((a, b) => b.count - a.count)[0];
  const district = [...summary.districts].sort((a, b) => b.count - a.count)[0];
  return (
    <section
      className={`panel briefing-panel ${expanded ? "briefing-expanded" : ""}`}
    >
      <div className="briefing-top">
        <span className="ai-mark">
          <Sparkles size={18} />
        </span>
        <span>AI analyst</span>
        <span className="ai-label">
          {ai.result ? "AI GENERATED" : "ON DEMAND"}
        </span>
      </div>
      <h2>
        {ai.result
          ? "Your analytical briefing."
          : "Find the signal in the data."}
      </h2>
      <p className="briefing-intro">
        {ai.result
          ? "Generated from aggregate metrics in your current filter context."
          : "Turn your selected view into a concise, plain-language briefing. Grounded in metrics. Clear about limitations."}
      </p>
      {ai.result ? (
        <div className="ai-content">
          <div className="insight-item">
            <TrendingUp size={17} />
            <div>
              <h3>Pattern summary</h3>
              <ReactMarkdown>{ai.result.summary}</ReactMarkdown>
            </div>
          </div>
          <div className="insight-item">
            <MapPin size={17} />
            <div>
              <h3>Notable observation</h3>
              <ReactMarkdown>{ai.result.observation}</ReactMarkdown>
            </div>
          </div>
          {expanded && (
            <div className="insight-item">
              <ShieldCheck size={17} />
              <div>
                <h3>Interpretation limits</h3>
                <ReactMarkdown>{ai.result.caveat}</ReactMarkdown>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="preview-insights">
          <span className="preview-label">
            STATISTICAL SNAPSHOT · NOT AI GENERATED
          </span>
          <div className="preview-row">
            <TrendingUp size={16} />
            <div>
              <strong>
                {summary.total
                  ? `${leading.name} leads this view`
                  : "No records in this context"}
              </strong>
              <p>
                {summary.total
                  ? `${number(leading.count)} incidents · ${((leading.count / summary.total) * 100).toFixed(1)}% of the selected records`
                  : "Widen your filters to generate a briefing."}
              </p>
            </div>
          </div>
          <div className="preview-row">
            <MapPin size={16} />
            <div>
              <strong>
                {summary.total
                  ? `${district.name} District has the highest count`
                  : "Context-aware analysis"}
              </strong>
              <p>
                {summary.total
                  ? `${number(district.count)} recorded incidents · fictional geography`
                  : "AI analyzes aggregate metrics, never individuals."}
              </p>
            </div>
          </div>
        </div>
      )}
      {ai.error && (
        <div className="ai-error" role="alert">
          <AlertCircle size={16} />
          <span>{ai.error}</span>
        </div>
      )}
      <div className="briefing-actions">
        <button
          className="button ai-button"
          onClick={() => void ai.generate()}
          disabled={ai.loading || summary.total === 0}
        >
          {ai.loading ? (
            <LoaderCircle size={16} className="spin" />
          ) : ai.result ? (
            <RefreshCw size={15} />
          ) : (
            <Sparkles size={15} />
          )}
          {ai.loading
            ? "Analyzing selected metrics…"
            : ai.result
              ? "Regenerate briefing"
              : ai.error
                ? "Retry AI briefing"
                : "Generate AI briefing"}
          {!ai.loading && <ArrowUpRight size={15} />}
        </button>
        {!expanded && openAnalyst && (
          <button className="analyst-link" onClick={openAnalyst}>
            Open analyst
            <ArrowUpRight size={13} />
          </button>
        )}
      </div>
      {ai.result ? (
        <div className="ai-meta">
          <CheckCheck size={13} />
          {ai.result.model} ·{" "}
          {new Date(ai.result.generatedAt).toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
          })}
          {ai.result.cached ? " · cached briefing" : ""}
        </div>
      ) : (
        <div className="ai-meta">
          <ShieldCheck size={12} />
          Aggregate analysis only. No individual risk scoring.
        </div>
      )}
      {ai.result && !expanded && (
        <p className="ai-caveat">{ai.result.caveat}</p>
      )}
    </section>
  );
}
export function AnalystPage({
  summary,
  ai,
}: {
  summary: Summary;
  ai: InsightState;
}) {
  return (
    <div className="analyst-layout">
      <BriefingCard summary={summary} ai={ai} expanded />
      <div className="analyst-side">
        <section className="panel">
          <SectionTitle title="How this analyst works" />
          <div className="analyst-process">
            {[
              [
                "01",
                "Your filters set the context",
                "Date, district, offense and status are applied before analysis. Changing filters clears the previous briefing.",
              ],
              [
                "02",
                "Metrics are computed server-side",
                "The model receives incident totals, category and district distributions, case statuses and a dated trend. No subject identifiers are sent.",
              ],
              [
                "03",
                "AI explains, not predicts",
                "The model describes observed synthetic patterns and limitations. It does not infer guilt, demographic risk or future criminality.",
              ],
            ].map(([index, title, body]) => (
              <div key={index}>
                <span>{index}</span>
                <section>
                  <h3>{title}</h3>
                  <p>{body}</p>
                </section>
              </div>
            ))}
          </div>
        </section>
        <section className="panel responsible-note">
          <ShieldCheck size={22} />
          <h3>Human judgment stays in the loop.</h3>
          <p>
            AI-generated text can be incorrect. Verify numerical claims against
            the dashboard. Counts reflect a fictional demo, not crime prevalence
            or a finding against a person.
          </p>
          <span className="panel-tag">RESPONSIBLE AI</span>
        </section>
      </div>
    </div>
  );
}
