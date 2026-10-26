import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  Clock3,
  FileText,
  MapPin,
  Search,
  ShieldCheck,
  UserRound,
  X,
} from "lucide-react";
import {
  categoryColors,
  type CaseRecord,
  type Filters,
} from "../../shared/data";
import {
  EmptyState,
  SectionTitle,
  SeverityBadge,
  StatusBadge,
  number,
  shortDate,
} from "./UI";

type SortKey = "id" | "date" | "category" | "district" | "severity" | "status";
const columns: { key: SortKey; label: string }[] = [
  { key: "id", label: "Case ID" },
  { key: "category", label: "Offense" },
  { key: "district", label: "District" },
  { key: "date", label: "Reported" },
  { key: "severity", label: "Severity" },
  { key: "status", label: "Status" },
];
const severityOrder: Record<string, number> = {
  Low: 0,
  Moderate: 1,
  High: 2,
  Critical: 3,
};

export function RecordsTable({
  rows,
  filters,
  setFilters,
  openCase,
  compact = false,
  openRecords,
  reset,
}: {
  rows: CaseRecord[];
  filters: Filters;
  setFilters: (value: Filters) => void;
  openCase: (record: CaseRecord) => void;
  compact?: boolean;
  openRecords?: () => void;
  reset: () => void;
}) {
  const [sort, setSort] = useState<SortKey>("date");
  const [ascending, setAscending] = useState(false);
  const [page, setPage] = useState(1);
  const pageSize = compact ? 5 : 15;
  useEffect(() => {
    setPage(1);
  }, [rows, sort, ascending]);
  const sorted = useMemo(
    () =>
      [...rows].sort((a, b) => {
        const comparison =
          sort === "severity"
            ? severityOrder[a.severity] - severityOrder[b.severity]
            : a[sort].localeCompare(b[sort]);
        return (
          (ascending ? comparison : -comparison) || b.id.localeCompare(a.id)
        );
      }),
    [rows, sort, ascending],
  );
  const pageCount = Math.max(1, Math.ceil(rows.length / pageSize));
  const visible = sorted.slice((page - 1) * pageSize, page * pageSize);
  function changeSort(key: SortKey) {
    if (sort === key) setAscending(!ascending);
    else {
      setSort(key);
      setAscending(key !== "date");
    }
  }
  return (
    <section className="panel records-panel">
      <SectionTitle
        title={compact ? "Recent case records" : "Case records"}
        subtitle={
          compact
            ? "The latest incidents in your selected view"
            : "Fictional incident records. A report is not proof of guilt."
        }
        action={
          compact ? (
            <button className="text-button" onClick={openRecords}>
              View all records <ArrowUpRight size={14} />
            </button>
          ) : (
            <span className="panel-tag">{number(rows.length)} RECORDS</span>
          )
        }
      />
      {!compact && (
        <div className="table-toolbar">
          <label className="table-search">
            <Search size={16} />
            <input
              aria-label="Search case records"
              placeholder="Search case ID, offense, location or subject…"
              value={filters.search}
              maxLength={80}
              onChange={(e) =>
                setFilters({ ...filters, search: e.target.value })
              }
            />
            {filters.search && (
              <button
                aria-label="Clear record search"
                onClick={() => setFilters({ ...filters, search: "" })}
              >
                <X size={14} />
              </button>
            )}
          </label>
          <span className="muted">All records are synthetic</span>
        </div>
      )}
      {rows.length === 0 ? (
        <EmptyState reset={reset} />
      ) : (
        <>
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  {columns.map((column) => (
                    <th
                      key={column.key}
                      aria-sort={
                        sort === column.key
                          ? ascending
                            ? "ascending"
                            : "descending"
                          : "none"
                      }
                    >
                      <button onClick={() => changeSort(column.key)}>
                        {column.label}
                        {sort === column.key ? (
                          ascending ? (
                            <ArrowUp size={11} />
                          ) : (
                            <ArrowDown size={11} />
                          )
                        ) : (
                          <ArrowUpDown size={11} />
                        )}
                      </button>
                    </th>
                  ))}
                  <th>
                    <span className="sr-only">Open case</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {visible.map((record) => (
                  <tr key={record.id}>
                    <td>
                      <button
                        className="case-link"
                        onClick={() => openCase(record)}
                      >
                        <FileText size={14} />
                        {record.id}
                      </button>
                    </td>
                    <td>
                      <span className="offense-name">
                        <i
                          style={{
                            background: categoryColors[record.category],
                          }}
                        />
                        {record.category}
                      </span>
                    </td>
                    <td>{record.district}</td>
                    <td className="date-cell">
                      {shortDate(record.date)
                        .replace(", 2026", "")
                        .replace(", 2025", " ’25")}
                    </td>
                    <td>
                      <SeverityBadge severity={record.severity} />
                    </td>
                    <td>
                      <StatusBadge status={record.status} />
                    </td>
                    <td>
                      <button
                        className="row-open"
                        onClick={() => openCase(record)}
                        aria-label={`Open case ${record.id}`}
                      >
                        <ArrowUpRight size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="table-footer">
            <span>
              Showing {number((page - 1) * pageSize + 1)}–
              {number(Math.min(page * pageSize, rows.length))} of{" "}
              {number(rows.length)} records
            </span>
            {!compact ? (
              <div className="pagination">
                <button
                  disabled={page === 1}
                  aria-label="Previous page"
                  onClick={() => setPage(page - 1)}
                >
                  <ChevronLeft size={14} />
                </button>
                <span>
                  Page {page} of {number(pageCount)}
                </span>
                <button
                  disabled={page >= pageCount}
                  aria-label="Next page"
                  onClick={() => setPage(page + 1)}
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            ) : (
              <span className="table-note">
                <ShieldCheck size={12} />
                Privacy-safe demonstration
              </span>
            )}
          </div>
        </>
      )}
    </section>
  );
}

export function CaseDrawer({
  record,
  close,
}: {
  record: CaseRecord;
  close: () => void;
}) {
  const panel = useRef<HTMLDivElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const priorOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButton.current?.focus();
    function keys(event: KeyboardEvent) {
      if (event.key === "Escape") close();
      if (event.key === "Tab") {
        const targets = Array.from(
          panel.current?.querySelectorAll<HTMLElement>(
            'button, a[href], input, select, [tabindex="0"]',
          ) || [],
        ).filter((el) => !el.hasAttribute("disabled"));
        const first = targets[0];
        const last = targets[targets.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last?.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first?.focus();
        }
      }
    }
    document.addEventListener("keydown", keys);
    return () => {
      document.body.style.overflow = priorOverflow;
      document.removeEventListener("keydown", keys);
      previous?.focus();
    };
  }, [close]);
  return (
    <div
      className="modal-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) close();
      }}
    >
      <div
        className="case-drawer"
        role="dialog"
        aria-modal="true"
        aria-labelledby="case-title"
        ref={panel}
      >
        <div className="drawer-heading">
          <span className="eyebrow">
            <FileText size={14} />
            CASEFILE / DEMO RECORD
          </span>
          <button
            ref={closeButton}
            className="icon-button"
            aria-label="Close casefile"
            onClick={close}
          >
            <X size={19} />
          </button>
        </div>
        <h2 id="case-title">{record.id}</h2>
        <div className="drawer-badges">
          <StatusBadge status={record.status} />
          <SeverityBadge severity={record.severity} />
          <span className="synthetic-pill">Synthetic record</span>
        </div>
        <section className="drawer-section">
          <h3>Incident overview</h3>
          <h4>{record.category}</h4>
          <p>{record.summary}</p>
          <div className="case-facts">
            <div>
              <CalendarIcon />
              <span>
                Reported<strong>{shortDate(record.date)}</strong>
              </span>
            </div>
            <div>
              <Clock3 size={15} />
              <span>
                Time (UTC)<strong>{record.time}</strong>
              </span>
            </div>
            <div>
              <MapPin size={15} />
              <span>
                District<strong>{record.district} · Northbridge</strong>
              </span>
            </div>
            <div>
              <MapPin size={15} />
              <span>
                Fictional location<strong>{record.location}</strong>
              </span>
            </div>
          </div>
        </section>
        <section className="drawer-section">
          <h3>Subject information</h3>
          <div className="subject-record">
            <span className="subject-icon">
              <UserRound size={22} />
            </span>
            <div>
              <strong>{record.subject}</strong>
              <p>Generated identifier · no real personal information</p>
            </div>
          </div>
          <p className="case-disclaimer">
            No identity, demographics or criminal-history information is stored.
            Incident records do not establish guilt or a conviction.
          </p>
        </section>
        <section className="drawer-section">
          <h3>Linked offense classification</h3>
          <div className="linked-offenses">
            {record.linkedOffenses.map((offense) => (
              <span key={offense}>{offense}</span>
            ))}
          </div>
          <p className="case-disclaimer">
            Metrics count distinct incidents, not individual offense
            classifications.
          </p>
        </section>
        <section className="drawer-section">
          <h3>Case timeline</h3>
          <ol className="timeline">
            {record.timeline.map((item, index) => (
              <li key={`${item.date}-${index}`}>
                <span className="timeline-dot" />
                <div>
                  <time>{shortDate(item.date)}</time>
                  <h4>{item.event}</h4>
                  <p>{item.description}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>
        <section className="drawer-section disposition">
          <h3>Disposition</h3>
          <p>{record.disposition}</p>
        </section>
        <div className="drawer-bottom">
          <ShieldCheck size={15} />
          <span>
            Learning demonstration only. Not a law-enforcement system.
          </span>
        </div>
      </div>
    </div>
  );
}
function CalendarIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden="true"
    >
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M16 3v4M8 3v4M3 11h18" />
    </svg>
  );
}
