import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { type Severity } from "./telemetry-data";
import {
  buildECAMCascade,
  buildSecondaryMemos,
  ECAM_MAX_VISIBLE_LINES,
  type ECAMMessage,
  type ECAMLevel,
} from "./ecam-messages";

// Design Tokens (PRD)
const ECAM_COLORS: Record<ECAMLevel, string> = {
  red: "#FF0000",
  amber: "#FFB000",
  blue: "#00FFFF",
  green: "#00FF00",
  white: "#FFFFFF",
};
const MEMO_COLORS: Record<string, string> = { green: "#00FF00", white: "#FFFFFF" };

const EMPTY_WARNINGS: string[] = [];

// Props
interface ECAMProps {
  n1Percent?: number;
  ecamWarnings?: string[];
  audioWarnings?: string[];
  autothrustStatus?: string;
  severity?: Severity;
  eventId?: string;
  apStatus?: string;
  flightLaw?: string;
  adrDisagreement?: boolean;
  stallWarning?: boolean;
  stallMuted?: boolean;
  gpwsWarning?: boolean;
  spdFlag?: boolean;
  angleOfAttack?: number;
  calculatedAirspeed?: number;
  egtDegC?: number;
  fuelFlowKgH?: number;
}

// Individual ECAM message line
function ECAMLine({ msg, flashOn }: { msg: ECAMMessage; flashOn: boolean }) {
  const color = ECAM_COLORS[msg.level];
  const visible = msg.flash ? flashOn : true;

  return (
    <div
      className="text-[11px] font-bold uppercase whitespace-pre"
      style={{
        color,
        opacity: visible ? 1 : 0.15,
        paddingLeft: msg.indent ? "8px" : "0",
        lineHeight: "1.9",
        transition: "opacity 0.08s",
      }}
    >
      {msg.text}
    </div>
  );
}

