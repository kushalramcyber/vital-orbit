import React from 'react';
import { AlertTriangle, CheckCircle2, ShieldAlert, Users } from 'lucide-react';
import { useVitalOrbitStore } from '../store/useVitalOrbitStore';
import { calculateHealthScore } from '../utils/anomalyEngine';
import { Severity } from '../types/telemetry';

const SEVERITY_META: Record<
  Severity,
  { label: string; ringColor: string; badgeClass: string; Icon: typeof CheckCircle2 }
> = {
  nominal: {
    label: 'NOMINAL',
    ringColor: '#10b981',
    badgeClass: 'badge-nominal',
    Icon: CheckCircle2,
  },
  watch: {
    label: 'WATCH',
    ringColor: '#f59e0b',
    badgeClass: 'badge-watch',
    Icon: AlertTriangle,
  },
  critical: {
    label: 'CRITICAL',
    ringColor: '#e11d48',
    badgeClass: 'badge-critical',
    Icon: ShieldAlert,
  },
};

const AVATAR_GRADIENTS = [
  'from-sky-500 to-blue-600',
  'from-emerald-500 to-teal-600',
  'from-violet-500 to-indigo-600',
  'from-amber-500 to-orange-600',
];

export const CrewRoster: React.FC = () => {
  const { crew, selectedCrewId, setSelectedCrew, selectedDay, role } = useVitalOrbitStore();

  const radius = 20;
  const circumference = 2 * Math.PI * radius;

  return (
    <aside className="app-card rounded-2xl p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg accent-pill">
            <Users className="w-3.5 h-3.5" />
          </div>
          <h2 className="text-xs font-bold uppercase tracking-wider opacity-85">Crew Roster</h2>
        </div>
        <span className="text-[11px] font-mono-telemetry font-semibold opacity-65">Sol {selectedDay}</span>
      </div>

      <div className="space-y-2.5">
        {crew.map((member, index) => {
          const { score, severity } = calculateHealthScore(member, selectedDay);
          const meta = SEVERITY_META[severity];
          const StatusIcon = meta.Icon;
          const isSelected = member.id === selectedCrewId;
          const dashOffset = circumference - (score / 100) * circumference;
          const cur = member.telemetry[selectedDay - 1];

          return (
            <button
              key={member.id}
              onClick={() => setSelectedCrew(member.id)}
              aria-pressed={isSelected}
              className={`w-full text-left p-3 rounded-2xl transition-all cursor-pointer border ${
                isSelected
                  ? 'elevated-card border-sky-500 ring-2 ring-sky-500/20 shadow-sm'
                  : 'border-transparent hover:border-slate-300/60 elevated-card opacity-90 hover:opacity-100'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className={`w-9 h-9 rounded-xl bg-gradient-to-br ${
                      AVATAR_GRADIENTS[index % AVATAR_GRADIENTS.length]
                    } text-white flex items-center justify-center text-xs font-bold shrink-0 shadow-xs`}
                  >
                    {member.avatarInitials}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold truncate">{member.name}</p>
                    <p className="text-[11px] opacity-70 truncate">{member.role}</p>
                  </div>
                </div>

                <div className="relative w-12 h-12 flex items-center justify-center shrink-0">
                  <svg className="w-12 h-12 -rotate-90" viewBox="0 0 48 48" aria-hidden="true">
                    <circle cx="24" cy="24" r={radius} fill="none" stroke="rgba(148,163,184,0.22)" strokeWidth="4.5" />
                    <circle
                      cx="24"
                      cy="24"
                      r={radius}
                      fill="none"
                      stroke={meta.ringColor}
                      strokeWidth="4.5"
                      strokeLinecap="round"
                      strokeDasharray={circumference}
                      strokeDashoffset={dashOffset}
                    />
                  </svg>
                  <span className="absolute text-xs font-mono-telemetry font-extrabold">{score}</span>
                </div>
              </div>

              <div className="mt-2.5 flex items-center justify-between text-[11px]">
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-bold ${meta.badgeClass}`}>
                  <StatusIcon className="w-3 h-3" />
                  {meta.label}
                </span>

                <span className="font-mono-telemetry font-medium opacity-75">
                  {role === 'mcc' ? `EVA: ${score >= 75 ? 'GO' : 'HOLD'}` : `${cur.heartRate} bpm • ${cur.sleepHours}h`}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </aside>
  );
};