import {
  TELEMETRY_EVENTS,
  getEventSeverity,
  getAudioWarnings,
  getEcamWarnings,
  isSpeedValid,
  SEVERITY_COLORS,
  CRITICAL_AOA_THRESHOLD,
} from "./telemetry-data";

interface DataLogProps {
  currentIndex: number;
  onSelectEvent: (index: number) => void;
}

export function DataLog({ currentIndex, onSelectEvent }: DataLogProps) {
  const events = TELEMETRY_EVENTS;

  // Build altitude profile SVG
  const altMax = Math.max(...events.map((e) => e.altitude_ft));
  const altMin = 0;
  const svgW = 400;
  const svgH = 100;
  const pad = { top: 10, bottom: 20, left: 40, right: 10 };
  const plotW = svgW - pad.left - pad.right;
  const plotH = svgH - pad.top - pad.bottom;

  const parseTimestamp = (ts: string) => {
    const [h, m, s] = ts.split(":").map(Number);
    return h * 3600 + m * 60 + s;
  };

  const startT = parseTimestamp(events[0].timestamp);
  const endT = parseTimestamp(events[events.length - 1].timestamp);
  const totalT = endT - startT;

  const getX = (idx: number) => {
    const t = parseTimestamp(events[idx].timestamp) - startT;
    return pad.left + (t / totalT) * plotW;
  };

  const getAltY = (alt: number) => {
    return pad.top + plotH - (alt / (altMax * 1.1)) * plotH;
  };

  const altPoints = events.map((e, i) => `${getX(i)},${getAltY(e.altitude_ft)}`).join(" ");

  return (
    <div className="flex flex-col">
      <div className="flex justify-between items-start px-1 mb-2">
        <span
          className="text-[10px] uppercase text-[#8A8A84]"
          style={{ fontFamily: "var(--font-stencil)", letterSpacing: "0.2em" }}
        >
          FDR — Flight Data Record
        </span>
        <span className="text-[10px] text-[#BEBEB8]" style={{ fontFamily: "var(--font-stencil)", letterSpacing: "0.1em" }}>FIG.08</span>
      </div>

      {/* Altitude profile chart */}
      <div className="border border-[#BEBEB8] bg-[#E2E2DF] p-2 mb-4">
        <svg viewBox={`0 0 ${svgW} ${svgH}`} className="w-full" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
          {/* Grid */}
          {[0, 10000, 20000, 30000, 40000].map((alt) => {
            const y = getAltY(alt);
            return (
              <g key={alt}>
                <line x1={pad.left} y1={y} x2={svgW - pad.right} y2={y} stroke="#BEBEB8" strokeWidth="0.3" strokeDasharray="2 4" />
                <text x={pad.left - 4} y={y + 3} fill="#BEBEB8" fontSize="6" textAnchor="end">{alt / 1000}k</text>
              </g>
            );
          })}

          {/* Altitude trace */}
          <polyline points={altPoints} fill="none" stroke="#4A4A46" strokeWidth="1" />

          {/* Event markers on trace */}
          {events.map((e, i) => {
            const x = getX(i);
            const y = getAltY(e.altitude_ft);
            const sev = getEventSeverity(e);
            const color = SEVERITY_COLORS[sev];
            const isActive = i === currentIndex;
            return (
              <g key={e.event_id} onClick={() => onSelectEvent(i)} className="cursor-pointer">
                <circle
                  cx={x} cy={y} r={isActive ? 5 : 3}
                  fill={isActive ? color : "transparent"}
                  stroke={color} strokeWidth="1"
                />
                {isActive && (
                  <line x1={x} y1={y + 6} x2={x} y2={svgH - pad.bottom + 5} stroke={color} strokeWidth="0.5" strokeDasharray="1 2" />
                )}
                <text x={x} y={svgH - pad.bottom + 12} fill={isActive ? "#222222" : "#BEBEB8"} fontSize="5" textAnchor="middle">
                  {e.timestamp.slice(3)}
                </text>
              </g>
            );
          })}

          {/* X axis */}
          <line x1={pad.left} y1={svgH - pad.bottom} x2={svgW - pad.right} y2={svgH - pad.bottom} stroke="#BEBEB8" strokeWidth="0.5" />
          <text x={pad.left} y={svgH - 3} fill="#BEBEB8" fontSize="5">TIME (UTC)</text>
          <text x={4} y={pad.top + 3} fill="#BEBEB8" fontSize="5">ALT</text>
        </svg>
      </div>

      {/* Data table */}
      <div className="border border-[#BEBEB8] overflow-hidden">
        {/* Header */}
        <div className="bg-[#D8D8D4] flex text-[8px] text-[#8A8A84] uppercase tracking-wider">
          <div className="w-[24px] py-1 px-1 border-r border-[#BEBEB8]">#</div>
          <div className="w-[54px] py-1 px-1 border-r border-[#BEBEB8]">UTC</div>
          <div className="w-[48px] py-1 px-1 border-r border-[#BEBEB8]">IAS</div>
          <div className="w-[52px] py-1 px-1 border-r border-[#BEBEB8]">ALT</div>
          <div className="w-[52px] py-1 px-1 border-r border-[#BEBEB8]">V/S</div>
          <div className="w-[38px] py-1 px-1 border-r border-[#BEBEB8]">PIT</div>
          <div className="w-[38px] py-1 px-1 border-r border-[#BEBEB8]">BNK</div>
          <div className="w-[36px] py-1 px-1 border-r border-[#BEBEB8]">AoA</div>
          <div className="w-[36px] py-1 px-1 border-r border-[#BEBEB8]">N1</div>
          <div className="w-[54px] py-1 px-1 border-r border-[#BEBEB8]">LAW</div>
          <div className="flex-1 py-1 px-1">WARNINGS / STALL LOGIC</div>
        </div>

        {/* Rows */}
        {events.map((e, i) => {
          const sev = getEventSeverity(e);
          const color = SEVERITY_COLORS[sev];
          const isActive = i === currentIndex;
          const audioW = getAudioWarnings(e);
          const ecamW = getEcamWarnings(e);
          const allWarnings = [...audioW, ...ecamW].filter(Boolean);
          const spdVal = isSpeedValid(e.indicated_airspeed_left_kts) ? e.indicated_airspeed_left_kts : null;

          return (
            <div
              key={e.event_id}
              onClick={() => onSelectEvent(i)}
              className={`flex text-[9px] tabular-nums border-t border-[#BEBEB8]/50 cursor-pointer transition-colors duration-100 ${
                isActive ? "bg-[#D8D8D4]" : "hover:bg-[#E2E2DF]"
              }`}
            >
              <div className="w-[24px] py-1 px-1 border-r border-[#BEBEB8]/30" style={{ color: isActive ? color : "#8A8A84" }}>
                {String(i + 1).padStart(2, "0")}
              </div>
              <div className="w-[54px] py-1 px-1 border-r border-[#BEBEB8]/30 text-[#222222]">
                {e.timestamp}
              </div>
              <div className="w-[48px] py-1 px-1 border-r border-[#BEBEB8]/30" style={{ color: spdVal === null ? "#FF5757" : spdVal < 60 ? "#FF5757" : "#4A4A46" }}>
                {spdVal !== null ? spdVal : "FLAG"}
              </div>
              <div className="w-[52px] py-1 px-1 border-r border-[#BEBEB8]/30 text-[#4A4A46]">
                {e.altitude_ft.toLocaleString()}
              </div>
              <div className="w-[52px] py-1 px-1 border-r border-[#BEBEB8]/30" style={{ color: Math.abs(e.vertical_speed_fpm) > 4000 ? "#FF5757" : "#4A4A46" }}>
                {e.vertical_speed_fpm > 0 ? "+" : ""}{e.vertical_speed_fpm}
              </div>
              <div className="w-[38px] py-1 px-1 border-r border-[#BEBEB8]/30 text-[#4A4A46]">
                {e.pitch_attitude_deg}°
              </div>
              <div className="w-[38px] py-1 px-1 border-r border-[#BEBEB8]/30 text-[#4A4A46]">
                {e.bank_angle_deg}°
              </div>
              <div className="w-[36px] py-1 px-1 border-r border-[#BEBEB8]/30" style={{ color: e.angle_of_attack_deg > CRITICAL_AOA_THRESHOLD ? "#FF5757" : "#4A4A46" }}>
                {e.angle_of_attack_deg}
              </div>
              <div className="w-[36px] py-1 px-1 border-r border-[#BEBEB8]/30" style={{ color: e.engine_thrust_n1_percent > 100 ? "#FFB347" : "#4A4A46" }}>
                {e.engine_thrust_n1_percent}
              </div>
              <div className="w-[54px] py-1 px-1 border-r border-[#BEBEB8]/30" style={{ color: e.flight_law !== "Normal" ? "#FFB347" : "#4A4A46" }}>
                {e.flight_law === "Normal" ? "NRM" : "ALT2"}
              </div>
              <div className="flex-1 py-1 px-1 truncate" style={{ color: sev === "normal" ? "#8A8A84" : color }}>
                {allWarnings.length > 0 ? allWarnings[0] : "—"}
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-2 flex gap-4">
        {(["normal", "caution", "warning", "critical"] as const).map((s) => (
          <div key={s} className="flex items-center gap-1">
            <div className="w-2 h-2" style={{ backgroundColor: SEVERITY_COLORS[s] }} />
            <span className="text-[8px] text-[#8A8A84] uppercase tracking-wider">{s}</span>
          </div>
        ))}
      </div>
    </div>
  );
}