export function ECAM({
  n1Percent = 84,
  audioWarnings,
  autothrustStatus = "ON",
  severity = "normal",
  eventId = "01_cruise_weather_entry",
  apStatus = "ON",
  flightLaw = "Normal",
  adrDisagreement = false,
  stallWarning = false,
  stallMuted = false,
  gpwsWarning = false,
  spdFlag = false,
  egtDegC = 610,
  fuelFlowKgH = 200,
}: ECAMProps) {
  // Engine gauge jitter: use a ref for random offsets, a single state tick to trigger re-render
  const jitterRef = useRef({
    n1L: 0, n1R: 0.2,
    egtL: 0, egtR: -4,
    ffL: 0, ffR: 3,
  });
  const [, setJitterTick] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      jitterRef.current = {
        n1L: (Math.random() - 0.5) * 0.4,
        n1R: 0.2 + (Math.random() - 0.5) * 0.4,
        egtL: Math.round((Math.random() - 0.5) * 10),
        egtR: -4 + Math.round((Math.random() - 0.5) * 10),
        ffL: Math.round((Math.random() - 0.5) * 20),
        ffR: 3 + Math.round((Math.random() - 0.5) * 20),
      };
      setJitterTick((v) => v + 1);
    }, 1500);
    return () => clearInterval(interval);
  }, []);

  // Displayed values = prop + jitter offset (no setState on prop change)
  const n1Left = +(n1Percent + jitterRef.current.n1L).toFixed(1);
  const n1Right = +(n1Percent + jitterRef.current.n1R).toFixed(1);
  const egtLeft = egtDegC + jitterRef.current.egtL;
  const egtRight = egtDegC + jitterRef.current.egtR;
  const ffLeft = fuelFlowKgH + jitterRef.current.ffL;
  const ffRight = fuelFlowKgH + jitterRef.current.ffR;

  const n1Color = n1Percent > 100 ? ECAM_COLORS.amber : ECAM_COLORS.green;

  // N1 arc path
  const n1Arc = (value: number, cx: number) => {
    const maxN1 = 110;
    const fraction = Math.min(value / maxN1, 1);
    const startAngle = -225;
    const sweep = 270;
    const angle = startAngle + fraction * sweep;
    const r = 38;
    const rad = (angle * Math.PI) / 180;
    const endX = cx + Math.cos(rad) * r;
    const endY = 55 + Math.sin(rad) * r;
    const largeArc = fraction * sweep > 180 ? 1 : 0;
    const startRad = (startAngle * Math.PI) / 180;
    const startX = cx + Math.cos(startRad) * r;
    const startY = 55 + Math.sin(startRad) * r;
    return "M" + startX + "," + startY + " A" + r + "," + r + " 0 " + largeArc + " 1 " + endX + "," + endY;
  };

  // ECAM message cascade (PRD)
  // Stabilize audioWarnings reference to prevent cascade recomputation every animation frame
  const resolvedAudioWarnings = audioWarnings ?? EMPTY_WARNINGS;
  const audioWarningsKey = resolvedAudioWarnings.join("|");
  const stableAudioWarnings = useMemo(() => resolvedAudioWarnings, [audioWarningsKey]);

  const cascadeMessages = useMemo(() => {
    return buildECAMCascade({
      eventId,
      apStatus,
      athrStatus: autothrustStatus,
      flightLaw,
      adrDisagreement,
      stallWarning,
      stallMuted,
      gpwsWarning,
      spdFlag,
      audioWarnings: stableAudioWarnings,
    });
  }, [eventId, apStatus, autothrustStatus, flightLaw, adrDisagreement, stallWarning, stallMuted, gpwsWarning, spdFlag, stableAudioWarnings]);

  const secondaryMemos = useMemo(() => {
    return buildSecondaryMemos({ eventId, flightLaw, apStatus });
  }, [eventId, flightLaw, apStatus]);

  // Overflow pagination
  const [scrollOffset, setScrollOffset] = useState(0);

  useEffect(() => {
    setScrollOffset(0);
  }, [eventId]);

  const visibleMessages = cascadeMessages.slice(scrollOffset, scrollOffset + ECAM_MAX_VISIBLE_LINES);
  const canScrollDown = scrollOffset + ECAM_MAX_VISIBLE_LINES < cascadeMessages.length;
  const canScrollUp = scrollOffset > 0;

  const handleCLR = useCallback(() => {
    if (canScrollDown) {
      setScrollOffset((prev) => prev + 1);
    }
  }, [canScrollDown]);

  // Flash state for red warnings
  const [flashOn, setFlashOn] = useState(true);
  useEffect(() => {
    const hasFlash = cascadeMessages.some((m) => m.flash);
    if (!hasFlash) {
      setFlashOn(true);
      return;
    }
    const interval = setInterval(() => setFlashOn((v) => !v), 500);
    return () => clearInterval(interval);
  }, [cascadeMessages]);

  const isAbnormal = severity !== "normal";

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-start px-1 mb-2">
        <span
          className="text-[10px] uppercase text-[#8A8A84]"
          style={{ fontFamily: "var(--font-stencil)", letterSpacing: "0.2em" }}
        >
          E/WD -- Engine / Warning Display
        </span>
        <span className="text-[10px] text-[#BEBEB8]" style={{ fontFamily: "var(--font-stencil)", letterSpacing: "0.1em" }}>FIG.06</span>
      </div>

      <div
        className={"border bg-[#000000] " + (isAbnormal ? "border-[#FFB347]" : "border-[#BEBEB8]")}
        style={{ fontFamily: "Courier New, Consolas, monospace", letterSpacing: "0.05em" }}
      >
        {/* ENGINE GAUGES */}
        <div className="px-3 pt-3 pb-1">
          <svg viewBox="0 0 280 200" className="w-full">
            <text x="140" y="10" fill="#FFFFFF" fontSize="7" textAnchor="middle" fontWeight="700">
              N1 %
            </text>

            {/* Engine 1 - N1 */}
            <path d={n1Arc(110, 80)} fill="none" stroke="#333333" strokeWidth="3" />
            <path d={n1Arc(Math.min(n1Left, 110), 80)} fill="none" stroke={n1Color} strokeWidth="3" />
            {n1Left > 100 && (
              <path d={n1Arc(Math.min(n1Left, 110), 80)} fill="none" stroke="#FF0000" strokeWidth="3" />
            )}
            <text x="80" y="58" fill={n1Color} fontSize="14" textAnchor="middle" fontWeight="700">
              {n1Left.toFixed(1)}
            </text>
            <text x="80" y="78" fill="#FFFFFF" fontSize="6" textAnchor="middle" fontWeight="700">
              ENG 1
            </text>

            {/* Engine 2 - N1 */}
            <path d={n1Arc(110, 200)} fill="none" stroke="#333333" strokeWidth="3" />
            <path d={n1Arc(Math.min(n1Right, 110), 200)} fill="none" stroke={n1Color} strokeWidth="3" />
            {n1Right > 100 && (
              <path d={n1Arc(Math.min(n1Right, 110), 200)} fill="none" stroke="#FF0000" strokeWidth="3" />
            )}
            <text x="200" y="58" fill={n1Color} fontSize="14" textAnchor="middle" fontWeight="700">
              {n1Right.toFixed(1)}
            </text>
            <text x="200" y="78" fill="#FFFFFF" fontSize="6" textAnchor="middle" fontWeight="700">
              ENG 2
            </text>

            {/* Center divider */}
            <line x1="140" y1="18" x2="140" y2="185" stroke="#333333" strokeWidth="0.5" strokeDasharray="2 3" />

            {/* === EGT ARC GAUGES === */}
            {(() => {
              const egtMax = 900;
              const egtAmber = 850;
              const egtR = 28;
              const egtCy = 120;
              const egtStartAngle = -225;
              const egtSweep = 270;

              const egtArc = (value: number, cx: number) => {
                const fraction = Math.min(value / egtMax, 1);
                const angle = egtStartAngle + fraction * egtSweep;
                const rad = (angle * Math.PI) / 180;
                const endX = cx + Math.cos(rad) * egtR;
                const endY = egtCy + Math.sin(rad) * egtR;
                const largeArc = fraction * egtSweep > 180 ? 1 : 0;
                const startRad = (egtStartAngle * Math.PI) / 180;
                const startX = cx + Math.cos(startRad) * egtR;
                const startY = egtCy + Math.sin(startRad) * egtR;
                return "M" + startX + "," + startY + " A" + egtR + "," + egtR + " 0 " + largeArc + " 1 " + endX + "," + endY;
              };

              // Amber zone arc (from 850 to 900)
              const amberArc = (cx: number) => {
                const f1 = egtAmber / egtMax;
                const f2 = 1;
                const a1 = egtStartAngle + f1 * egtSweep;
                const a2 = egtStartAngle + f2 * egtSweep;
                const r1 = (a1 * Math.PI) / 180;
                const r2 = (a2 * Math.PI) / 180;
                const x1 = cx + Math.cos(r1) * egtR;
                const y1 = egtCy + Math.sin(r1) * egtR;
                const x2 = cx + Math.cos(r2) * egtR;
                const y2 = egtCy + Math.sin(r2) * egtR;
                return "M" + x1 + "," + y1 + " A" + egtR + "," + egtR + " 0 0 1 " + x2 + "," + y2;
              };

              const egtLeftColor = egtLeft > egtAmber ? ECAM_COLORS.amber : ECAM_COLORS.green;
              const egtRightColor = egtRight > egtAmber ? ECAM_COLORS.amber : ECAM_COLORS.green;

              return (
                <>
                  <text x="140" y="96" fill="#FFFFFF" fontSize="6" textAnchor="middle" fontWeight="700">
                    EGT °C
                  </text>

                  {/* EGT 1 */}
                  <path d={egtArc(egtMax, 80)} fill="none" stroke="#333333" strokeWidth="2.5" />
                  <path d={amberArc(80)} fill="none" stroke="#FFB000" strokeWidth="2.5" opacity="0.3" />
                  <path d={egtArc(Math.min(egtLeft, egtMax), 80)} fill="none" stroke={egtLeftColor} strokeWidth="2.5" />
                  <text x="80" y="123" fill={egtLeftColor} fontSize="11" textAnchor="middle" fontWeight="700">
                    {egtLeft}
                  </text>

                  {/* EGT 2 */}
                  <path d={egtArc(egtMax, 200)} fill="none" stroke="#333333" strokeWidth="2.5" />
                  <path d={amberArc(200)} fill="none" stroke="#FFB000" strokeWidth="2.5" opacity="0.3" />
                  <path d={egtArc(Math.min(egtRight, egtMax), 200)} fill="none" stroke={egtRightColor} strokeWidth="2.5" />
                  <text x="200" y="123" fill={egtRightColor} fontSize="11" textAnchor="middle" fontWeight="700">
                    {egtRight}
                  </text>

                  {/* Red line tick at 900°C */}
                  {[80, 200].map((cx) => {
                    const a = egtStartAngle + egtSweep;
                    const rad = (a * Math.PI) / 180;
                    const ix = cx + Math.cos(rad) * (egtR - 4);
                    const iy = egtCy + Math.sin(rad) * (egtR - 4);
                    const ox = cx + Math.cos(rad) * (egtR + 4);
                    const oy = egtCy + Math.sin(rad) * (egtR + 4);
                    return <line key={"rl" + cx} x1={ix} y1={iy} x2={ox} y2={oy} stroke="#FF0000" strokeWidth="1.5" />;
                  })}
                </>
              );
            })()}

            {/* === FF BAR GAUGES === */}
            {(() => {
              const ffMax = 2000;
              const barY = 155;
              const barH = 6;
              const barW = 50;

              const ffLeftFrac = Math.min(ffLeft / ffMax, 1);
              const ffRightFrac = Math.min(ffRight / ffMax, 1);

              return (
                <>
                  <text x="140" y="152" fill="#FFFFFF" fontSize="6" textAnchor="middle" fontWeight="700">
                    FF KG/H
                  </text>

                  {/* FF 1 bar */}
                  <rect x={80 - barW / 2} y={barY} width={barW} height={barH} fill="none" stroke="#333333" strokeWidth="0.5" />
                  <rect x={80 - barW / 2} y={barY} width={barW * ffLeftFrac} height={barH} fill={ECAM_COLORS.green} opacity="0.7" />
                  <text x={80} y={barY + barH + 10} fill={ECAM_COLORS.green} fontSize="10" textAnchor="middle" fontWeight="700">
                    {ffLeft}
                  </text>

                  {/* FF 2 bar */}
                  <rect x={200 - barW / 2} y={barY} width={barW} height={barH} fill="none" stroke="#333333" strokeWidth="0.5" />
                  <rect x={200 - barW / 2} y={barY} width={barW * ffRightFrac} height={barH} fill={ECAM_COLORS.green} opacity="0.7" />
                  <text x={200} y={barY + barH + 10} fill={ECAM_COLORS.green} fontSize="10" textAnchor="middle" fontWeight="700">
                    {ffRight}
                  </text>
                </>
              );
            })()}

            {/* A/THR status */}
            <text
              x="140" y="192"
              fill={autothrustStatus === "ON" ? ECAM_COLORS.green : ECAM_COLORS.amber}
              fontSize="7" textAnchor="middle" fontWeight="700"
            >
              A/THR: {autothrustStatus.replace(/_/g, " ")}
            </text>
          </svg>
        </div>

        {/* ECAM WARNING DISPLAY -- 50/50 SPLIT */}
        <div className="border-t border-[#333333]">
          <div className="flex min-h-[180px]">
            {/* LEFT PANE: Primary Failures and Actions */}
            <div className="flex-1 border-r border-[#333333] flex flex-col">
              <div className="px-2 py-1 border-b border-[#333333]">
                <span className="text-[7px] text-[#666666] font-bold uppercase tracking-wider">
                  FAILURES / ACTIONS
                </span>
              </div>

              <div className="flex-1 px-2 py-1 relative">
                {visibleMessages.length === 0 && (
                  <div className="flex items-center justify-center h-full">
                    <span className="text-[11px] text-[#333333] font-bold uppercase">
                      NO ACTIVE WARNINGS
                    </span>
                  </div>
                )}

                {visibleMessages.map((msg, i) => (
                  <ECAMLine key={scrollOffset + "-" + i} msg={msg} flashOn={flashOn} />
                ))}

                {canScrollUp && (
                  <div className="absolute top-1 right-1">
                    <svg width="10" height="8" viewBox="0 0 10 8">
                      <polygon points="5,0 0,8 10,8" fill={ECAM_COLORS.green} />
                    </svg>
                  </div>
                )}
                {canScrollDown && (
                  <div className="absolute bottom-1 left-2">
                    <svg width="10" height="8" viewBox="0 0 10 8">
                      <polygon points="5,8 0,0 10,0" fill={ECAM_COLORS.green} />
                    </svg>
                  </div>
                )}
              </div>

              {cascadeMessages.length > 0 && (
                <div className="px-2 py-1 border-t border-[#333333] flex justify-between items-center">
                  <button
                    onClick={handleCLR}
                    className={"text-[8px] font-bold uppercase tracking-wider px-2 py-0.5 border transition-colors " + (
                      canScrollDown
                        ? "border-[#FFFFFF] text-[#FFFFFF] hover:bg-[#222222] cursor-pointer"
                        : "border-[#333333] text-[#333333] cursor-default"
                    )}
                  >
                    CLR
                  </button>
                  <span className="text-[7px] text-[#666666] font-bold tabular-nums">
                    {Math.min(scrollOffset + ECAM_MAX_VISIBLE_LINES, cascadeMessages.length)}/{cascadeMessages.length}
                  </span>
                </div>
              )}
            </div>

            {/* RIGHT PANE: Secondary Memos */}
            <div className="flex-1 flex flex-col">
              <div className="px-2 py-1 border-b border-[#333333]">
                <span className="text-[7px] text-[#666666] font-bold uppercase tracking-wider">
                  MEMO
                </span>
              </div>

              <div className="flex-1 px-2 py-1">
                {secondaryMemos.map((memo, i) => (
                  <div
                    key={i}
                    className="text-[11px] font-bold uppercase"
                    style={{ color: MEMO_COLORS[memo.level] || "#FFFFFF", lineHeight: "1.9" }}
                  >
                    {memo.text}
                  </div>
                ))}
              </div>

              <div className="px-2 py-1 border-t border-[#333333]">
                <span
                  className="text-[7px] font-bold uppercase tracking-wider"
                  style={{ color: isAbnormal ? ECAM_COLORS.amber : ECAM_COLORS.green }}
                >
                  {isAbnormal ? "ABNORMAL" : "NORMAL"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sub-ECAM status bar */}
      <div className="mt-2 flex justify-between">
        <span className={"text-[8px] uppercase tracking-wider " + (isAbnormal ? "text-[#FFB347]" : "text-[#BEBEB8]")}>
          FADEC: {n1Percent > 100 ? "TOGA" : "NORMAL"}
        </span>
        <span className={"text-[8px] uppercase tracking-wider " + (isAbnormal ? "text-[#FFB347]" : "text-[#BEBEB8]")}>
          THR: {autothrustStatus === "ON" ? "CLB" : autothrustStatus.replace("OFF_", "")}
        </span>
      </div>
    </div>
  );
}