import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ArrowUpRight, ChevronRight } from "lucide-react";
import { type Summary, type Filters } from "../../shared/data";
import { EmptyState, SectionTitle, number } from "./UI";

const tooltipStyle = {
  background: "#1b2532",
  border: "1px solid #354352",
  borderRadius: 8,
  fontSize: 12,
  color: "#eef3f7",
  padding: 12,
};
export function TrendChart({
  summary,
  filters,
  setFilters,
}: {
  summary: Summary;
  filters: Filters;
  setFilters: (filters: Filters) => void;
}) {
  return (
    <section className="panel trend-panel">
      <SectionTitle
        title="Incident trends"
        subtitle="Recorded incidents and case closures over time"
        action={<span className="panel-tag">MONTHLY</span>}
      />
      <div className="chart-legend">
        <span>
          <i style={{ background: "#31c3d9" }} />
          Incidents
        </span>
        <span>
          <i style={{ background: "#697aa0" }} />
          Closed cases
        </span>
        <span className="chart-hint">
          Click a month to explore
          <ArrowUpRight size={12} />
        </span>
      </div>
      {summary.total === 0 ? (
        <EmptyState />
      ) : (
        <div className="trend-chart">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={summary.trend}
              margin={{ top: 12, right: 10, bottom: 3, left: -24 }}
              onClick={(state) => {
                if (state?.activeLabel) {
                  const item = summary.trend.find(
                    (d) => d.label === state.activeLabel,
                  );
                  if (item) {
                    const end = new Date(
                      Date.UTC(
                        Number(item.month.slice(0, 4)),
                        Number(item.month.slice(5, 7)),
                        0,
                      ),
                    )
                      .toISOString()
                      .slice(0, 10);
                    setFilters({
                      ...filters,
                      from:
                        item.month + "-01" > filters.from
                          ? item.month + "-01"
                          : filters.from,
                      to: end < filters.to ? end : filters.to,
                    });
                  }
                }
              }}
            >
              <defs>
                <linearGradient id="cyanArea" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#31c3d9" stopOpacity={0.25} />
                  <stop offset="100%" stopColor="#31c3d9" stopOpacity={0.015} />
                </linearGradient>
                <linearGradient id="closedArea" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#697aa0" stopOpacity={0.1} />
                  <stop offset="100%" stopColor="#697aa0" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                stroke="#24303c"
                strokeDasharray="3 5"
                vertical={false}
              />
              <XAxis
                dataKey="label"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#8c9aaa", fontSize: 11 }}
                dy={9}
                minTickGap={20}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#8c9aaa", fontSize: 11 }}
                allowDecimals={false}
              />
              <Tooltip
                contentStyle={tooltipStyle}
                labelStyle={{ color: "#d9e2ec", marginBottom: 8 }}
                itemStyle={{ color: "#cad5e0" }}
                cursor={{ stroke: "#607284", strokeDasharray: "3 4" }}
              />
              <Area
                type="monotone"
                dataKey="closed"
                name="Closed cases"
                stroke="#7184af"
                fill="url(#closedArea)"
                strokeWidth={2}
              />
              <Area
                type="monotone"
                dataKey="total"
                name="Incidents"
                stroke="#31c3d9"
                fill="url(#cyanArea)"
                strokeWidth={2.4}
                activeDot={{
                  r: 5,
                  fill: "#31c3d9",
                  stroke: "#111b26",
                  strokeWidth: 3,
                }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
      <p className="panel-footnote">
        October ends on Oct 24. Partial months are not directly comparable.
      </p>
    </section>
  );
}
export function OffenseChart({
  summary,
  select,
}: {
  summary: Summary;
  select: (category: string) => void;
}) {
  return (
    <section className="panel offense-panel">
      <SectionTitle
        title="Offense breakdown"
        subtitle="Composition of the selected view"
      />
      {summary.total === 0 ? (
        <EmptyState />
      ) : (
        <>
          <div className="donut-container">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={summary.categories}
                  dataKey="count"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius="58%"
                  outerRadius="77%"
                  paddingAngle={3}
                  cornerRadius={3}
                  stroke="none"
                  onClick={(data) => select(data.name as string)}
                >
                  {summary.categories.map((item) => (
                    <Cell
                      key={item.name}
                      fill={item.color}
                      style={{ cursor: "pointer" }}
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={tooltipStyle}
                  itemStyle={{ color: "#e6edf3" }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="donut-label">
              <strong>{number(summary.total)}</strong>
              <span>INCIDENTS</span>
            </div>
          </div>
          <div className="offense-legend">
            {summary.categories.map((item) => (
              <button key={item.name} onClick={() => select(item.name)}>
                <span>
                  <i style={{ background: item.color }} />
                  {item.name}
                </span>
                <span>
                  {((item.count / summary.total) * 100).toFixed(1)}%
                  <ChevronRight size={12} />
                </span>
              </button>
            ))}
          </div>
        </>
      )}
    </section>
  );
}
export function RegionComparison({
  summary,
  select,
}: {
  summary: Summary;
  select: (district: string) => void;
}) {
  const max = Math.max(...summary.districts.map((d) => d.count), 1);
  return (
    <section className="panel region-panel">
      <SectionTitle
        title="District comparison"
        subtitle="Incident counts, not population-adjusted rates"
      />
      <div className="regional-list">
        {[...summary.districts]
          .sort((a, b) => b.count - a.count)
          .map((item, index) => (
            <button
              className="region-row"
              key={item.name}
              onClick={() => select(item.name)}
            >
              <span className="region-rank">0{index + 1}</span>
              <div>
                <div className="region-name">
                  <span>{item.name} District</span>
                  <strong>{number(item.count)}</strong>
                </div>
                <div className="region-track">
                  <span style={{ width: `${(item.count / max) * 100}%` }} />
                </div>
                <span className="region-meta">
                  {item.closureRate.toFixed(1)}% closed
                </span>
              </div>
              <ChevronRight size={15} />
            </button>
          ))}
      </div>
      <div className="regional-note">
        A higher count does not imply a higher crime risk. Population and
        reporting differences are not modeled.
      </div>
    </section>
  );
}
