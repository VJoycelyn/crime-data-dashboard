import { MapPin, Maximize2 } from "lucide-react";
import { type Summary } from "../../shared/data";
import { SectionTitle, number } from "./UI";

const regions = [
  {
    name: "North",
    path: "M96 36 206 22 254 59 239 128 167 137 88 99Z",
    cx: 170,
    cy: 82,
  },
  {
    name: "West",
    path: "M88 99 167 137 142 194 84 227 34 165 45 105Z",
    cx: 92,
    cy: 165,
  },
  {
    name: "Central",
    path: "M167 137 239 128 268 183 241 237 183 232 142 194Z",
    cx: 205,
    cy: 182,
  },
  {
    name: "East",
    path: "M254 59 326 87 370 157 327 219 268 183 239 128Z",
    cx: 309,
    cy: 143,
  },
  {
    name: "South",
    path: "M84 227 142 194 183 232 241 237 268 183 327 219 307 277 237 311 155 300 110 274Z",
    cx: 218,
    cy: 270,
  },
];
export function DistrictMap({
  summary,
  active,
  select,
  expanded = false,
  openGeography,
}: {
  summary: Summary;
  active: string;
  select: (district: string) => void;
  expanded?: boolean;
  openGeography?: () => void;
}) {
  const max = Math.max(...summary.districts.map((d) => d.count), 1);
  const hottest = [...summary.districts].sort((a, b) => b.count - a.count)[0];
  return (
    <section className={`panel map-panel ${expanded ? "map-expanded" : ""}`}>
      <SectionTitle
        title="District activity"
        subtitle="Northbridge · fictional demonstration city"
        action={
          openGeography && (
            <button
              className="icon-button"
              aria-label="Open geographic analysis"
              onClick={openGeography}
            >
              <Maximize2 size={16} />
            </button>
          )
        }
      />
      <div className="map-view">
        <div className="map-grid" />
        <svg
          viewBox="0 0 405 333"
          role="img"
          aria-label="Schematic map of five fictional Northbridge districts; select a district with the buttons below"
        >
          <defs>
            <pattern
              id="mapBlocks"
              width="19"
              height="17"
              patternUnits="userSpaceOnUse"
              patternTransform="rotate(-20)"
            >
              <path
                d="M0 0H19V17H0Z"
                fill="none"
                stroke="#688194"
                strokeOpacity=".08"
                strokeWidth="3"
              />
            </pattern>
            <radialGradient id="hotspot">
              <stop offset="0" stopColor="#31c3d9" stopOpacity=".35" />
              <stop offset="1" stopColor="#31c3d9" stopOpacity="0" />
            </radialGradient>
          </defs>
          <path
            d="M52 5C108 28 139 26 182 49S208 121 200 142 229 177 247 191 242 229 264 254 287 298 277 333"
            fill="none"
            stroke="#172e3d"
            strokeWidth="16"
          />
          <path
            d="M52 5C108 28 139 26 182 49S208 121 200 142 229 177 247 191 242 229 264 254 287 298 277 333"
            fill="none"
            stroke="#31516a"
            strokeWidth=".8"
          />
          {regions.map((region) => {
            const entry = summary.districts.find((d) => d.name === region.name);
            const count = entry?.count || 0;
            const opacity = 0.03 + (count / max) * 0.15;
            const selected = active === region.name;
            return (
              <g
                key={region.name}
                className="map-region"
                onClick={() =>
                  select(active === region.name ? "All" : region.name)
                }
              >
                <path
                  d={region.path}
                  fill={selected ? "#1b6572" : `rgba(49,195,217,${opacity})`}
                  stroke={selected ? "#31c3d9" : "#3a5969"}
                  strokeWidth={selected ? 1.8 : 1}
                />
                <path d={region.path} fill="url(#mapBlocks)" />
                <circle
                  cx={region.cx}
                  cy={region.cy + 1}
                  r={23 + (count / max) * 22}
                  fill="url(#hotspot)"
                />
                {count > 0 && (
                  <>
                    <circle
                      cx={region.cx - 7}
                      cy={region.cy + 1}
                      r={3 + (count / max) * 4}
                      fill="#31c3d9"
                      opacity=".8"
                    />
                    <circle
                      cx={region.cx + 18}
                      cy={region.cy - 12}
                      r="2.5"
                      fill="#31c3d9"
                      opacity=".65"
                    />
                    <circle
                      cx={region.cx - 22}
                      cy={region.cy + 16}
                      r="2"
                      fill="#31c3d9"
                      opacity=".6"
                    />
                  </>
                )}
                <text
                  x={region.cx}
                  y={region.cy - 20}
                  fill="#bfd0db"
                  textAnchor="middle"
                  fontSize="10"
                  fontFamily="Inter, sans-serif"
                  letterSpacing="1"
                >
                  {region.name.toUpperCase()}
                </text>
                <title>
                  {region.name} District: {number(count)} incidents. Select to
                  filter.
                </title>
              </g>
            );
          })}
          <g transform="translate(369 28)">
            <path d="m0 0-5 12 5-3 5 3Z" fill="#8fabbc" />
            <text y="24" textAnchor="middle" fill="#8fabbc" fontSize="8">
              N
            </text>
          </g>
          <text x="15" y="319" fill="#708593" fontSize="8" letterSpacing="1">
            SCHEMATIC · NOT TO SCALE
          </text>
        </svg>
        <div className="map-label">
          <span className="live-dot" />
          {active === "All" ? "5 districts" : `${active} District`}
        </div>
        <div className="map-intensity">
          <span>Lower</span>
          <i />
          <span>Higher</span>
        </div>
      </div>
      <div className="district-buttons" aria-label="Filter by district">
        {regions.map((region) => (
          <button
            className={active === region.name ? "selected" : ""}
            key={region.name}
            onClick={() => select(active === region.name ? "All" : region.name)}
          >
            {region.name}
          </button>
        ))}
      </div>
      <div className="map-foot">
        <MapPin size={13} />
        <span>
          {summary.total ? (
            <>
              <strong>{hottest.name}</strong> has the most incidents in this
              view · {number(hottest.count)} records
            </>
          ) : (
            "No incidents match the current filters."
          )}
        </span>
      </div>
    </section>
  );
}
