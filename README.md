# A320 Flight Control Interface

An interactive aviation cockpit UI and FDR telemetry replay system built with React, Vite, Tailwind CSS v4, and Motion. The app reconstructs a six-event flight sequence through live instruments, a functional Airbus MCDU, a sidestick input, and a replay timeline framed as an austere institutional document.

## What It Does

The app has three tabs:

1. `01 -- Replay` shows the telemetry sequence with a timeline scrubber, interpolated aircraft state, PFD, ND, ECAM, and a full data log.
2. `02 -- Controls` shows the A320-style sidestick, a flight data panel, and an interactive MCDU.
3. `03 -- Instruments` shows a live sidestick strip, a yoke-driven PFD, a navigation display, ECAM, and a system status panel.

The interface is intentionally monochrome outside the instrument frames. The flight data is embedded in the client bundle, so there is no backend, API, or routing layer.

## Getting Started

```bash
npm install
npm run dev
```

Then open the local Vite URL printed in the terminal, usually `http://127.0.0.1:5173/`.

Production build:

```bash
npm run build
```

## Verified Behavior

The app builds successfully with `npm run build`. The local UI also renders in the browser on desktop and mobile viewports.

## Architecture

State is centered in [`src/app/App.tsx`](/Users/taoconrad/Dev/GitHub%204/SDM%20Computer%20App/src/app/App.tsx):

- `activeTab` selects the current surface.
- `replayIndex` and `isPlaying` drive replay playback.
- `yokeState` feeds the controls and instruments views.
- `useInterpolatedTelemetry()` produces smooth in-between telemetry frames for replay.

The main flow is:

```text
App.tsx
  -> useInterpolatedTelemetry(replayIndex)
  -> Timeline
  -> PFD / ND / ECAM
  -> DataLog
  -> Yoke / FlightPanel / MCDU
```

## Replay

The replay tab reconstructs six telemetry events from [`src/app/components/telemetry-data.ts`](/Users/taoconrad/Dev/GitHub%204/SDM%20Computer%20App/src/app/components/telemetry-data.ts).

It includes:

- A scrubber with event markers, severity coloring, and play/pause controls.
- Interpolated timestamp, altitude, vertical speed, pitch, and bank.
- A PFD with attitude, speed tape, altitude tape, heading, FMA, SPD FLAG, stall, and GPWS states.
- An ND with heading-up compass rose, waypoints, wind, GS/TAS, and route progress.
- An ECAM with N1, EGT, fuel flow gauges, and warning-message cascade logic.
- A data log with altitude profile and a row-per-event telemetry table.

## Controls

The controls tab provides the interactive cockpit surfaces:

- A drag-to-deflect sidestick with spring return.
- A flight panel with UTC clock, flight metadata, and control-surface readout.
- A working MCDU with 8 pages, line-select keys, scratchpad entry, and page navigation.

## Instruments

The instruments tab mirrors the replay instruments, but it is driven by live yoke input instead of telemetry:

- The PFD uses the sidestick state as its source of motion.
- The ND shows stable cruise defaults.
- The ECAM shows a static cruise state.
- The system display shows fixed aircraft system statuses.

## Telemetry Model

The replay data uses a six-event sequence with these core fields:

- Flight law, autopilot status, and autothrust status.
- Airspeed, altitude, vertical speed, pitch, bank, and AoA.
- Heading, wind, groundspeed, true airspeed, and route distance.
- Engine N1, EGT, and fuel flow.
- Audio warnings and ECAM warnings.

Derived logic includes:

- ADR disagreement detection.
- Calculated airspeed synthesis from the available air data references.
- SPD FLAG activation.
- Stall warning gating.
- Severity classification for the timeline and tables.

## Styling

The design system is defined in [`src/styles/theme.css`](/Users/taoconrad/Dev/GitHub%204/SDM%20Computer%20App/src/styles/theme.css) and [`src/styles/fonts.css`](/Users/taoconrad/Dev/GitHub%204/SDM%20Computer%20App/src/styles/fonts.css).

Key conventions:

- Monochrome paper-and-ink framing for the main UI.
- CRT green, amber, and red only inside instrument panels.
- IBM Plex Mono as the primary typeface.
- Uppercase metadata and thin borders for hierarchy.

## Project Structure

```text
src/
  app/
    App.tsx
    components/
      telemetry-data.ts
      ecam-messages.ts
      useInterpolatedTelemetry.ts
      Timeline.tsx
      PFD.tsx
      ND.tsx
      ECAM.tsx
      DataLog.tsx
      Yoke.tsx
      FlightPanel.tsx
      MCDU.tsx
  imports/
    style-guide.md
    flight-telemetry-logs.txt
  styles/
    fonts.css
    index.css
    tailwind.css
    theme.css
```

## Stack

- React 18.3.1
- Vite 6.3.5
- Tailwind CSS 4.1.12
- Motion 12.23.24
- IBM Plex Mono from Google Fonts

## Attribution

See [`ATTRIBUTIONS.md`](/Users/taoconrad/Dev/GitHub%204/SDM%20Computer%20App/ATTRIBUTIONS.md) for third-party component and asset references.
