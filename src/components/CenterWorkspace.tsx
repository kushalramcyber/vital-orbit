import React, { useState } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  Bot,
  Brain,
  HeartPulse,
  Lock,
  Send,
  Shield,
  Sliders,
  Timer,
  Wind,
} from 'lucide-react';
import { CenterTab, useVitalOrbitStore } from '../store/useVitalOrbitStore';
import { BodyHeatmap } from './BodyHeatmap';
import { calculateHealthScore, computeRollingZScore } from '../utils/anomalyEngine';
import { ConsentSettings } from '../types/telemetry';

export const CenterWorkspace: React.FC = () => {
  const {
    crew,
    selectedCrewId,
    selectedDay,
    activeTab,
    setActiveTab,
    role,
    consent,
    toggleConsent,
    auditLog,
    submitDailyCheckIn,
    recordPvtResult,
    messageQueue,
    queueFlightSurgeonMessage,
  } = useVitalOrbitStore();

  const member = crew.find((c) => c.id === selectedCrewId) || crew[0];
  const cur = member.telemetry[selectedDay - 1];
  const windowSlice = member.telemetry.slice(Math.max(0, selectedDay - 14), selectedDay);

  const [checkIn, setCheckIn] = useState({
    mood: cur.mood,
    stress: cur.stress,
    fatigue: cur.fatigue,
    motivation: cur.motivation,
  });
  const [checkInSaved, setCheckInSaved] = useState(false);

  const [pvtState, setPvtState] = useState<'idle' | 'waiting' | 'stimulus' | 'done'>('idle');
  const [pvtStart, setPvtStart] = useState<number>(0);
  const [pvtScore, setPvtScore] = useState<number | null>(null);

  const [simSleepDelta, setSimSleepDelta] = useState(0);
  const [simWorkoutDelta, setSimWorkoutDelta] = useState(0);
  const [simEvaHours, setSimEvaHours] = useState(0);
  const [simCo2, setSimCo2] = useState(cur.cabinCo2Ppm);

  const [nlQuery, setNlQuery] = useState('How has Commander Reyes slept this week compared to baseline?');
  const [nlAnswer, setNlAnswer] = useState<string | null>(null);

  const [supportMsg, setSupportMsg] = useState('');
  const [breathingActive, setBreathingActive] = useState(false);

  const baselineScore = calculateHealthScore(member, selectedDay).score;
  const simulatedScore = calculateHealthScore(member, selectedDay, {
    sleepDelta: simSleepDelta,
    workoutDelta: simWorkoutDelta,
    evaHours: simEvaHours,
    co2Ppm: simCo2,
  }).score;

  const startPvtTest = () => {
    setPvtState('waiting');
    setPvtScore(null);
    const waitMs = 1200 + Math.random() * 2000;
    setTimeout(() => {
      setPvtStart(performance.now());
      setPvtState('stimulus');
    }, waitMs);
  };

  const handlePvtClick = () => {
    if (pvtState !== 'stimulus') return;
    const ms = Math.round(performance.now() - pvtStart);
    setPvtScore(ms);
    setPvtState('done');
    recordPvtResult(member.id, ms);
  };

  const runNlAssistant = (q: string) => {
    const queryLower = q.toLowerCase();
    const target =
      crew.find((c) => queryLower.includes(c.name.split(' ').pop()!.toLowerCase())) || member;
    const weekSlice = target.telemetry.slice(Math.max(0, selectedDay - 7), selectedDay);
    const avgSleep = (weekSlice.reduce((a, b) => a + b.sleepHours, 0) / weekSlice.length).toFixed(1);
    const sleepStats = computeRollingZScore(target.telemetry, selectedDay, (d) => d.sleepHours);
    const avgHr = Math.round(weekSlice.reduce((a, b) => a + b.heartRate, 0) / weekSlice.length);

    setNlAnswer(
      `${target.name} (Sol${selectedDay}): 7-day average sleep is ${avgSleep}h vs 21-day personal baseline of${sleepStats.mean}h (z-score ${sleepStats.zScore}σ). 7-day mean resting HR is${avgHr} bpm, cumulative radiation is ${target.telemetry[selectedDay - 1].cumulativeRadiationMsv} mSv, and PVT reaction time is${target.telemetry[selectedDay - 1].pvtReactionMs} ms.`
    );
  };

  const TABS: { id: CenterTab; label: string }[] = [
    { id: 'overview', label: 'Vitals & Body Map' },
    { id: 'sleep_msk', label: 'Sleep & Fitness' },
    { id: 'behavioral', label: 'Behavioral & Team' },
    { id: 'simulator', label: 'What-If & AI Query' },
    { id: 'support', label: 'Support & Privacy' },
  ];

  const sparkMetrics = [
    { id: 'hr', label: 'Heart Rate', val: `${cur.heartRate} bpm`, key: 'heartRate', color: '#e11d48' }, { id: 'hrv', label: 'HRV (RMSSD)', val: `${cur.hrv} ms`, key: 'hrv', color: '#0284c7' },
    { id: 'bp', label: 'Blood Pressure', val: `${cur.systolic}/${cur.diastolic}`, key: 'systolic', color: '#6366f1' },
    { id: 'spo2', label: 'SpO2 / Resp', val: `${cur.spo2}\% •${cur.respRate}/m`, key: 'spo2', color: '#10b981' },
    { id: 'temp', label: 'Core / Skin Temp', val: `${cur.coreTemp}° /${cur.skinTemp}°C`, key: 'coreTemp', color: '#f59e0b' },
    { id: 'hyd', label: 'Hydration / Intake', val: `${cur.hydrationLiters}L • ${cur.caloriesKcal} kcal`, key: 'hydrationLiters', color: '#0ea5e9' },
  ];

  const radPct = Math.min(100, Math.round((cur.cumulativeRadiationMsv / member.careerRadiationLimitMsv) * 100));
  const co2Pct = Math.min(100, Math.round((cur.cabinCo2Ppm / 5000) * 100));

  return (
    <section className="flex flex-col gap-3.5">
      {/* App Segmented Tab Bar */}
      <nav className="app-card rounded-2xl p-1.5 flex flex-wrap gap-1" aria-label="Telemetry views">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === t.id ? 'accent-pill shadow-xs' : 'opacity-70 hover:opacity-100'
            }`}
          >
            {t.label}
          </button>
        ))}
      </nav>

      {/* TAB 1: OVERVIEW & BODY HEATMAP */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-3.5">
          <div className="xl:col-span-5">
            <BodyHeatmap />
          </div>

          <div className="xl:col-span-7 flex flex-col gap-3.5">
            {/* Graphical Area-Sparkline Tiles */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {sparkMetrics.map((m) => (
                <div key={m.id} className="app-card rounded-2xl p-3.5 flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold opacity-75">{m.label}</span>
                    <span
                      className="p-1.5 rounded-lg"
                      style={{ backgroundColor: `${m.color}18`, color: m.color }} > <HeartPulse className="w-3.5 h-3.5" /> </span> </div> <p className="text-sm font-mono-telemetry font-extrabold mt-1">{m.val}</p> <div className="h-12 mt-1.5"> <ResponsiveContainer width="100%" height="100%"> <AreaChart data={windowSlice}> <defs> <linearGradient id={`grad-${m.id}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={m.color} stopOpacity={0.32} />
                            <stop offset="95%" stopColor={m.color} stopOpacity={0.0} />
                          </linearGradient>
                        </defs>
                        <Area
                          type="monotone"
                          dataKey={m.key}
                          stroke={m.color}
                          strokeWidth={2}
                          fill={`url(#grad-${m.id})`} dot={false} /> </AreaChart> </ResponsiveContainer> </div> </div> ))} </div>  {/* Graphical Spaceflight Environment & Countermeasure Gauges */} <div className="app-card rounded-2xl p-4"> <h3 className="text-xs font-bold uppercase tracking-wider opacity-80 mb-3"> Spaceflight Environment &amp; Microgravity Risk Meters </h3> <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs"> <div className="elevated-card rounded-xl p-3"> <div className="flex justify-between font-semibold mb-1"> <span>Cumulative Radiation</span> <span className="font-mono-telemetry">{cur.cumulativeRadiationMsv} / {member.careerRadiationLimitMsv} mSv</span> </div> <div className="h-2 rounded-full bg-slate-200/70 overflow-hidden"> <div className="h-full bg-sky-500 rounded-full" style={{ width: `${radPct}%` }} />
                  </div>
                  <p className="text-[11px] opacity-75 mt-1">Daily absorbed rate: {cur.dailyRadiationMsv} mSv/d</p>
                </div>

                <div className="elevated-card rounded-xl p-3">
                  <div className="flex justify-between font-semibold mb-1">
                    <span>Cabin CO2 Partial Pressure</span>
                    <span className="font-mono-telemetry">{cur.cabinCo2Ppm} ppm</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-200/70 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${cur.cabinCo2Ppm > 3800 ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${co2Pct}%` }}
                    />
                  </div>
                  <p className="text-[11px] opacity-75 mt-1">
                    {cur.cabinCo2Ppm > 3800 ? 'Watch: Scrubber efficiency dip' : 'Nominal (< 3500 ppm)'}
                  </p>
                </div>

                <div className="elevated-card rounded-xl p-3">
                  <div className="flex justify-between font-semibold mb-1">
                    <span>SANS Neuro-Ocular Risk</span>
                    <span className="font-mono-telemetry">{cur.sansRiskScore} / 100</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-200/70 overflow-hidden">
                    <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${cur.sansRiskScore}\%` }} /> </div> <p className="text-[11px] opacity-75 mt-1">Cephalad fluid shift monitoring</p> </div>  <div className="elevated-card rounded-xl p-3"> <div className="flex justify-between font-semibold mb-1"> <span>Vestibular Orientation Score</span> <span className="font-mono-telemetry">{cur.vestibularScore} / 100</span> </div> <div className="h-2 rounded-full bg-slate-200/70 overflow-hidden"> <div className="h-full bg-teal-500 rounded-full" style={{ width: `${cur.vestibularScore}%` }} />
                  </div>
                  <p className="text-[11px] opacity-75 mt-1">Spatial adaptation nominal</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: SLEEP & MUSCULOSKELETAL */}
      {activeTab === 'sleep_msk' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5">
          <div className="app-card rounded-2xl p-4">
            <h3 className="text-sm font-bold mb-1">14-Sol Sleep &amp; Circadian Alignment</h3>
            <p className="text-xs opacity-70 mb-3">
              REM {cur.remPercent}% • Deep {cur.deepPercent}% • Circadian Entrainment {cur.circadianAlignment}%
            </p>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={windowSlice}>
                  <defs>
                    <linearGradient id="sleepArea" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0284c7" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#0284c7" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.25)" />
                  <XAxis dataKey="day" stroke="#64748b" fontSize={11} />
                  <YAxis stroke="#64748b" fontSize={11} />
                  <Tooltip />
                  <Area type="monotone" dataKey="sleepHours" stroke="#0284c7" strokeWidth={2.5} fill="url(#sleepArea)" name="Sleep (hrs)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="app-card rounded-2xl p-4">
            <h3 className="text-sm font-bold mb-1">ARED Resistive &amp; Aerobic Compliance</h3>
            <p className="text-xs opacity-70 mb-3">
              Bone Density Index: {cur.boneDensityIndex}% • Lean Muscle: {cur.muscleMassKg} kg
            </p>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={windowSlice}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.25)" />
                  <XAxis dataKey="day" stroke="#64748b" fontSize={11} />
                  <YAxis stroke="#64748b" fontSize={11} />
                  <Tooltip />
                  <Bar dataKey="resistiveMins" fill="#0284c7" name="Resistive (m)" radius={[5, 5, 0, 0]} />
                  <Bar dataKey="aerobicMins" fill="#6366f1" name="Aerobic (m)" radius={[5, 5, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: BEHAVIORAL, COGNITIVE PVT & TEAM COHESION */}
      {activeTab === 'behavioral' && (
        <div className="space-y-3.5">
          {role === 'mcc' && !consent.behavioralCheckIn ? (
            <div className="app-card rounded-2xl p-6 text-center space-y-2">
              <Lock className="w-7 h-7 text-amber-500 mx-auto" />
              <h3 className="text-sm font-bold">Behavioral Telemetry Restricted by Crew Privacy Policy</h3>
              <p className="text-xs opacity-75">
                Mission Control sees aggregate readiness only unless the astronaut grants explicit behavioral consent.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3.5">
              <div className="app-card rounded-2xl p-4 space-y-3">
                <h3 className="text-sm font-bold">30-Second Behavioral Check-In</h3>
                {(['mood', 'stress', 'fatigue', 'motivation'] as const).map((field) => (
                  <div key={field}>
                    <div className="flex justify-between text-xs font-medium capitalize mb-1">
                      <span>{field}</span>
                      <span className="font-mono-telemetry font-bold">{checkIn[field]} / 5</span>
                    </div>
                    <input
                      type="range"
                      min={1}
                      max={5}
                      step={0.5}
                      value={checkIn[field]}
                      onChange={(e) => setCheckIn({ ...checkIn, [field]: Number(e.target.value) })}
                      className="w-full accent-sky-600"
                    />
                  </div>
                ))}
                <button
                  onClick={() => {
                    submitDailyCheckIn(member.id, checkIn);
                    setCheckInSaved(true);
                    setTimeout(() => setCheckInSaved(false), 2000);
                  }}
                  className="w-full py-2 rounded-xl accent-pill text-xs font-bold cursor-pointer"
                >
                  {checkInSaved ? 'Saved to Encrypted Vault' : 'Log Check-In'}
                </button>
              </div>

              <div className="app-card rounded-2xl p-4 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-1.5">
                    <Timer className="w-4 h-4 text-sky-600" />
                    <h3 className="text-sm font-bold">PVT Vigilance Micro-Test</h3>
                  </div>
                  <p className="text-xs opacity-75 mt-1">
                    Current latency: <strong className="font-mono-telemetry">{cur.pvtReactionMs} ms</strong> • Memory:{' '}
                    <strong className="font-mono-telemetry">{cur.memorySpan} digits</strong>
                  </p>
                </div>

                <button
                  onClick={pvtState === 'stimulus' ? handlePvtClick : startPvtTest}
                  className={`my-4 h-28 rounded-2xl font-mono-telemetry font-bold text-sm transition-all cursor-pointer border ${ pvtState === 'stimulus' ? 'bg-emerald-500 text-white border-emerald-400 scale-[1.02] shadow-md' : pvtState === 'waiting' ? 'badge-watch' : 'elevated-card hover:border-sky-500' }`} > {pvtState === 'idle' && 'START 5-SEC PVT TEST'} {pvtState === 'waiting' && 'WAIT FOR GREEN TARGET...'} {pvtState === 'stimulus' && 'TAP NOW!'} {pvtState === 'done' && `REACTION: ${pvtScore} ms (Retest)`}
                </button>

                <p className="text-[11px] opacity-70">
                  Psychomotor Vigilance Task flags micro-sleep fatigue before EVA ops.
                </p>
              </div>

              <div className="app-card rounded-2xl p-4 space-y-2.5">
                <div className="flex items-center gap-1.5">
                  <Brain className="w-4 h-4 text-sky-600" />
                  <h3 className="text-sm font-bold">Team Cohesion &amp; Interaction Map</h3>
                </div>
                <p className="text-xs opacity-70">Cross-crew comms &amp; workload balance (Sol {selectedDay})</p>
                <div className="space-y-2.5 pt-1">
                  {crew.map((c) => {
                    const d = c.telemetry[selectedDay - 1];
                    const pct = Math.min(100, d.socialInteractions * 9);
                    return (
                      <div key={c.id} className="text-xs">
                        <div className="flex justify-between font-medium mb-1">
                          <span>{c.name}</span>
                          <span className="font-mono-telemetry">{d.socialInteractions} / day</span>
                        </div>
                        <div className="h-2.5 rounded-full bg-slate-200/70 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${pct < 40 ? 'bg-amber-500' : 'bg-sky-500'}`} style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: WHAT-IF SIMULATOR & NATURAL-LANGUAGE ASSISTANT */}
      {activeTab === 'simulator' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5">
          <div className="app-card rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Sliders className="w-4 h-4 text-sky-600" />
                <h3 className="text-sm font-bold">What-If Mission Health Simulator</h3>
              </div>
              <div className="font-mono-telemetry text-xs">
                <span>Current: {baselineScore}</span> →{' '}
                <strong className={simulatedScore >= baselineScore ? 'text-emerald-600' : 'text-rose-600'}>
                  Predicted: {simulatedScore}
                </strong>
              </div>
            </div>

            <div className="space-y-2.5 text-xs">
              <div>
                <div className="flex justify-between font-medium mb-1">
                  <span>Sleep Adjustment</span>
                  <span className="font-mono-telemetry">{simSleepDelta >= 0 ? `+${simSleepDelta}` : simSleepDelta} hrs</span> </div> <input type="range" min={-3} max={3} step={0.5} value={simSleepDelta} onChange={(e) => setSimSleepDelta(Number(e.target.value))} className="w-full accent-sky-600" /> </div>  <div> <div className="flex justify-between font-medium mb-1"> <span>ARED / Aerobic Workout Delta</span> <span className="font-mono-telemetry">{simWorkoutDelta >= 0 ? `+${simWorkoutDelta}` : simWorkoutDelta} mins</span>
                </div>
                <input type="range" min={-45} max={45} step={15} value={simWorkoutDelta} onChange={(e) => setSimWorkoutDelta(Number(e.target.value))} className="w-full accent-sky-600" />
              </div>

              <div>
                <div className="flex justify-between font-medium mb-1">
                  <span>Planned EVA Duration</span>
                  <span className="font-mono-telemetry">{simEvaHours} hrs</span>
                </div>
                <input type="range" min={0} max={8} step={1} value={simEvaHours} onChange={(e) => setSimEvaHours(Number(e.target.value))} className="w-full accent-sky-600" />
              </div>

              <div>
                <div className="flex justify-between font-medium mb-1">
                  <span>Cabin CO2 Level</span>
                  <span className="font-mono-telemetry">{simCo2} ppm</span>
                </div>
                <input type="range" min={1800} max={5000} step={200} value={simCo2} onChange={(e) => setSimCo2(Number(e.target.value))} className="w-full accent-sky-600" />
              </div>
            </div>
          </div>

          <div className="app-card rounded-2xl p-4 flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <Bot className="w-4 h-4 text-sky-600" />
                <h3 className="text-sm font-bold">On-Board Medical Query Assistant</h3>
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={nlQuery}
                  onChange={(e) => setNlQuery(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-xl elevated-card text-xs focus:outline-none focus:ring-2 focus:ring-sky-500"
                  placeholder="Ask about crew sleep, HRV, radiation..."
                />
                <button
                  onClick={() => runNlAssistant(nlQuery)}
                  className="px-3.5 py-2 rounded-xl accent-pill text-xs font-bold cursor-pointer"
                >
                  Ask
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {[
                  'How has Commander Reyes slept this week compared to baseline?',
                  'Why is Specialist Vance flagged today?',
                ].map((preset) => (
                  <button
                    key={preset}
                    onClick={() => {
                      setNlQuery(preset);
                      runNlAssistant(preset);
                    }}
                    className="text-[11px] px-2.5 py-1 rounded-lg elevated-card opacity-85 hover:opacity-100 cursor-pointer"
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-3.5 rounded-xl elevated-card text-xs leading-relaxed">
              {nlAnswer || 'Query local telemetry baselines offline without Earth ground-link latency.'}
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: PRIVATE SUPPORT, DELAYED COMMS & PRIVACY CONSENT */}
      {activeTab === 'support' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3.5">
          <div className="app-card rounded-2xl p-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-1.5">
                <Wind className="w-4 h-4 text-sky-600" />
                <h3 className="text-sm font-bold">Guided Respiratory &amp; Light Protocol</h3>
              </div>
              <p className="text-xs opacity-75 mt-1">
                4-4-4-4 vagal-tone breathing pacer + 480nm circadian reset
              </p>
            </div>
            <div className="my-4 flex flex-col items-center">
              <div
                className={`w-24 h-24 rounded-full border-2 border-sky-500 flex items-center justify-center text-xs font-mono-telemetry font-bold transition-transform duration-1000 ${ breathingActive ? 'scale-110 accent-pill' : 'elevated-card' }`} > {breathingActive ? '4s CADENCE' : 'READY'} </div> </div> <button onClick={() => setBreathingActive(!breathingActive)} className="w-full py-2 rounded-xl accent-pill text-xs font-bold cursor-pointer" > {breathingActive ? 'Stop Pacer' : 'Start Guided Breathing'} </button> </div>  <div className="app-card rounded-2xl p-4 flex flex-col justify-between space-y-2.5"> <div> <h3 className="text-sm font-bold">Confidential Flight Surgeon Link</h3> <p className="text-xs opacity-70">End-to-end encrypted; queued over light-delay channel</p> </div> <div className="space-y-1.5 max-h-32 overflow-y-auto"> {messageQueue.map((m) => ( <div key={m.id} className="p-2.5 rounded-xl elevated-card text-[11px]"> <div className="flex justify-between font-mono-telemetry font-bold text-sky-600"> <span>{m.status.toUpperCase()}</span> <span>{m.deliveryEtaSeconds > 0 ? `ETA ${m.deliveryEtaSeconds}s` : 'DELIVERED'}</span>
                  </div>
                  <p className="mt-1 opacity-90">{m.content}</p>
                </div>
              ))}
            </div>
            <div className="flex gap-1.5">
              <input
                type="text"
                value={supportMsg}
                onChange={(e) => setSupportMsg(e.target.value)}
                placeholder="Confidential note to psychologist..."
                className="flex-1 px-3 py-1.5 rounded-xl elevated-card text-xs"
              />
              <button
                onClick={() => {
                  if (!supportMsg.trim()) return;
                  queueFlightSurgeonMessage(supportMsg);
                  setSupportMsg('');
                }}
                className="px-3 py-1.5 rounded-xl accent-pill text-xs font-bold cursor-pointer"
                aria-label="Queue confidential message"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="app-card rounded-2xl p-4 space-y-2.5">
            <div className="flex items-center gap-1.5">
              <Shield className="w-4 h-4 text-sky-600" />
              <h3 className="text-sm font-bold">Crew Data Consent &amp; Audit Trail</h3>
            </div>
            <div className="space-y-1.5 text-xs">
              {(Object.keys(consent) as (keyof ConsentSettings)[]).map((key) => (
                <label key={key} className="flex items-center justify-between p-2 rounded-xl elevated-card cursor-pointer">
                  <span className="capitalize font-medium">{key.replace(/([A-Z])/g, ' $1')}</span>
                  <input
                    type="checkbox"
                    checked={consent[key]}
                    onChange={() => toggleConsent(key)}
                    className="accent-sky-600"
                  />
                </label>
              ))}
            </div>
            <div className="text-[11px] opacity-75 pt-1.5 border-t border-slate-300/40">
              <p className="font-bold mb-1">Recent Access Audit:</p>
              {auditLog.slice(0, 2).map((a) => (
                <p key={a.id} className="truncate font-mono-telemetry">
                  • [{a.viewerRole.toUpperCase()}] {a.crewName}: {a.action}
                </p>
              ))}
            </div>
          </div>
        </div>
      )}
    </section>
  );
};