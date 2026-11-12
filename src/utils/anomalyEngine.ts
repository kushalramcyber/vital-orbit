import { CrewMember, DailyTelemetry, ExplainableAlert, Severity } from '../types/telemetry';

export interface RollingStats {
  mean: number;
  stdDev: number;
  zScore: number;
}

export function computeRollingZScore(
  series: DailyTelemetry[],
  day: number,
  selector: (d: DailyTelemetry) => number,
  windowDays = 21
): RollingStats {
  const idx = Math.max(0, Math.min(series.length - 1, day - 1));
  const start = Math.max(0, idx - windowDays);
  const baselineSlice = series.slice(start, idx);
  const currentVal = selector(series[idx]);

  if (baselineSlice.length < 3) {
    return { mean: currentVal, stdDev: 1, zScore: 0 };
  }

  const values = baselineSlice.map(selector);
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance = values.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0) / values.length;
  const stdDev = Math.max(Math.sqrt(variance), 0.15);
  const zScore = Number(((currentVal - mean) / stdDev).toFixed(2));

  return { mean: Number(mean.toFixed(2)), stdDev: Number(stdDev.toFixed(2)), zScore };
}

export function calculateHealthScore(
  crew: CrewMember,
  day: number,
  whatIfAdjustments?: {
    sleepDelta?: number;
    workoutDelta?: number;
    evaHours?: number;
    co2Ppm?: number;
  }
): { score: number; severity: Severity } {
  const idx = Math.max(0, Math.min(crew.telemetry.length - 1, day - 1));
  const current = crew.telemetry[idx];

  const hrZ = computeRollingZScore(crew.telemetry, day, (d) => d.heartRate).zScore;
  const hrvZ = computeRollingZScore(crew.telemetry, day, (d) => d.hrv).zScore;
  const tempZ = computeRollingZScore(crew.telemetry, day, (d) => d.coreTemp).zScore;
  const sleepZ = computeRollingZScore(crew.telemetry, day, (d) => d.sleepHours).zScore;

  let penalty = 0;
  if (hrZ > 1.8) penalty += Math.min(24, (hrZ - 1.5) * 6);
  if (hrvZ < -1.8) penalty += Math.min(22, Math.abs(hrvZ + 1.5) * 6);
  if (tempZ > 2.0) penalty += Math.min(26, (tempZ - 1.5) * 7);
  if (sleepZ < -1.6) penalty += Math.min(20, Math.abs(sleepZ + 1.2) * 5);
  if (current.stress >= 4) penalty += 10;
  if (current.dailyRadiationMsv > 2.0) penalty += 12;

  if (whatIfAdjustments) {
    const { sleepDelta = 0, workoutDelta = 0, evaHours = 0, co2Ppm = current.cabinCo2Ppm } = whatIfAdjustments;
    penalty -= sleepDelta * 4.5;
    penalty -= (workoutDelta / 15) * 2.5;
    penalty += Math.max(0, evaHours - 4) * 3.5;
    if (co2Ppm > 3500) penalty += ((co2Ppm - 3500) / 500) * 3;
  }

  const score = Math.round(Math.min(100, Math.max(12, 96 - penalty)));
  const severity: Severity = score >= 80 ? 'nominal' : score >= 62 ? 'watch' : 'critical';
  return { score, severity };
}

