export interface TelemetryEvent {
  event_id: string;
  timestamp: string;
  description: string;
  flight_law: string;
  autopilot_status: string;
  autothrust_status: string;
  indicated_airspeed_left_kts: number | "INVALID_DATA";
  indicated_airspeed_standby_kts: number | "INVALID_DATA";
  indicated_airspeed_right_kts: number | "INVALID_DATA";
  mach_number: number | "INVALID_DATA";
  altitude_ft: number;
  vertical_speed_fpm: number;
  pitch_attitude_deg: number;
  bank_angle_deg: number;
  engine_thrust_n1_percent: number;
  active_audio_warnings: string | string[];
  active_ecam_warnings: string | string[];
  angle_of_attack_deg: number;
  // Navigation / engine fields for ND + ECAM gauge integration
  heading_deg: number;
  wind_direction_deg: number;
  wind_speed_kt: number;
  ground_speed_kt: number;
  true_airspeed_kt: number;
  route_distance_nm: number; // cumulative distance along flight plan
  egt_deg_c: number; // exhaust gas temperature
  fuel_flow_kg_h: number; // per-engine fuel flow
}

// --- ADR / Flight Law / Stall Logic Constants ---

/** Critical angle of attack threshold for stall warning activation (degrees) */
export const CRITICAL_AOA_THRESHOLD = 15;

/** Minimum IAS for stall warning to remain active (below this, system assumes on-ground) */
export const STALL_IAS_FLOOR_KTS = 60;

/** ADR disagreement threshold that triggers flight law downgrade (knots) */
export const ADR_DISAGREE_THRESHOLD_KTS = 20;

/** Below this IAS, the speed tape is flagged invalid and SPD FLAG renders */
export const SPD_FLAG_THRESHOLD_KTS = 30;

// --- ADR Helper Types ---

export interface ADRState {
  adr1: number; // Left pitot (Captain) — 0 if INVALID
  adr2: number; // Right pitot (F/O) — 0 if INVALID
  adr3: number; // Standby pitot — 0 if INVALID
  adr1Valid: boolean;
  adr2Valid: boolean;
  adr3Valid: boolean;
}

/** Extract numeric ADR values from a telemetry event */
export function extractADR(event: TelemetryEvent): ADRState {
  const v1 = event.indicated_airspeed_left_kts;
  const v2 = event.indicated_airspeed_right_kts;
  const v3 = event.indicated_airspeed_standby_kts;
  return {
    adr1: typeof v1 === "number" ? v1 : 0,
    adr2: typeof v2 === "number" ? v2 : 0,
    adr3: typeof v3 === "number" ? v3 : 0,
    adr1Valid: typeof v1 === "number",
    adr2Valid: typeof v2 === "number",
    adr3Valid: typeof v3 === "number",
  };
}

/** Compute the best-estimate calculated airspeed from valid ADR sources */
export function computeCalculatedAirspeed(adr: ADRState): number {
  const valids: number[] = [];
  if (adr.adr1Valid) valids.push(adr.adr1);
  if (adr.adr2Valid) valids.push(adr.adr2);
  if (adr.adr3Valid) valids.push(adr.adr3);
  if (valids.length === 0) return 0;
  return valids.reduce((a, b) => a + b, 0) / valids.length;
}

/** Check if any ADR pair disagrees by more than the threshold */
export function computeADRDisagreement(adr: ADRState): boolean {
  const validPairs: [number, number][] = [];
  if (adr.adr1Valid && adr.adr2Valid) validPairs.push([adr.adr1, adr.adr2]);
  if (adr.adr1Valid && adr.adr3Valid) validPairs.push([adr.adr1, adr.adr3]);
  if (adr.adr2Valid && adr.adr3Valid) validPairs.push([adr.adr2, adr.adr3]);
  // If fewer than 2 valid ADRs, we can't compare — but all-invalid is itself a failure mode
  if (validPairs.length === 0) {
    // No valid pairs at all: if at least one is valid, no disagree; if none valid, flag disagree
    const anyValid = adr.adr1Valid || adr.adr2Valid || adr.adr3Valid;
    return !anyValid; // All invalid → disagree
  }
  return validPairs.some(([a, b]) => Math.abs(a - b) > ADR_DISAGREE_THRESHOLD_KTS);
}

/** Compute flight law from ADR state (Normal → Alternate if disagreement) */
export function computeFlightLawFromADR(adr: ADRState, currentLaw: string): string {
  if (computeADRDisagreement(adr)) return "Alternate_Law_2";
  return currentLaw;
}

