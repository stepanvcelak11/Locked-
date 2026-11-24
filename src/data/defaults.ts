import type { AppData, LockItem, Settings, SolveRecord, ToolItem, ChallengeResult, Technique } from '../types';
import { mulberry32 } from '../lib/random';

export const DATA_VERSION = 1;

const DAY = 86400000;

export const defaultSettings: Settings = {
  sound: true,
  volume: 0.8,
  haptics: true,
  holdToStartMs: 500,
  requireTwoFingers: false,
  inspectionSec: 0,
  audioTrigger: false,
  audioThreshold: 0.55,
  hideTimeWhileRunning: false,
  simDifficulty: 'normal',
  showBindingHint: true,
  theme: 'light',
};

export function seedLocks(now = Date.now()): LockItem[] {
  return [
    {
      id: 'lock-acrylic',
      name: 'Průhledný trénovací zámek',
      brand: 'Generic Acrylic',
      mechanism: 'pin-tumbler',
      formFactor: 'padlock',
      pins: 5,
      belt: 'white',
      keyway: 'KW1 (široký)',
      pinConfig: [1, 2, 3, 4, 5].map((i) => ({ index: i, type: 'standard' as const })),
      bindingOrder: [3, 1, 5, 2, 4],
      notes: 'První zámek. Ideální na pochopení střižné roviny.',
      favorite: true,
      createdAt: now - 40 * DAY,
    },
    {
      id: 'lock-master3',
      name: 'No. 3 Laminated',
      brand: 'Master Lock',
      mechanism: 'pin-tumbler',
      formFactor: 'padlock',
      pins: 4,
      belt: 'yellow',
      keyway: 'Master',
      pinConfig: [1, 2, 3, 4].map((i) => ({ index: i, type: 'standard' as const })),
      bindingOrder: [2, 4, 1, 3],
      notes: 'Velké tolerance, jde i rakem.',
      createdAt: now - 35 * DAY,
    },
    {
      id: 'lock-master140',
      name: '140 Brass',
      brand: 'Master Lock',
      mechanism: 'pin-tumbler',
      formFactor: 'padlock',
      pins: 4,
      belt: 'orange',
      keyway: 'Master',
      pinConfig: [
        { index: 1, type: 'standard' },
        { index: 2, type: 'spool', note: 'výrazný false set' },
        { index: 3, type: 'standard' },
        { index: 4, type: 'spool' },
      ],
      bindingOrder: [1, 3, 2, 4],
      notes: 'Spooly – při false setu povolit napínák.',
      createdAt: now - 28 * DAY,
    },
    {
      id: 'lock-abus5540',
      name: '55/40',
      brand: 'Abus',
      mechanism: 'pin-tumbler',
      formFactor: 'padlock',
      pins: 5,
      belt: 'orange',
      keyway: 'Abus paracentrický',
      pinConfig: [
        { index: 1, type: 'standard' },
        { index: 2, type: 'standard' },
        { index: 3, type: 'spool' },
        { index: 4, type: 'standard' },
        { index: 5, type: 'spool' },
      ],
      bindingOrder: [4, 2, 1, 3, 5],
      notes: 'Úzký profil – lépe 0.020" planžeta.',
      createdAt: now - 20 * DAY,
    },
    {
      id: 'lock-american1100',
      name: '1100 Series',
      brand: 'American Lock',
      mechanism: 'pin-tumbler',
      formFactor: 'padlock',
      pins: 5,
      belt: 'green',
      keyway: 'American',
      pinConfig: [
        { index: 1, type: 'serrated' },
        { index: 2, type: 'spool' },
        { index: 3, type: 'serrated' },
        { index: 4, type: 'serrated' },
        { index: 5, type: 'spool' },
      ],
      bindingOrder: [2, 5, 1, 4, 3],
      notes: 'Serrated drivery dávají mnoho falešných kliknutí. Lehké napětí!',
      createdAt: now - 12 * DAY,
    },
  ];
}

export function seedTools(now = Date.now()): ToolItem[] {
  return [
    {
      id: 'tool-shorthook',
      name: 'Short Hook',
      manufacturer: 'Sparrows',
      category: 'pick',
      profile: 'short-hook',
      thickness: '0.025',
      position: 'n/a',
      notes: 'Univerzální SPP planžeta.',
      createdAt: now - 40 * DAY,
    },
    {
      id: 'tool-deephook',
      name: 'Deep Hook 1',
      manufacturer: 'Peterson',
      category: 'pick',
      profile: 'deep-hook',
      thickness: '0.018',
      position: 'n/a',
      notes: 'Na vysoká zadní stavítka.',
      createdAt: now - 30 * DAY,
    },
    {
      id: 'tool-halfdiamond',
      name: 'Half-Diamond',
      manufacturer: 'SouthOrd',
      category: 'pick',
      profile: 'half-diamond',
      thickness: '0.025',
      position: 'n/a',
      notes: '',
      createdAt: now - 30 * DAY,
    },
    {
      id: 'tool-cityrake',
      name: 'City Rake (L-Rake)',
      manufacturer: 'Multipick',
      category: 'rake',
      profile: 'city-rake',
      thickness: '0.020',
      position: 'n/a',
      notes: 'Rychlý raking na levné visací zámky.',
      createdAt: now - 25 * DAY,
    },
    {
      id: 'tool-tok',
      name: 'TOK Pry Bar',
      manufacturer: 'Peterson',
      category: 'tension',
      profile: 'tok-bar',
      thickness: '0.050',
      position: 'TOK',
      notes: 'Vroubkovaný hrot, drží v klíčové dírce.',
      createdAt: now - 40 * DAY,
    },
    {
      id: 'tool-bok',
      name: 'BOK Z-Wrench',
      manufacturer: 'SouthOrd',
      category: 'tension',
      profile: 'bok-wrench',
      thickness: '0.040',
      position: 'BOK',
      notes: '',
      createdAt: now - 40 * DAY,
    },
  ];
}

