import { create } from 'zustand';
import {
  AuditLogEntry,
  ConsentSettings,
  CrewMember,
  MissionEvent,
  OrganOverlay,
  QueuedMessage,
  ThemeMode,
  UserRole,
} from '../types/telemetry';
import { MISSION_EVENTS, SEEDED_CREW } from '../data/syntheticMissionData';
import { saveToIndexedDB } from '../utils/offlineDb';

export type CenterTab = 'overview' | 'sleep_msk' | 'behavioral' | 'simulator' | 'support';

interface VitalOrbitState {
  crew: CrewMember[];
  events: MissionEvent[];
  selectedCrewId: string;
  selectedDay: number;
  theme: ThemeMode;
  role: UserRole;
  activeOverlay: OrganOverlay;
  selectedOrganDrawer: OrganOverlay | null;
  activeTab: CenterTab;
  earthDelaySeconds: number;
  autonomousCareMode: boolean;
  demoIncidentStep: number; // 0 = off, 1..4 = guided story steps
  consent: ConsentSettings;
  auditLog: AuditLogEntry[];
  messageQueue: QueuedMessage[];

  setSelectedCrew: (id: string) => void;
  setSelectedDay: (day: number) => void;
  setTheme: (theme: ThemeMode) => void;
  setRole: (role: UserRole) => void;
  setActiveOverlay: (overlay: OrganOverlay) => void;
  setSelectedOrganDrawer: (organ: OrganOverlay | null) => void;
  setActiveTab: (tab: CenterTab) => void;
  setEarthDelaySeconds: (sec: number) => void;
  advanceDemoIncident: () => void;
  resetDemoIncident: () => void;
  toggleConsent: (key: keyof ConsentSettings) => void;
  submitDailyCheckIn: (crewId: string, values: { mood: number; stress: number; fatigue: number; motivation: number }) => void;
  recordPvtResult: (crewId: string, reactionMs: number) => void;
  queueFlightSurgeonMessage: (content: string) => void;
  tickTimers: () => void;
}

