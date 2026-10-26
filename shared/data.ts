export const AS_OF = "2026-10-24";
export const DATA_START = "2025-01-01";

export const categories = [
  "Theft",
  "Burglary",
  "Assault",
  "Fraud",
  "Vandalism",
  "Drug offense",
] as const;
export const districts = ["Central", "North", "South", "East", "West"] as const;
export const severities = ["Low", "Moderate", "High", "Critical"] as const;
export const statuses = [
  "Open",
  "Investigating",
  "Closed",
  "Referred",
] as const;

export const categoryColors: Record<string, string> = {
  Theft: "#31c3d9",
  Burglary: "#6389ec",
  Assault: "#ad8be8",
  Fraud: "#e1ae67",
  Vandalism: "#71bb9f",
  "Drug offense": "#d68190",
};

export interface Filters {
  from: string;
  to: string;
  category: string;
  district: string;
  severity: string;
  status: string;
  search: string;
}

export const defaultFilters: Filters = {
  from: "2026-05-01",
  to: AS_OF,
  category: "All",
  district: "All",
  severity: "All",
  status: "All",
  search: "",
};

export interface CaseRecord {
  id: string;
  date: string;
  time: string;
  category: string;
  district: string;
  severity: string;
  status: string;
  location: string;
  summary: string;
  subject: string;
  disposition: string;
  linkedOffenses: string[];
  timeline: { date: string; event: string; description: string }[];
  x: number;
  y: number;
}

export interface Summary {
  total: number;
  closed: number;
  closureRate: number;
  open: number;
  critical: number;
  previousTotal: number;
  delta: number | null;
  trend: { month: string; label: string; total: number; closed: number }[];
  categories: { name: string; count: number; color: string }[];
  districts: {
    name: string;
    count: number;
    closed: number;
    closureRate: number;
  }[];
  severity: { name: string; count: number }[];
  statuses: { name: string; count: number }[];
}

const allValues = new Set(["All"]);
const categoryValues = new Set<string>(categories);
const districtValues = new Set<string>(districts);
const severityValues = new Set<string>(severities);
const statusValues = new Set<string>(statuses);
const datePattern = /^\d{4}-\d{2}-\d{2}$/;

export class FilterValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "FilterValidationError";
  }
}

function parseDateOnly(value: string): Date | null {
  if (!datePattern.test(value)) return null;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
    ? date
    : null;
}

function dateOnly(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function addDays(value: string, amount: number): string {
  const date = parseDateOnly(value);
  if (!date) throw new FilterValidationError(`Invalid date: ${value}`);
  date.setUTCDate(date.getUTCDate() + amount);
  return dateOnly(date);
}

/** Validate and normalize user-controlled filters before they reach data or AI code. */
export function validateFilters(input: unknown): Filters {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw new FilterValidationError("filters must be an object");
  }
  const value = input as Partial<Record<keyof Filters, unknown>>;
  const fields: (keyof Filters)[] = [
    "from",
    "to",
    "category",
    "district",
    "severity",
    "status",
    "search",
  ];
  for (const field of fields) {
    if (typeof value[field] !== "string")
      throw new FilterValidationError(`${field} must be a string`);
  }

  const from = value.from as string;
  const to = value.to as string;
  const search = (value.search as string).trim();
  const fromDate = parseDateOnly(from);
  const toDate = parseDateOnly(to);
  if (!fromDate || !toDate)
    throw new FilterValidationError(
      "from and to must be valid ISO dates (YYYY-MM-DD)",
    );
  if (from < DATA_START || to > AS_OF)
    throw new FilterValidationError(
      `date range must stay within ${DATA_START} and ${AS_OF}`,
    );
  if (from > to)
    throw new FilterValidationError("from must be on or before to");
  if (search.length > 80)
    throw new FilterValidationError("search must be 80 characters or fewer");

  const category = value.category as string;
  const district = value.district as string;
  const severity = value.severity as string;
  const status = value.status as string;
  if (!allValues.has(category) && !categoryValues.has(category))
    throw new FilterValidationError("invalid category filter");
  if (!allValues.has(district) && !districtValues.has(district))
    throw new FilterValidationError("invalid district filter");
  if (!allValues.has(severity) && !severityValues.has(severity))
    throw new FilterValidationError("invalid severity filter");
  if (!allValues.has(status) && !statusValues.has(status))
    throw new FilterValidationError("invalid status filter");

  return { from, to, category, district, severity, status, search };
}

function seededRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let result = Math.imul(state ^ (state >>> 15), 1 | state);
    result ^= result + Math.imul(result ^ (result >>> 7), 61 | result);
    return ((result ^ (result >>> 14)) >>> 0) / 4294967296;
  };
}