/** Determine if the SPD FLAG should be displayed */
export function computeSpdFlag(calculatedAirspeed: number, adr: ADRState): boolean {
  const anyValid = adr.adr1Valid || adr.adr2Valid || adr.adr3Valid;
  if (!anyValid) return true; // All ADRs invalid
  return calculatedAirspeed < SPD_FLAG_THRESHOLD_KTS;
}

/**
 * Stall warning activation logic per PRD:
 * Active when AoA > critical threshold AND calculated_airspeed > 60kts.
 * MUTED when airspeed ≤ 60kts (system assumes aircraft is on ground).
 */
export function computeStallWarningActive(
  aoa: number,
  calculatedAirspeed: number
): boolean {
  if (calculatedAirspeed <= STALL_IAS_FLOOR_KTS) return false; // Ground-speed muting
  return aoa > CRITICAL_AOA_THRESHOLD;
}

export const TELEMETRY_EVENTS: TelemetryEvent[] = [
  {
    event_id: "01_cruise_weather_entry",
    timestamp: "02:08:17",
    description: "Aircraft entering heavy ice crystal precipitation in the ITCZ.",
    flight_law: "Normal",
    autopilot_status: "ON",
    autothrust_status: "ON",
    indicated_airspeed_left_kts: 275,
    indicated_airspeed_standby_kts: 275,
    indicated_airspeed_right_kts: 275,
    mach_number: 0.80,
    altitude_ft: 35000,
    vertical_speed_fpm: 0,
    pitch_attitude_deg: 2.5,
    bank_angle_deg: 0,
    engine_thrust_n1_percent: 84,
    active_audio_warnings: "None",
    active_ecam_warnings: [],
    angle_of_attack_deg: 2.5,
    heading_deg: 218,
    wind_direction_deg: 240,
    wind_speed_kt: 38,
    ground_speed_kt: 462,
    true_airspeed_kt: 478,
    route_distance_nm: 1580,
    egt_deg_c: 612,
    fuel_flow_kg_h: 1218,
  },
  {
    event_id: "02_pitot_failure_startle",
    timestamp: "02:10:05",
    description: "Ice clogs pitot tubes. AP/ATHR disconnect. Protections lost.",
    flight_law: "Alternate_Law_2",
    autopilot_status: "OFF",
    autothrust_status: "OFF_THRUST_LOCK",
    indicated_airspeed_left_kts: 60,
    indicated_airspeed_standby_kts: 60,
    indicated_airspeed_right_kts: "INVALID_DATA",
    mach_number: "INVALID_DATA",
    altitude_ft: 34700,
    vertical_speed_fpm: -300,
    pitch_attitude_deg: 2.5,
    bank_angle_deg: 8,
    engine_thrust_n1_percent: 84,
    active_audio_warnings: [
      "Cavalry Charge (AP Disconnect)",
      "Brief STALL warning",
    ],
    active_ecam_warnings: [
      "AUTO FLT AP OFF",
      "AUTO FLT A/THR OFF",
      "F/CTL ALTN LAW (PROT LOST)",
      "NAV ADR DISAGREE",
    ],
    angle_of_attack_deg: 2.5,
    heading_deg: 220,
    wind_direction_deg: 238,
    wind_speed_kt: 40,
    ground_speed_kt: 450,
    true_airspeed_kt: 460,
    route_distance_nm: 1586,
    egt_deg_c: 608,
    fuel_flow_kg_h: 1215,
  },
  {
    event_id: "03_zoom_climb",
    timestamp: "02:10:26",
    description: "Pilot flying commands severe pitch up. Aircraft trading speed for altitude.",
    flight_law: "Alternate_Law_2",
    autopilot_status: "OFF",
    autothrust_status: "OFF_CLIMB_LATCHED",
    indicated_airspeed_left_kts: "INVALID_DATA",
    indicated_airspeed_standby_kts: "INVALID_DATA",
    indicated_airspeed_right_kts: "INVALID_DATA",
    mach_number: "INVALID_DATA",
    altitude_ft: 36000,
    vertical_speed_fpm: 6900,
    pitch_attitude_deg: 12.0,
    bank_angle_deg: -5,
    engine_thrust_n1_percent: 100,
    active_audio_warnings: ["C-Chord (Altitude Deviation)"],
    active_ecam_warnings: ["10+ Warning Messages Displayed"],
    angle_of_attack_deg: 8.0,
    heading_deg: 225,
    wind_direction_deg: 235,
    wind_speed_kt: 42,
    ground_speed_kt: 380,
    true_airspeed_kt: 400,
    route_distance_nm: 1590,
    egt_deg_c: 720,
    fuel_flow_kg_h: 1580,
  },
  {
    event_id: "04_apogee_and_stall",
    timestamp: "02:10:57",
    description: "Aircraft reaches maximum altitude. Fully developed aerodynamic stall begins.",
    flight_law: "Alternate_Law_2",
    autopilot_status: "OFF",
    autothrust_status: "OFF_TOGA",
    indicated_airspeed_left_kts: 183,
    indicated_airspeed_standby_kts: 183,
    indicated_airspeed_right_kts: 183,
    mach_number: 0.53,
    altitude_ft: 37924,
    vertical_speed_fpm: 0,
    pitch_attitude_deg: 16.0,
    bank_angle_deg: 12,
    engine_thrust_n1_percent: 104,
    active_audio_warnings: ["Continuous STALL warning"],
    active_ecam_warnings: ["10+ Warning Messages Displayed"],
    angle_of_attack_deg: 18.0,
    heading_deg: 230,
    wind_direction_deg: 230,
    wind_speed_kt: 35,
    ground_speed_kt: 300,
    true_airspeed_kt: 320,
    route_distance_nm: 1594,
    egt_deg_c: 755,
    fuel_flow_kg_h: 1720,
  },
  {
    event_id: "05_deep_stall_descent",
    timestamp: "02:11:42",
    description: "Aircraft falling flat. Extreme AoA causes airspeed to read invalid, silencing stall warning.",
    flight_law: "Alternate_Law_2",
    autopilot_status: "OFF",
    autothrust_status: "OFF_IDLE_COMMANDED",
    indicated_airspeed_left_kts: 29,
    indicated_airspeed_standby_kts: 29,
    indicated_airspeed_right_kts: 29,
    mach_number: "INVALID_DATA",
    altitude_ft: 35000,
    vertical_speed_fpm: -10000,
    pitch_attitude_deg: 15.0,
    bank_angle_deg: 30,
    engine_thrust_n1_percent: 45,
    active_audio_warnings: "None",
    active_ecam_warnings: ["10+ Warning Messages Displayed"],
    angle_of_attack_deg: 40.0,
    heading_deg: 240,
    wind_direction_deg: 225,
    wind_speed_kt: 30,
    ground_speed_kt: 180,
    true_airspeed_kt: 200,
    route_distance_nm: 1600,
    egt_deg_c: 480,
    fuel_flow_kg_h: 650,
  },
  {
    event_id: "06_impact",
    timestamp: "02:14:28",
    description: "Aircraft impacts the ocean surface.",
    flight_law: "Alternate_Law_2",
    autopilot_status: "OFF",
    autothrust_status: "OFF_TOGA",
    indicated_airspeed_left_kts: 107,
    indicated_airspeed_standby_kts: 107,
    indicated_airspeed_right_kts: 107,
    mach_number: "INVALID_DATA",
    altitude_ft: 0,
    vertical_speed_fpm: -10900,
    pitch_attitude_deg: 16.0,
    bank_angle_deg: -5,
    engine_thrust_n1_percent: 104,
    active_audio_warnings: [
      "Continuous STALL warning",
      "GPWS: SINK RATE, PULL UP",
      "DUAL INPUT",
    ],
    active_ecam_warnings: ["10+ Warning Messages Displayed"],
    angle_of_attack_deg: 35.0,
    heading_deg: 245,
    wind_direction_deg: 220,
    wind_speed_kt: 25,
    ground_speed_kt: 250,
    true_airspeed_kt: 270,
    route_distance_nm: 1612,
    egt_deg_c: 740,
    fuel_flow_kg_h: 1700,
  },
];

