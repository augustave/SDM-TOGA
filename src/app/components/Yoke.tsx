import { useRef, useState, useCallback, useEffect } from "react";
import { motion, useSpring, useTransform } from "motion/react";

interface YokeState {
  roll: number; // -1 to 1
  pitch: number; // -1 to 1
}

interface YokeProps {
  onStateChange?: (state: YokeState) => void;
}

export function Yoke({ onStateChange }: YokeProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [yokeState, setYokeState] = useState<YokeState>({ roll: 0, pitch: 0 });

  const springConfig = { stiffness: 120, damping: 20 };
  const rollSpring = useSpring(0, springConfig);
  const pitchSpring = useSpring(0, springConfig);

  const rollDeg = useTransform(rollSpring, [-1, 1], [-45, 45]);
  const pitchY = useTransform(pitchSpring, [-1, 1], [-30, 30]);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    setIsDragging(true);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, []);

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isDragging || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const roll = Math.max(-1, Math.min(1, (e.clientX - cx) / (rect.width / 2)));
      const pitch = Math.max(-1, Math.min(1, (e.clientY - cy) / (rect.height / 2)));
      rollSpring.set(roll);
      pitchSpring.set(pitch);
      setYokeState({ roll, pitch });
      onStateChange?.({ roll, pitch });
    },
    [isDragging, rollSpring, pitchSpring, onStateChange]
  );

  const handlePointerUp = useCallback(() => {
    setIsDragging(false);
    rollSpring.set(0);
    pitchSpring.set(0);
    setYokeState({ roll: 0, pitch: 0 });
    onStateChange?.({ roll: 0, pitch: 0 });
  }, [rollSpring, pitchSpring, onStateChange]);

  return (
    <div className="flex flex-col h-full">
      {/* Header metadata */}
      <div className="flex justify-between items-start px-1 mb-3">
        <div>
          <span
            className="text-[10px] uppercase text-[#8A8A84]"
            style={{ fontFamily: "var(--font-stencil)", letterSpacing: "0.2em" }}
          >
            CTRL-COL / SIDESTICK POSITION
          </span>
        </div>
        <span className="text-[10px] text-[#BEBEB8]" style={{ fontFamily: "var(--font-stencil)", letterSpacing: "0.1em" }}>FIG.01</span>
      </div>

      {/* Yoke visualization */}
      <div
        ref={containerRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        className="flex-1 relative border border-[#BEBEB8] bg-[#E2E2DF] select-none cursor-grab active:cursor-grabbing"
        style={{ touchAction: "none" }}
      >
        {/* Grid lines */}
        <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
          {/* Vertical center */}
          <line x1="50%" y1="0" x2="50%" y2="100%" stroke="#BEBEB8" strokeWidth="0.5" strokeDasharray="4 4" />
          {/* Horizontal center */}
          <line x1="0" y1="50%" x2="100%" y2="50%" stroke="#BEBEB8" strokeWidth="0.5" strokeDasharray="4 4" />
          {/* Quarter lines */}
          <line x1="25%" y1="0" x2="25%" y2="100%" stroke="#BEBEB8" strokeWidth="0.3" strokeDasharray="2 6" />
          <line x1="75%" y1="0" x2="75%" y2="100%" stroke="#BEBEB8" strokeWidth="0.3" strokeDasharray="2 6" />
          <line x1="0" y1="25%" x2="100%" y2="25%" stroke="#BEBEB8" strokeWidth="0.3" strokeDasharray="2 6" />
          <line x1="0" y1="75%" x2="100%" y2="75%" stroke="#BEBEB8" strokeWidth="0.3" strokeDasharray="2 6" />
        </svg>

        {/* Axis labels */}
        <span className="absolute top-2 left-1/2 -translate-x-1/2 text-[9px] text-[#BEBEB8] uppercase tracking-widest">
          Nose Up
        </span>
        <span className="absolute bottom-2 left-1/2 -translate-x-1/2 text-[9px] text-[#BEBEB8] uppercase tracking-widest">
          Nose Dn
        </span>
        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[9px] text-[#BEBEB8] uppercase tracking-widest -rotate-90 origin-center">
          Left
        </span>
        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] text-[#BEBEB8] uppercase tracking-widest rotate-90 origin-center">
          Right
        </span>

        {/* Yoke SVG */}
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.div
            style={{ rotate: rollDeg, y: pitchY }}
            className="w-[80%] max-w-[320px]"
          >
            <svg viewBox="0 0 320 200" className="w-full">
              {/* Column */}
              <line
                x1="160" y1="100" x2="160" y2="200"
                stroke="#4A4A46" strokeWidth="2"
              />
              <line
                x1="155" y1="200" x2="165" y2="200"
                stroke="#4A4A46" strokeWidth="1"
              />

              {/* Main yoke bar */}
              <rect
                x="30" y="85" width="260" height="30" rx="0"
                fill="none" stroke="#4A4A46" strokeWidth="1.5"
              />
              {/* Center hub */}
              <rect
                x="130" y="75" width="60" height="50" rx="0"
                fill="none" stroke="#4A4A46" strokeWidth="1.5"
              />
              <circle cx="160" cy="100" r="6" fill="none" stroke="#4A4A46" strokeWidth="1" />
              <circle cx="160" cy="100" r="2" fill="#4A4A46" />

              {/* Left horn */}
              <path
                d="M30,85 L30,60 Q30,45 45,45 L80,45 L80,85"
                fill="none" stroke="#4A4A46" strokeWidth="1.5"
              />
              {/* Left grip marks */}
              <line x1="40" y1="55" x2="70" y2="55" stroke="#BEBEB8" strokeWidth="0.5" />
              <line x1="40" y1="62" x2="70" y2="62" stroke="#BEBEB8" strokeWidth="0.5" />
              <line x1="40" y1="69" x2="70" y2="69" stroke="#BEBEB8" strokeWidth="0.5" />

              {/* Right horn */}
              <path
                d="M290,85 L290,60 Q290,45 275,45 L240,45 L240,85"
                fill="none" stroke="#4A4A46" strokeWidth="1.5"
              />
              {/* Right grip marks */}
              <line x1="250" y1="55" x2="280" y2="55" stroke="#BEBEB8" strokeWidth="0.5" />
              <line x1="250" y1="62" x2="280" y2="62" stroke="#BEBEB8" strokeWidth="0.5" />
              <line x1="250" y1="69" x2="280" y2="69" stroke="#BEBEB8" strokeWidth="0.5" />

              {/* Buttons on horns */}
              <rect x="48" y="48" width="14" height="8" fill="none" stroke="#4A4A46" strokeWidth="0.75" />
              <rect x="258" y="48" width="14" height="8" fill="none" stroke="#4A4A46" strokeWidth="0.75" />

              {/* Dimension annotations */}
              <line x1="30" y1="35" x2="290" y2="35" stroke="#BEBEB8" strokeWidth="0.5" />
              <line x1="30" y1="32" x2="30" y2="38" stroke="#BEBEB8" strokeWidth="0.5" />
              <line x1="290" y1="32" x2="290" y2="38" stroke="#BEBEB8" strokeWidth="0.5" />
              <text x="160" y="32" textAnchor="middle" fill="#BEBEB8" fontSize="7" fontFamily="IBM Plex Mono, monospace">
                260mm
              </text>
            </svg>
          </motion.div>
        </div>

        {/* Drag indicator */}
        <div className={`absolute bottom-3 left-1/2 -translate-x-1/2 text-[9px] uppercase tracking-wider transition-opacity duration-150 ${isDragging ? 'opacity-0' : 'opacity-100'}`} style={{ color: '#BEBEB8' }}>
          Drag to control
        </div>
      </div>

      {/* Telemetry readout */}
      <div className="mt-3 border-t border-[#BEBEB8] pt-3">
        <div className="grid grid-cols-2 gap-x-6 gap-y-1">
          <div className="flex justify-between">
            <span className="text-[10px] text-[#8A8A84] uppercase tracking-wider">Roll</span>
            <span className="text-[11px] text-[#222222] tabular-nums">
              {(yokeState.roll * 45).toFixed(1)}°
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-[10px] text-[#8A8A84] uppercase tracking-wider">Pitch</span>
            <span className="text-[11px] text-[#222222] tabular-nums">
              {(yokeState.pitch * -17).toFixed(1)}°
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-[10px] text-[#8A8A84] uppercase tracking-wider">Bank Lim</span>
            <span className="text-[11px] text-[#8A8A84] tabular-nums">±67.0°</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[10px] text-[#8A8A84] uppercase tracking-wider">Status</span>
            <span className="text-[11px] text-[#222222] tabular-nums">
              {isDragging ? "ACTIVE" : "NEUTRAL"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}