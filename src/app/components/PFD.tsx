import { useMemo } from "react";
import {
  type Severity,
  SEVERITY_COLORS,
  CRITICAL_AOA_THRESHOLD,
  STALL_IAS_FLOOR_KTS,
} from "./telemetry-data";

interface PFDProps {
  roll: number;
  pitch: number;
  speed?: number;
  altitude?: number;
  heading?: number;
  verticalSpeed?: number;
  speedValid?: boolean;
  machNumber?: number | "INVALID_DATA";
  flightLaw?: string;
  apStatus?: string;
  athrStatus?: string;
  severity?: Severity;
  stallWarning?: boolean;
  gpwsWarning?: boolean;
  fmaLeft?: string;
  fmaCenter?: string;
  fmaRight?: string;
  // --- ADR / AoA / derived state props ---
  adr1Speed?: number;
  adr2Speed?: number;
  adr3Speed?: number;
  adr1Valid?: boolean;
  adr2Valid?: boolean;
  adr3Valid?: boolean;
  angleOfAttack?: number;
  calculatedAirspeed?: number;
  adrDisagreement?: boolean;
  spdFlagActive?: boolean;
  stallWarningComputed?: boolean;
  computedFlightLaw?: string;
}

export function PFD({
  roll = 0,
  pitch = 0,
  speed = 248,
  altitude = 37000,
  heading = 218,
  verticalSpeed = 0,
  speedValid = true,
  machNumber = 0.8,
  flightLaw = "Normal",
  apStatus = "ON",
  athrStatus = "ON",
  severity = "normal",
  stallWarning = false,
  gpwsWarning = false,
  fmaLeft = "THR CLB",
  fmaCenter = "NAV",
  fmaRight = "ALT CRZ",
  adr1Speed = 0,
  adr2Speed = 0,
  adr3Speed = 0,
  adr1Valid = true,
  adr2Valid = true,
  adr3Valid = true,
  angleOfAttack = 2.5,
  calculatedAirspeed,
  adrDisagreement = false,
  spdFlagActive,
  stallWarningComputed,
  computedFlightLaw,
}: PFDProps) {
  // Sanitize all numeric inputs — guard against NaN from interpolation edge cases
  const safeNum = (v: number, fallback = 0) => (isNaN(v) || v == null ? fallback : v);
  const rollDeg = safeNum(roll);
  const pitchDeg = safeNum(pitch);
  const pitchOffset = pitchDeg * 2.5;
  const safeSpeed = safeNum(speed, 248);
  const safeAltitude = safeNum(altitude, 0);
  const safeVS = safeNum(verticalSpeed);
  const safeHeading = safeNum(heading, 218);
  const safeAoA = safeNum(angleOfAttack, 0);
  const safeAdr1 = safeNum(adr1Speed);
  const safeAdr2 = safeNum(adr2Speed);
  const safeAdr3 = safeNum(adr3Speed);

  // Use computed flight law if available, otherwise fall back to prop
  const effectiveFlightLaw = computedFlightLaw ?? flightLaw;
  const isNormalLaw = effectiveFlightLaw === "Normal";
  const isAltnLaw = !isNormalLaw;

  // SPD FLAG: use computed value if available, otherwise legacy fallback
  const showSpdFlag = spdFlagActive ?? !speedValid;

  // Stall warning: use AoA-computed logic if available, otherwise legacy
  const showStallWarning = stallWarningComputed ?? stallWarning;

  // Calculated airspeed for display purposes
  const calcIAS = safeNum(calculatedAirspeed ?? (speedValid ? safeSpeed : 0));

  const sevColor = SEVERITY_COLORS[severity];
  const isAbnormal = severity !== "normal";
  const speedColor = showSpdFlag ? "#FF5757" : speed < 60 ? "#FF5757" : "#57FF57";
  const vsClamp = Math.max(-10000, Math.min(10000, safeVS));

  // Speed tape marks
  const speedMarks = useMemo(() => {
    if (showSpdFlag) return [];
    const marks: { value: number; y: number }[] = [];
    const center = safeSpeed;
    for (let s = center - 40; s <= center + 40; s += 10) {
      if (s > 0) {
        marks.push({ value: s, y: 150 - (s - center) * 2.5 });
      }
    }
    return marks;
  }, [safeSpeed, showSpdFlag]);

  // Alt tape marks
  const altMarks = useMemo(() => {
    const marks: { value: number; y: number; label: string }[] = [];
    const center = safeAltitude;
    const step = safeAltitude > 5000 ? 1000 : 500;
    for (let a = center - 4000; a <= center + 4000; a += step) {
      if (a >= 0) {
        marks.push({
          value: a,
          y: 150 - ((a - center) / (safeAltitude > 5000 ? 1000 : 500)) * 25,
          label: a >= 10000 ? `${(a / 1000).toFixed(0)}` : `${a}`,
        });
      }
    }
    return marks;
  }, [safeAltitude]);

  // ADR validity count
  const adrValidCount = [adr1Valid, adr2Valid, adr3Valid].filter(Boolean).length;

  return (
    <div className="flex flex-col">
      <div className="flex justify-between items-start px-1 mb-2">
        <span
          className="text-[10px] uppercase text-[#8A8A84]"
          style={{ fontFamily: "var(--font-stencil)", letterSpacing: "0.2em" }}
        >
          PFD — Primary Flight Display
        </span>
        <span className="text-[10px] text-[#BEBEB8]" style={{ fontFamily: "var(--font-stencil)", letterSpacing: "0.1em" }}>FIG.04</span>
      </div>

      <div className="border border-[#BEBEB8] bg-[#0A0A0A] overflow-hidden" style={{ aspectRatio: "4/3" }}>
        <svg viewBox="0 0 400 300" className="w-full h-full" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
          <defs>
            <clipPath id="pfd-clip"><rect x="0" y="0" width="400" height="300" /></clipPath>
            <clipPath id="adi-clip"><rect x="90" y="20" width="220" height="240" /></clipPath>
            <clipPath id="speed-clip"><rect x="10" y="40" width="70" height="220" /></clipPath>
            <clipPath id="alt-clip"><rect x="320" y="40" width="70" height="220" /></clipPath>
          </defs>

          <rect width="400" height="300" fill="#0A0A0A" />

          {/* === ATTITUDE INDICATOR === */}
          <g clipPath="url(#adi-clip)">
            <g transform={`translate(200, 150) rotate(${rollDeg})`}>
              <rect x="-300" y={-400 + pitchOffset} width="600" height="400" fill="#1a2a3a" />
              <rect x="-300" y={pitchOffset} width="600" height="400" fill="#2a1a0a" />
              <line x1="-300" y1={pitchOffset} x2="300" y2={pitchOffset} stroke="#4A4A46" strokeWidth="1" />
              {[-30, -20, -15, -10, -5, 5, 10, 15, 20, 30].map((deg) => {
                const py = pitchOffset - deg * 2.5;
                const w = Math.abs(deg) % 10 === 0 ? 40 : 20;
                return (
                  <g key={deg}>
                    <line x1={-w} y1={py} x2={w} y2={py} stroke="#8A8A84" strokeWidth="0.75" />
                    {Math.abs(deg) % 10 === 0 && (
                      <text x={w + 6} y={py + 3} fill="#8A8A84" fontSize="8" textAnchor="start">
                        {Math.abs(deg)}
                      </text>
                    )}
                  </g>
                );
              })}

              {/* === NORMAL LAW: Green Pitch Limit Bars === */}
              {isNormalLaw && (
                <>
                  {/* Upper pitch limit: +30° */}
                  <line
                    x1="-60" y1={pitchOffset - 30 * 2.5}
                    x2="60" y2={pitchOffset - 30 * 2.5}
                    stroke="#57FF57" strokeWidth="1.5" strokeDasharray="4,3"
                  />
                  {/* Lower pitch limit: -15° */}
                  <line
                    x1="-60" y1={pitchOffset + 15 * 2.5}
                    x2="60" y2={pitchOffset + 15 * 2.5}
                    stroke="#57FF57" strokeWidth="1.5" strokeDasharray="4,3"
                  />
                </>
              )}
            </g>
          </g>

          {/* === BANK ANGLE MARKS === */}
          <g transform="translate(200, 150)">
            {[-60, -45, -30, -20, -10, 0, 10, 20, 30, 45, 60].map((deg) => {
              const r = 108;
              const len = Math.abs(deg) % 30 === 0 ? 12 : 8;
              const rad = ((deg - 90) * Math.PI) / 180;
              return (
                <line
                  key={deg}
                  x1={Math.cos(rad) * r} y1={Math.sin(rad) * r}
                  x2={Math.cos(rad) * (r + len)} y2={Math.sin(rad) * (r + len)}
                  stroke="#4A4A46" strokeWidth="0.75"
                />
              );
            })}

            {/* === NORMAL LAW: Green Bank Limit Marks at ±67° === */}
            {isNormalLaw && (
              <>
                {[67, -67].map((deg) => {
                  const r = 108;
                  const rad = ((deg - 90) * Math.PI) / 180;
                  const x1 = Math.cos(rad) * r;
                  const y1 = Math.sin(rad) * r;
                  const x2 = Math.cos(rad) * (r + 14);
                  const y2 = Math.sin(rad) * (r + 14);
                  return (
                    <g key={`green-bank-${deg}`}>
                      <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#57FF57" strokeWidth="1.5" />
                      {/* Small perpendicular "stop" bar */}
                      <line
                        x1={x2 - Math.sin(rad) * 4} y1={y2 + Math.cos(rad) * 4}
                        x2={x2 + Math.sin(rad) * 4} y2={y2 - Math.cos(rad) * 4}
                        stroke="#57FF57" strokeWidth="1.5"
                      />
                    </g>
                  );
                })}
              </>
            )}

            {/* === ALTERNATE LAW: Amber Crosses at ±67° (replaces green limits) === */}
            {isAltnLaw && (
              <>
                {[67, -67].map((deg) => {
                  const r = 108;
                  const rad = ((deg - 90) * Math.PI) / 180;
                  const cx = Math.cos(rad) * (r + 7);
                  const cy = Math.sin(rad) * (r + 7);
                  const sz = 6;
                  return (
                    <g key={`amber-cross-${deg}`}>
                      <line
                        x1={cx - sz} y1={cy - sz}
                        x2={cx + sz} y2={cy + sz}
                        stroke="#FFB347" strokeWidth="1.5"
                      />
                      <line
                        x1={cx + sz} y1={cy - sz}
                        x2={cx - sz} y2={cy + sz}
                        stroke="#FFB347" strokeWidth="1.5"
                      />
                    </g>
                  );
                })}
              </>
            )}

            <g transform={`rotate(${rollDeg})`}>
              <polygon points="0,-105 -4,-97 4,-97" fill="none" stroke="#BEBEB8" strokeWidth="0.75" />
            </g>
          </g>

          {/* === AIRCRAFT SYMBOL === */}
          <g transform="translate(200, 150)">
            <rect x="-2" y="-1" width="4" height="2" fill="#BEBEB8" />
            <line x1="-60" y1="0" x2="-20" y2="0" stroke="#BEBEB8" strokeWidth="1.5" />
            <line x1="-60" y1="0" x2="-60" y2="8" stroke="#BEBEB8" strokeWidth="1.5" />
            <line x1="20" y1="0" x2="60" y2="0" stroke="#BEBEB8" strokeWidth="1.5" />
            <line x1="60" y1="0" x2="60" y2="8" stroke="#BEBEB8" strokeWidth="1.5" />
          </g>

          {/* === STALL WARNING OVERLAY (AoA-driven) === */}
          {showStallWarning && (
            <g>
              <rect x="120" y="60" width="160" height="28" fill="#FF2020" opacity="0.15" />
              <rect x="120" y="60" width="160" height="28" fill="none" stroke="#FF2020" strokeWidth="1.5" />
              <text x="200" y="79" fill="#FF2020" fontSize="14" textAnchor="middle" fontWeight="500">
                STALL
              </text>
            </g>
          )}

          {/* === STALL MUTED indicator (AoA above threshold but IAS ≤ 60kt) === */}
          {!showStallWarning && safeAoA > CRITICAL_AOA_THRESHOLD && calcIAS <= STALL_IAS_FLOOR_KTS && (
            <g>
              <rect x="145" y="60" width="110" height="14" fill="#0A0A0A" opacity="0.8" />
              <rect x="145" y="60" width="110" height="14" fill="none" stroke="#4A4A46" strokeWidth="0.5" />
              <text x="200" y="70" fill="#8A8A84" fontSize="7" textAnchor="middle">
                STALL MUTED (IAS≤{STALL_IAS_FLOOR_KTS})
              </text>
            </g>
          )}

          {/* === GPWS WARNING === */}
          {gpwsWarning && (
            <g>
              <rect x="120" y="200" width="160" height="28" fill="#FF2020" opacity="0.15" />
              <rect x="120" y="200" width="160" height="28" fill="none" stroke="#FF2020" strokeWidth="1.5" />
              <text x="200" y="219" fill="#FF2020" fontSize="12" textAnchor="middle" fontWeight="500">
                PULL UP
              </text>
            </g>
          )}

          {/* === SPEED TAPE === */}
          <g clipPath="url(#speed-clip)">
            <rect x="10" y="40" width="65" height="220" fill="#0A0A0A" opacity="0.8" />
            <line x1="75" y1="40" x2="75" y2="260" stroke="#4A4A46" strokeWidth="0.5" />
            {/* Speed numbers and tick marks: HIDDEN when SPD FLAG active */}
            {!showSpdFlag && speedMarks.map((m) => (
              <g key={m.value}>
                <line x1="68" y1={m.y} x2="75" y2={m.y} stroke="#4A4A46" strokeWidth="0.5" />
                {m.value % 20 === 0 && (
                  <text x="64" y={m.y + 3} fill="#BEBEB8" fontSize="9" textAnchor="end">
                    {m.value}
                  </text>
                )}
              </g>
            ))}
          </g>

          {/* Speed readout box */}
          <rect x="15" y="140" width="55" height="20" fill="#0A0A0A" stroke={!showSpdFlag ? "#4A4A46" : "#FF5757"} strokeWidth="1" />
          {!showSpdFlag ? (
            <text x="67" y="154" fill={speedColor} fontSize="12" textAnchor="end">
              {safeSpeed}
            </text>
          ) : (
            <text x="42" y="154" fill="#FF5757" fontSize="11" textAnchor="middle">
              SPD
            </text>
          )}
          <text x="42" y="36" fill="#8A8A84" fontSize="7" textAnchor="middle">SPD</text>
          <text x="42" y="275" fill="#8A8A84" fontSize="7" textAnchor="middle">KT</text>

          {/* SPD FLAG overlay when active */}
          {showSpdFlag && (
            <g>
              <rect x="15" y="108" width="55" height="16" fill="#FF5757" opacity="0.15" />
              <rect x="15" y="108" width="55" height="16" fill="none" stroke="#FF5757" strokeWidth="1" />
              <text x="42" y="120" fill="#FF5757" fontSize="9" textAnchor="middle">SPD FLAG</text>
            </g>
          )}

          {/* Mach display — hidden when SPD FLAG active */}
          {!showSpdFlag && typeof machNumber === "number" && (
            <text x="42" y="268" fill="#57FF57" fontSize="8" textAnchor="middle">
              .{Math.round(machNumber * 100)}
            </text>
          )}

          {/* === ALTITUDE TAPE === */}
          <g clipPath="url(#alt-clip)">
            <rect x="320" y="40" width="70" height="220" fill="#0A0A0A" opacity="0.8" />
            <line x1="320" y1="40" x2="320" y2="260" stroke="#4A4A46" strokeWidth="0.5" />
            {altMarks.map((m) => (
              <g key={m.value}>
                <line x1="320" y1={m.y} x2="327" y2={m.y} stroke="#4A4A46" strokeWidth="0.5" />
                <text x="332" y={m.y + 3} fill="#BEBEB8" fontSize="8" textAnchor="start">
                  {m.label}
                </text>
              </g>
            ))}
          </g>

          {/* Altitude readout box */}
          <rect x="322" y="140" width="65" height="20" fill="#0A0A0A" stroke="#4A4A46" strokeWidth="1" />
          <text x="383" y="154" fill="#57FF57" fontSize="11" textAnchor="end">
            {safeAltitude.toLocaleString()}
          </text>
          <text x="355" y="36" fill="#8A8A84" fontSize="7" textAnchor="middle">ALT</text>
          <text x="355" y="275" fill="#8A8A84" fontSize="7" textAnchor="middle">FT</text>

          {/* === VERTICAL SPEED === */}
          <rect x="390" y="60" width="8" height="180" fill="none" stroke="#4A4A46" strokeWidth="0.5" />
          {[-6000, -4000, -2000, 0, 2000, 4000, 6000].map((vs) => {
            const vy = 150 - (vs / 6000) * 80;
            return <line key={vs} x1="390" y1={vy} x2="398" y2={vy} stroke="#4A4A46" strokeWidth="0.5" />;
          })}
          {/* VS bar */}
          <line
            x1="394" y1={150}
            x2="394" y2={150 - Math.max(-80, Math.min(80, (vsClamp / 6000) * 80))}
            stroke={Math.abs(vsClamp) > 4000 ? "#FFB347" : "#57FF57"} strokeWidth="3"
          />
          {/* VS readout */}
          {safeVS !== 0 && (
            <text
              x="394" y={safeVS > 0 ? 52 : 250}
              fill={Math.abs(vsClamp) > 4000 ? "#FFB347" : "#57FF57"}
              fontSize="7" textAnchor="middle"
            >
              {safeVS > 0 ? "+" : ""}{safeVS}
            </text>
          )}

          {/* === HEADING BAR === */}
          <rect x="90" y="268" width="220" height="30" fill="#0A0A0A" opacity="0.8" />
          <line x1="90" y1="268" x2="310" y2="268" stroke="#4A4A46" strokeWidth="0.5" />
          {Array.from({ length: 37 }, (_, i) => {
            const hdgVal = safeHeading - 18 + i;
            const normalized = ((hdgVal % 360) + 360) % 360;
            const x = 90 + i * (220 / 36);
            const isMajor = normalized % 10 === 0;
            const labels: Record<number, string> = { 0: "N", 90: "E", 180: "S", 270: "W" };
            return (
              <g key={i}>
                <line x1={x} y1={268} x2={x} y2={isMajor ? 276 : 272} stroke="#4A4A46" strokeWidth="0.5" />
                {isMajor && (
                  <text x={x} y={284} fill="#BEBEB8" fontSize="7" textAnchor="middle">
                    {labels[normalized] || normalized}
                  </text>
                )}
              </g>
            );
          })}
          <polygon points="200,266 197,261 203,261" fill="#BEBEB8" />
          <text x="200" y="296" fill="#57FF57" fontSize="9" textAnchor="middle">{safeHeading}°</text>

          {/* === FMA (Flight Mode Annunciator) === */}
          <rect x="90" y="2" width="220" height="16" fill="#0A0A0A" opacity="0.7" />
          <line x1="90" y1="18" x2="310" y2="18" stroke="#4A4A46" strokeWidth="0.5" />
          <line x1="163" y1="2" x2="163" y2="18" stroke="#4A4A46" strokeWidth="0.3" />
          <line x1="237" y1="2" x2="237" y2="18" stroke="#4A4A46" strokeWidth="0.3" />
          <text x="126" y="13" fill={isAbnormal ? "#FFB347" : "#57FF57"} fontSize="8" textAnchor="middle">{fmaLeft}</text>
          <text x="200" y="13" fill={isAbnormal ? "#FFB347" : "#57FF57"} fontSize="8" textAnchor="middle">{fmaCenter}</text>
          <text x="273" y="13" fill={isAbnormal ? "#FFB347" : "#57FF57"} fontSize="8" textAnchor="middle">{fmaRight}</text>

          {/* === FLIGHT LAW INDICATOR === */}
          {isAltnLaw && (
            <g>
              <rect x="2" y="2" width="86" height="16" fill="#0A0A0A" opacity="0.7" />
              <rect x="2" y="2" width="86" height="16" fill="none" stroke="#FFB347" strokeWidth="0.75" />
              <text x="45" y="13" fill="#FFB347" fontSize="7" textAnchor="middle">ALTN LAW</text>
            </g>
          )}

          {/* === AP/ATHR STATUS FLAGS === */}
          {apStatus === "OFF" && (
            <g>
              <rect x="2" y="20" width="86" height="12" fill="#FF5757" opacity="0.12" />
              <rect x="2" y="20" width="86" height="12" fill="none" stroke="#FF5757" strokeWidth="0.75" />
              <text x="45" y="29" fill="#FF5757" fontSize="7" textAnchor="middle">AP OFF</text>
            </g>
          )}
          {athrStatus !== "ON" && athrStatus !== undefined && (
            <g>
              <rect x="2" y={apStatus === "OFF" ? 34 : 20} width="86" height="12" fill="#FFB347" opacity="0.12" />
              <rect x="2" y={apStatus === "OFF" ? 34 : 20} width="86" height="12" fill="none" stroke="#FFB347" strokeWidth="0.75" />
              <text x="45" y={apStatus === "OFF" ? 43 : 29} fill="#FFB347" fontSize="7" textAnchor="middle">A/THR OFF</text>
            </g>
          )}

          {/* === ADR DISAGREE indicator === */}
          {adrDisagreement && (
            <g>
              <rect x="2" y={apStatus === "OFF" && athrStatus !== "ON" ? 48 : apStatus === "OFF" ? 34 : 20} width="86" height="12" fill="#FFB347" opacity="0.12" />
              <rect x="2" y={apStatus === "OFF" && athrStatus !== "ON" ? 48 : apStatus === "OFF" ? 34 : 20} width="86" height="12" fill="none" stroke="#FFB347" strokeWidth="0.75" />
              <text x="45" y={(apStatus === "OFF" && athrStatus !== "ON" ? 48 : apStatus === "OFF" ? 34 : 20) + 9} fill="#FFB347" fontSize="7" textAnchor="middle">ADR DISAGREE</text>
            </g>
          )}

          {/* === AoA readout (lower-left corner) === */}
          <rect x="2" y="258" width="52" height="18" fill="#0A0A0A" opacity="0.7" />
          <text x="5" y="267" fill="#8A8A84" fontSize="6" textAnchor="start">AoA</text>
          <text
            x="50" y="272"
            fill={safeAoA > CRITICAL_AOA_THRESHOLD ? "#FF5757" : "#8A8A84"}
            fontSize="8" textAnchor="end"
          >
            {safeAoA.toFixed(1)}°
          </text>

          {/* === ADR status strip (bottom-left) === */}
          <rect x="2" y="278" width="86" height="20" fill="#0A0A0A" opacity="0.7" />
          <line x1="2" y1="278" x2="88" y2="278" stroke="#4A4A46" strokeWidth="0.3" />
          {[
            { label: "ADR1", valid: adr1Valid, speed: safeAdr1 },
            { label: "ADR2", valid: adr2Valid, speed: safeAdr2 },
            { label: "ADR3", valid: adr3Valid, speed: safeAdr3 },
          ].map((adr, i) => {
            const x = 5 + i * 28;
            return (
              <g key={adr.label}>
                <text x={x} y="286" fill={adr.valid ? "#8A8A84" : "#FF5757"} fontSize="5" textAnchor="start">
                  {adr.label}
                </text>
                <text
                  x={x} y="294"
                  fill={!adr.valid ? "#FF5757" : adrDisagreement ? "#FFB347" : "#57FF57"}
                  fontSize="6" textAnchor="start"
                >
                  {adr.valid ? Math.round(adr.speed) : "---"}
                </text>
              </g>
            );
          })}

          <rect x="0" y="0" width="400" height="300" fill="none" stroke={isAbnormal ? sevColor : "#4A4A46"} strokeWidth={isAbnormal ? "2" : "1"} />
        </svg>
      </div>

      {/* === Sub-PFD status bar === */}
      <div className="mt-2 flex justify-between">
        <span className="text-[8px] text-[#BEBEB8] uppercase tracking-wider">
          LAW: {effectiveFlightLaw.replace(/_/g, " ")}
          {isAltnLaw && <span className="text-[#FFB347] ml-1">(PROT LOST)</span>}
        </span>
        <span className={`text-[8px] uppercase tracking-wider ${apStatus === "ON" ? "text-[#BEBEB8]" : "text-[#FF5757]"}`}>
          AP: {apStatus} / FD: {apStatus === "ON" ? "ENGAGED" : "OFF"}
        </span>
      </div>
      <div className="mt-1 flex justify-between text-[8px]">
        <span className={`uppercase tracking-wider ${adrDisagreement ? "text-[#FFB347]" : "text-[#BEBEB8]"}`}>
          ADR: {adrValidCount}/3 VALID{adrDisagreement ? " — DISAGREE" : ""}
        </span>
        <span className={`uppercase tracking-wider ${safeAoA > CRITICAL_AOA_THRESHOLD ? "text-[#FF5757]" : "text-[#BEBEB8]"}`}>
          AoA: {safeAoA.toFixed(1)}°{safeAoA > CRITICAL_AOA_THRESHOLD ? " — ABOVE CRIT" : ""}
          {safeAoA > CRITICAL_AOA_THRESHOLD && calcIAS <= STALL_IAS_FLOOR_KTS
            ? ` / STALL MUTED (IAS ${Math.round(calcIAS)}≤${STALL_IAS_FLOOR_KTS})`
            : ""
          }
        </span>
      </div>
    </div>
  );
}