export function getAudioWarnings(event: TelemetryEvent): string[] {
  if (typeof event.active_audio_warnings === "string") {
    return event.active_audio_warnings === "None" ? [] : [event.active_audio_warnings];
  }
  return event.active_audio_warnings;
}

export function getEcamWarnings(event: TelemetryEvent): string[] {
  if (typeof event.active_ecam_warnings === "string") {
    return [event.active_ecam_warnings];
  }
  return event.active_ecam_warnings;
}

export function isSpeedValid(speed: number | "INVALID_DATA"): speed is number {
  return typeof speed === "number";
}

// Severity classification
export type Severity = "normal" | "caution" | "warning" | "critical";

export function getEventSeverity(event: TelemetryEvent): Severity {
  const audioWarnings = getAudioWarnings(event);
  const hasStall = audioWarnings.some((w) => w.toLowerCase().includes("stall"));
  const hasGPWS = audioWarnings.some((w) => w.toLowerCase().includes("gpws") || w.toLowerCase().includes("pull up"));

  if (hasGPWS) return "critical";
  if (hasStall) return "warning";
  if (event.autopilot_status === "OFF" || event.flight_law !== "Normal") return "caution";
  return "normal";
}

export const SEVERITY_COLORS: Record<Severity, string> = {
  normal: "#57FF57",
  caution: "#FFB347",
  warning: "#FF5757",
  critical: "#FF2020",
};