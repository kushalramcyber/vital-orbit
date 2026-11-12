import { useEffect } from 'react';
import { useVitalOrbitStore } from './store/useVitalOrbitStore';
import { TopBar } from './components/TopBar';
import { CrewRoster } from './components/CrewRoster';
import { CenterWorkspace } from './components/CenterWorkspace';
import { RightAlertsPanel } from './components/RightAlertsPanel';
import { TimelineScrubber } from './components/TimelineScrubber';

export function App() {
  const theme = useVitalOrbitStore((s) => s.theme);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  return (
    <div className="min-h-screen app-canvas flex flex-col">
      <TopBar />

      <main className="flex-1 max-w-[1600px] w-full mx-auto px-4 py-4 grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        <div className="lg:col-span-3 xl:col-span-2">
          <CrewRoster />
        </div>

        <div className="lg:col-span-6 xl:col-span-7">
          <CenterWorkspace />
        </div>

        <div className="lg:col-span-3">
          <RightAlertsPanel />
        </div>
      </main>

      <div className="max-w-[1600px] w-full mx-auto px-4 pb-5">
        <TimelineScrubber />
      </div>
    </div>
  );
}

export default App;