export const useVitalOrbitStore = create<VitalOrbitState>((set, get) => ({
  crew: SEEDED_CREW,
  events: MISSION_EVENTS,
  selectedCrewId: 'vance',
  selectedDay: 214,
  theme: 'daylight',
  role: 'surgeon',
  activeOverlay: 'cardiovascular',
  selectedOrganDrawer: null,
  activeTab: 'overview',
  earthDelaySeconds: 760, // 12m 40s one-way
  autonomousCareMode: true,
  demoIncidentStep: 0,
  consent: {
    physiological: true,
    sleepAndCircadian: true,
    cognitiveTests: true,
    behavioralCheckIn: true,
    voiceStressPassive: true,
  },
  auditLog: [
    {
      id: 'aud-1',
      timestamp: 'Day 214 06:12 UTC',
      viewerRole: 'surgeon',
      crewName: 'Spec. Marcus Vance',
      dataCategory: 'Cardiovascular & Core Temp',
      action: 'Reviewed automated z-score anomaly alert',
    },
    {
      id: 'aud-2',
      timestamp: 'Day 214 05:45 UTC',
      viewerRole: 'mcc',
      crewName: 'All Crew',
      dataCategory: 'Aggregate EVA Readiness',
      action: 'Synced telemetry packet (private behavioral masked)',
    },
  ],
  messageQueue: [
    {
      id: 'msg-init',
      timestamp: 'Day 214 06:15 UTC',
      senderRole: 'surgeon',
      recipient: 'Houston Flight Surgeon Desk',
      content: 'Autonomous protocol initiated for MS-04 (Vance): elevated HR/Temp; EVA-15 deferral advised.',
      deliveryEtaSeconds: 410,
      status: 'queued',
    },
  ],

  setSelectedCrew: (id) => {
    const member = get().crew.find((c) => c.id === id);
    set((state) => ({
      selectedCrewId: id,
      auditLog: [
        {
          id: `aud-${Date.now()}`,
          timestamp: `Day ${state.selectedDay} LIVE`,
          viewerRole: state.role,
          crewName: member?.name || id,
          dataCategory: 'Biometric Profile',
          action: 'Opened crew telemetry console',
        },
        ...state.auditLog.slice(0, 19),
      ],
    }));
  },

  setSelectedDay: (day) => set({ selectedDay: Math.max(1, Math.min(500, day)) }),
  setTheme: (theme) => set({ theme }),
  setRole: (role) => set({ role }),
  setActiveOverlay: (activeOverlay) => set({ activeOverlay }),
  setSelectedOrganDrawer: (selectedOrganDrawer) => set({ selectedOrganDrawer }),
  setActiveTab: (activeTab) => set({ activeTab }),
  setEarthDelaySeconds: (earthDelaySeconds) =>
    set({ earthDelaySeconds, autonomousCareMode: earthDelaySeconds >= 300 }),

  advanceDemoIncident: () => {
    const next = (get().demoIncidentStep + 1) % 5;
    if (next === 1) {
      set({
        demoIncidentStep: 1,
        selectedCrewId: 'vance',
        selectedDay: 214,
        activeOverlay: 'cardiovascular',
        activeTab: 'overview',
        selectedOrganDrawer: null,
      });
    } else if (next === 2) {
      set({ demoIncidentStep: 2, selectedOrganDrawer: 'cardiovascular' });
    } else if (next === 3) {
      set({ demoIncidentStep: 3, selectedOrganDrawer: null, activeTab: 'simulator' });
    } else if (next === 4) {
      set({ demoIncidentStep: 4, activeTab: 'support' });
    } else {
      set({ demoIncidentStep: 0, selectedOrganDrawer: null, activeTab: 'overview' });
    }
  },

  resetDemoIncident: () => set({ demoIncidentStep: 0, selectedOrganDrawer: null }),

  toggleConsent: (key) =>
    set((state) => {
      const updated = { ...state.consent, [key]: !state.consent[key] };
      saveToIndexedDB('consent', updated);
      return { consent: updated };
    }),

  submitDailyCheckIn: (crewId, values) =>
    set((state) => {
      const updatedCrew = state.crew.map((member) => {
        if (member.id !== crewId) return member;
        const telemetry = member.telemetry.map((entry) =>
          entry.day === state.selectedDay ? { ...entry, ...values } : entry
        );
        return { ...member, telemetry };
      });
      saveToIndexedDB('crewTelemetry', updatedCrew);
      return { crew: updatedCrew };
    }),

  recordPvtResult: (crewId, reactionMs) =>
    set((state) => {
      const updatedCrew = state.crew.map((member) => {
        if (member.id !== crewId) return member;
        const telemetry = member.telemetry.map((entry) =>
          entry.day === state.selectedDay ? { ...entry, pvtReactionMs: reactionMs } : entry
        );
        return { ...member, telemetry };
      });
      return { crew: updatedCrew };
    }),

  queueFlightSurgeonMessage: (content) =>
    set((state) => {
      const msg: QueuedMessage = {
        id: `msg-${Date.now()}`,
        timestamp: `Day ${state.selectedDay} LIVE`,
        senderRole: state.role,
        recipient: 'Ground Flight Surgeon (Delayed Link)',
        content,
        deliveryEtaSeconds: state.earthDelaySeconds,
        status: 'queued',
      };
      return { messageQueue: [msg, ...state.messageQueue] };
    }),

  tickTimers: () =>
    set((state) => ({
      messageQueue: state.messageQueue.map((m) =>
        m.deliveryEtaSeconds > 1
          ? { ...m, deliveryEtaSeconds: m.deliveryEtaSeconds - 1 }
          : { ...m, deliveryEtaSeconds: 0, status: 'transmitted' }
      ),
    })),
}));