/** 25 historical solves with a believable learning curve. */
export function seedSolves(now = Date.now()): SolveRecord[] {
  const rnd = mulberry32(2024);
  const plan: { lock: string; base: number; final: number; count: number; pick: string; tension: string; tech: Technique }[] = [
    { lock: 'lock-acrylic', base: 95000, final: 9000, count: 6, pick: 'tool-shorthook', tension: 'tool-bok', tech: 'SPP' },
    { lock: 'lock-master3', base: 60000, final: 7000, count: 6, pick: 'tool-cityrake', tension: 'tool-bok', tech: 'Raking' },
    { lock: 'lock-master140', base: 180000, final: 42000, count: 6, pick: 'tool-shorthook', tension: 'tool-tok', tech: 'SPP' },
    { lock: 'lock-abus5540', base: 240000, final: 75000, count: 4, pick: 'tool-halfdiamond', tension: 'tool-tok', tech: 'SPP' },
    { lock: 'lock-american1100', base: 420000, final: 210000, count: 3, pick: 'tool-deephook', tension: 'tool-tok', tech: 'SPP' },
  ];
  const solves: SolveRecord[] = [];
  const notes = [
    '',
    '',
    '3. stavítko bylo spool, pomohlo povolit napínák.',
    'Přemačkal jsem zadní pin, reset.',
    '',
    'Lehčí napětí = rychlejší.',
    '',
  ];
  let k = 0;
  plan.forEach((p, li) => {
    const startDay = 26 - li * 4;
    for (let i = 0; i < p.count; i++) {
      const prog = i / Math.max(1, p.count - 1);
      const t = p.base * Math.pow(p.final / p.base, prog) * (0.85 + rnd() * 0.3);
      const dayOffset = startDay - (i * (startDay - 1)) / Math.max(1, p.count);
      const penaltyRoll = rnd();
      const penalty = li >= 3 && penaltyRoll < 0.22 ? 'DNF' : penaltyRoll > 0.93 ? '+2' : 'none';
      solves.push({
        id: `seed-${k++}`,
        time: Math.round(t),
        penalty,
        lockId: p.lock,
        pickId: p.pick,
        tensionId: p.tension,
        technique: p.tech,
        note: notes[Math.floor(rnd() * notes.length)],
        date: now - dayOffset * DAY - Math.floor(rnd() * 8) * 3600000,
        source: 'timer',
      });
    }
  });
  return solves.sort((a, b) => a.date - b.date);
}

export function seedChallenges(now = Date.now()): ChallengeResult[] {
  return [
    { id: 'seed-c1', kind: 'quiz-keyway', date: now - 6 * DAY, score: 1840, correct: 7, total: 10, bestStreak: 4 },
    { id: 'seed-c2', kind: 'quiz-xray', date: now - 4 * DAY, score: 2210, correct: 8, total: 10, bestStreak: 5 },
    {
      id: 'seed-c3',
      kind: 'gauntlet',
      date: now - 3 * DAY,
      difficulty: 'warmup',
      time: 41230,
      splits: [9840, 21500, 41230],
      rank: 'B',
      lockIds: ['lock-acrylic', 'lock-master3', 'lock-master140'],
      virtual: false,
    },
  ];
}

/**
 * withSamples: starter lock vault + tool arsenal (useful defaults for the timer).
 * withDemoHistory: fake solves/challenges – only when the user explicitly asks for a demo.
 */
export function createDefaultData(withSamples = true, withDemoHistory = false): AppData {
  const now = Date.now();
  return {
    version: DATA_VERSION,
    ethicsAccepted: false,
    locks: withSamples ? seedLocks(now) : [],
    tools: withSamples ? seedTools(now) : [],
    solves: withDemoHistory ? seedSolves(now) : [],
    challenges: withDemoHistory ? seedChallenges(now) : [],
    demoCleaned: true,
    settings: { ...defaultSettings },
    timerConfig: {
      lockId: withSamples ? 'lock-master140' : null,
      pickId: withSamples ? 'tool-shorthook' : null,
      tensionId: withSamples ? 'tool-tok' : null,
      technique: 'SPP',
    },
    badges: {},
    drills: {},
  };
}
