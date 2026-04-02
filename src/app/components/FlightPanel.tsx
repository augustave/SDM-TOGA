import { useState, useEffect } from "react";

interface FlightPanelProps {
  yokeRoll?: number;
  yokePitch?: number;
}

export function FlightPanel({ yokeRoll = 0, yokePitch = 0 }: FlightPanelProps) {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const utcH = time.getUTCHours().toString().padStart(2, "0");
  const utcM = time.getUTCMinutes().toString().padStart(2, "0");
  const utcS = time.getUTCSeconds().toString().padStart(2, "0");
  const aircraftPitch = -yokePitch;
  const ghostRollDeg = yokeRoll * 10;
  const ghostOffsetY = -aircraftPitch * 6;

  const rows = [
    { label: "FLT", value: "AFR1842" },
    { label: "A/C", value: "A320-214" },
    { label: "REG", value: "F-HBNK" },
    { label: "FROM", value: "LFPG" },
    { label: "TO", value: "LEBL" },
    { label: "ALTN", value: "LFBO" },
    { label: "CRZ FL", value: "FL370" },
    { label: "CI", value: "38" },
    { label: "ZFW", value: "55.8T" },
    { label: "FUEL", value: "12.4T" },
    { label: "TOW", value: "68.2T" },
  ];

  return (
    <div className="space-y-6">
      {/* UTC Clock */}
      <div>
        <div
          className="text-[10px] text-[#8A8A84] uppercase mb-1"
          style={{ fontFamily: "var(--font-stencil)", letterSpacing: "0.2em" }}
        >
          UTC
        </div>
        <div className="text-[18px] text-[#222222] tabular-nums tracking-wider" style={{ fontFamily: "var(--font-data)" }}>
          {utcH}:{utcM}:{utcS}Z
        </div>
      </div>

      {/* Flight data table */}
      <div>
        <div
          className="text-[10px] text-[#8A8A84] uppercase mb-2"
          style={{ fontFamily: "var(--font-stencil)", letterSpacing: "0.2em" }}
        >
          Flight Data
        </div>
        <div className="border-t border-[#BEBEB8]">
          {rows.map((r) => (
            <div
              key={r.label}
              className="flex justify-between py-[3px] border-b border-[#BEBEB8]/50"
            >
              <span className="text-[10px] text-[#8A8A84] uppercase tracking-wider">{r.label}</span>
              <span className="text-[11px] text-[#222222] tabular-nums">{r.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Control surface indicators */}
      <div>
        <div
          className="text-[10px] text-[#8A8A84] uppercase mb-2"
          style={{ fontFamily: "var(--font-stencil)", letterSpacing: "0.2em" }}
        >
          Control Surfaces
        </div>
        <div className="border border-[#BEBEB8] bg-[#E2E2DF] p-3">
          <svg viewBox="0 0 200 120" className="w-full">
            {/* Faint response ghost so the aircraft mirrors the sidestick input */}
            <g
              transform={`translate(100 ${60 + ghostOffsetY}) rotate(${ghostRollDeg}) translate(-100 -60)`}
              opacity="0.25"
            >
              <line x1="100" y1="10" x2="100" y2="110" stroke="#4A4A46" strokeWidth="0.75" />
              <ellipse cx="100" cy="15" rx="4" ry="8" fill="none" stroke="#4A4A46" strokeWidth="0.75" />
              <line x1="96" y1="15" x2="96" y2="95" stroke="#4A4A46" strokeWidth="0.75" />
              <line x1="104" y1="15" x2="104" y2="95" stroke="#4A4A46" strokeWidth="0.75" />
              <line x1="96" y1="95" x2="92" y2="110" stroke="#4A4A46" strokeWidth="0.75" />
              <line x1="104" y1="95" x2="108" y2="110" stroke="#4A4A46" strokeWidth="0.75" />
              <line x1="92" y1="110" x2="108" y2="110" stroke="#4A4A46" strokeWidth="0.75" />
              <line x1="96" y1="50" x2="20" y2="58" stroke="#4A4A46" strokeWidth="0.75" />
              <line x1="104" y1="50" x2="180" y2="58" stroke="#4A4A46" strokeWidth="0.75" />
              <line x1="20" y1="58" x2="30" y2="68" stroke="#4A4A46" strokeWidth="0.75" />
              <line x1="180" y1="58" x2="170" y2="68" stroke="#4A4A46" strokeWidth="0.75" />
              <line x1="30" y1="68" x2="96" y2="60" stroke="#4A4A46" strokeWidth="0.75" />
              <line x1="170" y1="68" x2="104" y2="60" stroke="#4A4A46" strokeWidth="0.75" />
              <line x1="92" y1="100" x2="70" y2="104" stroke="#4A4A46" strokeWidth="0.5" />
              <line x1="108" y1="100" x2="130" y2="104" stroke="#4A4A46" strokeWidth="0.5" />
              <line x1="70" y1="104" x2="75" y2="108" stroke="#4A4A46" strokeWidth="0.5" />
              <line x1="130" y1="104" x2="125" y2="108" stroke="#4A4A46" strokeWidth="0.5" />
              <line x1="75" y1="108" x2="92" y2="105" stroke="#4A4A46" strokeWidth="0.5" />
              <line x1="125" y1="108" x2="108" y2="105" stroke="#4A4A46" strokeWidth="0.5" />
            </g>

            {/* Aircraft outline - top view */}
            {/* Fuselage */}
            <line x1="100" y1="10" x2="100" y2="110" stroke="#BEBEB8" strokeWidth="0.5" />
            <ellipse cx="100" cy="15" rx="4" ry="8" fill="none" stroke="#4A4A46" strokeWidth="1" />
            <line x1="96" y1="15" x2="96" y2="95" stroke="#4A4A46" strokeWidth="1" />
            <line x1="104" y1="15" x2="104" y2="95" stroke="#4A4A46" strokeWidth="1" />
            {/* Tail */}
            <line x1="96" y1="95" x2="92" y2="110" stroke="#4A4A46" strokeWidth="1" />
            <line x1="104" y1="95" x2="108" y2="110" stroke="#4A4A46" strokeWidth="1" />
            <line x1="92" y1="110" x2="108" y2="110" stroke="#4A4A46" strokeWidth="1" />

            {/* Wings */}
            <line x1="96" y1="50" x2="20" y2="58" stroke="#4A4A46" strokeWidth="1" />
            <line x1="104" y1="50" x2="180" y2="58" stroke="#4A4A46" strokeWidth="1" />
            <line x1="20" y1="58" x2="30" y2="68" stroke="#4A4A46" strokeWidth="1" />
            <line x1="180" y1="58" x2="170" y2="68" stroke="#4A4A46" strokeWidth="1" />
            <line x1="30" y1="68" x2="96" y2="60" stroke="#4A4A46" strokeWidth="1" />
            <line x1="170" y1="68" x2="104" y2="60" stroke="#4A4A46" strokeWidth="1" />

            {/* Horizontal stabilizer */}
            <line x1="92" y1="100" x2="70" y2="104" stroke="#4A4A46" strokeWidth="0.75" />
            <line x1="108" y1="100" x2="130" y2="104" stroke="#4A4A46" strokeWidth="0.75" />
            <line x1="70" y1="104" x2="75" y2="108" stroke="#4A4A46" strokeWidth="0.75" />
            <line x1="130" y1="104" x2="125" y2="108" stroke="#4A4A46" strokeWidth="0.75" />
            <line x1="75" y1="108" x2="92" y2="105" stroke="#4A4A46" strokeWidth="0.75" />
            <line x1="125" y1="108" x2="108" y2="105" stroke="#4A4A46" strokeWidth="0.75" />

            {/* Aileron indicators - left */}
            <rect
              x="22" y="59"
              width="16" height="4"
              fill="none" stroke="#4A4A46" strokeWidth="0.75"
            />
            <rect
              x="22" y="59"
              width={Math.abs(yokeRoll * -8)}
              height="4"
              fill={yokeRoll < 0 ? "#4A4A46" : "none"}
              opacity="0.5"
            />

            {/* Aileron indicators - right */}
            <rect
              x="162" y="59"
              width="16" height="4"
              fill="none" stroke="#4A4A46" strokeWidth="0.75"
            />
            <rect
              x="162" y="59"
              width={Math.abs(yokeRoll * 8)}
              height="4"
              fill={yokeRoll > 0 ? "#4A4A46" : "none"}
              opacity="0.5"
            />

            {/* Elevator indicators */}
            <rect
              x="73" y="104"
              width="10" height="3"
              fill="none" stroke="#4A4A46" strokeWidth="0.5"
            />
            <rect
              x="117" y="104"
              width="10" height="3"
              fill="none" stroke="#4A4A46" strokeWidth="0.5"
            />
            <rect
              x="73" y="104"
              width={Math.abs(yokePitch * 5)}
              height="3"
              fill={yokePitch !== 0 ? "#4A4A46" : "none"}
              opacity="0.5"
            />
            <rect
              x="117" y="104"
              width={Math.abs(yokePitch * 5)}
              height="3"
              fill={yokePitch !== 0 ? "#4A4A46" : "none"}
              opacity="0.5"
            />

            {/* Labels */}
            <text x="30" y="56" textAnchor="middle" fill="#BEBEB8" fontSize="5" fontFamily="IBM Plex Mono, monospace">L AIL</text>
            <text x="170" y="56" textAnchor="middle" fill="#BEBEB8" fontSize="5" fontFamily="IBM Plex Mono, monospace">R AIL</text>
            <text x="100" y="118" textAnchor="middle" fill="#BEBEB8" fontSize="5" fontFamily="IBM Plex Mono, monospace">ELEV</text>
          </svg>
        </div>
      </div>

      {/* Version */}
      <div className="text-[8px] text-[#BEBEB8] uppercase tracking-wider">
        FMGS VER 2.4.1 — DB CYCLE 2603
      </div>
    </div>
  );
}
