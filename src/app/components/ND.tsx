import { useMemo } from "react";
import { type Severity, SEVERITY_COLORS } from "./telemetry-data";

interface NDProps {
  heading?: number;
  range?: number;
  windDirection?: number;
  windSpeed?: number;
  groundSpeed?: number;
  trueAirspeed?: number;
  routeDistance?: number;
  severity?: Severity;
  eventId?: string;
  flightLaw?: string;
  apStatus?: string;
}

interface Waypoint {
  id: string;
  name: string;
  bearing: number; // degrees from origin
  distance: number; // nm from LFPG
  routeNm: number; // cumulative route nm at this waypoint
}

// AF447 route: LFPG → INTOL → TASIL → ORARO → SALPU → NATAL → ...
// Using approximate oceanic waypoints for the AERO track
const WAYPOINTS: Waypoint[] = [
  { id: "dep", name: "LFPG", bearing: 0, distance: 0, routeNm: 0 },
  { id: "salpu", name: "SALPU", bearing: 230, distance: 420, routeNm: 420 },
  { id: "oraro", name: "ORARO", bearing: 225, distance: 780, routeNm: 780 },
  { id: "tasil", name: "TASIL", bearing: 218, distance: 1200, routeNm: 1200 },
  { id: "intol", name: "INTOL", bearing: 215, distance: 1560, routeNm: 1560 },
  { id: "crash", name: "AF447", bearing: 218, distance: 1610, routeNm: 1610 },
  { id: "natal", name: "NATAL", bearing: 220, distance: 2100, routeNm: 2100 },
];

const NAVAIDS = [
  { name: "DKR", bearing: 210, distance: 600, type: "VOR" },
  { name: "SAL", bearing: 225, distance: 1100, type: "VOR" },
];

