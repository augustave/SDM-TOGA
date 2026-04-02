import { useState, useCallback } from "react";

type MCDUPage = "init" | "fplan" | "perf" | "prog" | "dir" | "data" | "fuel" | "radnav";

interface FlightPlanLeg {
  waypoint: string;
  bearing: string;
  dist: string;
  alt: string;
  spd: string;
  time: string;
}

const FPLAN_DATA: FlightPlanLeg[] = [
  { waypoint: "LFPG/27R", bearing: "---", dist: "---", alt: "  262", spd: "---", time: "0812" },
  { waypoint: "PG432", bearing: "272", dist: "3.2", alt: " 1500", spd: "210", time: "0814" },
  { waypoint: "OPALE", bearing: "265", dist: "12.8", alt: " 5000", spd: "250", time: "0819" },
  { waypoint: "AGOPA", bearing: "240", dist: "38.4", alt: "FL180", spd: "290", time: "0828" },
  { waypoint: "LERGA", bearing: "218", dist: "62.1", alt: "FL320", spd: ".78", time: "0841" },
  { waypoint: "AMORO", bearing: "215", dist: "114.6", alt: "FL370", spd: ".80", time: "0902" },
];

const PAGES: Record<MCDUPage, { title: string; lines: string[][] }> = {
  init: {
    title: "  INIT",
    lines: [
      ["  CO RTE", "ALTN/CO RTE"],
      ["  LFPG/LEBL", "----/----------"],
      ["  FLT NBR", ""],
      ["  AFR1842", ""],
      ["  FROM/TO", "COST INDEX"],
      ["  LFPG/LEBL", "  38"],
      ["  CRZ FL/TEMP", ""],
      ["  FL370/-52°C", ""],
      ["  TROPO", "GND TEMP"],
      ["  36090", "  15°C"],
      ["", "WIND>"],
      ["", ""],
    ],
  },
  fplan: {
    title: "  F-PLN",
    lines: [],
  },
  perf: {
    title: "  TAKE OFF  RWY27R",
    lines: [
      ["  V1    FLP RETR", ""],
      ["  148", "    ---°/---"],
      ["  VR", "SLT RETR"],
      ["  152", "    180/200"],
      ["  V2    CLEAN", ""],
      ["  157", "    220/---"],
      ["  TRANS ALT", "FLEX TO TEMP"],
      ["  5000", "  55°C"],
      ["  THR RED/ACC", "ENG OUT ACC"],
      ["  1500/1500", "  1500"],
      ["<TO DATA", "NEXT "],
      ["", "PHASE>"],
    ],
  },
  prog: {
    title: "  PROG",
    lines: [
      ["  CRZ", "OPT     MAX REC"],
      ["  FL370", "  FL390   FL410"],
      ["  TO", "DIST  EFOB  ETA"],
      ["  LEBL", " 478   6.2  0952"],
      ["  NEXT WPT", ""],
      ["  PG432", "  3.2"],
      ["", "BRG/DIST"],
      ["", "  272°/3.2"],
      ["  GPS PRIMARY", ""],
      ["  NAV ACCURACY: HIGH", ""],
      ["<REPORT", ""],
      ["", ""],
    ],
  },
  dir: {
    title: "  DIR TO",
    lines: [
      ["  WAYPOINT", "DIST   HDG"],
      ["  [     ]", ""],
      ["  ------", ""],
      ["  PG432", "  3.2   272"],
      ["  OPALE", " 12.8   265"],
      ["  AGOPA", " 38.4   240"],
      ["  LERGA", " 62.1   218"],
      ["  AMORO", "114.6   215"],
      ["", ""],
      ["", ""],
      ["<ERASE", "INSERT*"],
      ["", ""],
    ],
  },
  data: {
    title: "  DATA INDEX",
    lines: [
      ["<POSITION", "MONITOR>"],
      ["  MONITOR", ""],
      ["<IRS", "GPS>"],
      ["  STATUS", "POSITION"],
      ["<NAVAIDS", "WINDS>"],
      ["", ""],
      ["<RUNWAYS", "ROUTES>"],
      ["", ""],
      ["<WAYPOINTS", ""],
      ["", ""],
      ["<RETURN", ""],
      ["", ""],
    ],
  },
  fuel: {
    title: "  FUEL PRED",
    lines: [
      ["  AT", "EFOB"],
      ["  LEBL", "  6.2"],
      ["  ALTN", ""],
      ["  ----", " ----"],
      ["  FINAL", "TIME"],
      ["  0.8", " 0030"],
      ["  EXTRA", "TIME"],
      ["  0.0", " ----"],
      ["  GW /  CG", ""],
      ["  68.2 / 28.5", ""],
      ["  FOB  :  12.4", ""],
      ["", ""],
    ],
  },
  radnav: {
    title: "  RADIO NAV",
    lines: [
      ["  VOR1/FREQ", "FREQ/VOR2"],
      ["  ---/---.-", "---.-/---"],
      ["  CRS", "CRS"],
      ["  ---°", "---°"],
      ["  ILS /FREQ", ""],
      ["  PG /110.30", ""],
      ["  CRS", "SLOPE"],
      ["  272°", "3.00°"],
      ["  ADF1/FREQ", "FREQ/ADF2"],
      ["  ---/---.-", "---.-/---"],
      ["", ""],
      ["", ""],
    ],
  },
};

