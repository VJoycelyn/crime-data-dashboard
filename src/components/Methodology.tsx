import {
  ArrowRight,
  ArrowUpRight,
  Braces,
  Check,
  Database,
  Download,
  FileCode2,
  Layers3,
  ShieldCheck,
  Sparkles,
  Workflow,
} from "lucide-react";
import { AS_OF, DATA_START, records } from "../../shared/data";
import { number, SectionTitle, shortDate } from "./UI";

const fabricSource =
  "https://learn.microsoft.com/en-us/fabric/onelake/onelake-medallion-lakehouse-architecture";
export function Methodology({ exportAll }: { exportAll: () => void }) {
  return (
    <div className="methodology-page">
      <div className="method-intro">
        <span className="eyebrow">A TRANSPARENT PROOF OF WORK</span>
        <h2>
          Built to explore.
          <br />
          Designed to explain.
        </h2>
        <p>
          Casefile demonstrates interactive crime-data analytics and responsible
          AI for a Microsoft Fabric & AI learning hackathon. The working web
          application is hosted independently; the Fabric flow below is a
          proposed reference architecture, not an active workspace connection.
        </p>
      </div>
      <section className="panel provenance-panel">
        <SectionTitle
          title="Know what you’re looking at"
          action={<span className="synthetic-pill">100% synthetic</span>}
        />
        <div className="provenance-grid">
          <div>
            <Database size={21} />
            <h3>Fictional, reproducible data</h3>
            <p>
              {number(records.length)} deterministic synthetic incident records,
              generated from a fixed seed. Dates span {shortDate(DATA_START)}–
              {shortDate(AS_OF)}. The dataset snapshot is fixed; it does not
              update automatically.
            </p>
          </div>
          <div>
            <MapIcon />
            <h3>Invented geography</h3>
            <p>
              Northbridge and its five districts are fictional. Map shapes are
              schematic, not geocoded boundaries. Hotspot intensity represents
              district incident counts, not actual incident coordinates or crime
              risk.
            </p>
          </div>
          <div>
            <ShieldCheck size={21} />
            <h3>No personal records</h3>
            <p>
              Subjects use generated identifiers. No names, biometrics,
              demographic attributes or actual criminal histories are collected.
              An incident report, arrest, case closure or referral is not a
              conviction.
            </p>
          </div>
        </div>
      </section>
      <section className="panel architecture-panel">
        <SectionTitle
          title="Microsoft Fabric reference workflow"
          subtitle="A learning architecture you can implement in your own Fabric workspace"
          action={<span className="panel-tag">PROPOSED · NOT CONNECTED</span>}
        />
        <div className="pipeline">
          {[
            {
              icon: Download,
              label: "INGEST",
              title: "Data Factory",
              body: "Load synthetic CSV incident exports.",
            },
            {
              icon: Database,
              label: "BRONZE",
              title: "OneLake",
              body: "Preserve immutable raw source files.",
            },
            {
              icon: Braces,
              label: "SILVER",
              title: "Spark notebooks",
              body: "Validate dates, deduplicate IDs, standardize codes.",
            },
            {
              icon: Layers3,
              label: "GOLD",
              title: "Curated tables",
              body: "Aggregate by month, offense and district.",
            },
            {
              icon: Sparkles,
              label: "ANALYZE",
              title: "Power BI + AI",
              body: "Model metrics and generate aggregate briefings.",
            },
          ].map((item, index) => (
            <div className="pipeline-stage" key={item.label}>
              <div className="pipeline-icon">
                <item.icon size={23} />
                {index < 4 && (
                  <ArrowRight className="pipeline-arrow" size={17} />
                )}
              </div>
              <span>{item.label}</span>
              <h3>{item.title}</h3>
              <p>{item.body}</p>
            </div>
          ))}
        </div>
        <div className="architecture-foot">
          <span>
            Bronze → Silver → Gold follows the medallion design pattern.
          </span>
          <a href={fabricSource} target="_blank" rel="noreferrer">
            Read Microsoft’s documentation
            <ArrowUpRight size={14} />
          </a>
        </div>
      </section>
      <div className="method-bottom">
        <section className="panel">
          <SectionTitle title="Metric definitions" />
          <dl className="definitions">
            <div>
              <dt>Total incidents</dt>
              <dd>
                Distinct incident records matching every active filter,
                including search. Linked offense classifications do not add to
                the total.
              </dd>
            </div>
            <div>
              <dt>Case closure rate</dt>
              <dd>
                Records with status Closed ÷ all selected records × 100. This is
                a snapshot status measure, not a legal outcome or official
                police clearance rate.
              </dd>
            </div>
            <div>
              <dt>Active cases</dt>
              <dd>
                The sum of Open and Investigating records in the current
                snapshot. Referred cases are shown separately in case records.
              </dd>
            </div>
            <div>
              <dt>Critical incidents</dt>
              <dd>
                Records with the fictional Critical severity label. No severity
                is assigned to a person.
              </dd>
            </div>
            <div>
              <dt>Prior-period change</dt>
              <dd>
                Incident-count change versus the immediately preceding window of
                equal inclusive length, keeping all other filters unchanged. No
                percentage is shown when baseline coverage is incomplete or
                zero.
              </dd>
            </div>
            <div>
              <dt>District activity</dt>
              <dd>
                Raw incident counts in each invented district. Counts are not
                adjusted for population, reporting behavior or exposure.
              </dd>
            </div>
          </dl>
        </section>
        <section className="panel">
          <SectionTitle title="What’s running in this demo" />
          <div className="implementation-list">
            {[
              [
                "Interactive analytics",
                "React + TypeScript with a shared, deterministic filtering and aggregation module.",
              ],
              [
                "On-demand AI",
                "Secure Express endpoint sends only computed aggregate metrics to a hosted language model. Results are labeled AI generated.",
              ],
              [
                "Data transformations",
                "Unique generated incident IDs, normalized UTC dates, controlled offense/status codes and consistent incident-level aggregation.",
              ],
              [
                "Reproducibility",
                "A fixed seed and snapshot date keep shared portfolio views consistent. CSV exports retain synthetic identifiers.",
              ],
            ].map(([title, body]) => (
              <div key={title}>
                <Check size={15} />
                <section>
                  <h3>{title}</h3>
                  <p>{body}</p>
                </section>
              </div>
            ))}
          </div>
          <div className="implementation-warning">
            <Workflow size={17} />
            <p>
              No live public-data connector, scheduled refresh, Microsoft Fabric
              workspace or Power BI report is connected to this demo.
            </p>
          </div>
          <button className="button secondary" onClick={exportAll}>
            <FileCode2 size={15} />
            Download synthetic dataset
            <Download size={15} />
          </button>
        </section>
      </div>
      <section className="responsible-banner">
        <ShieldCheck size={23} />
        <div>
          <h3>Demonstrate analytics. Respect people.</h3>
          <p>
            This public sample is for learning and portfolio review only. It
            must not be used for background checks, eligibility screening,
            law-enforcement decisions, predictive policing or judgments about
            real people. AI outputs require human verification.
          </p>
        </div>
      </section>
    </div>
  );
}
function MapIcon() {
  return (
    <svg
      width="21"
      height="21"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden="true"
    >
      <path d="m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3ZM9 3v15M15 6v15" />
    </svg>
  );
}
