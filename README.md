# VitalOrbit — Crew Health Command Center

**Autonomous Physiological & Behavioral Health Monitoring for Deep-Space Missions**  
*Built for the NASA Space Apps Challenge 2026 — Health Monitoring Software*

> **Data & Compliance Notice:** All crew telemetry, biometric time-series, and mission events pre-loaded in this repository are **labelled synthetic datasets** generated for a simulated 4-person, 500-day Mars transit (`ARES-V`). VitalOrbit includes a pluggable `TelemetryDataAdapter` interface (`src/data/syntheticMissionData.ts`) designed to ingest real flight-analog datasets from the NASA Open Science Data Repository (OSDR) or wearable health APIs. *NASA does not endorse any non-U.S. Government entity and is not responsible for information contained on non-U.S. Government websites.*

---

## Overview

During long-duration deep-space missions, one-way communication delays of up to 20 minutes prevent real-time tele-medicine from Earth. **VitalOrbit** is an offline-first, autonomous crew health command centre engineered for rapid triage under high-stress conditions—enabling a Flight Surgeon, Commander, or individual astronaut to assess fleet-wide readiness within **3 seconds** and inspect organ-level diagnostics within **2 clicks**.

---

## Space Agency Data & Resource Alignment

VitalOrbit translates the official **NASA Human Research Program (HRP)** and **Canadian Space Agency (CSA)** challenge resources directly into clinical telemetry rules, visual overlays, and autonomous countermeasures:

* **NASA HRP — 5 Hazards of Human Spaceflight:**
  * **Space Radiation:** Tracks daily absorbed dose ($\text{mSv/day}$) against the $600\text{ mSv}$ NASA career limit, visualises exposure on the **Radiation** body heat-map overlay, and triggers Storm Haven shielding alerts during Solar Particle Events (demonstrated on **Sol 199**).
  * **Distance from Earth:** Simulates a $12\text{m }40\text{s}$ one-way Earth communication delay with **Autonomous Care Mode**, local IndexedDB storage, and queued asynchronous Flight Surgeon messaging.
  * **Isolation and Confinement:** Combines a 30-second daily behavioural check-in (mood, stress, fatigue, motivation), on-device acoustic voice-stress estimation, crew interaction cohesion bars, and a private guided breathing and CBT support module.
  * **Gravity Fields:** Monitors microgravity bone density index, lean muscle mass, ARED resistive/aerobic exercise compliance, vestibular orientation scores, and cephalad fluid-shift / Spaceflight Associated Neuro-ocular Syndrome (**SANS**) risk.
  * **Hostile/Closed Environments:** Tracks cabin $\text{CO}_2$ partial pressure ($\text{ppm}$ scrubber efficiency alerts) alongside circadian alignment and $480\text{ nm}$ light-therapy scheduling.
* **NASA HRP — Risks of Human Spaceflight & Ongoing HRP Research in Space:**
  * Replaces static terrestrial thresholds with **21-day rolling personal baseline $z$-scores** to account for microgravity physiological adaptation (such as resting bradycardia).
  * Incorporates an interactive **Psychomotor Vigilance Task (PVT)** reaction-time micro-test modelled on ISS behavioural health and fatigue countermeasures.
* **CSA — Monitoring Radiation for Astronaut Health:**
  * Guides VitalOrbit's dual-tier dosimetry tracking (acute daily proton flux spikes vs. cumulative mission radiation dose) and automated EVA deferral rules.
* **CSA — Why Do We Conduct Science Experiments in Space?:**
  * Connects orbital biomedical engineering to Earth healthcare: VitalOrbit's offline-first $z$-score early-warning engine and low-burden triage are directly transferable to remote rural clinics, disaster response, and isolated terrestrial expeditions.

---

## Core Capabilities

