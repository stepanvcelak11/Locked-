import type { AppData } from '../types';
import { effectiveTime, bestAverage } from './stats';
import { beltRank } from '../data/labels';

export interface BadgeDef {
  id: string;
  icon: string;
  title: string;
  desc: string;
  tier: 'bronze' | 'silver' | 'gold';
  progress: (d: AppData) => [number, number];
}

const solvedCount = (d: AppData) => d.solves.filter((s) => s.penalty !== 'DNF').length;
const sims = (d: AppData) => d.challenges.filter((c) => c.kind === 'sim' && !c.dnf);
const bool = (v: boolean): [number, number] => [v ? 1 : 0, 1];

function drillStreak(d: AppData): number {
  let streak = 0;
  const day = new Date();
  for (let i = 0; i < 365; i++) {
    const key = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, '0')}-${String(day.getDate()).padStart(2, '0')}`;
    if ((d.drills[key]?.length ?? 0) > 0) streak++;
    else if (i > 0) break;
    day.setDate(day.getDate() - 1);
  }
  return streak;
}

export const BADGES: BadgeDef[] = [
  { id: 'first-open', icon: '🔓', title: 'První otevření', desc: 'Zaznamenej první otevřený zámek.', tier: 'bronze', progress: (d) => [Math.min(1, solvedCount(d)), 1] },
  { id: 'ten-opens', icon: '🔟', title: 'Rozjetý', desc: '10 otevření ve stopkách.', tier: 'bronze', progress: (d) => [Math.min(10, solvedCount(d)), 10] },
  { id: 'hundred-opens', icon: '💯', title: 'Stovka', desc: '100 otevření ve stopkách.', tier: 'gold', progress: (d) => [Math.min(100, solvedCount(d)), 100] },
  {
    id: 'sub-10',
    icon: '⚡',
    title: 'Pod 10 sekund',
    desc: 'Otevři reálný zámek za méně než 10 s.',
    tier: 'silver',
    progress: (d) => bool(d.solves.some((s) => effectiveTime(s) < 10000)),
  },
  {
    id: 'ao5-30',
    icon: '📈',
    title: 'Konzistence',
    desc: 'Ao5 pod 30 sekund na jednom zámku.',
    tier: 'silver',
    progress: (d) => {
      const byLock = new Map<string, number[]>();
      [...d.solves].sort((a, b) => a.date - b.date).forEach((s) => {
        const k = s.lockId ?? '-';
        byLock.set(k, [...(byLock.get(k) ?? []), effectiveTime(s)]);
      });
      return bool([...byLock.values()].some((t) => (bestAverage(t, 5) ?? Infinity) < 30000));
    },
  },
  {
    id: 'green-belt',
    icon: '🟢',
    title: 'Zelený pás',
    desc: 'Otevři zámek zeleného pásu nebo vyššího.',
    tier: 'silver',
    progress: (d) =>
      bool(
        d.solves.some((s) => {
          if (s.penalty === 'DNF') return false;
          const l = d.locks.find((x) => x.id === s.lockId);
          return !!l && beltRank(l.belt) >= beltRank('green');
        }),
      ),
  },
  {
    id: 'blue-belt',
    icon: '🔵',
    title: 'Modrý pás',
    desc: 'Otevři zámek modrého pásu nebo vyššího.',
    tier: 'gold',
    progress: (d) =>
      bool(
        d.solves.some((s) => {
          if (s.penalty === 'DNF') return false;
          const l = d.locks.find((x) => x.id === s.lockId);
          return !!l && beltRank(l.belt) >= beltRank('blue');
        }),
      ),
  },
  { id: 'collector', icon: '🗃️', title: 'Sběratel', desc: 'Měj ve sbírce 10 zámků.', tier: 'silver', progress: (d) => [Math.min(10, d.locks.length), 10] },
  { id: 'arsenal', icon: '🧰', title: 'Arzenál', desc: 'Měj v arzenálu 10 nástrojů.', tier: 'bronze', progress: (d) => [Math.min(10, d.tools.length), 10] },
  { id: 'sim-first', icon: '🧪', title: 'Virtuální průlom', desc: 'Otevři první zámek v simulátoru.', tier: 'bronze', progress: (d) => [Math.min(1, sims(d).length), 1] },
  {
    id: 'sim-blind',
    icon: '🙈',
    title: 'Slepý mistr',
    desc: 'Otevři 6pinový zámek v Blind módu.',
    tier: 'gold',
    progress: (d) => bool(sims(d).some((s) => s.blind && (s.pins ?? 0) >= 6)),
  },
  {
    id: 'sim-feather',
    icon: '🪶',
    title: 'Pírko',
    desc: 'Otevři 5pinový zámek s napětím max. 25 %.',
    tier: 'silver',
    progress: (d) => bool(sims(d).some((s) => (s.pins ?? 0) >= 5 && (s.maxTension ?? 1) <= 0.25)),
  },
  {
    id: 'quiz-perfect',
    icon: '🧠',
    title: 'Encyklopedie',
    desc: 'Odpověz 10/10 v poznávačce.',
    tier: 'gold',
    progress: (d) => bool(d.challenges.some((c) => (c.kind === 'quiz-keyway' || c.kind === 'quiz-xray') && c.correct === c.total && (c.total ?? 0) >= 10)),
  },
  {
    id: 'gauntlet-s',
    icon: '🏆',
    title: 'Trojboj S',
    desc: 'Získej hodnocení S v 3-Lock Gauntletu.',
    tier: 'gold',
    progress: (d) => bool(d.challenges.some((c) => c.kind === 'gauntlet' && c.rank === 'S')),
  },
  {
    id: 'gauntlet-first',
    icon: '🥉',
    title: 'Gladiátor',
    desc: 'Dokonči první 3-Lock Gauntlet.',
    tier: 'bronze',
    progress: (d) => bool(d.challenges.some((c) => c.kind === 'gauntlet' && !c.dnf)),
  },
  { id: 'drill-streak-3', icon: '🔥', title: 'Na vlně', desc: 'Plň denní drily 3 dny v řadě.', tier: 'bronze', progress: (d) => [Math.min(3, drillStreak(d)), 3] },
  { id: 'drill-streak-7', icon: '🌋', title: 'Týden disciplíny', desc: 'Plň denní drily 7 dní v řadě.', tier: 'gold', progress: (d) => [Math.min(7, drillStreak(d)), 7] },
  {
    id: 'mapper',
    icon: '🗺️',
    title: 'Kartograf',
    desc: 'Zaznamenej kompletní binding order u 3 zámků.',
    tier: 'silver',
    progress: (d) => [Math.min(3, d.locks.filter((l) => l.bindingOrder.length >= l.pins && l.pins > 0).length), 3],
  },
];

export function earnedBadges(d: AppData): string[] {
  return BADGES.filter((b) => {
    const [a, t] = b.progress(d);
    return a >= t;
  }).map((b) => b.id);
}

export { drillStreak };
