import { useState, useRef, useEffect, useCallback } from "react";
import {
  TELEMETRY_EVENTS,
  type TelemetryEvent,
  getEventSeverity,
  getAudioWarnings,
  getEcamWarnings,
  isSpeedValid,
  type Severity,
  extractADR,
  computeCalculatedAirspeed,
  computeADRDisagreement,
  computeSpdFlag,
  computeStallWarningActive,
  CRITICAL_AOA_THRESHOLD,
} from "./telemetry-data";

/** Numeric fields we can lerp smoothly */
interface NumericSnapshot {
  altitude_ft: number;
  vertical_speed_fpm: number;
  pitch_attitude_deg: number;
  bank_angle_deg: number;
  engine_thrust_n1_percent: number;
  speed: number;
  machNumeric: number;
  angle_of_attack_deg: number;
  adr1Speed: number;
  adr2Speed: number;
  adr3Speed: number;
  // Navigation / engine fields
  heading_deg: number;
  wind_direction_deg: number;
  wind_speed_kt: number;
  ground_speed_kt: number;
  true_airspeed_kt: number;
  route_distance_nm: number;
  egt_deg_c: number;
  fuel_flow_kg_h: number;
}

/** Discrete fields that snap at midpoint */
interface DiscreteSnapshot {
  flight_law: string;
  autopilot_status: string;
  autothrust_status: string;
  speedValid: boolean;
  severity: Severity;
  stallWarning: boolean;
  gpwsWarning: boolean;
  audioWarnings: string[];
  ecamWarnings: string[];
  fmaLeft: string;
  fmaCenter: string;
  fmaRight: string;
  description: string;
  event_id: string;
  timestamp: string;
  adr1Valid: boolean;
  adr2Valid: boolean;
  adr3Valid: boolean;
}

/** Derived states computed from interpolated values every frame */
interface DerivedState {
  calculatedAirspeed: number;
  adrDisagreement: boolean;
  spdFlagActive: boolean;
  stallWarningComputed: boolean;
  computedFlightLaw: string;
}

export interface InterpolatedState extends NumericSnapshot, DiscreteSnapshot, DerivedState {
  transitionProgress: number;
  isTransitioning: boolean;
}

function extractNumeric(event: TelemetryEvent): NumericSnapshot {
  const spdLeft = event.indicated_airspeed_left_kts;
  const speedVal = isSpeedValid(spdLeft) ? spdLeft : 0;
  const machVal = typeof event.mach_number === "number" ? event.mach_number : 0;
  const adr = extractADR(event);
  return {
    altitude_ft: event.altitude_ft,
    vertical_speed_fpm: event.vertical_speed_fpm,
    pitch_attitude_deg: event.pitch_attitude_deg,
    bank_angle_deg: event.bank_angle_deg,
    engine_thrust_n1_percent: event.engine_thrust_n1_percent,
    speed: speedVal,
    machNumeric: machVal,
    angle_of_attack_deg: event.angle_of_attack_deg,
    adr1Speed: adr.adr1,
    adr2Speed: adr.adr2,
    adr3Speed: adr.adr3,
    // Navigation / engine fields
    heading_deg: event.heading_deg,
    wind_direction_deg: event.wind_direction_deg,
    wind_speed_kt: event.wind_speed_kt,
    ground_speed_kt: event.ground_speed_kt,
    true_airspeed_kt: event.true_airspeed_kt,
    route_distance_nm: event.route_distance_nm,
    egt_deg_c: event.egt_deg_c,
    fuel_flow_kg_h: event.fuel_flow_kg_h,
  };
}

function getFMA(event: TelemetryEvent) {
  if (event.autopilot_status === "ON") {
    return { left: "THR CLB", center: "NAV", right: "ALT CRZ" };
  }
  const athr = event.autothrust_status;
  let left = "MAN THR";
  if (athr.includes("TOGA")) left = "MAN TOGA";
  else if (athr.includes("CLIMB")) left = "MAN CLB";
  else if (athr.includes("IDLE")) left = "MAN IDLE";
  else if (athr.includes("LOCK")) left = "THR LK";
  return { left, center: "HDG", right: "V/S" };
}

