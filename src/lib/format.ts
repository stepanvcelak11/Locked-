import type { Penalty } from '../types';

/** 14820 → "14.82", 74820 → "1:14.82" */
export function formatTime(ms: number | null | undefined, opts: { dnfLabel?: string; pad?: boolean } = {}): string {
  if (ms === null || ms === undefined || Number.isNaN(ms)) return '—';
  if (!Number.isFinite(ms)) return opts.dnfLabel ?? 'DNF';
  const totalCs = Math.floor(ms / 10);
  const cs = totalCs % 100;
  const totalS = Math.floor(totalCs / 100);
  const s = totalS % 60;
  const m = Math.floor(totalS / 60) % 60;
  const h = Math.floor(totalS / 3600);
  const csStr = String(cs).padStart(2, '0');
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}.${csStr}`;
  if (m > 0 || opts.pad) return `${opts.pad ? String(m).padStart(2, '0') : m}:${String(s).padStart(2, '0')}.${csStr}`;
  return `${s}.${csStr}`;
}

export function formatSolve(time: number, penalty: Penalty): string {
  if (penalty === 'DNF') return 'DNF';
  if (penalty === '+2') return `${formatTime(time + 2000)}+`;
  return formatTime(time);
}

export function formatDuration(ms: number): string {
  const totalMin = Math.round(ms / 60000);
  if (totalMin < 60) return `${totalMin} min`;
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return m ? `${h} h ${m} min` : `${h} h`;
}

export function formatDate(ts: number, withTime = true): string {
  const d = new Date(ts);
  const date = d.toLocaleDateString('cs-CZ', { day: 'numeric', month: 'numeric', year: '2-digit' });
  if (!withTime) return date;
  return `${date} ${d.toLocaleTimeString('cs-CZ', { hour: '2-digit', minute: '2-digit' })}`;
}

export function relativeDay(ts: number): string {
  const now = new Date();
  const d = new Date(ts);
  const startOf = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const diff = Math.round((startOf(now) - startOf(d)) / 86400000);
  if (diff === 0) return 'Dnes';
  if (diff === 1) return 'Včera';
  if (diff < 7) return `Před ${diff} dny`;
  return formatDate(ts, false);
}

export function plural(n: number, one: string, few: string, many: string): string {
  if (n === 1) return one;
  if (n >= 2 && n <= 4) return few;
  return many;
}
