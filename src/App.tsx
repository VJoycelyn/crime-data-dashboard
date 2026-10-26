import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowUpRight,
  BookOpen,
  ChevronRight,
  Download,
  FileText,
  LayoutDashboard,
  Map,
  Menu,
  Search,
  Share2,
  ShieldCheck,
  Sparkles,
  X,
  Check,
  Database,
} from "lucide-react";
import {
  AS_OF,
  defaultFilters,
  filterRecords,
  records,
  summarize,
  type CaseRecord,
  type Filters,
} from "../shared/data";
import { Logo, FilterBar, Metrics, number, shortDate } from "./components/UI";
import {
  OffenseChart,
  RegionComparison,
  TrendChart,
} from "./components/Charts";
import { DistrictMap } from "./components/DistrictMap";
import { CaseDrawer, RecordsTable } from "./components/Records";
import {
  AnalystPage,
  BriefingCard,
  useAIInsights,
} from "./components/Insights";
import { Methodology } from "./components/Methodology";
import { filtersFromURL, shareURL } from "../shared/share";

type Page = "overview" | "records" | "geography" | "insights" | "methodology";
const pageNames: Record<Page, string> = {
  overview: "Overview",
  records: "Case records",
  geography: "Geographic analysis",
  insights: "AI analyst",
  methodology: "Methodology & Fabric",
};
const pageDescriptions: Record<Page, string> = {
  overview:
    "A clearer view of incidents, outcomes, and the patterns between them.",
  records:
    "Explore the details behind the numbers. Every case here is fictional.",
  geography:
    "Understand the distribution. Compare districts without losing context.",
  insights: "From selected metrics to a grounded, plain-language briefing.",
  methodology:
    "Transparent data. Defined metrics. A responsible learning project.",
};
const navItems = [
  { page: "overview" as Page, name: "Overview", icon: LayoutDashboard },
  { page: "records" as Page, name: "Case records", icon: FileText },
  { page: "geography" as Page, name: "Geographic analysis", icon: Map },
  { page: "insights" as Page, name: "AI analyst", icon: Sparkles },
];
function pageFromHash(): Page {
  const value = window.location.hash.slice(1);
  return Object.prototype.hasOwnProperty.call(pageNames, value)
    ? (value as Page)
    : "overview";
}
function csvText(rows: CaseRecord[]) {
  const header = [
    "data_type",
    "case_id",
    "reported_date",
    "time_utc",
    "offense",
    "district",
    "severity",
    "status",
    "fictional_location",
    "synthetic_subject_id",
    "summary",
    "disposition",
  ];
  const values = rows.map((row) => [
    "SYNTHETIC DEMO - NOT A REAL CRIMINAL RECORD",
    row.id,
    row.date,
    row.time,
    row.category,
    row.district,
    row.severity,
    row.status,
    row.location,
    row.subject,
    row.summary,
    row.disposition,
  ]);
  return (
    "\uFEFF" +
    [header, ...values]
      .map((row) =>
        row
          .map((value) => '"' + String(value).replace(/"/g, '""') + '"')
          .join(","),
      )
      .join("\r\n")
  );
}
export default function App() {
  const [page, setPage] = useState<Page>(pageFromHash);
  const [filters, setFilters] = useState<Filters>(() =>
    filtersFromURL(window.location.href),
  );
  const [selectedCase, setSelectedCase] = useState<CaseRecord | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [toast, setToast] = useState("");
  const rows = useMemo(() => filterRecords(filters), [filters]);
  const summary = useMemo(() => summarize(filters), [filters]);
  const ai = useAIInsights(filters);
  const closeCase = useCallback(() => setSelectedCase(null), []);
  const reset = useCallback(() => {
    setFilters({ ...defaultFilters });
    setSelectedCase(null);
  }, []);
  useEffect(() => {
    const change = () => {
      setPage(pageFromHash());
      setMenuOpen(false);
      window.scrollTo({ top: 0, behavior: "instant" });
    };
    window.addEventListener("hashchange", change);
    return () => window.removeEventListener("hashchange", change);
  }, []);
  useEffect(() => {
    const url = shareURL(window.location.href, filters);
    window.history.replaceState(null, "", url);
  }, [filters]);
  useEffect(() => {
    const restore = () => {
      setFilters(filtersFromURL(window.location.href));
      setPage(pageFromHash());
    };
    window.addEventListener("popstate", restore);
    return () => window.removeEventListener("popstate", restore);
  }, []);
  useEffect(() => {
    document.title = `${pageNames[page]} — Casefile Crime Intelligence`;
  }, [page]);
  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(""), 4500);
    return () => window.clearTimeout(timer);
  }, [toast]);
  function navigate(next: Page) {
    if (next === page) {
      setMenuOpen(false);
      return;
    }
    window.location.hash = next === "overview" ? "" : next;
    setPage(next);
    setMenuOpen(false);
  }
  function downloadRows(selected: CaseRecord[]) {
    if (!selected.length) {
      setToast("No matching records to export. Try removing a filter.");
      return;
    }
    const url = URL.createObjectURL(
      new Blob([csvText(selected)], { type: "text/csv;charset=utf-8;" }),
    );
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `casefile-synthetic-records-${AS_OF}.csv`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    setToast(`${number(selected.length)} synthetic records exported as CSV.`);
  }
  async function share() {
    const url = shareURL(window.location.href, filters);
    try {
      if (navigator.clipboard?.writeText)
        await navigator.clipboard.writeText(url);
      else {
        const input = document.createElement("textarea");
        input.value = url;
        input.style.position = "fixed";
        input.style.opacity = "0";
        document.body.appendChild(input);
        input.select();
        const copied = document.execCommand("copy");
        input.remove();
        if (!copied) throw new Error("Copy not supported");
      }
      setToast("Project link copied. Ready to share as your proof of work.");
    } catch {
      if (navigator.share) {
        try {
          await navigator.share({
            title: "Casefile — Crime Intelligence Dashboard",
            text: "Microsoft Fabric & AI hackathon proof-of-work demo using synthetic incident data.",
            url,
          });
        } catch {
          setToast(
            "Sharing canceled. You can copy the link from your address bar.",
          );
        }
      } else
        setToast(
          "Copy the project URL from your browser’s address bar to share it.",
        );
    }
  }
  const isMethodology = page === "methodology";
  return (
    <div className="app-shell">
      <a
        className="skip-link"
        href="#main-content"
        onClick={(event) => {
          event.preventDefault();
          document.getElementById("main-content")?.focus();
        }}
      >
        Skip to dashboard
      </a>
      {menuOpen && (
        <button
          className="sidebar-scrim"
          aria-label="Close navigation"
          onClick={() => setMenuOpen(false)}
        />
      )}
      <aside className={`sidebar ${menuOpen ? "sidebar-open" : ""}`}>
        <a
          className="brand-link"
          href="#"
          onClick={(event) => {
            event.preventDefault();
            navigate("overview");
          }}
          aria-label="Casefile overview"
        >
          <Logo />
        </a>
        <div className="workspace-selector">
          <span className="workspace-symbol">
            <Database size={16} />
          </span>
          <div>
            <strong>Crime intelligence</strong>
            <span>Hackathon workspace</span>
          </div>
          <ChevronRight size={14} />
        </div>
        <div className="nav-label">WORKSPACE</div>
        <nav aria-label="Dashboard navigation">
          {navItems.map((item) => (
            <a
              key={item.page}
              href={item.page === "overview" ? "#" : `#${item.page}`}
              aria-current={page === item.page ? "page" : undefined}
              className={`nav-item ${page === item.page ? "active" : ""}`}
              onClick={(event) => {
                event.preventDefault();
                navigate(item.page);
              }}
            >
              <item.icon size={18} />
              <span>{item.name}</span>
              {item.page === "insights" && (
                <span className="nav-ai-badge">AI</span>
              )}
            </a>
          ))}
        </nav>
        <div className="nav-label project-label">PROJECT</div>
        <a
          className={`nav-item ${isMethodology ? "active" : ""}`}
          href="#methodology"
          aria-current={isMethodology ? "page" : undefined}
          onClick={(event) => {
            event.preventDefault();
            navigate("methodology");
          }}
        >
          <BookOpen size={18} />
          <span>Methodology & Fabric</span>
        </a>
        <div className="sidebar-bottom">
          <div className="hackathon-card">
            <span className="fabric-mark">
              <i />
              <i />
              <i />
              <i />
            </span>
            <span className="eyebrow">LEARNING PROJECT</span>
            <strong>
              Microsoft Fabric
              <br />& AI hackathon
            </strong>
            <p>Explore. Analyze. Explain.</p>
            <button onClick={() => navigate("methodology")}>
              Behind the project
              <ArrowUpRight size={13} />
            </button>
          </div>
          <div className="sidebar-data">
            <span className="live-dot" />
            <span>Synthetic dataset loaded</span>
          </div>
          <div className="workspace-profile">
            <span className="avatar">CF</span>
            <div>
              <strong>Public demo</strong>
              <span>Read-only sample</span>
            </div>
            <ShieldCheck size={16} />
          </div>
        </div>
      </aside>
      <div className="main-shell">
        <header className="topbar">
          <div className="topbar-left">
            <button
              className="mobile-menu icon-button"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label={menuOpen ? "Close navigation" : "Open navigation"}
              aria-expanded={menuOpen}
            >
              {menuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            <span className="breadcrumb">
              Workspace
              <ChevronRight size={12} />
              <strong>{pageNames[page]}</strong>
            </span>
          </div>
          <div className="topbar-right">
            <span className="environment-tag">
              <span />
              DEMO ENVIRONMENT
            </span>
            <span className="topbar-divider" />
            <button className="share-button" onClick={() => void share()}>
              <Share2 size={15} />
              <span>Share project</span>
            </button>
          </div>
        </header>
        <main id="main-content" tabIndex={-1}>
          <div className="page-heading">
            <div>
              <div className="eyebrow page-eyebrow">
                <span className="cyan-line" />
                MICROSOFT FABRIC & AI · HACKATHON PROJECT
              </div>
              <h1>
                {page === "overview" ? "Crime intelligence" : pageNames[page]}
                <span className="heading-dot">.</span>
              </h1>
              <p>{pageDescriptions[page]}</p>
            </div>
            <div className="page-actions">
              {!isMethodology && (
                <>
                  <label className="global-search">
                    <Search size={16} />
                    <input
                      value={filters.search}
                      maxLength={80}
                      onChange={(event) =>
                        setFilters({ ...filters, search: event.target.value })
                      }
                      placeholder="Search records…"
                      aria-label="Search all incident records"
                    />
                    {filters.search && (
                      <button
                        aria-label="Clear search"
                        onClick={() => setFilters({ ...filters, search: "" })}
                      >
                        <X size={13} />
                      </button>
                    )}
                  </label>
                  <button
                    className="button secondary export-button"
                    onClick={() => downloadRows(rows)}
                  >
                    <Download size={15} />
                    <span>Export CSV</span>
                  </button>
                </>
              )}
            </div>
          </div>
          <div className="demo-banner">
            <span className="synthetic-pill">
              <ShieldCheck size={12} />
              SYNTHETIC DATA
            </span>
            <p>
              All incidents, locations and subjects are fictional. This is a
              learning demo, not a criminal-history lookup.
            </p>
            <button onClick={() => navigate("methodology")}>
              About the data
              <ArrowUpRight size={12} />
            </button>
          </div>
          {!isMethodology && (
            <>
              <div className="view-context">
                <span>
                  <span className="live-dot" />
                  Snapshot: {shortDate(AS_OF)}
                  <span className="context-separator">/</span>Northbridge demo
                  jurisdiction
                </span>
                <span>
                  {shortDate(filters.from)
                    .replace(", 2026", "")
                    .replace(", 2025", " ’25")}{" "}
                  — {shortDate(filters.to)}
                </span>
              </div>
              <FilterBar
                filters={filters}
                setFilters={setFilters}
                reset={reset}
              />
            </>
          )}
          {page === "overview" && (
            <>
              <Metrics summary={summary} />
              <div className="overview-charts">
                <TrendChart
                  summary={summary}
                  filters={filters}
                  setFilters={setFilters}
                />
                <OffenseChart
                  summary={summary}
                  select={(category) =>
                    setFilters({
                      ...filters,
                      category:
                        filters.category === category ? "All" : category,
                    })
                  }
                />
              </div>
              <div className="overview-secondary">
                <DistrictMap
                  summary={summary}
                  active={filters.district}
                  select={(district) => setFilters({ ...filters, district })}
                  openGeography={() => navigate("geography")}
                />
                <BriefingCard
                  summary={summary}
                  ai={ai}
                  openAnalyst={() => navigate("insights")}
                />
              </div>
              <RecordsTable
                rows={rows}
                filters={filters}
                setFilters={setFilters}
                openCase={setSelectedCase}
                compact
                openRecords={() => navigate("records")}
                reset={reset}
              />
            </>
          )}
          {page === "records" && (
            <>
              <div className="records-heading-summary">
                <span>
                  <strong>{number(rows.length)}</strong> incidents in this view
                </span>
                <span>
                  <strong>{number(summary.open)}</strong> active cases
                </span>
                <span>
                  <strong>{summary.closureRate.toFixed(1)}%</strong> case
                  closure rate
                </span>
              </div>
              <RecordsTable
                rows={rows}
                filters={filters}
                setFilters={setFilters}
                openCase={setSelectedCase}
                reset={reset}
              />
            </>
          )}
          {page === "geography" && (
            <>
              <Metrics summary={summary} />
              <div className="geography-layout">
                <DistrictMap
                  summary={summary}
                  active={filters.district}
                  select={(district) => setFilters({ ...filters, district })}
                  expanded
                />
                <RegionComparison
                  summary={summary}
                  select={(district) =>
                    setFilters({
                      ...filters,
                      district:
                        filters.district === district ? "All" : district,
                    })
                  }
                />
              </div>
              <TrendChart
                summary={summary}
                filters={filters}
                setFilters={setFilters}
              />
              <RecordsTable
                rows={rows}
                filters={filters}
                setFilters={setFilters}
                openCase={setSelectedCase}
                compact
                openRecords={() => navigate("records")}
                reset={reset}
              />
            </>
          )}
          {page === "insights" && (
            <>
              <Metrics summary={summary} />
              <AnalystPage summary={summary} ai={ai} />
            </>
          )}
          {isMethodology && (
            <Methodology exportAll={() => downloadRows(records)} />
          )}
          <footer className="page-footer">
            <span>
              <Logo small />
              <span>Learning project · Independent demo</span>
            </span>
            <span>
              Fictional records. Responsible analytics.
              <span className="footer-version">v1.0</span>
            </span>
          </footer>
        </main>
      </div>
      {selectedCase && <CaseDrawer record={selectedCase} close={closeCase} />}
      {toast && (
        <div className="toast" role="status">
          <Check size={17} />
          <span>{toast}</span>
          <button
            aria-label="Dismiss notification"
            onClick={() => setToast("")}
          >
            <X size={14} />
          </button>
        </div>
      )}
    </div>
  );
}
