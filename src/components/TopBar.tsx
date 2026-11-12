import React, { useEffect, useState } from 'react';
import {
  Activity,
  AlertOctagon,
  Clock,
  Eye,
  Moon,
  Radio,
  Sparkles,
  Sun,
  WifiOff,
} from 'lucide-react';
import { useVitalOrbitStore } from '../store/useVitalOrbitStore';
import { ThemeMode, UserRole } from '../types/telemetry';

const DEMO_STEPS = [
  null,
  {
    step: 1,
    badge: 'STEP 1/4: ANOMALY DETECTED',
    text: 'MS-04 (Vance) Resting HR spiked +19 bpm (+3.1σ) & Core Temp reached 38.0°C on Sol 214.',
  },
  {
    step: 2,
    badge: 'STEP 2/4: ORGAN & Z-SCORE EXPLANATION',
    text: 'Cardiovascular drawer opened: HRV dropped -26 ms alongside elevated respiratory rate (94% confidence).',
  },
  {
    step: 3,
    badge: 'STEP 3/4: PREDICTIVE WHAT-IF IMPACT',
    text: 'Simulating EVA-15 exertion drops Health Score into Critical. Deferring EVA restores recovery trajectory.',
  },
  {
    step: 4,
    badge: 'STEP 4/4: AUTONOMOUS PROTOCOL & DELAYED LINK',
    text: 'Earth is 12m 40s away. Autonomous Care Mode queued Flight Surgeon advisory & launched recovery protocol.',
  },
];

export const TopBar: React.FC = () => {
  const {
    selectedDay,
    theme,
    setTheme,
    role,
    setRole,
    earthDelaySeconds,
    autonomousCareMode,
    demoIncidentStep,
    advanceDemoIncident,
    resetDemoIncident,
    tickTimers,
  } = useVitalOrbitStore();

  const [utcTime, setUtcTime] = useState(() => new Date().toISOString().slice(11, 19));

  useEffect(() => {
    const id = setInterval(() => {
      setUtcTime(new Date().toISOString().slice(11, 19));
      tickTimers();
    }, 1000);
    return () => clearInterval(id);
  }, [tickTimers]);

  const delayMins = Math.floor(earthDelaySeconds / 60);
  const delaySecs = String(earthDelaySeconds % 60).padStart(2, '0');
  const activeDemo = DEMO_STEPS[demoIncidentStep];

  return (
    <header className="app-card sticky top-0 z-30 px-4 py-3 border-x-0 border-t-0 rounded-none">
      <div className="max-w-[1600px] mx-auto flex flex-wrap items-center justify-between gap-3">
        {/* App Icon + Mission Status */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center text-white shadow-sm">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold tracking-tight text-base">VitalOrbit</span>
              <span className="text-[10px] font-mono-telemetry font-semibold uppercase px-2 py-0.5 rounded-full accent-pill">
                SYNTHETIC DEMO
              </span>
            </div>
            <p className="text-xs opacity-70">ARES-V Crew Health Command App</p>
          </div>

          <div className="hidden sm:flex items-center gap-2 ml-2 px-3.5 py-1.5 rounded-xl elevated-card font-mono-telemetry text-xs">
            <span className="font-bold text-sky-600">Sol {selectedDay}</span>
            <span className="opacity-50">/ 500</span>
            <span className="opacity-30">|</span>
            <Clock className="w-3.5 h-3.5 opacity-65" />
            <span>{utcTime} UTC</span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <div
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl elevated-card text-xs font-mono-telemetry"
            title="One-way light-time communication delay to Earth"
          >
            <Radio className="w-3.5 h-3.5 text-amber-500" />
            <span>Earth link: {delayMins}m {delaySecs}s</span>
          </div>

          {autonomousCareMode && (
            <div className="hidden xl:flex items-center gap-1.5 px-3 py-1.5 rounded-xl badge-watch text-xs font-semibold">
              <WifiOff className="w-3.5 h-3.5" />
              <span>Autonomous Care</span>
            </div>
          )}

          <label className="sr-only" htmlFor="role-select">View Role</label>
          <select
            id="role-select"
            value={role}
            onChange={(e) => setRole(e.target.value as UserRole)}
            className="px-3 py-1.5 rounded-xl elevated-card text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-sky-500 cursor-pointer"
          >
            <option value="surgeon">Flight Surgeon</option>
            <option value="astronaut">Astronaut View</option>
            <option value="mcc">Mission Control</option>
          </select>

          {/* Theme Switcher (Light First) */}
          <div className="flex items-center rounded-xl elevated-card p-1 gap-0.5" role="group" aria-label="Display theme">
            {(
              [
                { id: 'daylight', icon: Sun, label: 'Light' },
                { id: 'dark', icon: Moon, label: 'Dark' },
                { id: 'redshift', icon: Eye, label: 'Night' },
              ] as { id: ThemeMode; icon: typeof Sun; label: string }[]
            ).map(({ id, icon: Icon, label }) => (
              <button
                key={id}
                onClick={() => setTheme(id)}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  theme === id ? 'accent-pill shadow-xs' : 'opacity-65 hover:opacity-100'
                }`}
                aria-pressed={theme === id}
              >
                <Icon className="w-3.5 h-3.5" />
                <span className="hidden md:inline">{label}</span>
              </button>
            ))}
          </div>

          <button
            onClick={advanceDemoIncident}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white text-xs font-semibold shadow-sm transition-all cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            {demoIncidentStep === 0 ? 'Trigger Demo Incident' : `Story Step (${demoIncidentStep}/4)`}
          </button>
        </div>
      </div>

      {activeDemo && (
        <div className="max-w-[1600px] mx-auto mt-2.5 px-3.5 py-2 rounded-xl badge-critical flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <AlertOctagon className="w-4 h-4 shrink-0" />
            <span className="font-mono-telemetry font-bold">{activeDemo.badge}:</span>
            <span>{activeDemo.text}</span>
          </div>
          <button onClick={resetDemoIncident} className="underline font-semibold cursor-pointer">
            Exit Walkthrough
          </button>
        </div>
      )}
    </header>
  );
};