import React from 'react';
import {
  Activity,
  AlertTriangle,
  Bone,
  Brain,
  CheckCircle2,
  Moon,
  Radiation,
  ShieldAlert,
  X,
} from 'lucide-react';
import { useVitalOrbitStore } from '../store/useVitalOrbitStore';
import { computeRollingZScore } from '../utils/anomalyEngine';
import { OrganOverlay, Severity } from '../types/telemetry';

const OVERLAYS: { id: OrganOverlay; label: string; Icon: typeof Activity }[] = [
  { id: 'cardiovascular', label: 'Cardio', Icon: Activity },
  { id: 'musculoskeletal', label: 'Musculoskeletal', Icon: Bone },
  { id: 'neuro', label: 'Neuro-Vestibular', Icon: Brain },
  { id: 'sleep', label: 'Sleep / Circadian', Icon: Moon },
  { id: 'radiation', label: 'Radiation', Icon: Radiation },
];

export const BodyHeatmap: React.FC = () => {
  const {
    crew,
    selectedCrewId,
    selectedDay,
    activeOverlay,
    setActiveOverlay,
    selectedOrganDrawer,
    setSelectedOrganDrawer,
  } = useVitalOrbitStore();

  const member = crew.find((c) => c.id === selectedCrewId) || crew[0];
  const cur = member.telemetry[selectedDay - 1];

  const hrZ = computeRollingZScore(member.telemetry, selectedDay, (d) => d.heartRate);
  const sleepZ = computeRollingZScore(member.telemetry, selectedDay, (d) => d.sleepHours);
  const voiceZ = computeRollingZScore(member.telemetry, selectedDay, (d) => d.voiceStressIndex);

  const systemStatus: Record<OrganOverlay, { severity: Severity; metric: string; detail: string; action: string }> = {
    cardiovascular: {
      severity: hrZ.zScore > 2.2 || cur.coreTemp > 37.5 ? 'critical' : hrZ.zScore > 1.4 ? 'watch' : 'nominal',
      metric: `${cur.heartRate} bpm • HRV ${cur.hrv} ms`,
      detail: `BP ${cur.systolic}/${cur.diastolic} mmHg | SpO2 ${cur.spo2}% | Core Temp ${cur.coreTemp}°C (HR z-score: ${hrZ.zScore}σ vs 21-day mean ${hrZ.mean} bpm).`,
      action: hrZ.zScore > 2 ? 'Initiate 4h vitals polling, 500 mL electrolyte intake, and defer high-exertion EVA.' : 'Cardiovascular autonomic tone within personal baseline.',
    },
    musculoskeletal: {
      severity: cur.resistiveMins < 35 ? 'watch' : 'nominal',
      metric: `Bone ${cur.boneDensityIndex}% • ARED ${cur.resistiveMins}m`,
      detail: `Estimated lean muscle mass ${cur.muscleMassKg} kg | Aerobic cycle ${cur.aerobicMins}m / 30m target.`,
      action: cur.resistiveMins < 35 ? 'Schedule makeup ARED squat/deadlift block to prevent microgravity bone resorption.' : 'Countermeasure compliance on track.',
    },
    neuro: {
      severity: voiceZ.zScore > 2.2 || cur.vestibularScore > 30 ? 'watch' : 'nominal',
      metric: `PVT ${cur.pvtReactionMs} ms • SANS ${cur.sansRiskScore}/100`,
      detail: `Vestibular orientation score ${cur.vestibularScore}/100 | Memory span ${cur.memorySpan} digits | On-device voice stress ${cur.voiceStressIndex}/100.`,
      action: voiceZ.zScore > 2.2 ? 'Recommend private decompression module & workload redistribution.' : 'Neuro-ocular and vestibular telemetry nominal.',
    },
    sleep: {
      severity: sleepZ.zScore < -2.0 ? 'watch' : 'nominal',
      metric: `${cur.sleepHours}h (${cur.sleepEfficiency}% eff)`,
      detail: `REM ${cur.remPercent}% | Deep ${cur.deepPercent}% | Circadian alignment ${cur.circadianAlignment}% (z-score: ${sleepZ.zScore}σ).`,
      action: sleepZ.zScore < -2.0 ? 'Prescribe 480nm morning light exposure & limit post-sleep console tasks.' : 'Circadian entrainment aligned with ship schedule.',
    },
    radiation: {
      severity: cur.dailyRadiationMsv > 2.0 ? 'critical' : cur.cumulativeRadiationMsv > 450 ? 'watch' : 'nominal',
      metric: `${cur.dailyRadiationMsv} mSv/d • ${cur.cumulativeRadiationMsv} mSv`,
      detail: `Cumulative transit exposure ${cur.cumulativeRadiationMsv} mSv of ${member.careerRadiationLimitMsv} mSv career NASA limit.`,
      action: cur.dailyRadiationMsv > 2.0 ? 'Remain in polyethylene-shielded Storm Haven until proton flux subsides.' : 'Standard transit shielding nominal.',
    },
  };

  const colorFor = (sev: Severity) =>
    sev === 'critical' ? '#f43f5e' : sev === 'watch' ? '#f59e0b' : '#22d3ee';

  const activeInfo = systemStatus[activeOverlay];
  const drawerInfo = selectedOrganDrawer ? systemStatus[selectedOrganDrawer] : null;

  return (
    <div className="glass-panel rounded-2xl p-4 relative flex flex-col justify-between">
      <div>
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <div>
            <h2 className="text-sm font-bold">Physiological Twin &amp; Heat-Map</h2>
            <p className="text-xs opacity-70">Click an organ region to inspect baseline z-score</p>
          </div>
        </div>

        {/* Heat-Map Layer Selector */}
        <div className="flex flex-wrap gap-1 mb-3">
          {OVERLAYS.map(({ id, label, Icon }) => (
            <button
              key={id}
              onClick={() => setActiveOverlay(id)}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                activeOverlay === id
                  ? 'bg-cyan-500/20 border-cyan-400/50 text-cyan-300'
                  : 'elevated-card opacity-75 hover:opacity-100'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Interactive SVG Human Anatomy Model */}
      <div className="relative flex items-center justify-center py-2 rounded-xl elevated-card overflow-hidden">
        <svg viewBox="0 0 240 310" className="w-56 h-64" role="img" aria-label="Interactive astronaut physiological heat map">
          <defs>
            <radialGradient id="heatGlow">
              <stop offset="0%" stopColor={colorFor(activeInfo.severity)} stopOpacity="0.65" />
              <stop offset="100%" stopColor={colorFor(activeInfo.severity)} stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Subtle Telemetry Grid */}
          <line x1="120" y1="8" x2="120" y2="302" stroke="rgba(148,163,184,0.18)" strokeDasharray="3 3" />
          <line x1="25" y1="145" x2="215" y2="145" stroke="rgba(148,163,184,0.18)" strokeDasharray="3 3" />

          {/* Ambient Heat Overlay */}
          <circle
            cx="120"
            cy={activeOverlay === 'neuro' || activeOverlay === 'sleep' ? 44 : activeOverlay === 'cardiovascular' ? 105 : 145}
            r={activeOverlay === 'radiation' ? 95 : 52}
            fill="url(#heatGlow)"
          />

          {/* Head: Neuro-Vestibular & Sleep */}
          <g className="cursor-pointer" onClick={() => setSelectedOrganDrawer('neuro')}>
            <circle
              cx="120"
              cy="42"
              r="23"
              fill="rgba(15,23,42,0.55)"
              stroke={colorFor(systemStatus.neuro.severity)}
              strokeWidth={activeOverlay === 'neuro' || activeOverlay === 'sleep' ? 3 : 1.75}
            />
            <circle cx="120" cy="42" r="5" fill={colorFor(systemStatus.neuro.severity)} className="animate-ping" />
          </g>

          {/* Thorax / Heart: Cardiovascular */}
          <g className="cursor-pointer" onClick={() => setSelectedOrganDrawer('cardiovascular')}>
            <rect
              x="84"
              y="72"
              width="72"
              height="66"
              rx="16"
              fill="rgba(15,23,42,0.55)"
              stroke={colorFor(systemStatus.cardiovascular.severity)}
              strokeWidth={activeOverlay === 'cardiovascular' ? 3 : 1.75}
            />
            <circle cx="128" cy="98" r="7" fill={colorFor(systemStatus.cardiovascular.severity)} />
          </g>

          {/* Abdomen: Radiation / Metabolic */}
          <g className="cursor-pointer" onClick={() => setSelectedOrganDrawer('radiation')}>
            <rect
              x="89"
              y="144"
              width="62"
              height="52"
              rx="12"
              fill="rgba(15,23,42,0.55)"
              stroke={colorFor(systemStatus.radiation.severity)}
              strokeWidth={activeOverlay === 'radiation' ? 3 : 1.75}
            />
          </g>

          {/* Limbs: Musculoskeletal */}
          <g className="cursor-pointer" onClick={() => setSelectedOrganDrawer('musculoskeletal')}>
            <rect x="56" y="76" width="20" height="104" rx="9" fill="rgba(15,23,42,0.5)" stroke={colorFor(systemStatus.musculoskeletal.severity)} strokeWidth="1.75" />
            <rect x="164" y="76" width="20" height="104" rx="9" fill="rgba(15,23,42,0.5)" stroke={colorFor(systemStatus.musculoskeletal.severity)} strokeWidth="1.75" />
            <rect x="91" y="203" width="22" height="96" rx="9" fill="rgba(15,23,42,0.5)" stroke={colorFor(systemStatus.musculoskeletal.severity)} strokeWidth="1.75" />
            <rect x="127" y="203" width="22" height="96" rx="9" fill="rgba(15,23,42,0.5)" stroke={colorFor(systemStatus.musculoskeletal.severity)} strokeWidth="1.75" />
          </g>
        </svg>

        {/* Active Layer Readout Pill */}
        <div className="absolute bottom-2.5 left-3 right-3 px-3 py-1.5 rounded-lg glass-panel flex items-center justify-between text-xs">
          <span className="font-semibold capitalize">{activeOverlay}</span>
          <span className="font-mono-telemetry text-cyan-300">{activeInfo.metric}</span>
        </div>
      </div>

      {/* Organ Detail Drawer */}
      {selectedOrganDrawer && drawerInfo && (
        <div className="mt-3 p-3.5 rounded-xl elevated-card border-cyan-400/50 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              {drawerInfo.severity === 'critical' ? (
                <ShieldAlert className="w-4 h-4 text-rose-400" />
              ) : drawerInfo.severity === 'watch' ? (
                <AlertTriangle className="w-4 h-4 text-amber-400" />
              ) : (
                <CheckCircle2 className="w-4 h-4 text-cyan-400" />
              )}
              <span className="text-xs font-bold uppercase tracking-wide">
                {selectedOrganDrawer} System Detail
              </span>
            </div>
            <button
              onClick={() => setSelectedOrganDrawer(null)}
              className="p-1 rounded hover:bg-white/10"
              aria-label="Close organ drawer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <p className="text-xs font-mono-telemetry">{drawerInfo.detail}</p>
          <p className="text-xs opacity-85">
            <strong>Action:</strong> {drawerInfo.action}
          </p>
        </div>
      )}
    </div>
  );
};