* **3-Second Triage & Interactive Physiological Twin:** Left-rail crew roster with radial Health Score rings (`0–100`) paired with an interactive SVG human body heat-map covering **Cardiovascular**, **Musculoskeletal**, **Neuro-Vestibular**, **Sleep/Circadian**, and **Radiation** systems.
* **Explainable AI Alerts & Short-Term Forecasting:** Every alert surfaces contributing biometric signals, statistical deviation (`+σ`), confidence score, 48-hour risk forecast, and actionable Flight Surgeon protocols.
* **What-If Mission Simulator & On-Board Assistant:** Interactive sliders simulate the predicted Health Score impact of sleep adjustments, ARED resistance workouts, EVA duration, and cabin $\text{CO}_2$ levels, paired with an offline natural-language telemetry query assistant.
* **Role-Based Privacy & Audit Trail:** Switches seamlessly between **Flight Surgeon**, **Astronaut (Personal)**, and **Mission Control** views, enforcing granular crew consent toggles, maintaining a live access audit log, and exporting printable **PDF Medical Summary** reports.
* **Adaptive Display Themes:** Supports **Light Clinical Mode**, **Mission Control Dark Mode**, and a **Red-Shift Night Mode** to preserve crew dark adaptation in darkened habitat quarters.

---

## Tech Stack

* **Frontend Framework:** React + TypeScript + Vite
* **Styling:** Tailwind CSS v4 (CSS custom-property theme tokens, WCAG AA dual-coded status badges, `prefers-reduced-motion` support)
* **Data Visualisation:** Recharts (responsive area/bar charts & sparklines) + Custom Interactive SVG Anatomy Model
* **State & Offline Persistence:** Zustand + Browser IndexedDB
* **Testing:** Vitest (unit tests for rolling $z$-score calculations and predictive scoring)

---

## Local Setup & Running Instructions

### Prerequisites
* Node.js (v18 or higher) and npm

### 1. Install Dependencies
```bash
npm install
```

### 2. Run Unit Tests
Verify the rolling $z$-score anomaly detection and What-If predictive scoring logic:
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

1. **0:00 – 0:35 | 3-Second Fleet Triage & Deep-Space Context**
   * Point out the top bar showing **Sol 214 / 500**, the **12m 40s one-way Earth link delay**, and **Autonomous Care** mode.
   * Highlight the left-rail **Crew Roster**: three crew members show high readiness scores, while **Spec. Marcus Vance** is flagged **CRITICAL** with both colour and icon/text dual-coding.
2. **0:35 – 1:30 | Guided Incident Walkthrough (`Trigger Demo Incident`)**
   * Click **Trigger Demo Incident** in the top-right header to step through the 4-part clinical story:
     * **Step 1:** Detects Vance's resting heart rate spike (`+19 bpm`, `+3.1σ`) and core temperature rise (`38.0°C`).
     * **Step 2:** Opens the **Cardiovascular System Detail** drawer on the body heat-map and expands **"Why this alert?"** in the right panel to show contributing signals and a 94% confidence score.
     * **Step 3:** Opens the **What-If Mission Health Simulator**, demonstrating how proceeding with an 8-hour EVA drops his predicted Health Score further, whereas deferring EVA restores recovery.
     * **Step 4:** Switches to **Support & Privacy**, showing the queued, delayed-link message to Flight Surgeons and the on-board guided breathing pacer.
3. **1:30 – 2:20 | Historical Replay & Behavioural Vigilance**
   * Click **Sol 199: Solar Particle Event** on the bottom **Mission Timeline Scrubber** to replay how VitalOrbit tracks acute radiation spikes across the entire crew.
   * Switch to the **Behavioral & Team** tab and run the live 5-second **PVT Vigilance Micro-Test** to demonstrate rapid cognitive fatigue screening.
4. **2:20 – 3:00 | Crew Privacy & Offline Autonomy**
   * Switch the top-bar role selector from **Flight Surgeon** to **Mission Control**, then toggle off `Behavioral Check In` under **Support & Privacy** to show how private mental-health signals are masked from ground controllers while logging access in the audit trail.
   * Click **Export PDF** in the alerts panel to generate an offline medical summary report.