// ECAM Message Cascade Definitions
// Structured warning/caution/action messages per event phase,
// plus secondary memo logic for the right-hand display pane.

export type ECAMLevel = "red" | "amber" | "blue" | "green" | "white";

export interface ECAMMessage {
  level: ECAMLevel;
  text: string;
  indent?: boolean;
  flash?: boolean;
}

export interface ECAMMemo {
  level: "green" | "white";
  text: string;
}

// Build the primary ECAM message cascade for a given event state.
export function buildECAMCascade(opts: {
  eventId: string;
  apStatus: string;
  athrStatus: string;
  flightLaw: string;
  adrDisagreement: boolean;
  stallWarning: boolean;
  stallMuted: boolean;
  gpwsWarning: boolean;
  spdFlag: boolean;
  audioWarnings: string[];
}): ECAMMessage[] {
  const msgs: ECAMMessage[] = [];

  // Event 01: clean cruise -- no failures
  if (opts.eventId === "01_cruise_weather_entry") {
    return [];
  }

  // AP / ATHR disconnect
  if (opts.apStatus === "OFF") {
    msgs.push({ level: "red", text: "AUTO FLT AP OFF", flash: true });
  }
  if (opts.athrStatus !== "ON") {
    msgs.push({ level: "red", text: "AUTO FLT A/THR OFF", flash: true });
  }

  // Flight law degradation
  if (opts.flightLaw !== "Normal") {
    msgs.push({ level: "amber", text: "F/CTL ALTN LAW" });
    msgs.push({ level: "blue", text: "  (PROT LOST)", indent: true });
  }

  // ADR disagreement
  if (opts.adrDisagreement) {
    msgs.push({ level: "amber", text: "NAV ADR DISAGREE" });
  }

  // SPD FLAG
  if (opts.spdFlag) {
    msgs.push({ level: "amber", text: "NAV SPD FLAG" });
  }

  // Thrust status
  if (opts.athrStatus.includes("LOCK")) {
    msgs.push({ level: "amber", text: "ENG THRUST LOCKED" });
    msgs.push({ level: "blue", text: "  -THR LEVERS......MOVE", indent: true });
  } else if (opts.athrStatus.includes("TOGA")) {
    msgs.push({ level: "amber", text: "ENG THR LEVER ABV MCT" });
    msgs.push({ level: "blue", text: "  -THR LEVERS.....CHECK", indent: true });
  } else if (opts.athrStatus.includes("IDLE")) {
    msgs.push({ level: "amber", text: "ENG THR IDLE" });
    msgs.push({ level: "blue", text: "  -THR LEVERS.....CHECK", indent: true });
  } else if (opts.athrStatus.includes("CLIMB")) {
    msgs.push({ level: "amber", text: "ENG THR CLB LATCHED" });
  }

  // Stall
  if (opts.stallWarning) {
    msgs.push({ level: "red", text: "STALL  STALL  STALL", flash: true });
    msgs.push({ level: "blue", text: "  -NOSE DOWN.......NOW", indent: true });
    msgs.push({ level: "blue", text: "  -THR LEVERS....TOGA", indent: true });
    msgs.push({ level: "blue", text: "  -SPD BRK........RETRACT", indent: true });
  }

  // Stall muted paradox annotation
  if (opts.stallMuted) {
    msgs.push({ level: "amber", text: "STALL WARN INHIBITED" });
    msgs.push({ level: "blue", text: "  IAS<60KT: ON-GND LOGIC", indent: true });
  }

  // GPWS
  if (opts.gpwsWarning) {
    msgs.push({ level: "red", text: "GPWS  PULL UP", flash: true });
    msgs.push({ level: "red", text: "GPWS  SINK RATE", flash: true });
    msgs.push({ level: "blue", text: "  -PITCH........PULL UP", indent: true });
  }

  // DUAL INPUT (event 06)
  if (opts.audioWarnings.some((w) => w.includes("DUAL INPUT"))) {
    msgs.push({ level: "red", text: "F/CTL DUAL INPUT", flash: true });
    msgs.push({ level: "blue", text: "  -SIDESTICK....RELEASE", indent: true });
  }

  // Altitude deviation (event 03)
  if (opts.audioWarnings.some((w) => w.toLowerCase().includes("altitude"))) {
    msgs.push({ level: "amber", text: "ALT ALERT" });
  }

  return msgs;
}

// Build the secondary memos for the right-hand E/WD pane.
export function buildSecondaryMemos(opts: {
  eventId: string;
  flightLaw: string;
  apStatus: string;
}): ECAMMemo[] {
  const memos: ECAMMemo[] = [];

  memos.push({ level: "green", text: "SEAT BELTS" });
  memos.push({ level: "green", text: "NO SMOKING" });
  memos.push({ level: "green", text: "STROBE LT AUTO" });
  memos.push({ level: "green", text: "SIGNS ON" });

  if (opts.flightLaw !== "Normal") {
    memos.push({ level: "white", text: "USE MAN PITCH TRIM" });
  }

  if (opts.apStatus === "OFF") {
    memos.push({ level: "white", text: "FLY MANUALLY" });
    memos.push({ level: "green", text: "FD OFF" });
  }

  if (opts.eventId !== "01_cruise_weather_entry") {
    memos.push({ level: "green", text: "ICE NOT DET" });
  }

  if (opts.eventId === "06_impact") {
    memos.push({ level: "white", text: "LDG INHIBIT" });
  }

  return memos;
}

// Max visible lines in left pane before overflow arrow appears
export const ECAM_MAX_VISIBLE_LINES = 8;
