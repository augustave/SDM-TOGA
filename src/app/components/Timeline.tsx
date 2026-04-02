import {
  TELEMETRY_EVENTS,
  getEventSeverity,
  SEVERITY_COLORS,
} from "./telemetry-data";

interface TimelineProps {
  currentIndex: number;
  onIndexChange: (index: number) => void;
  isPlaying: boolean;
  onPlayToggle: () => void;
  transitionProgress?: number;
  interpolatedTimestamp?: string;
  interpolatedAlt?: number;
  interpolatedVS?: number;
  interpolatedPitch?: number;
  interpolatedBank?: number;
  isTransitioning?: boolean;
}

export function Timeline({
  currentIndex,
  onIndexChange,
  isPlaying,
  onPlayToggle,
  transitionProgress = 0,
  interpolatedTimestamp,
  interpolatedAlt,
  interpolatedVS,
  interpolatedPitch,
  interpolatedBank,
  isTransitioning = false,
}: TimelineProps) {
  const events = TELEMETRY_EVENTS;
  const current = events[currentIndex];
  const severity = getEventSeverity(current);
  const sevColor = SEVERITY_COLORS[severity];

  const parseTimestamp = (ts: string) => {
    const [h, m, s] = ts.split(":").map(Number);
    return h * 3600 + m * 60 + s;
  };

  const startTime = parseTimestamp(events[0].timestamp);
  const endTime = parseTimestamp(events[events.length - 1].timestamp);
  const totalDuration = endTime - startTime;

  const getElapsed = (idx: number) => parseTimestamp(events[idx].timestamp) - startTime;

  const getProgress = (idx: number) => (totalDuration > 0 ? getElapsed(idx) / totalDuration : 0);

  const formatElapsed = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `+${m}:${s.toString().padStart(2, "0")}`;
  };

  // Continuous playhead position
  const playheadProgress = (() => {
    const baseProgress = getProgress(currentIndex);
    if (!isTransitioning || currentIndex <= 0) return baseProgress;
    const prevProgress = getProgress(currentIndex - 1);
    return prevProgress + (baseProgress - prevProgress) * transitionProgress;
  })();

  // Display timestamp
  const displayTimestamp = interpolatedTimestamp || current.timestamp;

  const displayElapsed = (() => {
    if (!interpolatedTimestamp) return formatElapsed(getElapsed(currentIndex));
    const [h, m, s] = interpolatedTimestamp.split(":").map(Number);
    const secs = h * 3600 + m * 60 + s - startTime;
    return formatElapsed(Math.max(0, secs));
  })();

  return (
    <div className="border border-[#BEBEB8] bg-[#E2E2DF]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-[#BEBEB8]">
        <div className="flex items-center gap-3">
          <span
            className="text-[10px] text-[#8A8A84] uppercase"
            style={{ fontFamily: "var(--font-stencil)", letterSpacing: "0.2em" }}
          >
            Flight Telemetry Replay
          </span>
          <span className="text-[11px] text-[#222222] tabular-nums" style={{ fontFamily: "var(--font-data)" }}>
            {displayTimestamp}Z
          </span>
          <span className="text-[10px] text-[#8A8A84] tabular-nums" style={{ fontFamily: "var(--font-data)" }}>
            ({displayElapsed})
          </span>
          {isTransitioning && (
            <span className="text-[8px] text-[#FFB347] uppercase tracking-wider animate-pulse">
              Interpolating
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[9px] uppercase" style={{ color: sevColor, fontFamily: "var(--font-stencil)", letterSpacing: "0.15em" }}>
            {severity}
          </span>
          <span className="text-[10px] text-[#8A8A84] tabular-nums" style={{ fontFamily: "var(--font-data)" }}>
            Event {currentIndex + 1} / {events.length}
          </span>
        </div>
      </div>

      {/* Timeline track */}
      <div className="px-4 py-3">
        <div className="relative h-6">
          {/* Track background */}
          <div className="absolute top-[11px] left-0 right-0 h-[1px] bg-[#BEBEB8]" />

          {/* Continuous progress fill */}
          <div
            className="absolute top-[9px] h-[5px]"
            style={{
              left: "0%",
              width: `${playheadProgress * 100}%`,
              background: sevColor,
              opacity: 0.2,
            }}
          />

          {/* Segment color fills between events */}
          {events.map((evt, i) => {
            if (i === 0) return null;
            const x1 = getProgress(i - 1) * 100;
            const x2 = getProgress(i) * 100;
            const segSev = getEventSeverity(events[i]);
            const segColor = SEVERITY_COLORS[segSev];
            const isActive = i <= currentIndex;
            return (
              <div
                key={`seg-${i}`}
                className="absolute top-[9px] h-[5px]"
                style={{
                  left: `${x1}%`,
                  width: `${x2 - x1}%`,
                  backgroundColor: isActive ? segColor : "transparent",
                  opacity: isActive ? 0.4 : 0,
                }}
              />
            );
          })}

          {/* Event markers */}
          {events.map((evt, i) => {
            const x = getProgress(i) * 100;
            const sev = getEventSeverity(evt);
            const color = SEVERITY_COLORS[sev];
            const isActive = i === currentIndex;
            const isPast = i < currentIndex;
            return (
              <button
                key={evt.event_id}
                onClick={() => onIndexChange(i)}
                className="absolute top-0 -translate-x-1/2 flex flex-col items-center cursor-pointer group"
                style={{ left: `${x}%` }}
              >
                <div
                  className="w-[9px] h-[9px] border transition-all duration-150"
                  style={{
                    borderColor: isActive ? color : isPast ? color : "#BEBEB8",
                    backgroundColor: isActive ? color : "transparent",
                    transform: `rotate(45deg) scale(${isActive ? 1.3 : 1})`,
                  }}
                />
                <div
                  className="w-[1px] h-[8px] mt-[2px] transition-colors duration-150"
                  style={{ backgroundColor: isActive ? color : "#BEBEB8" }}
                />
              </button>
            );
          })}

          {/* Moving playhead diamond */}
          <div
            className="absolute top-0 -translate-x-1/2 pointer-events-none"
            style={{
              left: `${playheadProgress * 100}%`,
              transition: isTransitioning ? "none" : "left 0.3s ease",
            }}
          >
            <div
              className="w-[7px] h-[7px] border rotate-45 mt-[1px]"
              style={{
                borderColor: sevColor,
                backgroundColor: isTransitioning ? sevColor : "transparent",
                opacity: isTransitioning ? 0.7 : 0,
              }}
            />
          </div>
        </div>

        {/* Event timestamp labels */}
        <div className="relative h-4 mt-0.5">
          {events.map((evt, i) => {
            const x = getProgress(i) * 100;
            return (
              <span
                key={`lbl-${i}`}
                className="absolute text-[7px] tabular-nums -translate-x-1/2"
                style={{
                  left: `${x}%`,
                  color: i === currentIndex ? "#222222" : "#BEBEB8",
                }}
              >
                {evt.timestamp.slice(3)}
              </span>
            );
          })}
        </div>
      </div>

      {/* Controls + description */}
      <div className="px-4 py-2 border-t border-[#BEBEB8] flex items-start gap-4">
        {/* Playback controls */}
        <div className="flex gap-1 shrink-0 pt-0.5">
          <button
            onClick={() => onIndexChange(Math.max(0, currentIndex - 1))}
            className="w-6 h-5 border border-[#BEBEB8] text-[8px] text-[#4A4A46] flex items-center justify-center hover:bg-[#D8D8D4] transition-colors duration-150"
            disabled={currentIndex === 0}
          >
            &#9666;
          </button>
          <button
            onClick={onPlayToggle}
            className={`w-8 h-5 border text-[8px] flex items-center justify-center transition-colors duration-150 ${
              isPlaying
                ? "border-[#222222] text-[#222222] bg-[#D8D8D4]"
                : "border-[#BEBEB8] text-[#4A4A46] hover:bg-[#D8D8D4]"
            }`}
          >
            {isPlaying ? "||" : "\u25B6"}
          </button>
          <button
            onClick={() => onIndexChange(Math.min(events.length - 1, currentIndex + 1))}
            className="w-6 h-5 border border-[#BEBEB8] text-[8px] text-[#4A4A46] flex items-center justify-center hover:bg-[#D8D8D4] transition-colors duration-150"
            disabled={currentIndex === events.length - 1}
          >
            &#9656;
          </button>
          <button
            onClick={() => onIndexChange(0)}
            className="w-6 h-5 border border-[#BEBEB8] text-[7px] text-[#4A4A46] flex items-center justify-center hover:bg-[#D8D8D4] transition-colors duration-150"
          >
            &#9666;&#9666;
          </button>
        </div>

        {/* Event description */}
        <div className="flex-1 min-w-0">
          <div className="text-[9px] text-[#8A8A84] uppercase tracking-wider mb-0.5">
            {current.event_id.replace(/_/g, " ")}
          </div>
          <div className="text-[10px] text-[#4A4A46] leading-relaxed">
            {current.description}
          </div>
        </div>

        {/* Key parameter readout */}
        <div className="shrink-0 text-right hidden md:block">
          <div className="grid grid-cols-2 gap-x-4 gap-y-0">
            <span className="text-[8px] text-[#8A8A84] uppercase">ALT</span>
            <span className="text-[9px] text-[#222222] tabular-nums">
              {Math.round(interpolatedAlt ?? current.altitude_ft).toLocaleString()} FT
            </span>
            <span className="text-[8px] text-[#8A8A84] uppercase">V/S</span>
            <span
              className="text-[9px] tabular-nums"
              style={{ color: Math.abs(interpolatedVS ?? current.vertical_speed_fpm) > 4000 ? "#FF5757" : "#222222" }}
            >
              {(interpolatedVS ?? current.vertical_speed_fpm) > 0 ? "+" : ""}
              {Math.round(interpolatedVS ?? current.vertical_speed_fpm)} FPM
            </span>
            <span className="text-[8px] text-[#8A8A84] uppercase">PITCH</span>
            <span className="text-[9px] text-[#222222] tabular-nums">
              {(interpolatedPitch ?? current.pitch_attitude_deg).toFixed(1)}&deg;
            </span>
            <span className="text-[8px] text-[#8A8A84] uppercase">BANK</span>
            <span className="text-[9px] text-[#222222] tabular-nums">
              {(interpolatedBank ?? current.bank_angle_deg).toFixed(1)}&deg;
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}