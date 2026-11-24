import type { AppData } from '../types';
import { createDefaultData, DATA_VERSION, defaultSettings } from '../data/defaults';

const KEY = 'locked.data.v1';

export function loadData(): AppData {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return createDefaultData(true);
    return migrate(JSON.parse(raw));
  } catch {
    return createDefaultData(true);
  }
}

export function saveData(d: AppData) {
  try {
    localStorage.setItem(KEY, JSON.stringify(d));
  } catch (e) {
    console.warn('Unable to persist data', e);
  }
}

/** Validate + fill in missing fields of an imported / stored profile. */
export function migrate(raw: unknown): AppData {
  if (!raw || typeof raw !== 'object') throw new Error('Neplatný soubor zálohy.');
  const r = raw as Partial<AppData>;
  if (!Array.isArray(r.locks) || !Array.isArray(r.tools) || !Array.isArray(r.solves)) {
    throw new Error('Soubor neobsahuje data aplikace Locked.');
  }
  const base = createDefaultData(false);
  // Older versions auto-filled a fresh install with a fake history. Drop it once (real records are kept).
  const isSeed = (x: { id?: string }) => typeof x?.id === 'string' && x.id.startsWith('seed-');
  const cleanDemo = !r.demoCleaned;
  const solves = r.solves.filter((s) => typeof s?.time === 'number' && !(cleanDemo && isSeed(s)));
  const challenges = (Array.isArray(r.challenges) ? r.challenges : []).filter((c) => !(cleanDemo && isSeed(c)));
  const removedDemo = cleanDemo && (solves.length !== r.solves.length || challenges.length !== (r.challenges?.length ?? 0));
  return {
    ...base,
    ...r,
    version: DATA_VERSION,
    ethicsAccepted: !!r.ethicsAccepted,
    locks: r.locks.map((l) => ({ ...l, pinConfig: l.pinConfig ?? [], bindingOrder: l.bindingOrder ?? [], notes: l.notes ?? '', formFactor: l.formFactor ?? 'padlock' })),
    tools: r.tools.map((t) => ({ ...t, notes: t.notes ?? '', position: t.position ?? 'n/a' })),
    solves,
    challenges,
    settings: { ...defaultSettings, ...(r.settings ?? {}) },
    timerConfig: { ...base.timerConfig, ...(r.timerConfig ?? {}) },
    // badges earned only thanks to the demo history are re-evaluated from real data
    badges: removedDemo ? {} : (r.badges ?? {}),
    demoCleaned: true,
    drills: r.drills ?? {},
  };
}

export function exportFile(d: AppData) {
  const blob = new Blob([JSON.stringify({ app: 'locked', exportedAt: new Date().toISOString(), data: d }, null, 2)], {
    type: 'application/json',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const date = new Date().toISOString().slice(0, 10);
  a.href = url;
  a.download = `locked-zaloha-${date}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

export async function importFile(file: File): Promise<AppData> {
  const text = await file.text();
  const json = JSON.parse(text);
  return migrate(json?.app === 'locked' ? json.data : json);
}

export function solvesToCsv(d: AppData): string {
  const lock = (id: string | null) => d.locks.find((l) => l.id === id)?.name ?? '';
  const tool = (id: string | null) => d.tools.find((l) => l.id === id)?.name ?? '';
  const rows = [['datum', 'cas_ms', 'penalizace', 'zamek', 'planzeta', 'napinak', 'technika', 'poznamka']];
  for (const s of d.solves) {
    rows.push([new Date(s.date).toISOString(), String(s.time), s.penalty, lock(s.lockId), tool(s.pickId), tool(s.tensionId), s.technique, s.note]);
  }
  return rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
}
