import { CrewMember, DailyTelemetry, MissionEvent } from '../types/telemetry';

/**
 * Pluggable Data Adapter Interface for NASA OSDR, ISS HRP datasets, or wearable streams.
 */
export interface TelemetryDataAdapter {
  sourceName: string;
  isSynthetic: boolean;
  fetchCrewMissionData(): Promise<{ crew: CrewMember[]; events: MissionEvent[] }>;
}

function seededRandom(seed: number): () => number {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function generateCrewSeries(
  crewId: string,
  seed: number,
  baselines: {
    hr: number;
    hrv: number;
    sys: number;
    dia: number;
    temp: number;
    sleep: number;
    muscle: number;
    pvt: number;
  }
): DailyTelemetry[] {
  const rand = seededRandom(seed);
  const series: DailyTelemetry[] = [];
  let cumRad = 42;

  for (let day = 1; day <= 500; day++) {
    const n = () => (rand() - 0.5) * 2;
    let dailyRad = 0.62 + n() * 0.12;
    let cabinCo2 = 2400 + n() * 350;

    // Injected Anomaly 1: Day 198 Solar Particle Event (affects all crew)
    if (day >= 198 && day <= 200) {
      dailyRad += day === 199 ? 4.8 : 2.1;
    }

    // Injected Anomaly 2: Day 212-214 Cabin CO2 scrubber efficiency dip
    if (day >= 212 && day <= 214) {
      cabinCo2 = 4350 + n() * 180;
    }

    cumRad = Number((cumRad + dailyRad).toFixed(2));

    let hr = baselines.hr + n() * 3.5;
    let hrv = baselines.hrv + n() * 6;
    let sys = baselines.sys + n() * 4;
    let dia = baselines.dia + n() * 3;
    let spo2 = 98 + n() * 0.8;
    let respRate = 14 + n() * 1.2;
    let coreTemp = baselines.temp + n() * 0.14;
    let hydration = 2.4 + n() * 0.3;
    let glucose = 94 + n() * 7;
    let sleepHours = baselines.sleep + n() * 0.45;
    let sleepEff = 88 + n() * 4;
    let circadian = 91 + n() * 5;
    let resistive = day % 7 === 0 ? 0 : 58 + n() * 8;
    let aerobic = day % 7 === 0 ? 15 : 30 + n() * 5;
    let mood = 4.2 + n() * 0.5;
    let stress = 2.0 + n() * 0.5;
    let fatigue = 2.1 + n() * 0.5;
    let motivation = 4.4 + n() * 0.4;
    let pvt = baselines.pvt + n() * 12;
    let social = 9 + Math.round(n() * 3);
    let voiceStress = 24 + n() * 8;
    let sansRisk = Math.min(85, 18 + day * 0.09 + n() * 3);
    let vestibular = day < 14 ? 45 - day * 2 : 11 + n() * 4;

    // Injected Anomaly 3: Commander Reyes acute sleep disruption (Days 209-214)
    if (crewId === 'reyes' && day >= 209 && day <= 214) {
      sleepHours = 4.6 + n() * 0.35;
      sleepEff = 69 + n() * 4;
      circadian = 64 + n() * 5;
      hrv -= 19;
      pvt += 58;
      fatigue = 4.3;
      stress = 3.7;
    }

    // Injected Anomaly 4: Spec. Marcus Vance early viral/immune onset (Days 212-214)
    if (crewId === 'vance' && day >= 212 && day <= 214) {
      hr += 19;
      hrv -= 26;
      coreTemp += day === 214 ? 1.15 : 0.65;
      respRate += 4.2;
      spo2 -= 1.8;
      hydration -= 0.65;
      fatigue = 4.6;
      mood = 2.4;
    }

    // Injected Anomaly 5: Eng. Priya Nair interpersonal / workload strain (Days 210-214)
    if (crewId === 'nair' && day >= 210 && day <= 214) {
      stress = 4.2;
      mood = 2.6;
      social = 3;
      voiceStress = 68;
      resistive = 25;
    }

    const boneDensity = Number((100 - day * 0.011 + (resistive > 50 ? 0.15 : -0.1)).toFixed(2));
    const muscleMass = Number((baselines.muscle - day * 0.003 + (resistive > 50 ? 0.12 : -0.08)).toFixed(2));

    series.push({
      day,
      heartRate: Math.round(hr),
      hrv: Math.max(18, Math.round(hrv)),
      systolic: Math.round(sys),
      diastolic: Math.round(dia),
      spo2: Number(Math.min(100, Math.max(91, spo2)).toFixed(1)),
      respRate: Number(respRate.toFixed(1)),
      coreTemp: Number(coreTemp.toFixed(2)),
      skinTemp: Number((coreTemp - 1.9 + n() * 0.2).toFixed(2)),
      hydrationLiters: Number(Math.max(1.1, hydration).toFixed(2)),
      glucose: Math.round(glucose),
      sleepHours: Number(Math.max(3.5, sleepHours).toFixed(1)),
      sleepEfficiency: Math.round(Math.min(98, Math.max(55, sleepEff))),
      remPercent: Math.round(21 + n() * 4),
      deepPercent: Math.round(18 + n() * 4),
      circadianAlignment: Math.round(Math.min(100, Math.max(45, circadian))),
      boneDensityIndex: boneDensity,
      muscleMassKg: muscleMass,
      resistiveMins: Math.max(0, Math.round(resistive)),
      aerobicMins: Math.max(0, Math.round(aerobic)),
      dailyRadiationMsv: Number(dailyRad.toFixed(2)),
      cumulativeRadiationMsv: cumRad,
      cabinCo2Ppm: Math.round(cabinCo2),
      sansRiskScore: Math.round(sansRisk),
      vestibularScore: Math.max(4, Math.round(vestibular)),
      caloriesKcal: Math.round(2650 + n() * 220),
      mood: Number(Math.min(5, Math.max(1, mood)).toFixed(1)),
      stress: Number(Math.min(5, Math.max(1, stress)).toFixed(1)),
      fatigue: Number(Math.min(5, Math.max(1, fatigue)).toFixed(1)),
      motivation: Number(Math.min(5, Math.max(1, motivation)).toFixed(1)),
      pvtReactionMs: Math.round(pvt),
      memorySpan: Math.max(5, Math.round(8 + n() * 1.1 - (pvt > 290 ? 1.5 : 0))),
      socialInteractions: Math.max(1, social),
      voiceStressIndex: Math.round(Math.min(95, Math.max(10, voiceStress))),
    });
  }
  return series;
}

export const MISSION_EVENTS: MissionEvent[] = [
  { day: 194, crewId: 'all', type: 'eva', title: 'EVA-14 Hull Inspection', description: '5.5h external truss sensor replacement.' },
  { day: 199, crewId: 'all', type: 'radiation', title: 'Solar Particle Event (SPE-04)', description: 'Crew sheltered in Storm Haven; +4.8 mSv spike.' },
  { day: 205, crewId: 'sato', type: 'exercise', title: 'ARED Peak Load Milestone', description: 'Dr. Sato achieved 104% pre-flight squat baseline.' },
  { day: 209, crewId: 'reyes', type: 'sleep', title: 'Circadian Phase Drift', description: 'Night-shift telemetry ops shifted sleep onset by +3.2h.' },
  { day: 211, crewId: 'nair', type: 'conflict', title: 'ECLSS Maintenance Friction', description: 'Elevated acoustic stress & reduced crew comms logged.' },
  { day: 213, crewId: 'vance', type: 'illness', title: 'Early Febrile / Immune Response', description: 'Resting HR +19 bpm, HRV -26 ms, Core Temp 38.0°C.' },
  { day: 214, crewId: 'all', type: 'eva', title: 'Scheduled EVA-15 Readiness Gate', description: 'Autonomous medical clearance check before airlock depressurization.' },
];

export const SEEDED_CREW: CrewMember[] = [
  {
    id: 'reyes',
    name: 'Cmdr. Elena Reyes',
    callsign: 'CDR-01',
    role: 'Mission Commander',
    age: 41,
    avatarInitials: 'ER',
    careerRadiationLimitMsv: 600,
    telemetry: generateCrewSeries('reyes', 101, {
      hr: 61, hrv: 68, sys: 116, dia: 74, temp: 36.7, sleep: 7.4, muscle: 54.2, pvt: 238,
    }),
  },
  {
    id: 'sato',
    name: 'Dr. Kenji Sato',
    callsign: 'CMO-02',
    role: 'Crew Medical Officer',
    age: 38,
    avatarInitials: 'KS',
    careerRadiationLimitMsv: 600,
    telemetry: generateCrewSeries('sato', 202, {
      hr: 58, hrv: 74, sys: 114, dia: 72, temp: 36.6, sleep: 7.6, muscle: 61.5, pvt: 229,
    }),
  },
  {
    id: 'nair',
    name: 'Eng. Priya Nair',
    callsign: 'FE-03',
    role: 'Flight & ECLSS Engineer',
    age: 35,
    avatarInitials: 'PN',
    careerRadiationLimitMsv: 600,
    telemetry: generateCrewSeries('nair', 303, {
      hr: 65, hrv: 64, sys: 118, dia: 76, temp: 36.8, sleep: 7.2, muscle: 51.8, pvt: 242,
    }),
  },
  {
    id: 'vance',
    name: 'Spec. Marcus Vance',
    callsign: 'MS-04',
    role: 'Payload & EVA Specialist',
    age: 36,
    avatarInitials: 'MV',
    careerRadiationLimitMsv: 600,
    telemetry: generateCrewSeries('vance', 404, {
      hr: 63, hrv: 70, sys: 120, dia: 77, temp: 36.7, sleep: 7.5, muscle: 68.4, pvt: 234,
    }),
  },
];

export const SyntheticMissionAdapter: TelemetryDataAdapter = {
  sourceName: 'VitalOrbit Synthetic Deep-Space Generator v2.6 (Labeled Synthetic)',
  isSynthetic: true,
  async fetchCrewMissionData() {
    return { crew: SEEDED_CREW, events: MISSION_EVENTS };
  },
};