# VitalOrbit — Crew Health Command Center

**Autonomous Physiological & Behavioral Health Monitoring for Deep-Space Missions**  
*Built for the NASA Space Apps Challenge 2026 — Health Monitoring Software*

> **Data Notice:** All crew telemetry, biometric time-series, and mission events pre-loaded in this repository are **labeled synthetic datasets** generated for a simulated 4-person, 500-day Mars transit (`ARES-V`). VitalOrbit includes a pluggable `TelemetryDataAdapter` interface (`src/data/syntheticMissionData.ts`) designed to ingest real flight-analog datasets from the NASA Open Science Data Repository (OSDR) or wearable health APIs.

---

## Overview

During long-duration deep-space missions, communication delays of up to 20 minutes each way prevent real-time tele-medicine from Earth. **VitalOrbit** is an offline-first, autonomous crew health command center engineered for rapid triage under high-stress conditions—enabling a Flight Surgeon, Commander, or individual astronaut to assess fleet-wide readiness within **3 seconds** and inspect organ-level diagnostics within **2 clicks**.

### Core Capabilities

* **3-Second Triage & Interactive Physiological Twin:** Left-rail crew roster with radial Health Score rings (`0–100`) paired with an interactive SVG human body heat-map covering **Cardiovascular**, **Musculoskeletal**, **Neuro-Vestibular**, **Sleep/Circadian**, and **Radiation** systems.
* **Personal Baseline Z-Score Engine:** Evaluates telemetry against rolling 21-day personal baselines rather than rigid ground thresholds, accounting for microgravity physiological adaptation (such as resting bradycardia and cephalad fluid shifts).
* **Explainable AI Alerts & Short-Term Forecasting:** Every alert surfaces contributing biometric signals, statistical deviation (`+σ`), confidence score, 48-hour risk forecast, and actionable Flight Surgeon protocols.
* **Comprehensive Spaceflight Telemetry:** Live sparkline tiles for Heart Rate, HRV (RMSSD), Blood Pressure, $\text{SpO}_2$, Respiration Rate, Core/Skin Temperature, Hydration, and Caloric Intake, alongside cumulative radiation dose vs. NASA career limits, cabin $\text{CO}_2$ partial pressure, SANS ocular risk, and vestibular scores.
* **Behavioral Health & Cognitive Vigilance:** Includes a 30-second mood/stress/fatigue/motivation check-in, an interactive **Psychomotor Vigilance Task (PVT)** reaction-time micro-test, team interaction cohesion tracking, and a guided 4-4-4-4 vagal-tone breathing pacer.
* **What-If Mission Simulator & On-Board Assistant:** Interactive sliders simulate the predicted Health Score impact of sleep adjustments, ARED resistance workouts, EVA duration, and cabin $\text{CO}_2$ levels, paired with an offline natural-language telemetry query assistant.
* **Deep-Space Realism, Privacy & Role-Based Access:**
  * Simulates one-way Earth light-time delay (`12m 40s`) with message queuing and **Autonomous Care Mode**.
  * Persists state locally in **IndexedDB** for zero-network operation and supports one-click **PDF Medical Summary** export.
  * Switches seamlessly between **Flight Surgeon**, **Astronaut (Personal)**, and **Mission Control** views, enforcing granular crew consent toggles and maintaining a live access audit log.
* **Adaptive Display Themes:** Supports **Light Clinical Mode**, **Mission Control Dark Mode**, and a **Red-Shift Night Mode** to preserve crew dark adaptation in darkened habitat quarters.

---

## Tech Stack

* **Frontend Framework:** React + TypeScript + Vite
* **Styling:** Tailwind CSS v4 (CSS custom-property theme tokens, WCAG AA dual-coded status badges, `prefers-reduced-motion` support)
* **Data Visualization:** Recharts (responsive area/bar charts & sparklines) + Custom Interactive SVG Anatomy Model
* **State & Offline Persistence:** Zustand + Browser IndexedDB
* **Testing:** Vitest (unit tests for rolling z-score calculations and predictive scoring)

---

## Project Architecture