function extractDiscrete(event: TelemetryEvent): DiscreteSnapshot {
  const audioWarnings = getAudioWarnings(event);
  const ecamWarnings = getEcamWarnings(event);
  const hasStall = audioWarnings.some((w) => w.toLowerCase().includes("stall"));
  const hasGPWS = audioWarnings.some(
    (w) => w.toLowerCase().includes("pull up") || w.toLowerCase().includes("gpws")
  );
  const spdLeft = event.indicated_airspeed_left_kts;
  const fma = getFMA(event);
  const adr = extractADR(event);
  return {
    flight_law: event.flight_law,
    autopilot_status: event.autopilot_status,
    autothrust_status: event.autothrust_status,
    speedValid: isSpeedValid(spdLeft),
    severity: getEventSeverity(event),
    stallWarning: hasStall,
    gpwsWarning: hasGPWS,
    audioWarnings,
    ecamWarnings,
    fmaLeft: fma.left,
    fmaCenter: fma.center,
    fmaRight: fma.right,
    description: event.description,
    event_id: event.event_id,
    timestamp: event.timestamp,
    adr1Valid: adr.adr1Valid,
    adr2Valid: adr.adr2Valid,
    adr3Valid: adr.adr3Valid,
  };
}

/** Compute derived states from current interpolated values */
function computeDerived(
  num: NumericSnapshot,
  disc: DiscreteSnapshot
): DerivedState {
  // Build an ADR state from the interpolated values + discrete validity flags
  const adrState = {
    adr1: num.adr1Speed,
    adr2: num.adr2Speed,
    adr3: num.adr3Speed,
    adr1Valid: disc.adr1Valid,
    adr2Valid: disc.adr2Valid,
    adr3Valid: disc.adr3Valid,
  };

  const calculatedAirspeed = computeCalculatedAirspeed(adrState);
  const adrDisagreement = computeADRDisagreement(adrState);
  const spdFlagActive = computeSpdFlag(calculatedAirspeed, adrState);
  const stallWarningComputed = computeStallWarningActive(
    num.angle_of_attack_deg,
    calculatedAirspeed
  );
  // Flight law: if ADR disagrees → ALTN LAW, otherwise use the event's flight law
  const computedFlightLaw = adrDisagreement
    ? "Alternate_Law_2"
    : disc.flight_law;

  return {
    calculatedAirspeed,
    adrDisagreement,
    spdFlagActive,
    stallWarningComputed,
    computedFlightLaw,
  };
}

