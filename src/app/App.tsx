import { TELEMETRY_EVENTS, CRITICAL_AOA_THRESHOLD } from "./components/telemetry-data";
import { useState, useEffect, useCallback } from "react";
import { Yoke } from "./components/Yoke";
import { MCDU } from "./components/MCDU";
import { FlightPanel } from "./components/FlightPanel";
import { PFD } from "./components/PFD";
import { ND } from "./components/ND";
import { ECAM } from "./components/ECAM";
import { Timeline } from "./components/Timeline";
import { DataLog } from "./components/DataLog";
import { useInterpolatedTelemetry } from "./components/useInterpolatedTelemetry";
import { FlightStateBanner } from "./components/FlightStateBanner";

type ActiveTab = "cockpit" | "instruments" | "replay";

export default function App() {
  const [yokeState, setYokeState] = useState({ roll: 0, pitch: 0 });
  const [activeTab, setActiveTab] = useState<ActiveTab>("replay");

  // Replay state
  const [replayIndex, setReplayIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  // Interpolated telemetry — smoothly animated between events
  const interp = useInterpolatedTelemetry(replayIndex);

  // Auto-play: advance after transition settles + a dwell pause
  useEffect(() => {
    if (!isPlaying) return;
    // Wait for transition to finish, then dwell 1.5s, then advance
    if (interp.isTransitioning) return;
    const timer = setTimeout(() => {
      if (replayIndex < TELEMETRY_EVENTS.length - 1) {
        setReplayIndex((prev) => prev + 1);
      } else {
        setIsPlaying(false);
      }
    }, 1500);
    return () => clearTimeout(timer);
  }, [isPlaying, replayIndex, interp.isTransitioning]);

  const handlePlayToggle = useCallback(() => {
    if (replayIndex >= TELEMETRY_EVENTS.length - 1) {
      setReplayIndex(0);
      setIsPlaying(true);
    } else {
      setIsPlaying((prev) => !prev);
    }
  }, [replayIndex]);

  const tabs: { key: ActiveTab; label: string }[] = [
    { key: "replay", label: "01 — Replay" },
    { key: "cockpit", label: "02 — Controls" },
    { key: "instruments", label: "03 — Instruments" },
  ];

  return (
    <div className="min-h-screen bg-[#E9E9E7] p-4 md:p-6 lg:p-10">
      <div className="max-w-[1600px] mx-auto">
        {/* Top metadata band */}
        <div className="flex justify-between items-start border-b border-[#BEBEB8] pb-3 mb-6">
          <div>
            <div
              className="text-[13px] text-[#222222] uppercase tracking-[0.35em]"
              style={{ fontFamily: "var(--font-stencil)" }}
            >
              Flight Control Interface
            </div>
            <div className="text-[9px] text-[#BEBEB8] uppercase tracking-wider mt-1" style={{ fontFamily: "var(--font-data)" }}>
              A320 — EFIS / MCDU / FDR Telemetry Analysis
            </div>
            {/* Expressive overprint — colliding baseline ghost text */}
            <div
              className="relative h-0 select-none pointer-events-none"
              aria-hidden="true"
            >
              <span
                className="absolute text-[22px] text-[#BEBEB8] uppercase"
                style={{
                  fontFamily: "var(--font-stencil)",
                  top: "-28px",
                  left: "180px",
                  opacity: 0.08,
                  letterSpacing: "0.5em",
                  transform: "rotate(-0.5deg)",
                }}
              >
                FDR
              </span>
              <span
                className="absolute text-[18px] text-[#222222] uppercase"
                style={{
                  fontFamily: "var(--font-stencil)",
                  top: "-22px",
                  left: "330px",
                  opacity: 0.04,
                  letterSpacing: "0.8em",
                  transform: "rotate(0.3deg)",
                }}
              >
                AF447
              </span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-[9px] text-[#BEBEB8] uppercase tracking-wider" style={{ fontFamily: "var(--font-data)" }}>
              Document No.
            </div>
            <div className="text-[11px] text-[#4A4A46] tabular-nums" style={{ fontFamily: "var(--font-data)" }}>
              FCOM-1.34.10-R04
            </div>
          </div>
        </div>

        {/* Section tabs */}
        <div className="mb-6 grid grid-cols-3 gap-0 md:flex md:overflow-x-auto">
          {tabs.map((tab, i) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-2 sm:px-4 py-2 text-[8px] sm:text-[10px] uppercase border transition-colors duration-150 min-w-0 whitespace-nowrap ${
                activeTab === tab.key
                  ? "border-[#222222] text-[#222222] bg-[#D8D8D4]"
                  : "border-[#BEBEB8] text-[#8A8A84] hover:bg-[#D8D8D4]"
              } ${i > 0 ? "md:border-l-0" : ""}`}
              style={{
                fontFamily: "var(--font-stencil)",
                letterSpacing: "0.18em",
              }}
            >
              {tab.label}
            </button>
          ))}
          <div className="hidden md:block md:flex-1 md:border-b md:border-[#BEBEB8] md:self-end" />
        </div>

        <FlightStateBanner
          viewLabel={activeTab.toUpperCase()}
          eventId={interp.event_id}
          eventIndex={replayIndex}
          totalEvents={TELEMETRY_EVENTS.length}
          timestamp={interp.timestamp}
          description={interp.description}
          flightLaw={interp.flight_law}
          computedFlightLaw={interp.computedFlightLaw}
          autopilotStatus={interp.autopilot_status}
          autothrustStatus={interp.autothrust_status}
          speedValid={interp.speedValid}
          adr1Valid={interp.adr1Valid}
          adr2Valid={interp.adr2Valid}
          adr3Valid={interp.adr3Valid}
          adrDisagreement={interp.adrDisagreement}
          spdFlagActive={interp.spdFlagActive}
          stallWarningComputed={interp.stallWarningComputed}
          gpwsWarning={interp.gpwsWarning}
          calculatedAirspeed={interp.calculatedAirspeed}
          angleOfAttack={interp.angle_of_attack_deg}
          ecamWarnings={interp.ecamWarnings}
          audioWarnings={interp.audioWarnings}
        />

        {/* ==================== SECTION 01: REPLAY ==================== */}
        {activeTab === "replay" && (
          <div>
            {/* Timeline scrubber — receives interpolated values */}
            <div className="mb-6">
              <Timeline
                currentIndex={replayIndex}
                onIndexChange={(idx) => {
                  setReplayIndex(idx);
                  setIsPlaying(false);
                }}
                isPlaying={isPlaying}
                onPlayToggle={handlePlayToggle}
                transitionProgress={interp.transitionProgress}
                interpolatedTimestamp={interp.timestamp}
                interpolatedAlt={interp.altitude_ft}
                interpolatedVS={interp.vertical_speed_fpm}
                interpolatedPitch={interp.pitch_attitude_deg}
                interpolatedBank={interp.bank_angle_deg}
                isTransitioning={interp.isTransitioning}
              />
            </div>

            {/* Instruments driven by interpolated telemetry */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 mb-6">
              <PFD
                roll={interp.bank_angle_deg / 45}
                pitch={-interp.pitch_attitude_deg / 17}
                speed={Math.round(interp.speed)}
                altitude={Math.round(interp.altitude_ft)}
                heading={Math.round(interp.heading_deg)}
                verticalSpeed={Math.round(interp.vertical_speed_fpm)}
                speedValid={interp.speedValid}
                machNumber={interp.machNumeric > 0 ? interp.machNumeric : "INVALID_DATA"}
                flightLaw={interp.flight_law}
                apStatus={interp.autopilot_status}
                athrStatus={interp.autothrust_status}
                severity={interp.severity}
                stallWarning={interp.stallWarning}
                gpwsWarning={interp.gpwsWarning}
                fmaLeft={interp.fmaLeft}
                fmaCenter={interp.fmaCenter}
                fmaRight={interp.fmaRight}
                adr1Speed={interp.adr1Speed}
                adr2Speed={interp.adr2Speed}
                adr3Speed={interp.adr3Speed}
                adr1Valid={interp.adr1Valid}
                adr2Valid={interp.adr2Valid}
                adr3Valid={interp.adr3Valid}
                angleOfAttack={interp.angle_of_attack_deg}
                calculatedAirspeed={interp.calculatedAirspeed}
                adrDisagreement={interp.adrDisagreement}
                spdFlagActive={interp.spdFlagActive}
                stallWarningComputed={interp.stallWarningComputed}
                computedFlightLaw={interp.computedFlightLaw}
              />
              <ND
                heading={Math.round(interp.heading_deg)}
                range={160}
                windDirection={Math.round(interp.wind_direction_deg)}
                windSpeed={Math.round(interp.wind_speed_kt)}
                groundSpeed={Math.round(interp.ground_speed_kt)}
                trueAirspeed={Math.round(interp.true_airspeed_kt)}
                routeDistance={Math.round(interp.route_distance_nm)}
                severity={interp.severity}
                eventId={interp.event_id}
                flightLaw={interp.computedFlightLaw ?? interp.flight_law}
                apStatus={interp.autopilot_status}
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 mb-6">
              <ECAM
                n1Percent={Math.round(interp.engine_thrust_n1_percent)}
                ecamWarnings={interp.ecamWarnings}
                audioWarnings={interp.audioWarnings}
                autothrustStatus={interp.autothrust_status}
                severity={interp.severity}
                eventId={interp.event_id}
                apStatus={interp.autopilot_status}
                flightLaw={interp.computedFlightLaw ?? interp.flight_law}
                adrDisagreement={interp.adrDisagreement}
                stallWarning={interp.stallWarningComputed}
                stallMuted={
                  interp.angle_of_attack_deg > CRITICAL_AOA_THRESHOLD &&
                  (interp.calculatedAirspeed ?? 0) <= 60
                }
                gpwsWarning={interp.gpwsWarning}
                spdFlag={interp.spdFlagActive}
                angleOfAttack={interp.angle_of_attack_deg}
                calculatedAirspeed={interp.calculatedAirspeed}
                egtDegC={Math.round(interp.egt_deg_c)}
                fuelFlowKgH={Math.round(interp.fuel_flow_kg_h)}
              />
            </div>

            {/* Data log table */}
            <DataLog
              currentIndex={replayIndex}
              onSelectEvent={(idx) => {
                setReplayIndex(idx);
                setIsPlaying(false);
              }}
            />

            {/* Analysis notes */}
            <div className="mt-6 border-t border-[#BEBEB8] pt-4">
              <div
                className="text-[11px] text-[#222222] uppercase mb-3 relative"
                style={{ fontFamily: "var(--font-stencil)", letterSpacing: "0.3em" }}
              >
                Operational Notes
                {/* Expressive stamp overwrite */}
                <span
                  className="absolute select-none pointer-events-none"
                  aria-hidden="true"
                  style={{
                    fontFamily: "var(--font-stencil)",
                    fontSize: "28px",
                    color: "#BEBEB8",
                    opacity: 0.06,
                    top: "-12px",
                    left: "120px",
                    letterSpacing: "0.6em",
                    transform: "rotate(-1deg)",
                  }}
                >
                  CRITICAL
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="border border-[#BEBEB8] p-3">
                  <div
                    className="text-[9px] text-[#4A4A46] uppercase mb-1"
                    style={{ fontFamily: "var(--font-stencil)", letterSpacing: "0.2em" }}
                  >
                    ADR Disagreement Gate
                  </div>
                  <div className="text-[10px] text-[#4A4A46] leading-relaxed" style={{ fontFamily: "var(--font-data)" }}>
                    Three Air Data References (ADR 1/2/3) are compared pairwise.
                    If any pair disagrees by &gt;20kt, flight law downgrades to
                    Alternate Law 2 — green pitch/bank limits are removed and amber
                    crosses render at ±67° bank. ECAM shows F/CTL ALTN LAW (PROT LOST).
                  </div>
                </div>
                <div className="border border-[#BEBEB8] p-3">
                  <div
                    className="text-[9px] text-[#4A4A46] uppercase mb-1"
                    style={{ fontFamily: "var(--font-stencil)", letterSpacing: "0.2em" }}
                  >
                    Stall Warning Logic
                  </div>
                  <div className="text-[10px] text-[#4A4A46] leading-relaxed" style={{ fontFamily: "var(--font-data)" }}>
                    Stall warning activates when AoA exceeds {CRITICAL_AOA_THRESHOLD}° AND
                    calculated IAS &gt;60kt. Below 60kt, the warning is MUTED —
                    the system assumes ground operation. This creates the critical
                    paradox where deep-stall descent silences the warning.
                  </div>
                </div>
                <div className="border border-[#BEBEB8] p-3">
                  <div
                    className="text-[9px] text-[#4A4A46] uppercase mb-1"
                    style={{ fontFamily: "var(--font-stencil)", letterSpacing: "0.2em" }}
                  >
                    SPD Flag Logic
                  </div>
                  <div className="text-[10px] text-[#4A4A46] leading-relaxed" style={{ fontFamily: "var(--font-data)" }}>
                    When calculated airspeed (averaged from valid ADRs) falls below
                    30kt, the speed tape is invalidated: speed numbers, tick marks,
                    and Mach readout are hidden, and a red SPD FLAG renders. All-invalid
                    ADR state also triggers the flag.
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ==================== SECTION 02: CONTROLS ==================== */}
        {activeTab === "cockpit" && (
          <div>
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_240px_1fr] gap-6 lg:gap-8">
              <div className="min-h-[400px] lg:min-h-[500px]">
                <Yoke onStateChange={setYokeState} />
              </div>
              <div className="border-l border-r border-[#BEBEB8] px-5 hidden lg:block">
                <FlightPanel yokeRoll={yokeState.roll} yokePitch={yokeState.pitch} />
              </div>
              <div className="min-h-[400px]">
                <MCDU />
              </div>
            </div>
            <div className="lg:hidden mt-6 border-t border-[#BEBEB8] pt-4">
              <FlightPanel yokeRoll={yokeState.roll} yokePitch={yokeState.pitch} />
            </div>
          </div>
        )}

        {/* ==================== SECTION 03: INSTRUMENTS ==================== */}
        {activeTab === "instruments" && (
          <div>
            {/* Mini yoke strip */}
            <div className="mb-4 border border-[#BEBEB8] p-3 bg-[#E2E2DF]">
              <div className="flex items-center gap-3">
                <span className="text-[9px] text-[#8A8A84] uppercase tracking-wider">
                  Sidestick active — drag below to see FD response
                </span>
                <span className="text-[9px] text-[#4A4A46] tabular-nums">
                  Roll: {(yokeState.roll * 45).toFixed(1)}° / Pitch: {(yokeState.pitch * -17).toFixed(1)}°
                </span>
              </div>
            </div>
            <div
              className="mb-6 h-16 relative border border-[#BEBEB8] bg-[#E2E2DF] cursor-grab active:cursor-grabbing select-none"
              style={{ touchAction: "none" }}
              onPointerDown={(e) => (e.target as HTMLElement).setPointerCapture(e.pointerId)}
              onPointerMove={(e) => {
                if (e.buttons === 0) return;
                const rect = e.currentTarget.getBoundingClientRect();
                const cx = rect.left + rect.width / 2;
                const cy = rect.top + rect.height / 2;
                setYokeState({
                  roll: Math.max(-1, Math.min(1, (e.clientX - cx) / (rect.width / 2))),
                  pitch: Math.max(-1, Math.min(1, (e.clientY - cy) / (rect.height / 2))),
                });
              }}
              onPointerUp={() => setYokeState({ roll: 0, pitch: 0 })}
            >
              <div className="absolute left-1/2 top-0 bottom-0 border-l border-dashed border-[#BEBEB8]" />
              <div className="absolute top-1/2 left-0 right-0 border-t border-dashed border-[#BEBEB8]" />
              <div
                className="absolute w-2 h-2 bg-[#4A4A46]"
                style={{
                  left: `${50 + yokeState.roll * 45}%`,
                  top: `${50 + yokeState.pitch * 45}%`,
                  transform: "translate(-50%, -50%)",
                }}
              />
              <div className="absolute top-1 left-2 text-[8px] text-[#BEBEB8] uppercase tracking-wider">
                Mini Sidestick — Drag to deflect
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
              <PFD roll={yokeState.roll} pitch={yokeState.pitch} />
              <ND heading={218} range={160} />
            </div>

            <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
              <ECAM />
              {/* System status */}
              <div className="flex flex-col">
                <div className="flex justify-between items-start px-1 mb-2">
                  <span
                    className="text-[10px] uppercase text-[#8A8A84]"
                    style={{ fontFamily: "var(--font-stencil)", letterSpacing: "0.2em" }}
                  >
                    SD — System Display
                  </span>
                  <span className="text-[10px] text-[#BEBEB8]" style={{ fontFamily: "var(--font-stencil)", letterSpacing: "0.1em" }}>FIG.07</span>
                </div>
                <div className="flex-1 border border-[#BEBEB8] bg-[#0A0A0A] p-4" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
                  <div className="text-[#57FF57] text-[11px] mb-3">CRUISE</div>
                  <div className="space-y-2">
                    {[
                      { sys: "ELEC", status: "NORMAL", detail: "GEN 1+2 ON LINE" },
                      { sys: "HYD", status: "NORMAL", detail: "G+Y+B PRESS OK" },
                      { sys: "BLEED", status: "NORMAL", detail: "PACK 1+2 ON" },
                      { sys: "COND", status: "NORMAL", detail: "CKPT 22° / FWD 23° / AFT 23°" },
                      { sys: "PRESS", status: "NORMAL", detail: "CAB ALT 6800FT  ΔP 8.2PSI" },
                      { sys: "FUEL", status: "NORMAL", detail: "L 6.2T  R 6.2T  CTR 0.0T" },
                      { sys: "APU", status: "OFF", detail: "AVAIL: NO" },
                      { sys: "DOOR", status: "NORMAL", detail: "ALL CLOSED" },
                      { sys: "WHEEL", status: "NORMAL", detail: "BRAKES: RELEASED" },
                      { sys: "F/CTL", status: "NORMAL", detail: "NORMAL LAW" },
                    ].map((item) => (
                      <div key={item.sys} className="flex items-baseline gap-3">
                        <span className="text-[#BEBEB8] text-[9px] w-[48px] shrink-0">{item.sys}</span>
                        <span className={`text-[9px] w-[52px] shrink-0 ${item.status === "NORMAL" ? "text-[#57FF57]" : "text-[#8A8A84]"}`}>
                          {item.status}
                        </span>
                        <span className="text-[#8A8A84] text-[9px]">{item.detail}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 pt-2 border-t border-[#4A4A46]">
                    <div className="flex justify-between text-[8px] text-[#8A8A84]">
                      <span>TAT: -32°C</span>
                      <span>SAT: -52°C</span>
                      <span>ISA: -5°C</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-10 pt-3 border-t border-[#BEBEB8] relative">
          {/* Expressive overprint layer */}
          <div className="absolute inset-0 select-none pointer-events-none overflow-hidden" aria-hidden="true">
            <span
              style={{
                fontFamily: "var(--font-stencil)",
                fontSize: "48px",
                color: "#BEBEB8",
                opacity: 0.03,
                position: "absolute",
                top: "-8px",
                left: "10%",
                letterSpacing: "1.2em",
                transform: "rotate(-0.3deg)",
                whiteSpace: "nowrap",
              }}
            >
              UNCONTROLLED
            </span>
            <span
              style={{
                fontFamily: "var(--font-stencil)",
                fontSize: "36px",
                color: "#222222",
                opacity: 0.025,
                position: "absolute",
                top: "4px",
                left: "25%",
                letterSpacing: "0.9em",
                transform: "rotate(0.5deg)",
                whiteSpace: "nowrap",
              }}
            >
              COPY
            </span>
          </div>
          <div className="flex flex-col sm:flex-row justify-between gap-1">
            <div
              className="text-[8px] text-[#BEBEB8] uppercase"
              style={{ fontFamily: "var(--font-stencil)", letterSpacing: "0.15em" }}
            >
              Airbus A320 — Flight Crew Operating Manual — Vol. 1
            </div>
            <div className="text-[8px] text-[#BEBEB8] uppercase tabular-nums" style={{ fontFamily: "var(--font-data)", letterSpacing: "0.1em" }}>
              Rev. 04 — 08 Mar 2026
            </div>
          </div>
          <div className="mt-2 flex flex-col sm:flex-row gap-2 sm:gap-8">
            <div className="text-[8px] text-[#BEBEB8] uppercase" style={{ fontFamily: "var(--font-data)", letterSpacing: "0.12em" }}>
              Classification: Uncontrolled Copy
            </div>
            <div className="text-[8px] text-[#BEBEB8] uppercase" style={{ fontFamily: "var(--font-data)", letterSpacing: "0.08em" }}>
              Retention: Indefinite
            </div>
            <div className="text-[8px] text-[#BEBEB8] uppercase" style={{ fontFamily: "var(--font-stencil)", letterSpacing: "0.15em" }}>
              Sheets: 01—Replay / 02—Controls / 03—Instruments
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
