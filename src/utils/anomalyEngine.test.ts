import { describe, expect, it } from 'vitest';
import { SEEDED_CREW } from '../data/syntheticMissionData';
import { calculateHealthScore, computeRollingZScore, generateExplainableAlerts } from './anomalyEngine';

describe('VitalOrbit Anomaly & Baseline Engine', () => {
  it('flags Spec. Marcus Vance febrile/cardiovascular spike on Sol 214', () => {
    const vance = SEEDED_CREW.find((c) => c.id === 'vance')!;
    const hrStats = computeRollingZScore(vance.telemetry, 214, (d) => d.heartRate);
    expect(hrStats.zScore).toBeGreaterThan(2.2);

    const alerts = generateExplainableAlerts(SEEDED_CREW, 214);
    expect(alerts.some((a) => a.crewId === 'vance' && a.severity === 'critical')).toBe(true);
  });

  it('reduces predicted Health Score when simulating high cabin CO2 and extended EVA', () => {
    const sato = SEEDED_CREW.find((c) => c.id === 'sato')!;
    const base = calculateHealthScore(sato, 214).score;
    const stressed = calculateHealthScore(sato, 214, { evaHours: 8, co2Ppm: 4600, sleepDelta: -2 }).score;
    expect(stressed).toBeLessThan(base);
  });
});