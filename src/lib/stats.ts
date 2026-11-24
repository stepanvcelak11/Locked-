import type { SolveRecord } from '../types';

/** Effective time of a solve in ms. DNF → Infinity. */
export function effectiveTime(s: Pick<SolveRecord, 'time' | 'penalty'>): number {
  if (s.penalty === 'DNF') return Infinity;
  if (s.penalty === '+2') return s.time + 2000;
  return s.time;
}

/** Number of results trimmed from EACH end for an average of `n` (WCA / csTimer convention). */
export function trimCount(n: number): number {
  if (n <= 12) return 1;
  return Math.ceil(n * 0.05);
}

/**
 * Average of the given times (chronological window).
 * Ao5/Ao12 drop 1 best + 1 worst, Ao50/Ao100 drop 5 % best + 5 % worst.
 * If more DNFs than the trimmed count, the average is DNF (Infinity).
 */
export function averageOf(times: number[]): number | null {
  const n = times.length;
  if (n < 3) return null;
  const trim = trimCount(n);
  const sorted = [...times].sort((a, b) => a - b);
  const kept = sorted.slice(trim, n - trim);
  if (kept.some((t) => !Number.isFinite(t))) return Infinity;
  return kept.reduce((a, b) => a + b, 0) / kept.length;
}

export function mean(times: number[]): number | null {
  const valid = times.filter(Number.isFinite);
  if (!valid.length) return null;
  return valid.reduce((a, b) => a + b, 0) / valid.length;
}

/** Current (latest) AoN for a chronologically ordered list of times. */
export function currentAverage(times: number[], n: number): number | null {
  if (times.length < n) return null;
  return averageOf(times.slice(times.length - n));
}

/** Rolling AoN for each index (null until enough data). */
export function rollingAverages(times: number[], n: number): (number | null)[] {
  const out: (number | null)[] = [];
  for (let i = 0; i < times.length; i++) {
    out.push(i + 1 >= n ? averageOf(times.slice(i + 1 - n, i + 1)) : null);
  }
  return out;
}

export function bestAverage(times: number[], n: number): number | null {
  if (times.length < n) return null;
  let best: number | null = null;
  for (let i = n; i <= times.length; i++) {
    const a = averageOf(times.slice(i - n, i));
    if (a === null) continue;
    if (best === null || a < best) best = a;
  }
  return best;
}

export function bestSingle(times: number[]): number | null {
  const valid = times.filter(Number.isFinite);
  return valid.length ? Math.min(...valid) : null;
}

export interface AverageSummary {
  n: number;
  current: number | null;
  best: number | null;
}

export const AVERAGE_SIZES = [5, 12, 50, 100] as const;

export function summarize(solves: SolveRecord[]) {
  const sorted = [...solves].sort((a, b) => a.date - b.date);
  const times = sorted.map(effectiveTime);
  const averages: AverageSummary[] = AVERAGE_SIZES.map((n) => ({
    n,
    current: currentAverage(times, n),
    best: bestAverage(times, n),
  }));
  const dnf = sorted.filter((s) => s.penalty === 'DNF').length;
  return {
    count: sorted.length,
    solved: sorted.length - dnf,
    dnf,
    best: bestSingle(times),
    worst: (() => {
      const v = times.filter(Number.isFinite);
      return v.length ? Math.max(...v) : null;
    })(),
    mean: mean(times),
    averages,
    totalTime: sorted.reduce((a, s) => a + s.time + (s.penalty === '+2' ? 2000 : 0), 0),
  };
}

export function median(values: number[]): number | null {
  const v = values.filter(Number.isFinite).sort((a, b) => a - b);
  if (!v.length) return null;
  const mid = Math.floor(v.length / 2);
  return v.length % 2 ? v[mid] : (v[mid - 1] + v[mid]) / 2;
}