const LSK_LABELS_LEFT = ["", "", "", "", "", ""];
const LSK_LABELS_RIGHT = ["", "", "", "", "", ""];

const FUNC_KEYS_ROW1 = [
  { label: "DIR", page: "dir" as MCDUPage },
  { label: "PROG", page: "prog" as MCDUPage },
  { label: "PERF", page: "perf" as MCDUPage },
  { label: "INIT", page: "init" as MCDUPage },
  { label: "DATA", page: "data" as MCDUPage },
  { label: "F-PLN", page: "fplan" as MCDUPage },
];

const FUNC_KEYS_ROW2 = [
  { label: "RAD NAV", page: "radnav" as MCDUPage },
  { label: "FUEL", page: "fuel" as MCDUPage },
  { label: "SEC", page: null },
  { label: "ATC", page: null },
  { label: "MCDU", page: null },
  { label: "MENU", page: null },
];

const ALPHA_KEYS = [
  ["A", "B", "C", "D", "E"],
  ["F", "G", "H", "I", "J"],
  ["K", "L", "M", "N", "O"],
  ["P", "Q", "R", "S", "T"],
  ["U", "V", "W", "X", "Y"],
  ["Z", "/", "SP", "OVFY", "CLR"],
];

const NUM_KEYS = [
  ["1", "2", "3"],
  ["4", "5", "6"],
  ["7", "8", "9"],
  [".", "0", "+/-"],
];

