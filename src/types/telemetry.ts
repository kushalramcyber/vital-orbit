export type ThemeMode = 'dark' | 'daylight' | 'redshift';
export type UserRole = 'astronaut' | 'surgeon' | 'mcc';
export type Severity = 'nominal' | 'watch' | 'critical';
export type OrganOverlay = 'cardiovascular' | 'musculoskeletal' | 'neuro' | 'sleep' | 'radiation';

export interface DailyTelemetry {
  day: number;
  heartRate: number; // bpm
  hrv: number; // ms RMSSD
  systolic: number; // mmHg
  diastolic: number; // mmHg
  spo2: number; // %
  respRate: number; // breaths/min
  coreTemp: number; // °C
  skinTemp: number; // °C
  hydrationLiters: number; // L
  glucose: number; // mg/dL
  sleepHours: number;
  sleepEfficiency: number; // %
  remPercent: number;
  deepPercent: number;
  circadianAlignment: number; // 0-100
  boneDensityIndex: number; // % of pre-flight baseline
  muscleMassKg: number;
  resistiveMins: number; // target 60
  aerobicMins: number; // target 30
  dailyRadiationMsv: number;
  cumulativeRadiationMsv: number; // career limit 600 mSv
  cabinCo2Ppm: number;
  sansRiskScore: number; // Spaceflight Associated Neuro-ocular Syndrome (0-100)
  vestibularScore: number; // motion sickness / spatial disorientation (0-100)
  caloriesKcal: number;
  mood: number; // 1-5
  stress: number; // 1-5
  fatigue: number; // 1-5
  motivation: number; // 1-5
  pvtReactionMs: number; // Psychomotor Vigilance Test ms
  memorySpan: number; // digits
  socialInteractions: number; // daily crew interactions
  voiceStressIndex: number; // 0-100 on-device acoustic estimate
}

export interface MissionEvent {
  day: number;
  crewId: string | 'all';
  type: 'eva' | 'exercise' | 'sleep' | 'radiation' | 'illness' | 'conflict';
  title: string;
  description: string;
}

export interface CrewMember {
  id: string;
  name: string;
  callsign: string;
  role: string;
  age: number;
  avatarInitials: string;
  careerRadiationLimitMsv: number;
  telemetry: DailyTelemetry[];
}

export interface ExplainableAlert {
  id: string;
  crewId: string;
  crewName: string;
  day: number;
  organ: OrganOverlay;
  severity: Severity;
  title: string;
  summary: string;
  zScore: number;
  confidence: number;
  contributingSignals: string[];
  forecast48h: string;
  recommendedAction: string;
  isPrivateBehavioral?: boolean;
}

export interface ConsentSettings {
  physiological: boolean;
  sleepAndCircadian: boolean;
  cognitiveTests: boolean;
  behavioralCheckIn: boolean;
  voiceStressPassive: boolean;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  viewerRole: UserRole;
  crewName: string;
  dataCategory: string;
  action: string;
}

export interface QueuedMessage {
  id: string;
  timestamp: string;
  senderRole: UserRole;
  recipient: string;
  content: string;
  deliveryEtaSeconds: number;
  status: 'queued' | 'transmitted';
}