```text
vital-orbit/
├── index.html                        # Inter & JetBrains Mono typography setup
├── postcss.config.js                 # Tailwind CSS v4 PostCSS configuration
├── src/
│   ├── types/
│   │   └── telemetry.ts              # Strict TypeScript interfaces for vitals, alerts, roles & consent
│   ├── data/
│   │   └── syntheticMissionData.ts   # 500-Sol 4-crew synthetic generator + external DataAdapter interface
│   ├── utils/
│   │   ├── anomalyEngine.ts          # 21-day rolling z-score engine, Health Score & alert generator
│   │   ├── anomalyEngine.test.ts     # Vitest unit test suite
│   │   └── offlineDb.ts              # IndexedDB vault helper & printable PDF summary generator
│   ├── store/
│   │   └── useVitalOrbitStore.ts     # Global Zustand state (crew, timeline day, theme, role, demo walkthrough)
│   ├── components/
│   │   ├── TopBar.tsx                # Mission clock, light-delay status, role/theme switchers & Demo Incident trigger
│   │   ├── CrewRoster.tsx            # Left-rail crew roster with radial Health Score rings
│   │   ├── BodyHeatmap.tsx           # Interactive SVG organ heat-map & baseline diagnostic drawer
│   │   ├── CenterWorkspace.tsx       # Multi-tab workspace (Vitals, Sleep/Fitness, Behavioral/PVT, Simulator, Support)
│   │   ├── RightAlertsPanel.tsx      # Explainable AI alerts feed with "Why this alert?" breakdown & PDF export
│   │   └── TimelineScrubber.tsx      # 500-Sol mission replay scrubber with clickable event markers
│   ├── App.tsx                       # Responsive 3-column command center layout
│   └── index.css                     # Light, Dark & Red-Shift theme variables
└── package.json
```

---

## Local Setup & Running Instructions

### Prerequisites
* Node.js (v18 or higher) and npm

### 1. Install Dependencies
```bash
npm install
```

### 2. Run Unit Tests
Verify the rolling z-score anomaly detection and What-If predictive scoring logic:
```bash
npx vitest run
```

### 3. Start Development Server
```bash
npm run dev
```
Open `http://localhost:5173` in your browser.

### 4. Build for Production
```bash
npm run build
npm run preview
```

---

## 3-Minute Demo Walkthrough Script

Use this flow when presenting **VitalOrbit** to judges:

1. **0:00 – 0:35 | 3-Second Fleet Triage & Deep-Space Context**
   * Point out the top bar showing **Sol 214 / 500**, the **12m 40s one-way Earth link delay**, and **Autonomous Care** mode.
   * Highlight the left-rail **Crew Roster**: three crew members show high readiness scores, while **Spec. Marcus Vance** is flagged **CRITICAL** with both color and icon/text dual-coding.
2. **0:35 – 1:30 | Guided Incident Walkthrough (`Trigger Demo Incident`)**
   * Click **Trigger Demo Incident** in the top-right header to step through the 4-part clinical story:
     * **Step 1:** Detects Vance's resting heart rate spike (`+19 bpm`, `+3.1σ`) and core temperature rise (`38.0°C`).
     * **Step 2:** Opens the **Cardiovascular System Detail** drawer on the body heat-map and expands **"Why this alert?"** in the right panel to show contributing signals and a 94% confidence score.
     * **Step 3:** Opens the **What-If Mission Health Simulator**, demonstrating how proceeding with an 8-hour EVA drops his predicted Health Score further, whereas deferring EVA restores recovery.
     * **Step 4:** Switches to **Support & Privacy**, showing the queued, delayed-link message to Houston Flight Surgeons and the on-board guided breathing pacer.
3. **1:30 – 2:20 | Historical Replay & Behavioral Vigilance**
   * Click **Sol 199: Solar Particle Event** on the bottom **Mission Timeline Scrubber** to replay how VitalOrbit tracks acute radiation spikes across the entire crew.
   * Switch to the **Behavioral & Team** tab and run the live 5-second **PVT Vigilance Micro-Test** to demonstrate rapid cognitive fatigue screening.
4. **2:20 – 3:00 | Crew Privacy & Offline Autonomy**
   * Switch the top-bar role selector from **Flight Surgeon** to **Mission Control**, then toggle off `Behavioral Check In` under **Support & Privacy** to show how private mental-health signals are masked from ground controllers while logging access in the audit trail.
   * Click **Export PDF** in the alerts panel to generate an offline medical summary report.

---

## Post-Hackathon Roadmap

1. **Contactless WebRTC rPPG Vitals:** Extract pulse rate and HRV directly from habitat tablet cameras using green-channel photoplethysmography.
2. **Live NASA OSDR & Wearable Connectors:** Connect `TelemetryDataAdapter` to Garmin/Oura/Apple HealthKit streams and NASA Open Science Data Repository flight-analog archives.
3. **3D Anatomical Twin:** Upgrade the SVG body overlay to an interactive WebGL skeletal/vascular model with localized radiation dosimetry mapping.
4. **Closed-Loop ECLSS Integration:** Link cabin circadian lighting spectrum and $\text{CO}_2$ scrubber duty cycles directly to sleep-debt and hypercapnia alerts.
5. **Federated On-Board ML:** Train personalized illness and fatigue classifiers locally in IndexedDB/WebGPU and sync encrypted model weights during DSN downlink windows.