const districtCenters: Record<string, { x: number; y: number }> = {
  Central: { x: 50, y: 50 },
  North: { x: 51, y: 19 },
  South: { x: 48, y: 81 },
  East: { x: 81, y: 51 },
  West: { x: 19, y: 49 },
};

function weightedCategory(random: () => number): string {
  const value = random() * 100;
  if (value < 33) return "Theft";
  if (value < 55) return "Burglary";
  if (value < 71) return "Assault";
  if (value < 83) return "Fraud";
  if (value < 93) return "Vandalism";
  return "Drug offense";
}

function weightedStatus(random: () => number): string {
  const value = random() * 100;
  if (value < 55) return "Closed";
  if (value < 80) return "Investigating";
  if (value < 93) return "Open";
  return "Referred";
}

function weightedSeverity(random: () => number, category: string): string {
  const value = random() * 100;
  if (category === "Assault" && value > 91) return "Critical";
  if (value < 49) return "Low";
  if (value < 83) return "Moderate";
  if (value < 97) return "High";
  return "Critical";
}

function dayCount(random: () => number, date: Date): number {
  const weekday = date.getUTCDay();
  const weekdayPattern = weekday === 0 || weekday === 6 ? -1 : 1;
  const monthPattern = [0, 1, 1, 0, -1, -1, 0, 1, 1, 0, -1, -1][
    date.getUTCMonth()
  ];
  const noise = Math.floor(random() * 5) - 2;
  return Math.max(10, Math.min(17, 13 + weekdayPattern + monthPattern + noise));
}

function formatTime(random: () => number): string {
  const hour = Math.floor(random() * 24);
  const minute = Math.floor(random() * 60);
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

function timelineFor(
  date: string,
  status: string,
  category: string,
  district: string,
  random: () => number,
) {
  const events = [
    {
      date,
      event: "Report logged",
      description: `Synthetic ${category.toLowerCase()} report logged for the ${district} district.`,
    },
  ];
  const offsets =
    status === "Closed"
      ? [1, 3]
      : status === "Investigating"
        ? [1]
        : status === "Referred"
          ? [2]
          : [];
  const labels =
    status === "Closed"
      ? ["Review assigned", "Disposition recorded"]
      : status === "Investigating"
        ? ["Review assigned"]
        : ["Referral recorded"];
  for (let index = 0; index < offsets.length; index += 1) {
    const offset = Math.max(0, Math.floor(random() * (offsets[index] + 2)));
    const priorDate = events[events.length - 1].date;
    const candidateDate = addDays(date, offset);
    const boundedDate = candidateDate > AS_OF ? AS_OF : candidateDate;
    const eventDate = boundedDate < priorDate ? priorDate : boundedDate;
    events.push({
      date: eventDate,
      event: labels[index],
      description:
        status === "Closed" && index === 1
          ? "Synthetic administrative disposition recorded; no real-world finding is implied."
          : "Synthetic workflow event for demonstration purposes.",
    });
  }
  return events.sort((a, b) => a.date.localeCompare(b.date));
}

function generateRecords(): CaseRecord[] {
  const random = seededRandom(0x26c0ffee);
  const result: CaseRecord[] = [];
  const sequenceByYear: Record<string, number> = { "25": 0, "26": 0 };
  const start = parseDateOnly(DATA_START)!;
  const end = parseDateOnly(AS_OF)!;

  for (
    const date = new Date(start);
    date <= end;
    date.setUTCDate(date.getUTCDate() + 1)
  ) {
    const dateString = dateOnly(date);
    const count = dayCount(random, date);
    for (let index = 0; index < count; index += 1) {
      const year = dateString.slice(2, 4);
      sequenceByYear[year] += 1;
      const category = weightedCategory(random);
      const district = districts[Math.floor(random() * districts.length)];
      const severity = weightedSeverity(random, category);
      const status = weightedStatus(random);
      const center = districtCenters[district];
      const x = Math.max(
        0,
        Math.min(100, Number((center.x + (random() - 0.5) * 15).toFixed(2))),
      );
      const y = Math.max(
        0,
        Math.min(100, Number((center.y + (random() - 0.5) * 15).toFixed(2))),
      );
      const sequence = String(sequenceByYear[year]).padStart(6, "0");
      const id = `DEMO-${year}-${sequence}`;
      const block = String(1 + Math.floor(random() * 24)).padStart(2, "0");
      const subjectNumber = String(
        100000 + Math.floor(random() * 899999),
      ).padStart(6, "0");
      const disposition =
        status === "Closed"
          ? "Administrative review complete"
          : status === "Referred"
            ? "Referred for synthetic follow-up"
            : "Active synthetic review";
      result.push({
        id,
        date: dateString,
        time: formatTime(random),
        category,
        district,
        severity,
        status,
        location: `${district} Sector / Block ${block}`,
        summary: `Synthetic ${category.toLowerCase()} report in the ${district} district; record contains no real-world incident details.`,
        subject: `Synthetic subject #${subjectNumber}`,
        disposition,
        linkedOffenses: [
          ...new Set(
            random() < 0.18
              ? [category, categories[Math.floor(random() * categories.length)]]
              : [category],
          ),
        ],
        timeline: timelineFor(dateString, status, category, district, random),
        x,
        y,
      });
    }
  }
  return result;
}

export const records: CaseRecord[] = generateRecords();

export function filterRecords(filters: Filters): CaseRecord[] {
  const normalized = validateFilters(filters);
  const search = normalized.search.toLowerCase();
  return records.filter((record) => {
    if (record.date < normalized.from || record.date > normalized.to)
      return false;
    if (
      normalized.category !== "All" &&
      record.category !== normalized.category
    )
      return false;
    if (
      normalized.district !== "All" &&
      record.district !== normalized.district
    )
      return false;
    if (
      normalized.severity !== "All" &&
      record.severity !== normalized.severity
    )
      return false;
    if (normalized.status !== "All" && record.status !== normalized.status)
      return false;
    if (
      search &&
      ![
        record.id,
        record.category,
        record.location,
        record.subject,
        record.district,
        record.status,
        record.severity,
        record.date,
        record.summary,
      ].some((field) => field.toLowerCase().includes(search))
    )
      return false;
    return true;
  });
}

function monthStart(value: string): string {
  return `${value.slice(0, 7)}-01`;
}

function nextMonth(value: string): string {
  const date = parseDateOnly(`${value.slice(0, 7)}-01`)!;
  date.setUTCMonth(date.getUTCMonth() + 1);
  return dateOnly(date);
}

function monthLabel(month: string, multiYear: boolean): string {
  const date = parseDateOnly(`${month}-01`)!;
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    timeZone: "UTC",
    ...(multiYear ? { year: "numeric" } : {}),
  }).format(date);
}