export function ND({
  heading = 218,
  range = 160,
  windDirection = 240,
  windSpeed = 38,
  groundSpeed = 462,
  trueAirspeed = 478,
  routeDistance = 1580,
  severity = "normal",
  eventId,
  flightLaw = "Normal",
  apStatus = "ON",
}: NDProps) {
  const cx = 200;
  const cy = 200;
  const radius = 150;

  const isAbnormal = severity !== "normal";
  const sevColor = SEVERITY_COLORS[severity];

  // Convert bearing/distance to screen coords (heading-up mode)
  const toScreen = (bearing: number, distance: number) => {
    const relBearing = bearing - heading;
    const rad = ((relBearing - 90) * Math.PI) / 180;
    const r = Math.min((distance / range) * radius, radius);
    return {
      x: cx + Math.cos(rad) * r,
      y: cy + Math.sin(rad) * r,
    };
  };

  // Determine which waypoints are passed based on route distance
  const waypointsWithStatus = useMemo(() => {
    return WAYPOINTS.map((wp) => ({
      ...wp,
      passed: routeDistance >= wp.routeNm,
    }));
  }, [routeDistance]);

  // Find next waypoint (first one not passed)
  const nextWaypoint = waypointsWithStatus.find((wp) => !wp.passed);
  const distToNext = nextWaypoint
    ? Math.max(0, nextWaypoint.routeNm - routeDistance)
    : 0;

  // Compass rose marks
  const compassMarks = useMemo(() => {
    return Array.from({ length: 36 }, (_, i) => {
      const deg = i * 10;
      const relDeg = deg - heading;
      const rad = ((relDeg - 90) * Math.PI) / 180;
      const isMajor = deg % 30 === 0;
      const r1 = radius - (isMajor ? 12 : 6);
      const r2 = radius;
      const labels: Record<number, string> = { 0: "N", 30: "3", 60: "6", 90: "E", 120: "12", 150: "15", 180: "S", 210: "21", 240: "24", 270: "W", 300: "30", 330: "33" };
      return {
        deg,
        x1: cx + Math.cos(rad) * r1,
        y1: cy + Math.sin(rad) * r1,
        x2: cx + Math.cos(rad) * r2,
        y2: cy + Math.sin(rad) * r2,
        labelX: cx + Math.cos(rad) * (r1 - 10),
        labelY: cy + Math.sin(rad) * (r1 - 10),
        label: labels[deg] || "",
        isMajor,
      };
    });
  }, [heading]);

  // Route line waypoints in screen space (only show nearby ones relative to aircraft position)
  const routePoints = useMemo(() => {
    // Compute relative distance from aircraft position to each waypoint
    return waypointsWithStatus
      .map((wp) => {
        const relDist = Math.abs(wp.routeNm - routeDistance);
        // Place waypoints on the heading axis — passed ones behind, upcoming ones ahead
        const ahead = wp.routeNm > routeDistance;
        // Approximate screen position: ahead = up, behind = down
        const screenDist = ahead ? relDist : relDist;
        // Only show if within range
        if (screenDist > range * 1.2) return null;
        const pos = toScreen(wp.bearing, screenDist);
        return {
          ...wp,
          x: ahead ? pos.x : cx + (cx - pos.x) * 0.3, // pull passed ones closer to center
          y: ahead ? pos.y : cy + (cy - pos.y) * 0.15,
          visible: true,
        };
      })
      .filter(Boolean) as Array<Waypoint & { passed: boolean; x: number; y: number; visible: boolean }>;
  }, [heading, range, routeDistance, waypointsWithStatus]);

  // Wind arrow rotation (relative to heading)
  const windRelative = windDirection - heading;

  // ETA calculation
  const etaMinutes = groundSpeed > 0 && nextWaypoint
    ? Math.round((distToNext / groundSpeed) * 60)
    : 0;

  return (
    <div className="flex flex-col">
      <div className="flex justify-between items-start px-1 mb-2">
        <span
          className="text-[10px] uppercase text-[#8A8A84]"
          style={{ fontFamily: "var(--font-stencil)", letterSpacing: "0.2em" }}
        >
          ND — Navigation Display
        </span>
        <span className="text-[10px] text-[#BEBEB8]" style={{ fontFamily: "var(--font-stencil)", letterSpacing: "0.1em" }}>FIG.05</span>
      </div>

      <div
        className={"border bg-[#0A0A0A] overflow-hidden " + (isAbnormal ? "border-[#FFB347]" : "border-[#BEBEB8]")}
        style={{ aspectRatio: "4/3" }}
      >
        <svg viewBox="0 0 400 300" className="w-full h-full" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
          <rect width="400" height="300" fill="#0A0A0A" />

          {/* Range rings */}
          {[0.25, 0.5, 0.75, 1].map((frac) => (
            <circle
              key={frac}
              cx={cx} cy={cy} r={radius * frac}
              fill="none" stroke="#4A4A46" strokeWidth="0.3"
              strokeDasharray={frac < 1 ? "2 4" : "0"}
            />
          ))}

          {/* Range labels */}
          <text x={cx + 4} y={cy - radius * 0.5 + 3} fill="#8A8A84" fontSize="7">{Math.round(range / 2)}</text>
          <text x={cx + 4} y={cy - radius + 3} fill="#8A8A84" fontSize="7">{range}</text>

          {/* Compass rose */}
          {compassMarks.map((m) => (
            <g key={m.deg}>
              <line x1={m.x1} y1={m.y1} x2={m.x2} y2={m.y2} stroke="#4A4A46" strokeWidth={m.isMajor ? "1" : "0.5"} />
              {m.isMajor && m.label && (
                <text
                  x={m.labelX} y={m.labelY + 3}
                  fill="#BEBEB8" fontSize="8" textAnchor="middle"
                >
                  {m.label}
                </text>
              )}
            </g>
          ))}

          {/* Heading line */}
          <line x1={cx} y1={cy} x2={cx} y2={cy - radius - 5} stroke="#BEBEB8" strokeWidth="1" />

          {/* Aircraft symbol */}
          <g transform={`translate(${cx}, ${cy})`}>
            <line x1="-12" y1="0" x2="12" y2="0" stroke="#BEBEB8" strokeWidth="1.5" />
            <line x1="0" y1="-5" x2="0" y2="8" stroke="#BEBEB8" strokeWidth="1.5" />
            <line x1="-6" y1="8" x2="6" y2="8" stroke="#BEBEB8" strokeWidth="1" />
          </g>

          {/* Route line (green dashed) */}
          {routePoints.length > 1 && (
            <polyline
              points={routePoints.map((p) => `${p.x},${p.y}`).join(" ")}
              fill="none"
              stroke="#57FF57"
              strokeWidth="1"
              strokeDasharray="4 2"
            />
          )}

          {/* Waypoints */}
          {routePoints.map((wp) => {
            const isPassed = wp.passed;
            const isActive = nextWaypoint && wp.id === nextWaypoint.id;
            const wpColor = isActive ? "#FFFFFF" : isPassed ? "#8A8A84" : "#57FF57";
            return (
              <g key={wp.id}>
                {/* Waypoint diamond */}
                <polygon
                  points={`${wp.x},${wp.y - 5} ${wp.x + 4},${wp.y} ${wp.x},${wp.y + 5} ${wp.x - 4},${wp.y}`}
                  fill={isActive ? "#57FF57" : "none"}
                  stroke={wpColor}
                  strokeWidth="1"
                />
                {/* Label */}
                <text
                  x={wp.x + 7} y={wp.y + 3}
                  fill={wpColor}
                  fontSize="7"
                >
                  {wp.name}
                </text>
                {/* Distance to waypoint if active */}
                {isActive && (
                  <text x={wp.x + 7} y={wp.y + 12} fill="#57FF57" fontSize="6">
                    {Math.round(distToNext)}NM
                  </text>
                )}
              </g>
            );
          })}

          {/* Navaids */}
          {NAVAIDS.map((nav) => {
            const relDist = Math.abs(nav.distance - routeDistance);
            if (relDist > range) return null;
            const pos = toScreen(nav.bearing, relDist);
            return (
              <g key={nav.name}>
                <polygon
                  points={Array.from({ length: 6 }, (_, i) => {
                    const a = (i * 60 - 30) * (Math.PI / 180);
                    return `${pos.x + Math.cos(a) * 4},${pos.y + Math.sin(a) * 4}`;
                  }).join(" ")}
                  fill="none" stroke="#8A8A84" strokeWidth="0.5"
                />
                <text x={pos.x + 7} y={pos.y + 3} fill="#8A8A84" fontSize="6">{nav.name}</text>
              </g>
            );
          })}

          {/* Mode annotations (top left) */}
          <rect x="2" y="2" width="80" height="14" fill="#0A0A0A" opacity="0.6" />
          <text x="6" y="12" fill={apStatus === "ON" ? "#57FF57" : "#FFB347"} fontSize="8">
            {apStatus === "ON" ? "NAV" : "HDG"}
          </text>
          <text x="36" y="12" fill="#8A8A84" fontSize="8">HDG {Math.round(heading)}°</text>

          <rect x="2" y="18" width="80" height="14" fill="#0A0A0A" opacity="0.6" />
          <text x="6" y="28" fill="#8A8A84" fontSize="8">RANGE {range}NM</text>

          {/* Flight law indicator */}
          {flightLaw !== "Normal" && (
            <>
              <rect x="2" y="34" width="80" height="14" fill="#0A0A0A" opacity="0.6" />
              <rect x="2" y="34" width="80" height="14" fill="none" stroke="#FFB347" strokeWidth="0.5" />
              <text x="6" y="44" fill="#FFB347" fontSize="7">ALTN LAW</text>
            </>
          )}

          {/* Wind data (top right) — animated wind arrow */}
          <rect x="318" y="2" width="80" height="40" fill="#0A0A0A" opacity="0.6" />
          <text x="322" y="12" fill="#8A8A84" fontSize="7">WIND</text>
          <text x="322" y="24" fill="#BEBEB8" fontSize="9" fontWeight="700">
            {Math.round(windDirection)}°/{Math.round(windSpeed)}KT
          </text>

          {/* Wind arrow */}
          <g transform={`translate(380, 28) rotate(${windRelative + 180})`}>
            <line x1="0" y1="-10" x2="0" y2="10" stroke="#BEBEB8" strokeWidth="1" />
            <polygon points="0,-10 -3,-5 3,-5" fill="#BEBEB8" />
          </g>

          {/* GS / TAS (bottom left) */}
          <rect x="2" y="270" width="140" height="28" fill="#0A0A0A" opacity="0.6" />
          <text x="6" y="282" fill="#8A8A84" fontSize="7">GS</text>
          <text x="24" y="282" fill="#57FF57" fontSize="9" fontWeight="700">{Math.round(groundSpeed)}</text>
          <text x="60" y="282" fill="#8A8A84" fontSize="7">TAS</text>
          <text x="80" y="282" fill="#BEBEB8" fontSize="9">{Math.round(trueAirspeed)}</text>
          <text x="6" y="294" fill="#8A8A84" fontSize="6">
            DIST: {Math.round(routeDistance)}NM
          </text>

          {/* Next waypoint + ETA (bottom right) */}
          <rect x="280" y="270" width="118" height="28" fill="#0A0A0A" opacity="0.6" />
          {nextWaypoint ? (
            <>
              <text x="284" y="282" fill="#57FF57" fontSize="8" fontWeight="700">
                {nextWaypoint.name}
              </text>
              <text x="340" y="282" fill="#BEBEB8" fontSize="7">
                {Math.round(distToNext)}NM
              </text>
              <text x="284" y="294" fill="#8A8A84" fontSize="6">
                ETA +{etaMinutes}MIN
              </text>
            </>
          ) : (
            <text x="284" y="282" fill="#8A8A84" fontSize="7">NO WPT</text>
          )}

          {/* Crash site marker if at event 06 */}
          {eventId === "06_impact" && (
            <g transform={`translate(${cx}, ${cy})`}>
              <line x1="-8" y1="-8" x2="8" y2="8" stroke="#FF2020" strokeWidth="2" />
              <line x1="8" y1="-8" x2="-8" y2="8" stroke="#FF2020" strokeWidth="2" />
            </g>
          )}

          {/* Frame */}
          <rect x="0" y="0" width="400" height="300" fill="none" stroke={isAbnormal ? sevColor : "#4A4A46"} strokeWidth={isAbnormal ? "2" : "1"} />
        </svg>
      </div>

      {/* ND annotations */}
      <div className="mt-2 flex justify-between">
        <span className={"text-[8px] uppercase tracking-wider " + (isAbnormal ? "text-[#FFB347]" : "text-[#BEBEB8]")}>
          MODE: {apStatus === "ON" ? "NAV" : "HDG"} — ROSE
        </span>
        <span className={"text-[8px] uppercase tracking-wider " + (isAbnormal ? "text-[#FFB347]" : "text-[#BEBEB8]")}>
          EFIS: ND1 — CAPT
        </span>
      </div>
    </div>
  );
}