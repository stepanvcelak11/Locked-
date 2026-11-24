import type { AppData, SimLockSpec } from '../types';

export type DrillCheck =
  | { kind: 'manual' }
  | { kind: 'sim'; pins: number; blind: boolean; timeLimit?: number; maxTension?: number; spools?: number; serrated?: number; count: number; tool?: string }
  | { kind: 'timer'; count: number; technique?: 'SPP' | 'Raking'; maxTime?: number }
  | { kind: 'quiz'; minCorrect: number };

export interface DrillDef {
  id: string;
  title: string;
  icon: string;
  focus: string;
  description: string;
  check: DrillCheck;
  xp: number;
}

export const DRILLS: DrillDef[] = [
  {
    id: 'featherweight',
    title: 'Jemná ruka (Featherweight)',
    icon: '🪶',
    focus: 'Kontrola napětí',
    description: 'Otevři 3 zámky v simulátoru s napětím, které nikdy nepřekročí 35 %.',
    check: { kind: 'sim', pins: 5, blind: false, maxTension: 0.35, count: 3 },
    xp: 40,
  },
  {
    id: 'spp-only',
    title: 'Pouze SPP',
    icon: '🎯',
    focus: 'Single Pin Picking',
    description: 'Zákaz rake planžet. Otevři 3 reálné zámky stavítko po stavítku – zaznamenej je stopkami s technikou SPP.',
    check: { kind: 'timer', count: 3, technique: 'SPP' },
    xp: 50,
  },
  {
    id: 'blind-5',
    title: 'Zámek naslepo',
    icon: '🙈',
    focus: 'Hmatová & zvuková zpětná vazba',
    description: 'Zvládni 5pinový zámek v Blind módu simulátoru do 45 sekund.',
    check: { kind: 'sim', pins: 5, blind: true, timeLimit: 45000, count: 1 },
    xp: 60,
  },
  {
    id: 'spool-master',
    title: 'Mistr spoolů',
    icon: '🧵',
    focus: 'False set & counter-rotation',
    description: 'Otevři v simulátoru 5pinový zámek se 3 spool piny.',
    check: { kind: 'sim', pins: 5, blind: false, spools: 3, count: 1 },
    xp: 60,
  },
  {
    id: 'serrated-ear',
    title: 'Vroubkované ucho',
    icon: '👂',
    focus: 'Rozlišení mikro-kliknutí',
    description: 'Otevři 4pinový zámek se 2 serrated piny v Blind módu.',
    check: { kind: 'sim', pins: 4, blind: true, serrated: 2, count: 1 },
    xp: 60,
  },
  {
    id: 'six-pack',
    title: 'Šestipinová výzva',
    icon: '🔩',
    focus: 'Výdrž',
    description: 'Otevři 6pinový zámek v simulátoru (s 1 spoolem a 1 serrated).',
    check: { kind: 'sim', pins: 6, blind: false, spools: 1, serrated: 1, count: 1 },
    xp: 70,
  },
  {
    id: 'speed-3',
    title: 'Rychlá trojka',
    icon: '⚡',
    focus: 'Rychlost',
    description: 'Otevři 3 reálné zámky, každý pod 60 sekund (měř stopkami).',
    check: { kind: 'timer', count: 3, maxTime: 60000 },
    xp: 50,
  },
  {
    id: 'rake-session',
    title: 'Raking session',
    icon: '🧹',
    focus: 'Raking a rocking',
    description: 'Otevři 3 zámky technikou Raking. Zkus Bogotu i City rake a sleduj, co funguje lépe.',
    check: { kind: 'timer', count: 3, technique: 'Raking' },
    xp: 40,
  },
  {
    id: 'quiz-sharp',
    title: 'Ostré oko',
    icon: '🔍',
    focus: 'Teorie',
    description: 'Dosáhni alespoň 8/10 správných odpovědí v Poznávačce.',
    check: { kind: 'quiz', minCorrect: 8 },
    xp: 40,
  },
  {
    id: 'map-binding',
    title: 'Mapa binding orderu',
    icon: '🗺️',
    focus: 'Analýza',
    description: 'Vezmi si jeden reálný zámek, zjisti jeho pořadí tuhnutí a typy stavítek a zapiš je v Moje výbava → Sbírka.',
    check: { kind: 'manual' },
    xp: 30,
  },
  {
    id: 'reverse-tension',
    title: 'Opačné napětí',
    icon: '🔄',
    focus: 'Mechanika',
    description: 'Otevři reálný zámek, který obvykle otevíráš po směru, proti směru hodinových ručiček. Binding order se změní!',
    check: { kind: 'manual' },
    xp: 30,
  },
  {
    id: 'tok-only',
    title: 'Jen TOK',
    icon: '⬆️',
    focus: 'Napínák nahoře',
    description: 'Otevři 2 reálné zámky výhradně s TOK napínákem. Všimni si, kolik místa navíc má planžeta.',
    check: { kind: 'manual' },
    xp: 30,
  },
  {
    id: 'deep-hook',
    title: 'Hluboký hák',
    icon: '🪝',
    focus: 'Extrémní bitting',
    description: 'V simulátoru použij Deep Hook a otevři 6pinový zámek bez jediného přemačknutí.',
    check: { kind: 'sim', pins: 6, blind: false, count: 1, tool: 'deep-hook' },
    xp: 50,
  },
];

export interface SimDrillPreset {
  spec?: SimLockSpec;
  pins: number;
  spools: number;
  serrated: number;
  blind: boolean;
  drillId?: string;
}

/** How many sim results today match a sim drill. */
export function simDrillProgress(data: AppData, drill: DrillDef, dayStart: number): number {
  if (drill.check.kind !== 'sim') return 0;
  const c = drill.check;
  return data.challenges.filter(
    (r) =>
      r.kind === 'sim' &&
      r.date >= dayStart &&
      !r.dnf &&
      (r.pins ?? 0) >= c.pins &&
      (!c.blind || r.blind) &&
      (c.timeLimit === undefined || (r.time ?? Infinity) <= c.timeLimit) &&
      (c.maxTension === undefined || (r.maxTension ?? 1) <= c.maxTension) &&
      (!(c.spools || c.serrated || c.tool) || r.drillId === drill.id),
  ).length;
}
