import React from 'react';
import { Calendar, Flag } from 'lucide-react';
import { useVitalOrbitStore } from '../store/useVitalOrbitStore';

export const TimelineScrubber: React.FC = () => {
  const { selectedDay, setSelectedDay, events, setSelectedCrew } = useVitalOrbitStore();

  return (
    <footer className="app-card rounded-2xl p-4">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
        <div className="flex items-center gap-2 text-xs">
          <div className="p-1.5 rounded-lg accent-pill">
            <Calendar className="w-3.5 h-3.5" />
          </div>
          <span className="font-bold">Mission Timeline Scrubber</span>
          <span className="font-mono-telemetry font-bold text-sky-600">Sol {selectedDay} / 500</span>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {events.map((ev) => (
            <button
              key={`${ev.day}-${ev.title}`}
              onClick={() => {
                setSelectedDay(ev.day);
                if (ev.crewId !== 'all') setSelectedCrew(ev.crewId);
              }}
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[11px] font-mono-telemetry transition-all cursor-pointer ${
                selectedDay === ev.day ? 'accent-pill font-bold shadow-xs' : 'elevated-card opacity-85 hover:opacity-100'
              }`}
              title={ev.description}
            >
              <Flag className="w-2.5 h-2.5 text-amber-500" />
              Sol {ev.day}: {ev.title}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <span className="text-[11px] font-mono-telemetry font-semibold opacity-65">Sol 1</span>
        <input
          type="range"
          min={1}
          max={500}
          value={selectedDay}
          onChange={(e) => setSelectedDay(Number(e.target.value))}
          aria-label="Replay mission day"
          className="flex-1 accent-sky-600 cursor-pointer"
        />
        <span className="text-[11px] font-mono-telemetry font-semibold opacity-65">Sol 500</span>
      </div>
    </footer>
  );
};