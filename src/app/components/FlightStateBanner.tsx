import type { ReactNode } from "react";
import { CRITICAL_AOA_THRESHOLD } from "./telemetry-data";

interface FlightStateBannerProps {
  viewLabel: string;
  eventId: string;
  eventIndex: number;
  totalEvents: number;
  timestamp: string;
  description: string;
  flightLaw: string;
  computedFlightLaw: string;
  autopilotStatus: string;
  autothrustStatus: string;
  speedValid?: boolean;
  adr1Valid?: boolean;
  adr2Valid?: boolean;
  adr3Valid?: boolean;
  adrDisagreement?: boolean;
  spdFlagActive?: boolean;
  stallWarningComputed?: boolean;
  gpwsWarning?: boolean;
  calculatedAirspeed?: number;
  angleOfAttack?: number;
  ecamWarnings?: string[];
  audioWarnings?: string[];
}

function formatFlightLaw(law: string) {
  if (law === "Alternate_Law_2") return "ALTN LAW 2";
  return law.toUpperCase().replace(/_/g, " ");
}

function derivePhase(eventId: string) {
  if (eventId.includes("cruise")) return "CRUISE";
  if (eventId.includes("pitot")) return "DEGRADATION";
  if (eventId.includes("zoom")) return "UNSTABLE CLIMB";
  if (eventId.includes("apogee")) return "STALL INITIATION";
  if (eventId.includes("deep_stall")) return "DEEP STALL";
  if (eventId.includes("impact")) return "IMPACT";
  return "TRANSITION";
}

function collectAlerts(parts: Array<string | undefined>) {
  return Array.from(
    new Set(
      parts
        .flatMap((part) => (part ? [part] : []))
        .map((part) => part.trim())
        .filter(Boolean)
    )
  );
}

function Badge({
  tone = "neutral",
  children,
}: {
  tone?: "neutral" | "good" | "warn" | "bad" | "info";
  children: ReactNode;
}) {
  const toneClass =
    tone === "good"
      ? "border-[#2F7A2F] bg-[#DFF7DD] text-[#1F4D1F]"
      : tone === "warn"
        ? "border-[#9A6400] bg-[#FFF0D6] text-[#6C4200]"
        : tone === "bad"
          ? "border-[#A12222] bg-[#FFE1E1] text-[#7A0C0C]"
          : tone === "info"
            ? "border-[#222222] bg-[#E6E6E2] text-[#222222]"
            : "border-[#8A8A84] bg-[#E6E6E2] text-[#4A4A46]";

  return (
    <span
      className={`inline-flex items-center gap-1 border px-2 py-1 text-[8px] font-semibold uppercase tracking-[0.16em] ${toneClass}`}
      style={{ fontFamily: "var(--font-stencil)" }}
    >
      {children}
    </span>
  );
}

export function FlightStateBanner({
  viewLabel,
  eventId,
  eventIndex,
  totalEvents,
  timestamp,
  description,
  flightLaw,
  computedFlightLaw,
  autopilotStatus,
  autothrustStatus,
  speedValid = true,
  adr1Valid = true,
  adr2Valid = true,
  adr3Valid = true,
  adrDisagreement = false,
  spdFlagActive = false,
  stallWarningComputed = false,
  gpwsWarning = false,
  calculatedAirspeed = 0,
  angleOfAttack = 0,
  ecamWarnings = [],
  audioWarnings = [],
}: FlightStateBannerProps) {
  const phase = derivePhase(eventId);
  const validAdrCount = [adr1Valid, adr2Valid, adr3Valid].filter(Boolean).length;
  const stallMuted = angleOfAttack > CRITICAL_AOA_THRESHOLD && calculatedAirspeed <= 60;
  const alerts = collectAlerts([
    autopilotStatus !== "ON" ? `AP ${autopilotStatus}` : undefined,
    autothrustStatus !== "ON" ? `A/THR ${autothrustStatus.replace(/_/g, " ")}` : undefined,
    formatFlightLaw(computedFlightLaw) !== formatFlightLaw(flightLaw)
      ? `RAW LAW ${formatFlightLaw(flightLaw)}` : undefined,
    adrDisagreement ? "ADR DISAGREE" : undefined,
    spdFlagActive ? "SPD FLAG" : undefined,
    stallWarningComputed ? "STALL" : undefined,
    stallMuted ? "STALL INHIBITED" : undefined,
    gpwsWarning ? "GPWS" : undefined,
    ...ecamWarnings.slice(0, 2),
    ...audioWarnings.slice(0, 2),
  ]);

  return (
    <div className="mb-6 border border-[#BEBEB8] bg-[#E2E2DF] p-3">
      <div className="grid gap-3 lg:grid-cols-[1.2fr_1fr_auto] lg:items-start">
        <div className="min-w-0">
          <div className="text-[9px] uppercase tracking-[0.28em] text-[#4A4A46]" style={{ fontFamily: "var(--font-stencil)" }}>
            Flight State
          </div>
          <div className="mt-1 flex flex-wrap gap-2">
            <Badge tone="info">Phase {phase}</Badge>
            <Badge>View {viewLabel}</Badge>
            <Badge>Event {eventIndex + 1} / {totalEvents}</Badge>
            <Badge>{timestamp}Z</Badge>
          </div>
          <div className="mt-2 text-[10px] leading-relaxed text-[#222222]" style={{ fontFamily: "var(--font-data)" }}>
            {description}
          </div>
        </div>

        <div className="min-w-0">
          <div className="text-[9px] uppercase tracking-[0.28em] text-[#4A4A46]" style={{ fontFamily: "var(--font-stencil)" }}>
            Mode / Protections
          </div>
          <div className="mt-1 flex flex-wrap gap-2">
            <Badge tone={flightLaw === "Normal" ? "good" : "warn"}>LAW {formatFlightLaw(computedFlightLaw)}</Badge>
            <Badge tone={autopilotStatus === "ON" ? "good" : "warn"}>AP {autopilotStatus}</Badge>
            <Badge tone={autothrustStatus === "ON" ? "good" : "warn"}>A/THR {autothrustStatus.replace(/_/g, " ")}</Badge>
            <Badge tone={speedValid ? "good" : "bad"}>IAS {speedValid ? "VALID" : "INVALID"}</Badge>
          </div>
        </div>

        <div className="min-w-0 lg:text-right">
          <div className="text-[9px] uppercase tracking-[0.28em] text-[#4A4A46]" style={{ fontFamily: "var(--font-stencil)" }}>
            Provenance
          </div>
          <div className="mt-1 flex flex-wrap gap-2 lg:justify-end">
            <Badge tone="good">RAW</Badge>
            <Badge tone="warn">INTERP</Badge>
            <Badge tone="info">DERIVED</Badge>
            <Badge>ADR {validAdrCount} / 3</Badge>
          </div>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {alerts.length > 0 ? (
          alerts.map((alert) => {
            const tone =
              alert.includes("GPWS") || alert.includes("STALL")
                ? "bad"
                : alert.includes("SPD FLAG") || alert.includes("ADR DISAGREE") || alert.includes("RAW LAW") || alert.includes("AP ") || alert.includes("A/THR ")
                  ? "warn"
                  : "neutral";
            return (
              <Badge key={alert} tone={tone}>
                {alert}
              </Badge>
            );
          })
        ) : (
          <Badge tone="good">NO ACTIVE DEGRADATIONS</Badge>
        )}
      </div>
    </div>
  );
}