function percentage(numerator: number, denominator: number): number {
  return denominator === 0
    ? 0
    : Number(((numerator / denominator) * 100).toFixed(1));
}

export function summarize(filters: Filters): Summary {
  const normalized = validateFilters(filters);
  const selected = filterRecords(normalized);
  const total = selected.length;
  const closed = selected.filter((record) => record.status === "Closed").length;
  const open = selected.filter(
    (record) => record.status === "Open" || record.status === "Investigating",
  ).length;
  const critical = selected.filter(
    (record) => record.severity === "Critical",
  ).length;

  const categoriesSummary = categories.map((name) => ({
    name,
    count: selected.filter((record) => record.category === name).length,
    color: categoryColors[name],
  }));
  const districtsSummary = districts.map((name) => {
    const districtRecords = selected.filter(
      (record) => record.district === name,
    );
    const districtClosed = districtRecords.filter(
      (record) => record.status === "Closed",
    ).length;
    return {
      name,
      count: districtRecords.length,
      closed: districtClosed,
      closureRate: percentage(districtClosed, districtRecords.length),
    };
  });
  const severitySummary = severities.map((name) => ({
    name,
    count: selected.filter((record) => record.severity === name).length,
  }));
  const statusesSummary = statuses.map((name) => ({
    name,
    count: selected.filter((record) => record.status === name).length,
  }));

  const startMonth = monthStart(normalized.from);
  const endMonth = monthStart(normalized.to);
  const multiYear = startMonth.slice(0, 4) !== endMonth.slice(0, 4);
  const trend: Summary["trend"] = [];
  for (let month = startMonth; month <= endMonth; month = nextMonth(month)) {
    const monthRecords = selected.filter((record) =>
      record.date.startsWith(month.slice(0, 7)),
    );
    trend.push({
      month: month.slice(0, 7),
      label: monthLabel(month.slice(0, 7), multiYear),
      total: monthRecords.length,
      closed: monthRecords.filter((record) => record.status === "Closed")
        .length,
    });
  }

  const duration =
    Math.round(
      (parseDateOnly(normalized.to)!.getTime() -
        parseDateOnly(normalized.from)!.getTime()) /
        86400000,
    ) + 1;
  const previousTo = addDays(normalized.from, -1);
  const previousFrom = addDays(previousTo, -(duration - 1));
  let previousTotal = 0;
  let delta: number | null = null;
  if (previousFrom >= DATA_START && previousTo <= AS_OF) {
    previousTotal = filterRecords({
      ...normalized,
      from: previousFrom,
      to: previousTo,
    }).length;
    delta =
      previousTotal > 0
        ? Number((((total - previousTotal) / previousTotal) * 100).toFixed(1))
        : null;
  }

  return {
    total,
    closed,
    closureRate: percentage(closed, total),
    open,
    critical,
    previousTotal,
    delta,
    trend,
    categories: categoriesSummary,
    districts: districtsSummary,
    severity: severitySummary,
    statuses: statusesSummary,
  };
}