function lerpNum(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function lerpSnapshot(from: NumericSnapshot, to: NumericSnapshot, t: number): NumericSnapshot {
  return {
    altitude_ft: lerpNum(from.altitude_ft, to.altitude_ft, t),
    vertical_speed_fpm: lerpNum(from.vertical_speed_fpm, to.vertical_speed_fpm, t),
    pitch_attitude_deg: lerpNum(from.pitch_attitude_deg, to.pitch_attitude_deg, t),
    bank_angle_deg: lerpNum(from.bank_angle_deg, to.bank_angle_deg, t),
    engine_thrust_n1_percent: lerpNum(from.engine_thrust_n1_percent, to.engine_thrust_n1_percent, t),
    speed: lerpNum(from.speed, to.speed, t),
    machNumeric: lerpNum(from.machNumeric, to.machNumeric, t),
    angle_of_attack_deg: lerpNum(from.angle_of_attack_deg, to.angle_of_attack_deg, t),
    adr1Speed: lerpNum(from.adr1Speed, to.adr1Speed, t),
    adr2Speed: lerpNum(from.adr2Speed, to.adr2Speed, t),
    adr3Speed: lerpNum(from.adr3Speed, to.adr3Speed, t),
    // Navigation / engine fields
    heading_deg: lerpNum(from.heading_deg, to.heading_deg, t),
    wind_direction_deg: lerpNum(from.wind_direction_deg, to.wind_direction_deg, t),
    wind_speed_kt: lerpNum(from.wind_speed_kt, to.wind_speed_kt, t),
    ground_speed_kt: lerpNum(from.ground_speed_kt, to.ground_speed_kt, t),
    true_airspeed_kt: lerpNum(from.true_airspeed_kt, to.true_airspeed_kt, t),
    route_distance_nm: lerpNum(from.route_distance_nm, to.route_distance_nm, t),
    egt_deg_c: lerpNum(from.egt_deg_c, to.egt_deg_c, t),
    fuel_flow_kg_h: lerpNum(from.fuel_flow_kg_h, to.fuel_flow_kg_h, t),
  };
}

function easeInOut(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function lerpTimestamp(fromTs: string, toTs: string, t: number): string {
  const parse = (ts: string) => {
    const [h, m, s] = ts.split(":").map(Number);
    return h * 3600 + m * 60 + s;
  };
  const format = (total: number) => {
    const h = Math.floor(total / 3600);
    const m = Math.floor((total % 3600) / 60);
    const s = Math.floor(total % 60);
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };
  return format(Math.round(lerpNum(parse(fromTs), parse(toTs), t)));
}

const TRANSITION_DURATION_MS = 1800;

export function useInterpolatedTelemetry(targetIndex: number) {
  const events = TELEMETRY_EVENTS;

  const prevTargetRef = useRef(targetIndex);
  const rafRef = useRef<number>(0);
  const startTimeRef = useRef(0);

  const fromNumRef = useRef<NumericSnapshot>(extractNumeric(events[targetIndex]));
  const toNumRef = useRef<NumericSnapshot>(extractNumeric(events[targetIndex]));
  const fromDiscreteRef = useRef<DiscreteSnapshot>(extractDiscrete(events[targetIndex]));
  const toDiscreteRef = useRef<DiscreteSnapshot>(extractDiscrete(events[targetIndex]));

  // Ref that always holds the latest rendered state (for chaining mid-animation)
  const currentNumRef = useRef<NumericSnapshot>(extractNumeric(events[targetIndex]));
  const currentDiscreteRef = useRef<DiscreteSnapshot>(extractDiscrete(events[targetIndex]));

  const [state, setState] = useState<InterpolatedState>(() => {
    const num = extractNumeric(events[targetIndex]);
    const disc = extractDiscrete(events[targetIndex]);
    const derived = computeDerived(num, disc);
    return {
      ...num,
      ...disc,
      ...derived,
      transitionProgress: 0,
      isTransitioning: false,
    };
  });

  const animate = useCallback(() => {
    const elapsed = performance.now() - startTimeRef.current;
    const rawT = Math.min(elapsed / TRANSITION_DURATION_MS, 1);
    const t = easeInOut(rawT);

    const numericState = lerpSnapshot(fromNumRef.current, toNumRef.current, t);
    const discrete = t >= 0.2 ? toDiscreteRef.current : fromDiscreteRef.current;
    const displayTimestamp = lerpTimestamp(
      fromDiscreteRef.current.timestamp,
      toDiscreteRef.current.timestamp,
      t
    );

    // Compute derived states from the current interpolated frame
    const derived = computeDerived(numericState, discrete);

    // Update the "live" refs so chaining works
    currentNumRef.current = numericState;
    currentDiscreteRef.current = { ...discrete, timestamp: displayTimestamp };

    setState({
      ...numericState,
      ...discrete,
      ...derived,
      timestamp: displayTimestamp,
      transitionProgress: rawT,
      isTransitioning: rawT < 1,
    });

    if (rawT < 1) {
      rafRef.current = requestAnimationFrame(animate);
    }
  }, []);

  // Kick off transition when target changes
  useEffect(() => {
    if (prevTargetRef.current === targetIndex) return;
    prevTargetRef.current = targetIndex;

    // Cancel any running animation
    if (rafRef.current) cancelAnimationFrame(rafRef.current);

    // Capture from-state as whatever is currently displayed (allows chaining)
    fromNumRef.current = { ...currentNumRef.current };
    fromDiscreteRef.current = { ...currentDiscreteRef.current };

    toNumRef.current = extractNumeric(events[targetIndex]);
    toDiscreteRef.current = extractDiscrete(events[targetIndex]);

    startTimeRef.current = performance.now();
    rafRef.current = requestAnimationFrame(animate);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [targetIndex, animate, events]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return state;
}