const DB_NAME = 'VitalOrbitOfflineVault';
const STORE_NAME = 'missionState';

export async function saveToIndexedDB(key: string, value: unknown): Promise<void> {
  if (typeof indexedDB === 'undefined') return;
  return new Promise((resolve) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      req.result.createObjectStore(STORE_NAME);
    };
    req.onsuccess = () => {
      const tx = req.result.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).put(value, key);
      tx.oncomplete = () => resolve();
    };
    req.onerror = () => resolve();
  });
}

export function exportMedicalSummaryReport(
  crewName: string,
  day: number,
  score: number,
  alertsSummary: string[]
) {
  const reportHtml = `
    <html>
      <head><title>VitalOrbit Medical Summary — ${crewName} (Day ${day})</title></head>
      <body style="font-family: Inter, sans-serif; padding: 32px; color: #0f172a;">
        <h1>ARES-V // VitalOrbit Medical Telemetry Summary</h1>
        <p><strong>Crew Member:</strong> ${crewName} | <strong>Mission Day:</strong> ${day} / 500</p>
        <p><strong>Composite Health Score:</strong> ${score} / 100</p>
        <p><em>Note: Synthetic mission telemetry dataset for NASA Space Apps 2026 demonstration.</em></p>
        <hr />
        <h2>Active Explainable Alerts & Protocols</h2>
        <ul>${alertsSummary.map((a) => `<li>${a}</li>`).join('') || '<li>All systems nominal.</li>'}</ul>
      </body>
    </html>
  `;
  const win = window.open('', '_blank');
  if (win) {
    win.document.write(reportHtml);
    win.document.close();
    win.print();
  }
}