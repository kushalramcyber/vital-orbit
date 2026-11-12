import React, { useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  FileText,
  ShieldAlert,
  Sparkles,
} from 'lucide-react';
import { useVitalOrbitStore } from '../store/useVitalOrbitStore';
import { calculateHealthScore, generateExplainableAlerts } from '../utils/anomalyEngine';
import { exportMedicalSummaryReport } from '../utils/offlineDb';

export const RightAlertsPanel: React.FC = () => {
  const { crew, selectedCrewId, selectedDay, role, consent, setSelectedCrew, setSelectedOrganDrawer } =
    useVitalOrbitStore();
  const [expandedAlertId, setExpandedAlertId] = useState<string | null>(null);

  const allAlerts = generateExplainableAlerts(crew, selectedDay).filter((a) => {
    if (role === 'mcc' && a.isPrivateBehavioral && !consent.behavioralCheckIn) return false;
    return true;
  });

  const activeCrew = crew.find((c) => c.id === selectedCrewId) || crew[0];
  const activeScore = calculateHealthScore(activeCrew, selectedDay).score;

  return (
    <aside className="app-card rounded-2xl p-4 flex flex-col justify-between gap-3">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <div className="p-1.5 rounded-lg accent-pill">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
            <h2 className="text-xs font-bold uppercase tracking-wider opacity-85">
              AI Alerts ({allAlerts.length})
            </h2>
          </div>
          <button
            onClick={() =>
              exportMedicalSummaryReport(
                activeCrew.name,
                selectedDay,
                activeScore,
                allAlerts.map((a) => `${a.crewName}:${a.title} — ${a.recommendedAction}`) ) } className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl elevated-card hover:border-sky-500 text-[11px] font-bold cursor-pointer" > <FileText className="w-3 h-3 text-sky-600" /> Export PDF </button> </div>  {allAlerts.length === 0 ? ( <div className="p-4 rounded-2xl badge-nominal flex items-center gap-2.5 text-xs font-medium"> <CheckCircle2 className="w-5 h-5 shrink-0" /> <span>All 4 crew members are within 21-day personal baselines on Sol {selectedDay}.</span> </div> ) : ( <div className="space-y-2.5 max-h-[540px] overflow-y-auto pr-0.5"> {allAlerts.map((alert) => { const isExpanded = expandedAlertId === alert.id; const isCritical = alert.severity === 'critical';  return ( <div key={alert.id} className={`rounded-2xl p-3.5 transition-all ${
                    isCritical ? 'badge-critical' : 'badge-watch'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    {isCritical ? (
                      <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                    )}
                    <div>
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-[10px] font-mono-telemetry font-bold uppercase px-2 py-0.5 rounded-md bg-white/60">
                          {alert.severity} • +{alert.zScore}σ
                        </span>
                        <button
                          onClick={() => {
                            setSelectedCrew(alert.crewId);
                            setSelectedOrganDrawer(alert.organ);
                          }}
                          className="text-xs font-extrabold underline cursor-pointer"
                        >
                          {alert.crewName}
                        </button>
                      </div>
                      <p className="text-xs font-bold mt-1">{alert.title}</p>
                    </div>
                  </div>

                  <p className="text-xs opacity-90 mt-1.5 leading-relaxed">{alert.summary}</p>

                  <div className="mt-2.5 pt-2 border-t border-current/15 flex items-center justify-between text-[11px]">
                    <span className="font-mono-telemetry font-semibold">Confidence: {alert.confidence}%</span>
                    <button
                      onClick={() => setExpandedAlertId(isExpanded ? null : alert.id)}
                      className="inline-flex items-center gap-1 font-bold underline cursor-pointer"
                    >
                      Why this alert?
                      {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>
                  </div>

                  {isExpanded && (
                    <div className="mt-2 p-2.5 rounded-xl elevated-card text-xs space-y-1.5">
                      <p className="font-bold text-[11px] uppercase opacity-75">Contributing Signals:</p>
                      <ul className="list-disc list-inside space-y-0.5 font-mono-telemetry text-[11px]">
                        {alert.contributingSignals.map((sig) => (
                          <li key={sig}>{sig}</li>
                        ))}
                      </ul>
                      <p className="text-[11px] font-bold pt-1">{alert.forecast48h}</p>
                      <p className="text-[11px] pt-1">
                        <strong>Protocol:</strong> {alert.recommendedAction}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </aside>
  );
};