export function MCDU() {
  const [currentPage, setCurrentPage] = useState<MCDUPage>("init");
  const [scratchpad, setScratchpad] = useState("");
  const [pageState, setPageState] = useState(PAGES);
  const [messages, setMessages] = useState<string[]>([]);

  const handleKey = useCallback(
    (key: string) => {
      if (key === "CLR") {
        if (scratchpad.length > 0) {
          setScratchpad((prev) => prev.slice(0, -1));
        } else if (messages.length > 0) {
          setMessages((prev) => prev.slice(1));
        }
      } else if (key === "SP") {
        setScratchpad((prev) => prev + " ");
      } else if (key === "+/-") {
        setScratchpad((prev) => {
          if (prev.startsWith("-")) return prev.slice(1);
          return "-" + prev;
        });
      } else if (key === "OVFY") {
        // no-op
      } else {
        setScratchpad((prev) => prev + key);
      }
    },
    [scratchpad, messages]
  );

  const handleFuncKey = useCallback((page: MCDUPage | null) => {
    if (page) setCurrentPage(page);
  }, []);

  const handleLSK = useCallback(
    (side: "L" | "R", index: number) => {
      if (!scratchpad) return;

      const page = currentPage;
      if (page === "fplan") return; // no editing on fplan

      setPageState((prev) => {
        const updated = { ...prev };
        const pageData = { ...updated[page] };
        const lines = [...pageData.lines];
        const dataLineIndex = index * 2 + 1;

        if (dataLineIndex < lines.length) {
          const line = [...lines[dataLineIndex]];
          if (side === "L") {
            line[0] = "  " + scratchpad;
          } else {
            line[1] = "  " + scratchpad;
          }
          lines[dataLineIndex] = line;
          pageData.lines = lines;
          updated[page] = pageData;
        }
        return updated;
      });

      setMessages([`* ${side}${index + 1} FIELD MODIFIED`]);
      setScratchpad("");
    },
    [scratchpad, currentPage]
  );

  const page = pageState[currentPage];
  const isFplan = currentPage === "fplan";

  const renderScreen = () => {
    if (isFplan) {
      return (
        <div className="flex flex-col h-full">
          <div className="text-[#57FF57] text-[11px]">{page.title}</div>
          <div className="text-[#FFFFFF] text-[9px] mt-1 flex">
            <span className="w-[72px]">WPT</span>
            <span className="w-[32px] text-right">BRG</span>
            <span className="w-[40px] text-right">DIST</span>
            <span className="w-[48px] text-right">ALT</span>
            <span className="w-[36px] text-right">SPD</span>
            <span className="w-[40px] text-right">TIME</span>
          </div>
          <div className="border-t border-[#57FF57]/20 mt-1 pt-1 flex-1">
            {FPLAN_DATA.map((leg, i) => (
              <div
                key={leg.waypoint}
                className="flex text-[11px] leading-[18px]"
                style={{ color: i === 0 ? "#FFFFFF" : "#57FF57" }}
              >
                <span className="w-[72px] truncate">{leg.waypoint}</span>
                <span className="w-[32px] text-right tabular-nums">{leg.bearing}</span>
                <span className="w-[40px] text-right tabular-nums">{leg.dist}</span>
                <span className="w-[48px] text-right tabular-nums">{leg.alt}</span>
                <span className="w-[36px] text-right tabular-nums">{leg.spd}</span>
                <span className="w-[40px] text-right tabular-nums">{leg.time}</span>
              </div>
            ))}
          </div>
          <div className="mt-auto flex justify-between text-[10px] text-[#57FF57]">
            <span>{"<RETURN"}</span>
            <span>{"NEXT>"}</span>
          </div>
        </div>
      );
    }

    // Standard page with 6 line pairs
    const lines = page.lines;
    return (
      <div className="flex flex-col h-full">
        <div className="text-[#57FF57] text-[11px] mb-1">{page.title}</div>
        <div className="flex-1 flex flex-col justify-between">
          {[0, 1, 2, 3, 4, 5].map((i) => {
            const labelLine = lines[i * 2] || ["", ""];
            const dataLine = lines[i * 2 + 1] || ["", ""];
            return (
              <div key={i}>
                <div className="flex justify-between text-[9px] text-[#FFFFFF]/60 leading-tight">
                  <span>{labelLine[0]}</span>
                  <span>{labelLine[1]}</span>
                </div>
                <div className="flex justify-between text-[11px] text-[#57FF57] leading-tight">
                  <span>{dataLine[0]}</span>
                  <span>{dataLine[1]}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex justify-between items-start px-1 mb-3">
        <span
          className="text-[10px] uppercase text-[#8A8A84]"
          style={{ fontFamily: "var(--font-stencil)", letterSpacing: "0.2em" }}
        >
          MCDU — MULTIPURPOSE CTRL/DISPLAY
        </span>
        <span className="text-[10px] text-[#BEBEB8]" style={{ fontFamily: "var(--font-stencil)", letterSpacing: "0.1em" }}>FIG.02</span>
      </div>

      {/* MCDU unit */}
      <div className="flex-1 border border-[#BEBEB8] bg-[#E2E2DF] flex flex-col">
        {/* Screen + LSKs */}
        <div className="flex p-2 gap-0">
          {/* Left LSKs */}
          <div className="flex flex-col justify-between py-1 pr-1">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <button
                key={`L${i}`}
                onClick={() => handleLSK("L", i)}
                className="w-5 h-4 border border-[#4A4A46] text-[7px] text-[#4A4A46] flex items-center justify-center hover:bg-[#D8D8D4] transition-colors duration-150"
              >
                {"<"}
              </button>
            ))}
          </div>

          {/* Screen */}
          <div
            className="flex-1 bg-[#0A1A0A] p-2 min-h-[200px] flex flex-col"
            style={{ fontFamily: "'IBM Plex Mono', monospace" }}
          >
            {renderScreen()}
            {/* Scratchpad */}
            <div className="mt-auto pt-2 border-t border-[#57FF57]/20">
              {messages.length > 0 && (
                <div className="text-[10px] text-[#FFB347] mb-0.5">{messages[0]}</div>
              )}
              <div className="text-[11px] text-[#57FF57] min-h-[16px] flex items-center">
                <span className="animate-pulse mr-0.5 text-[#57FF57]">▮</span>
                {scratchpad || ""}
              </div>
            </div>
          </div>

          {/* Right LSKs */}
          <div className="flex flex-col justify-between py-1 pl-1">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <button
                key={`R${i}`}
                onClick={() => handleLSK("R", i)}
                className="w-5 h-4 border border-[#4A4A46] text-[7px] text-[#4A4A46] flex items-center justify-center hover:bg-[#D8D8D4] transition-colors duration-150"
              >
                {">"}
              </button>
            ))}
          </div>
        </div>

        {/* Function keys row 1 */}
        <div className="px-2 pt-1">
          <div className="border-t border-[#BEBEB8]" />
          <div className="text-[7px] text-[#8A8A84] uppercase tracking-wider mt-1 mb-0.5 px-1">
            Page Select
          </div>
          <div className="grid grid-cols-6 gap-1 px-1">
            {FUNC_KEYS_ROW1.map((fk) => (
              <button
                key={fk.label}
                onClick={() => handleFuncKey(fk.page)}
                className={`h-6 border text-[8px] flex items-center justify-center transition-colors duration-150 ${
                  currentPage === fk.page
                    ? "border-[#222222] text-[#222222] bg-[#D8D8D4]"
                    : "border-[#BEBEB8] text-[#4A4A46] hover:bg-[#D8D8D4]"
                }`}
              >
                {fk.label}
              </button>
            ))}
          </div>
        </div>

        {/* Function keys row 2 */}
        <div className="px-2 pt-1">
          <div className="grid grid-cols-6 gap-1 px-1">
            {FUNC_KEYS_ROW2.map((fk) => (
              <button
                key={fk.label}
                onClick={() => handleFuncKey(fk.page)}
                className={`h-6 border text-[8px] flex items-center justify-center transition-colors duration-150 ${
                  fk.page && currentPage === fk.page
                    ? "border-[#222222] text-[#222222] bg-[#D8D8D4]"
                    : "border-[#BEBEB8] text-[#4A4A46] hover:bg-[#D8D8D4]"
                }`}
              >
                {fk.label}
              </button>
            ))}
          </div>
        </div>

        {/* Navigation arrows */}
        <div className="px-3 pt-2 flex justify-center gap-4">
          <button className="w-8 h-5 border border-[#BEBEB8] text-[8px] text-[#4A4A46] flex items-center justify-center hover:bg-[#D8D8D4] transition-colors duration-150">
            ←
          </button>
          <button className="w-8 h-5 border border-[#BEBEB8] text-[8px] text-[#4A4A46] flex items-center justify-center hover:bg-[#D8D8D4] transition-colors duration-150">
            ↑
          </button>
          <button className="w-8 h-5 border border-[#BEBEB8] text-[8px] text-[#4A4A46] flex items-center justify-center hover:bg-[#D8D8D4] transition-colors duration-150">
            ↓
          </button>
          <button className="w-8 h-5 border border-[#BEBEB8] text-[8px] text-[#4A4A46] flex items-center justify-center hover:bg-[#D8D8D4] transition-colors duration-150">
            →
          </button>
        </div>

        {/* Alpha keyboard */}
        <div className="px-2 pt-2">
          <div className="border-t border-[#BEBEB8]" />
          <div className="text-[7px] text-[#8A8A84] uppercase tracking-wider mt-1 mb-0.5 px-1">
            Alpha
          </div>
          <div className="space-y-0.5 px-1">
            {ALPHA_KEYS.map((row, ri) => (
              <div key={ri} className="flex gap-0.5">
                {row.map((k) => (
                  <button
                    key={k}
                    onClick={() => handleKey(k)}
                    className="flex-1 h-5 border border-[#BEBEB8] text-[8px] text-[#4A4A46] flex items-center justify-center hover:bg-[#D8D8D4] active:bg-[#BEBEB8] transition-colors duration-100"
                  >
                    {k}
                  </button>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Numeric keyboard */}
        <div className="px-2 pt-1 pb-2">
          <div className="text-[7px] text-[#8A8A84] uppercase tracking-wider mb-0.5 px-1">
            Numeric
          </div>
          <div className="space-y-0.5 px-1">
            {NUM_KEYS.map((row, ri) => (
              <div key={ri} className="flex gap-0.5">
                {row.map((k) => (
                  <button
                    key={k}
                    onClick={() => handleKey(k)}
                    className="flex-1 h-5 border border-[#BEBEB8] text-[8px] text-[#4A4A46] flex items-center justify-center hover:bg-[#D8D8D4] active:bg-[#BEBEB8] transition-colors duration-100"
                  >
                    {k}
                  </button>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Reference */}
      <div className="mt-2 text-[9px] text-[#BEBEB8]">
        REF: FCOM 1.34.10 — MCDU STANDARD LAYOUT
      </div>
    </div>
  );
}