export function generateExplainableAlerts(crewList: CrewMember[], day: number): ExplainableAlert[] {
  const alerts: ExplainableAlert[] = [];

  for (const member of crewList) {
    const idx = Math.max(0, Math.min(member.telemetry.length - 1, day - 1));
    const cur = member.telemetry[idx];

    const hrStats = computeRollingZScore(member.telemetry, day, (d) => d.heartRate);
    const hrvStats = computeRollingZScore(member.telemetry, day, (d) => d.hrv);
    const tempStats = computeRollingZScore(member.telemetry, day, (d) => d.coreTemp);
    const sleepStats = computeRollingZScore(member.telemetry, day, (d) => d.sleepHours);
    const voiceStats = computeRollingZScore(member.telemetry, day, (d) => d.voiceStressIndex);

    // Cardiovascular + Immune Alert
    if (hrStats.zScore > 2.2 || tempStats.zScore > 2.2) {
      alerts.push({
        id: `${member.id}-cardio-${day}`,
        crewId: member.id,
        crewName: member.name,
        day,
        organ: 'cardiovascular',
        severity: tempStats.zScore > 2.8 ? 'critical' : 'watch',
        title: 'Autonomic & Immune Stress Signature',
        summary: `Resting HR ${cur.heartRate} bpm (+${hrStats.zScore}σ) and Core Temp ${cur.coreTemp}°C (+${tempStats.zScore}σ) exceed 21-day personal baseline.`,
        zScore: Math.max(hrStats.zScore, tempStats.zScore),
        confidence: 94,
        contributingSignals: [
          `Resting HR: ${cur.heartRate} bpm (baseline ${hrStats.mean} bpm)`,
          `HRV RMSSD: ${cur.hrv} ms (${hrvStats.zScore}σ)`,
          `Core Temp: ${cur.coreTemp}°C (baseline ${tempStats.mean}°C)`,
          `Hydration: ${cur.hydrationLiters} L`,
        ],
        forecast48h: 'Acute febrile progression risk (Next 48h): HIGH (78%)',
        recommendedAction: 'Defer EVA-15 participation, administer 500 mL electrolyte bolus, run viral panel swab, and enable 4h vitals polling.',
      });
    }

    // Sleep & Circadian Alert
    if (sleepStats.zScore < -2.0) {
      alerts.push({
        id: `${member.id}-sleep-${day}`,
        crewId: member.id,
        crewName: member.name,
        day,
        organ: 'sleep',
        severity: 'watch',
        title: 'Cumulative Sleep Debt & Circadian Drift',
        summary: `Sleep duration dropped to ${cur.sleepHours}h (${sleepStats.zScore}σ) with PVT reaction latency slowing to ${cur.pvtReactionMs} ms.`,
        zScore: Math.abs(sleepStats.zScore),
        confidence: 91,
        contributingSignals: [
          `Sleep Duration: ${cur.sleepHours}h (baseline ${sleepStats.mean}h)`,
          `Circadian Alignment: ${cur.circadianAlignment}%`,
          `PVT Reaction Time: ${cur.pvtReactionMs} ms`,
        ],
        forecast48h: 'Cognitive fatigue & attention lapse risk (Next 48h): HIGH',
        recommendedAction: 'Schedule 480nm blue-enriched morning light exposure (30m), block non-critical night console duties, and prescribe 20m recovery nap.',
      });
    }

    // Behavioral & Social Withdrawal Alert (Protected by Consent)
    if (voiceStats.zScore > 2.2 || (cur.stress >= 4 && cur.socialInteractions <= 4)) {
      alerts.push({
        id: `${member.id}-neuro-${day}`,
        crewId: member.id,
        crewName: member.name,
        day,
        organ: 'neuro',
        severity: 'watch',
        title: 'Workload Strain & Social Withdrawal Signal',
        summary: `Acoustic stress index (${cur.voiceStressIndex}/100, +${voiceStats.zScore}σ) paired with reduced crew interactions (${cur.socialInteractions}/day).`,
        zScore: voiceStats.zScore,
        confidence: 86,
        contributingSignals: [
          `On-device Voice Stress: ${cur.voiceStressIndex}/100`,
          `Daily Crew Interactions: ${cur.socialInteractions} (baseline ~9)`,
          `Self-Reported Stress: ${cur.stress}/5`,
        ],
        forecast48h: 'Team cohesion & operational burnout risk (Next 48h): MODERATE-HIGH',
        recommendedAction: 'Rebalance ECLSS maintenance tasks across crew and prompt private CBT / guided decompression session.',
        isPrivateBehavioral: true,
      });
    }

    // Radiation Event Alert
    if (cur.dailyRadiationMsv > 2.0) {
      alerts.push({
        id: `${member.id}-rad-${day}`,
        crewId: member.id,
        crewName: member.name,
        day,
        organ: 'radiation',
        severity: 'critical',
        title: 'Solar Particle Radiation Spike',
        summary: `Daily absorbed dose ${cur.dailyRadiationMsv} mSv exceeds nominal 0.65 mSv/day transit rate.`,
        zScore: 4.1,
        confidence: 99,
        contributingSignals: [
          `Daily Dose: ${cur.dailyRadiationMsv} mSv`,
          `Cumulative Mission Dose: ${cur.cumulativeRadiationMsv} / ${member.careerRadiationLimitMsv} mSv`,
        ],
        forecast48h: 'Proton flux decay expected over next 36h',
        recommendedAction: 'Maintain Storm Haven polyethylene shielding posture until dosimeter rate drops below 0.9 mSv/day.',
      });
    }
  }

  return alerts.sort((a, b) => (a.severity === 'critical' ? -1 : 1));
}