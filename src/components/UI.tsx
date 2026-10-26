import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  CalendarDays,
  ChevronDown,
  CircleHelp,
  Filter,
  Layers3,
  RotateCcw,
  ShieldCheck,
  Siren,
  SlidersHorizontal,
  X,
} from "lucide-react";
import {
  AS_OF,
  DATA_START,
  categories,
  districts,
  severities,
  statuses,
  defaultFilters,
  type Filters,
  type Summary,
} from "../../shared/data";
import { useState, type ReactNode } from "react";

export const number = (n: number) => n.toLocaleString("en-US");
export function shortDate(date: string) {
  return new Date(date + "T12:00:00Z").toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}
export function Logo({ small = false }: { small?: boolean }) {
  return (
    <span className={`brand ${small ? "brand-small" : ""}`}>
      <svg
        width="34"
        height="38"
        viewBox="0 0 38 44"
        fill="none"
        aria-hidden="true"
      >
        <path
          d="M19 3 34 9v12c0 10-7 15-15 19C11 36 4 31 4 21V9Z"
          stroke="currentColor"
          strokeWidth="2.5"
        />
        <path
          d="M25 15h-8a7 7 0 0 0 0 14h8M15 22h9"
          stroke="currentColor"
          strokeWidth="2.5"
        />
      </svg>
      <span>
        casefile<span className="brand-period">.</span>
      </span>
    </span>
  );
}
export function SectionTitle({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="panel-heading">
      <div>
        <h2>{title}</h2>
        {subtitle && <p>{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}
export function EmptyState({ reset }: { reset?: () => void }) {
  return (
    <div className="empty-state">
      <Filter size={32} />
      <h3>No records in this view</h3>
      <p>
        Try a wider date range or remove a filter. This dataset only contains
        fictional incidents.
      </p>
      {reset && (
        <button className="button secondary" onClick={reset}>
          <RotateCcw size={15} />
          Reset demo view
        </button>
      )}
    </div>
  );
}
export function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`status-badge status-${status.toLowerCase()}`}>
      <span />
      {status}
    </span>
  );
}
export function SeverityBadge({ severity }: { severity: string }) {
  return (
    <span className={`severity-badge severity-${severity.toLowerCase()}`}>
      <span />
      {severity}
    </span>
  );
}
function Select({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: readonly string[];
  onChange: (value: string) => void;
}) {
  return (
    <label className="filter-select">
      <span>{label}</span>
      <div>
        <select
          aria-label={label}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        >
          {options.map((option) => (
            <option key={option} value={option}>
              {option === "All"
                ? `All ${label.toLowerCase()}${label === "Status" ? "es" : label === "Severity" ? " levels" : "s"}`
                : option}
            </option>
          ))}
        </select>
        <ChevronDown size={14} aria-hidden="true" />
      </div>
    </label>
  );
}
export function FilterBar({
  filters,
  setFilters,
  reset,
}: {
  filters: Filters;
  setFilters: (filters: Filters) => void;
  reset: () => void;
}) {
  const [more, setMore] = useState(false);
  const [customOpen, setCustomOpen] = useState(false);
  const preset = customOpen
    ? "custom"
    : filters.from === defaultFilters.from && filters.to === AS_OF
      ? "6months"
      : filters.from === "2026-01-01" && filters.to === AS_OF
        ? "year"
        : filters.from === "2026-09-25" && filters.to === AS_OF
          ? "30days"
          : filters.from === DATA_START && filters.to === AS_OF
            ? "all"
            : "custom";
  const update = (key: keyof Filters, value: string) =>
    setFilters({ ...filters, [key]: value });
  const active =
    ["category", "district", "severity", "status"].filter(
      (key) => filters[key as keyof Filters] !== "All",
    ).length + (filters.search ? 1 : 0);
  return (
    <div className="filters-wrap">
      <div className="filter-bar">
        <div className="filter-label">
          <SlidersHorizontal size={16} />
          <span>Explore data</span>
          {active > 0 && <span className="filter-count">{active}</span>}
        </div>
        <label className="filter-select date-select">
          <span>Date range</span>
          <div>
            <CalendarDays size={15} />
            <select
              aria-label="Date range"
              value={preset}
              onChange={(e) => {
                const value = e.target.value;
                setCustomOpen(value === "custom");
                if (value === "custom") return;
                const from =
                  value === "year"
                    ? "2026-01-01"
                    : value === "30days"
                      ? "2026-09-25"
                      : value === "all"
                        ? DATA_START
                        : value === "custom"
                          ? filters.from
                          : defaultFilters.from;
                setFilters({
                  ...filters,
                  from,
                  to: AS_OF,
                });
              }}
            >
              {[
                ["6months", "Last 6 months"],
                ["year", "2026 to date"],
                ["30days", "Last 30 days"],
                ["all", "All demo data"],
                ["custom", "Custom range"],
              ].map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
            <ChevronDown size={14} />
          </div>
        </label>
        <Select
          label="Offense"
          value={filters.category}
          options={["All", ...categories]}
          onChange={(value) => update("category", value)}
        />
        <Select
          label="District"
          value={filters.district}
          options={["All", ...districts]}
          onChange={(value) => update("district", value)}
        />
        <button
          className={`more-filter ${more || filters.severity !== "All" || filters.status !== "All" ? "is-active" : ""}`}
          onClick={() => setMore(!more)}
          aria-expanded={more}
        >
          <Filter size={14} />
          More filters
          <ChevronDown size={13} />
        </button>
        <button
          className="reset-button"
          onClick={() => {
            setCustomOpen(false);
            setMore(false);
            reset();
          }}
          title="Reset all filters and search"
          aria-label="Reset all filters"
        >
          <RotateCcw size={16} />
        </button>
      </div>
      {(more ||
        preset === "custom" ||
        filters.severity !== "All" ||
        filters.status !== "All") && (
        <div className="extended-filters">
          {preset === "custom" && (
            <div className="date-inputs">
              <label>
                From
                <input
                  aria-label="Start date"
                  type="date"
                  value={filters.from}
                  min={DATA_START}
                  max={filters.to}
                  onChange={(e) => {
                    if (e.target.value && e.target.validity.valid)
                      update("from", e.target.value);
                  }}
                />
              </label>
              <span>—</span>
              <label>
                To
                <input
                  aria-label="End date"
                  type="date"
                  value={filters.to}
                  min={filters.from}
                  max={AS_OF}
                  onChange={(e) => {
                    if (e.target.value && e.target.validity.valid)
                      update("to", e.target.value);
                  }}
                />
              </label>
            </div>
          )}
          <Select
            label="Severity"
            value={filters.severity}
            options={["All", ...severities]}
            onChange={(value) => update("severity", value)}
          />
          <Select
            label="Status"
            value={filters.status}
            options={["All", ...statuses]}
            onChange={(value) => update("status", value)}
          />
          <span className="context-note">
            All charts and records share these filters.
          </span>
        </div>
      )}
      {filters.search && (
        <div className="search-context">
          Search context: “{filters.search}”
          <button
            onClick={() => update("search", "")}
            aria-label="Clear search"
          >
            <X size={13} />
          </button>
        </div>
      )}
    </div>
  );
}
export function Metrics({ summary }: { summary: Summary }) {
  const change = summary.delta;
  const cards = [
    {
      label: "Total incidents",
      value: number(summary.total),
      icon: Layers3,
      cls: "cyan",
      sub: "Filtered incident records",
      foot:
        change === null
          ? "No comparable prior period"
          : `${Math.abs(change).toFixed(1)}% ${change >= 0 ? "more" : "fewer"} than prior period`,
      delta: change,
    },
    {
      label: "Case closure rate",
      value: `${summary.closureRate.toFixed(1)}%`,
      icon: ShieldCheck,
      cls: "green",
      sub: `${number(summary.closed)} cases marked closed`,
      foot: "Closed records ÷ total records",
      delta: null,
    },
    {
      label: "Active cases",
      value: number(summary.open),
      icon: Activity,
      cls: "blue",
      sub: "Open or under investigation",
      foot: "Current status in demo snapshot",
      delta: null,
    },
    {
      label: "Critical incidents",
      value: number(summary.critical),
      icon: Siren,
      cls: "amber",
      sub: "Critical severity classification",
      foot: "Incident severity, not individual risk",
      delta: null,
    },
  ];
  return (
    <section className="metrics" aria-label="Key metrics">
      {cards.map((card) => (
        <article className={`metric-card ${card.cls}`} key={card.label}>
          <div className="metric-top">
            <span>{card.label}</span>
            <span className="metric-icon">
              <card.icon size={18} />
            </span>
          </div>
          <div className="metric-value">{card.value}</div>
          <p>{card.sub}</p>
          <div className="metric-foot">
            {card.delta !== null ? (
              card.delta < 0 ? (
                <ArrowDownRight size={14} />
              ) : (
                <ArrowUpRight size={14} />
              )
            ) : (
              <span className="tiny-dot" />
            )}
            {card.foot}
          </div>
        </article>
      ))}
    </section>
  );
}
export function InfoTip({ children }: { children: ReactNode }) {
  return (
    <span className="info-tip" tabIndex={0}>
      <CircleHelp size={13} />
      <span role="tooltip">{children}</span>
    </span>
  );
}
