import { useMemo, useState, type ReactNode } from 'react';
import { motion } from 'framer-motion';
import { Area, CartesianGrid, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useStore } from '../../store/AppStore';
import { Button, Card, PageHeader, SectionTitle } from '../../components/ui';
import { Icon, type IconName } from '../../components/Icon';
import { ToolArt } from '../../components/svg/ToolArt';
import { effectiveTime, median, rollingAverages, summarize } from '../../lib/stats';
import { formatDate, formatDuration, formatTime, plural } from '../../lib/format';
import { TECHNIQUES, beltOf } from '../../data/labels';
import type { Belt, SolveRecord, ToolProfile } from '../../types';

/* Chart palette – validated (dataviz validator, dark mode) against the card surface #262038:
   blue #3987e5 / amber #d97706 pass lightness band, chroma, CVD (ΔE 27) and contrast. */
const C_SINGLE = '#3987e5';
const C_AVG = '#d97706';
const GRID = 'rgba(255,255,255,0.06)';
const AXIS = '#827a97';

const DAY = 86_400_000;
const dayKey = (t: number) => {
  const d = new Date(t);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
};

function TimeTooltip({ active, payload }: { active?: boolean; payload?: { payload: { idx: number; date: number; single: number | null; ao5: number | null; note?: string } }[] }) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload;
  return (
    <div className="rounded-2xl border border-white/10 bg-ink-900/95 px-3.5 py-2.5 text-xs shadow-xl backdrop-blur">
      <div className="mb-1 text-slate-400">
        Pokus {p.idx} · {formatDate(p.date)}
      </div>
      <div className="flex items-center gap-2">
        <span className="h-2.5 w-2.5 rounded-full" style={{ background: C_SINGLE }} />
        <span className="text-slate-300">Čas</span>
        <span className="ml-auto pl-4 font-mono font-bold text-slate-50">{p.single === null ? 'DNF' : formatTime(p.single)}</span>
      </div>
      {p.ao5 !== null && (
        <div className="flex items-center gap-2">
          <span className="h-[3px] w-3 rounded-full" style={{ background: C_AVG }} />
          <span className="text-slate-300">Průměr z 5</span>
          <span className="ml-auto pl-4 font-mono font-bold text-slate-50">{formatTime(p.ao5)}</span>
        </div>
      )}
      {p.note && <div className="mt-1 max-w-[190px] text-slate-400">📝 {p.note}</div>}
    </div>
  );
}

const fmtAxis = (v: number) => {
  if (v >= 60000) return `${Math.floor(v / 60000)}:${String(Math.round((v % 60000) / 1000)).padStart(2, '0')}`;
  return `${Math.round(v / 1000)} s`;
};

/** "o 12 % rychlejší" / "o 8 % pomalejší" relative to 1.0 */
function relWords(index: number) {
  const pct = Math.round(Math.abs(1 - index) * 100);
  if (pct === 0) return 'přesně tvůj běžný čas';
  return index < 1 ? `o ${pct} % rychlejší než obvykle` : `o ${pct} % pomalejší než obvykle`;
}

export function StatsPage() {
  const { data, navigate, setTimerConfig } = useStore();
  const solves = useMemo(() => [...data.solves].sort((a, b) => a.date - b.date), [data.solves]);
  const all = useMemo(() => summarize(solves), [solves]);
  const lockIds = useMemo(() => {
    const counts = new Map<string, number>();
    solves.forEach((s) => s.lockId && counts.set(s.lockId, (counts.get(s.lockId) ?? 0) + 1));
    return [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([id]) => id);
  }, [solves]);
  const [lockId, setLockId] = useState<string | null>(() => lockIds[0] ?? null);
  const [showTable, setShowTable] = useState(false);
  const [showAllCombos, setShowAllCombos] = useState(false);
  const lockOf = (id: string | null) => data.locks.find((x) => x.id === id);
  const lockName = (id: string | null) => {
    const l = lockOf(id);
    return l ? `${l.brand} ${l.name}` : 'Bez zámku';
  };

  // best Ao5/Ao12 across per-lock sessions (averages only make sense on one lock)
  const perLock = useMemo(() => {
    return data.locks
      .map((l) => {
        const ss = solves.filter((s) => s.lockId === l.id);
        return { lock: l, solves: ss, sum: summarize(ss) };
      })
      .filter((x) => x.solves.length > 0);
  }, [data.locks, solves]);
  const bestAo = (n: number) => {
    let best: { v: number; lock: string } | null = null;
    perLock.forEach((p) => {
      const a = p.sum.averages.find((x) => x.n === n)?.best;
      if (a != null && Number.isFinite(a) && (!best || a < best.v)) best = { v: a, lock: `${p.lock.brand} ${p.lock.name}` };
    });
    return best as { v: number; lock: string } | null;
  };
  const ao5 = bestAo(5);
  const ao12 = bestAo(12);
  const pbSolve = solves.filter((s) => Number.isFinite(effectiveTime(s))).sort((a, b) => effectiveTime(a) - effectiveTime(b))[0];
  const successPct = all.count ? Math.round((all.solved / all.count) * 100) : 0;

  // practice days & streaks
  const practice = useMemo(() => {
    const days = new Set(solves.map((s) => dayKey(s.date)));
    const today = dayKey(Date.now());
    let current = 0;
    // a streak survives until the end of today even if you haven't practised yet
    let d = days.has(today) ? today : today - DAY;
    while (days.has(d)) {
      current++;
      d -= DAY;
    }
    const sorted = [...days].sort((a, b) => a - b);
    let longest = 0;
    let run = 0;
    sorted.forEach((t, i) => {
      run = i > 0 && Math.round((t - sorted[i - 1]) / DAY) === 1 ? run + 1 : 1;
      longest = Math.max(longest, run);
    });
    return { days, current, longest };
  }, [solves]);

  // progress chart data
  const progress = useMemo(() => {
    const ss = solves.filter((s) => (lockId ? s.lockId === lockId : true));
    const times = ss.map(effectiveTime);
    const roll = rollingAverages(times, 5);
    return ss.map((s, i) => ({
      idx: i + 1,
      date: s.date,
      single: Number.isFinite(times[i]) ? times[i] : null,
      ao5: roll[i] !== null && Number.isFinite(roll[i]!) ? roll[i] : null,
      note: s.note,
    }));
  }, [solves, lockId]);
  const firstVsLast = useMemo(() => {
    const valid = progress.filter((p) => p.single !== null);
    if (valid.length < 4) return null;
    const k = Math.min(3, Math.floor(valid.length / 2));
    const first = valid.slice(0, k).reduce((a, p) => a + p.single!, 0) / k;
    const last = valid.slice(-k).reduce((a, p) => a + p.single!, 0) / k;
    return { first, last, pct: Math.round((1 - last / first) * 100) };
  }, [progress]);

  // tool usage
  const toolUsage = useMemo(() => {
    const m = new Map<string, number>();
    solves.forEach((s) => {
      if (s.penalty === 'DNF') return;
      [s.pickId, s.tensionId].forEach((id) => id && m.set(id, (m.get(id) ?? 0) + 1));
    });
    return [...m.entries()]
      .map(([id, count]) => {
        const t = data.tools.find((x) => x.id === id);
        return {
          id,
          name: t ? t.name : 'Smazaný nástroj',
          profile: (t?.profile ?? 'other') as ToolProfile,
          count,
          sub: t ? `${t.manufacturer} · ${t.thickness}"` : '',
        };
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);
  }, [solves, data.tools]);

  // fastest gear combos, normalised by lock difficulty (time / lock median)
  const combos = useMemo(() => {
    const lockMedian = new Map<string, number>();
    perLock.forEach((p) => lockMedian.set(p.lock.id, median(p.solves.map(effectiveTime)) ?? 1));
    const m = new Map<string, { pick: string | null; tension: string | null; rel: number[]; times: number[]; dnf: number }>();
    solves.forEach((s) => {
      if (!s.pickId && !s.tensionId) return;
      const key = `${s.pickId}|${s.tensionId}`;
      const cur = m.get(key) ?? { pick: s.pickId, tension: s.tensionId, rel: [], times: [], dnf: 0 };
      const t = effectiveTime(s);
      if (!Number.isFinite(t)) cur.dnf++;
      else {
        cur.times.push(t);
        const med = s.lockId ? lockMedian.get(s.lockId) : undefined;
        cur.rel.push(med ? t / med : 1);
      }
      m.set(key, cur);
    });
    return [...m.values()]
      .filter((c) => c.times.length > 0)
      .map((c) => ({
        ...c,
        index: c.rel.reduce((a, b) => a + b, 0) / c.rel.length,
        mean: c.times.reduce((a, b) => a + b, 0) / c.times.length,
        best: Math.min(...c.times),
      }))
      .sort((a, b) => a.index - b.index);
  }, [solves, perLock]);
  const toolName = (id: string | null) => data.tools.find((t) => t.id === id)?.name ?? '—';

  // comfort / nemesis
  const ranked = useMemo(
    () =>
      perLock.map((p) => {
        const valid = p.solves.map(effectiveTime).filter(Number.isFinite);
        const meanT = valid.length ? valid.reduce((a, b) => a + b, 0) / valid.length : Infinity;
        const dnfRate = p.sum.dnf / p.sum.count;
        return { ...p, meanT, dnfRate, nemesis: (Number.isFinite(meanT) ? meanT : 1e7) * (1 + dnfRate * 3) };
      }),
    [perLock],
  );
  // with a small vault, split it so the two lists never show the same lock
  const listSize = Math.min(5, Math.max(1, Math.ceil(ranked.length / 2)));
  const comfort = [...ranked].filter((r) => Number.isFinite(r.meanT)).sort((a, b) => a.meanT - b.meanT).slice(0, listSize);
  const nemesis = [...ranked]
    .filter((r) => ranked.length < 2 || !comfort.includes(r))
    .sort((a, b) => b.nemesis - a.nemesis)
    .slice(0, listSize);

  // techniques
  const tech = TECHNIQUES.map((t) => {
    const ss = solves.filter((s) => s.technique === t.id);
    const valid = ss.map(effectiveTime).filter(Number.isFinite);
    return { name: t.label, count: valid.length, avg: valid.length ? valid.reduce((a, b) => a + b, 0) / valid.length : null };
  }).filter((t) => t.count > 0);
  const techTotal = tech.reduce((a, t) => a + t.count, 0);

  // activity calendar: 12 whole weeks, Monday-first, ending with the current week
  const heat = useMemo(() => {
    const today = dayKey(Date.now());
    const dow = (new Date(today).getDay() + 6) % 7; // 0 = Monday
    const start = today - (dow + 7 * 11) * DAY;
    const counts = new Map<number, number>();
    solves.forEach((s) => counts.set(dayKey(s.date), (counts.get(dayKey(s.date)) ?? 0) + 1));
    const cells: { t: number; c: number; future: boolean }[] = [];
    for (let i = 0; i < 84; i++) {
      // DST-safe: re-normalise each step to local midnight
      const t = dayKey(start + i * DAY + DAY / 2);
      cells.push({ t, c: counts.get(t) ?? 0, future: t > today });
    }
    const max = Math.max(1, ...cells.map((c) => c.c));
    const active = cells.filter((c) => c.c > 0).length;
    return { cells, max, active };
  }, [solves]);

  // games summary
  const sims = data.challenges.filter((c) => c.kind === 'sim' && !c.dnf);
  const quizBest = Math.max(0, ...data.challenges.filter((c) => c.kind.startsWith('quiz')).map((c) => c.score ?? 0));
  const gauntletPb = data.challenges.filter((c) => c.kind === 'gauntlet' && !c.dnf && !c.virtual).sort((a, b) => (a.time ?? 0) - (b.time ?? 0))[0];

  if (!solves.length && !data.challenges.length) {
    return (
      <div>
        <PageHeader title="Statistiky" subtitle="Jak se ti daří a kde máš rezervy" />
        <Card className="flex flex-col items-center px-6 py-9 text-center">
          <svg viewBox="0 0 160 90" className="mb-4 w-44" aria-hidden="true">
            <path d="M10 78H150" stroke="var(--color-slate-700)" strokeWidth="2" strokeLinecap="round" />
            {[18, 30, 24, 44, 38, 56].map((h, i) => (
              <rect key={i} x={20 + i * 21} y={78 - h} width="13" height={h} rx="5" fill={i === 5 ? 'var(--color-brass-500)' : 'var(--color-slate-700)'} opacity={i === 5 ? 1 : 0.55 + i * 0.07} />
            ))}
            <circle cx="132" cy="14" r="9" fill="var(--color-brass-400)" opacity="0.25" />
            <path d="M128 14l3 3 6-6" stroke="var(--color-brass-500)" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <div className="font-display text-xl font-semibold text-slate-50">Tady bude vidět tvůj pokrok</div>
          <p className="mt-1.5 max-w-xs text-sm text-slate-400">
            Zatím jsi nic neměřil. Jakmile otevřeš první zámek se stopkami nebo zahraješ hru, začnou se tu objevovat tvoje rekordy, průměry a série.
          </p>
          <Button variant="brass" icon="timer" className="mt-5" onClick={() => navigate('timer')}>
            Změřit první otevření
          </Button>
          <button className="mt-3 text-sm font-bold text-slate-400 hover:text-slate-200" onClick={() => navigate('arcade')}>
            nebo si zahraj v simulátoru
          </button>
        </Card>
      </div>
    );
  }

  const progressLock = lockId ? lockOf(lockId) : null;

  return (
    <div>
      <PageHeader title="Statistiky" subtitle="Jak se ti daří a kde máš rezervy" />

      {/* Hero summary */}
      <div className="relative overflow-hidden rounded-[1.8rem] border border-white/10 bg-[linear-gradient(135deg,#4a2f6b_0%,#3a2a5c_40%,#2a2347_100%)] p-5 shadow-[0_24px_50px_-28px_rgba(0,0,0,0.9)]">
        <div className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-brass-500/25 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-10 h-56 w-56 rounded-full bg-[#4fd8c4]/15 blur-3xl" />
        <div className="relative flex items-center gap-4">
          <div className="min-w-0 flex-1">
            <div className="text-sm font-semibold text-white/70">Otevřené zámky</div>
            <div className="font-display text-[3.4rem] font-semibold leading-none text-white">{all.solved}</div>
            <div className="mt-1.5 text-sm text-white/70">
              z {all.count} {plural(all.count, 'pokusu', 'pokusů', 'pokusů')} · {perLock.length} {plural(perLock.length, 'zámek', 'zámky', 'zámků')}
            </div>
          </div>
          <SuccessRing pct={successPct} />
        </div>
        <div className="relative mt-5 grid grid-cols-3 gap-2">
          <HeroFact icon="timer" value={formatDuration(all.totalTime)} label="u stopek" />
          <HeroFact icon="flame" value={`${practice.current}`} label={plural(practice.current, 'den v řadě', 'dny v řadě', 'dní v řadě')} />
          <HeroFact icon="flag" value={`${practice.days.size}`} label={plural(practice.days.size, 'tréninkový den', 'tréninkové dny', 'tréninkových dní')} />
        </div>
      </div>

      {/* Records */}
      <SectionTitle sub="Tvoje nejlepší výkony">Osobní rekordy</SectionTitle>
      <div className="grid grid-cols-3 gap-2">
        <Record icon="trophy" tint="#ffb547" label="Nejrychlejší" value={formatTime(all.best)} sub={pbSolve ? lockName(pbSolve.lockId) : '—'} />
        <Record icon="target" tint="#b69cff" label="Průměr z 5" value={formatTime(ao5?.v)} sub={ao5?.lock ?? 'chce 5 pokusů'} />
        <Record icon="star" tint="#4fd8c4" label="Průměr z 12" value={formatTime(ao12?.v)} sub={ao12?.lock ?? 'chce 12 pokusů'} />
      </div>

      {/* Progress */}
      <SectionTitle sub="Každá tečka je jeden pokus, čára ukazuje průměr z posledních pěti">Tvůj pokrok</SectionTitle>
      <Card className="overflow-hidden p-4">
        <div className="scrollbar-none -mx-4 mb-4 flex gap-2 overflow-x-auto px-4">
          {lockIds.map((id) => (
            <LockChip key={id} active={lockId === id} belt={lockOf(id)?.belt} onClick={() => setLockId(id)}>
              {lockName(id)}
            </LockChip>
          ))}
          <LockChip active={lockId === null} onClick={() => setLockId(null)}>
            Všechny zámky
          </LockChip>
        </div>
        {progress.length < 2 ? (
          <p className="py-8 text-center text-sm text-slate-500">Pro graf jsou potřeba alespoň 2 pokusy.</p>
        ) : (
          <>
            {firstVsLast && (
              <div className="mb-3 flex items-center gap-3">
                <div
                  className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl ${firstVsLast.pct >= 0 ? 'bg-emerald-400/15 text-emerald-300' : 'bg-rose-400/15 text-rose-300'}`}
                >
                  <Icon name={firstVsLast.pct >= 0 ? 'zap' : 'refresh'} size={24} />
                </div>
                <p className="text-[0.95rem] leading-snug text-slate-300">
                  {firstVsLast.pct >= 0 ? (
                    <>
                      {progressLock ? 'Na tomhle zámku jsi' : 'Celkově jsi'} <b className="font-display text-lg font-semibold text-emerald-300">o {firstVsLast.pct} % rychlejší</b> než na začátku.
                    </>
                  ) : (
                    <>
                      Poslední pokusy jsou <b className="font-display text-lg font-semibold text-rose-300">o {Math.abs(firstVsLast.pct)} % pomalejší</b>. Zkus lehčí napětí.
                    </>
                  )}
                  <span className="block text-xs text-slate-500">
                    {formatTime(firstVsLast.first)} → {formatTime(firstVsLast.last)} · první vs. poslední pokusy
                  </span>
                </p>
              </div>
            )}
            <div className="mb-1 flex items-center gap-4 text-xs text-slate-400">
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: C_SINGLE }} /> Pokus
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-[3px] w-4 rounded-full" style={{ background: C_AVG }} /> Průměr z 5
              </span>
            </div>
            <div className="-mx-2 h-56">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={progress} margin={{ top: 8, right: 10, bottom: 0, left: -4 }}>
                  <defs>
                    <linearGradient id="ao5-fill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0" stopColor={C_AVG} stopOpacity={0.32} />
                      <stop offset="1" stopColor={C_AVG} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke={GRID} vertical={false} />
                  <XAxis dataKey="idx" tick={{ fill: AXIS, fontSize: 11 }} tickLine={false} axisLine={false} />
                  <YAxis tickFormatter={fmtAxis} tick={{ fill: AXIS, fontSize: 11 }} tickLine={false} axisLine={false} width={48} />
                  <Tooltip content={<TimeTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.25)', strokeDasharray: '3 4' }} />
                  <Area name="Průměr z 5" type="monotone" dataKey="ao5" stroke={C_AVG} strokeWidth={2.5} fill="url(#ao5-fill)" connectNulls isAnimationActive={false} />
                  <Line
                    name="Pokus"
                    dataKey="single"
                    stroke="none"
                    dot={{ r: 4.5, fill: C_SINGLE, stroke: '#262038', strokeWidth: 2 }}
                    activeDot={{ r: 7, fill: C_SINGLE, stroke: '#fff', strokeWidth: 2 }}
                    isAnimationActive={false}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
            <button className="mt-2 text-xs font-bold text-brass-400" onClick={() => setShowTable((v) => !v)}>
              {showTable ? 'Skrýt tabulku' : 'Zobrazit jako tabulku'}
            </button>
            {showTable && (
              <div className="mt-2 max-h-56 overflow-y-auto rounded-2xl bg-black/25">
                <table className="w-full text-xs">
                  <thead className="sticky top-0 bg-ink-900 text-slate-500">
                    <tr>
                      <th className="px-3 py-2 text-left font-semibold">#</th>
                      <th className="px-3 py-2 text-left font-semibold">Datum</th>
                      <th className="px-3 py-2 text-right font-semibold">Čas</th>
                      <th className="px-3 py-2 text-right font-semibold">Průměr z 5</th>
                    </tr>
                  </thead>
                  <tbody className="font-mono">
                    {progress.map((p) => (
                      <tr key={p.idx} className="border-t border-white/[0.05]">
                        <td className="px-3 py-1.5 text-slate-500">{p.idx}</td>
                        <td className="px-3 py-1.5 text-slate-400">{formatDate(p.date, false)}</td>
                        <td className="px-3 py-1.5 text-right font-bold">{p.single === null ? 'DNF' : formatTime(p.single)}</td>
                        <td className="px-3 py-1.5 text-right text-slate-400">{formatTime(p.ao5)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </Card>

      {/* Activity */}
      <SectionTitle sub="Posledních 12 týdnů – čím sytější tečka, tím víc pokusů">Kdy trénuješ</SectionTitle>
      <Card className="p-4">
        <div className="flex gap-2">
          <div className="grid grid-rows-7 gap-[5px] pr-0.5 text-[10px] leading-none text-slate-500">
            {['Po', '', 'St', '', 'Pá', '', 'Ne'].map((d, i) => (
              <span key={i} className="flex items-center">
                {d}
              </span>
            ))}
          </div>
          <div className="grid flex-1 grid-flow-col grid-rows-7 gap-[5px]" style={{ gridTemplateColumns: 'repeat(12, minmax(0, 1fr))' }}>
            {heat.cells.map((c) => (
              <div
                key={c.t}
                title={c.future ? undefined : `${formatDate(c.t, false)}: ${c.c} ${plural(c.c, 'pokus', 'pokusy', 'pokusů')}`}
                className="aspect-square rounded-full"
                style={{
                  background: c.future ? 'transparent' : c.c ? `rgba(255, 173, 51, ${0.3 + 0.7 * (c.c / heat.max)})` : 'rgba(255,255,255,0.06)',
                  boxShadow: c.c === heat.max && c.c > 0 ? '0 0 10px rgba(255,173,51,0.55)' : undefined,
                }}
              />
            ))}
          </div>
        </div>
        <div className="mt-3.5 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
          <span>
            <b className="text-slate-100">{heat.active}</b> {plural(heat.active, 'den', 'dny', 'dní')} s tréninkem · nejdelší série{' '}
            <b className="text-slate-100">{practice.longest}</b> {plural(practice.longest, 'den', 'dny', 'dní')}
          </span>
          <span className="flex items-center gap-1 text-[10px] text-slate-500">
            méně
            {[0, 0.33, 0.66, 1].map((v) => (
              <span key={v} className="h-2.5 w-2.5 rounded-full" style={{ background: v ? `rgba(255,173,51,${0.3 + 0.7 * v})` : 'rgba(255,255,255,0.06)' }} />
            ))}
            více
          </span>
        </div>
      </Card>

      {/* Tools */}
      <SectionTitle sub="Kolikrát ti který nástroj pomohl zámek otevřít">Oblíbené nástroje</SectionTitle>
      <Card className="p-2">
        {toolUsage.length ? (
          toolUsage.map((t, i) => (
            <div key={t.id} className="flex items-center gap-3 rounded-2xl px-2.5 py-2">
              <div className="flex h-10 w-16 shrink-0 items-center justify-center rounded-xl bg-black/20 px-1.5">
                <ToolArt profile={t.profile} className="h-full w-full" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="truncate text-sm font-bold text-slate-100">{t.name}</span>
                  <span className="shrink-0 font-mono text-sm font-extrabold text-slate-200">{t.count}×</span>
                </div>
                <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-white/[0.06]">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ background: i === 0 ? 'linear-gradient(90deg,#ffc65a,#ff8f1f)' : 'linear-gradient(90deg,#7c6aa8,#a58ad6)' }}
                    initial={{ width: 0 }}
                    animate={{ width: `${(t.count / toolUsage[0].count) * 100}%` }}
                    transition={{ duration: 0.7, delay: i * 0.05 }}
                  />
                </div>
              </div>
            </div>
          ))
        ) : (
          <p className="py-4 text-center text-sm text-slate-500">Přiřaď nástroje ke svým pokusům ve Stopkách.</p>
        )}
      </Card>

      {/* Combos */}
      <SectionTitle sub="Porovnáno s tvým běžným časem na stejném zámku">Nejlepší kombinace</SectionTitle>
      {combos.length ? (
        <div className="space-y-2">
          {combos.slice(0, showAllCombos ? 8 : 3).map((c, i) => (
            <Card key={`${c.pick}|${c.tension}`} className="flex items-center gap-3 px-4 py-3">
              <span
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full font-display text-base font-semibold"
                style={
                  i === 0
                    ? { background: 'linear-gradient(135deg,#ffd27a,#f0962c)', color: '#2a1a05' }
                    : i === 1
                      ? { background: 'linear-gradient(135deg,#ece6f3,#a99fbf)', color: '#1e1a2b' }
                      : i === 2
                        ? { background: 'linear-gradient(135deg,#f0b48a,#b0673a)', color: '#2a1405' }
                        : { background: 'rgba(255,255,255,0.07)', color: '#aaa1bd' }
                }
              >
                {i + 1}
              </span>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-bold text-slate-100">
                  {toolName(c.pick)} <span className="font-normal text-slate-500">s</span> {toolName(c.tension)}
                </div>
                <div className={`text-xs font-semibold ${c.index < 1 ? 'text-emerald-300' : 'text-slate-400'}`}>{relWords(c.index)}</div>
                <div className="text-[11px] text-slate-500">
                  {c.times.length}× · průměr {formatTime(c.mean)} · nejlépe {formatTime(c.best)}
                  {c.dnf ? ` · ${c.dnf}× nedokončeno` : ''}
                </div>
              </div>
            </Card>
          ))}
          {combos.length > 3 && (
            <button className="w-full py-1 text-xs font-bold text-brass-400" onClick={() => setShowAllCombos((v) => !v)}>
              {showAllCombos ? 'Zobrazit méně' : `Zobrazit další (${Math.min(8, combos.length) - 3})`}
            </button>
          )}
        </div>
      ) : (
        <Card className="px-4 py-4 text-sm text-slate-500">Zatím bez dat.</Card>
      )}

      {/* Techniques */}
      {tech.length > 0 && (
        <>
          <SectionTitle>Techniky</SectionTitle>
          <Card className="space-y-3 p-4">
            {tech.map((t) => (
              <div key={t.name}>
                <div className="flex items-baseline justify-between text-sm">
                  <span className="font-bold text-slate-100">{t.name}</span>
                  <span className="text-xs text-slate-400">
                    <b className="font-mono text-slate-200">{t.count}×</b> · průměr {formatTime(t.avg)}
                  </span>
                </div>
                <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-white/[0.06]">
                  <motion.div
                    className="h-full rounded-full bg-gradient-to-r from-[#3f9fe8] to-[#6cc9ff]"
                    initial={{ width: 0 }}
                    animate={{ width: `${(t.count / techTotal) * 100}%` }}
                    transition={{ duration: 0.7 }}
                  />
                </div>
              </div>
            ))}
          </Card>
        </>
      )}

      {/* Locks ranking */}
      <SectionTitle sub="Kde se cítíš jistě a co tě ještě potrápí">Zámky</SectionTitle>
      <div className="space-y-3">
        <LockGroup tone="comfort" title="Pohodové" emoji="😌" items={comfort} metric={(r) => `průměr ${formatTime(r.meanT)}`} />
        <LockGroup
          tone="nemesis"
          title="Tvoje nemesis"
          emoji="😈"
          items={nemesis}
          metric={(r) => (r.dnfRate > 0 ? `průměr ${formatTime(r.meanT)} · ${Math.round(r.dnfRate * 100)} % nedokončeno` : `průměr ${formatTime(r.meanT)}`)}
          action={(r) => (
            <Button
              size="sm"
              variant="danger"
              onClick={() => {
                setTimerConfig({ lockId: r.lock.id });
                navigate('timer');
              }}
            >
              Trénovat
            </Button>
          )}
        />
      </div>

      {/* Games */}
      <SectionTitle>Simulátor a hry</SectionTitle>
      <div className="grid grid-cols-3 gap-2">
        <Record icon="lock" tint="#b69cff" label="Simulátor" value={`${sims.length}×`} sub={sims.length ? `nejlépe ${formatTime(Math.min(...sims.map((s) => s.time ?? Infinity)))}` : 'otevřeno'} />
        <Record icon="zap" tint="#4fd8c4" label="Kvíz" value={quizBest ? String(quizBest) : '—'} sub="bodů rekord" />
        <Record icon="flag" tint="#ff8a6b" label="Gauntlet" value={formatTime(gauntletPb?.time)} sub={gauntletPb ? `${gauntletPb.difficulty} · ${gauntletPb.rank}` : 'reálné zámky'} />
      </div>
    </div>
  );
}

function SuccessRing({ pct }: { pct: number }) {
  const r = 34;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative h-[92px] w-[92px] shrink-0">
      <svg viewBox="0 0 92 92" className="h-full w-full -rotate-90">
        <defs>
          <linearGradient id="ring-g" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#ffd27a" />
            <stop offset="1" stopColor="#ff7a59" />
          </linearGradient>
        </defs>
        <circle cx={46} cy={46} r={r} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth={9} />
        <motion.circle
          cx={46}
          cy={46}
          r={r}
          fill="none"
          stroke="url(#ring-g)"
          strokeWidth={9}
          strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: c * (1 - pct / 100) }}
          transition={{ duration: 1, ease: 'easeOut' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-mono text-xl font-extrabold leading-none text-white">{pct} %</span>
        <span className="mt-0.5 text-[10px] font-semibold text-white/60">úspěšnost</span>
      </div>
    </div>
  );
}

function HeroFact({ icon, value, label }: { icon: IconName; value: string; label: string }) {
  return (
    <div className="rounded-2xl bg-black/20 px-3 py-2.5">
      <Icon name={icon} size={16} className="text-brass-300" />
      <div className="mt-1 font-mono text-lg font-extrabold leading-tight text-white">{value}</div>
      <div className="text-[11px] leading-tight text-white/60">{label}</div>
    </div>
  );
}

function Record({ icon, tint, label, value, sub }: { icon: IconName; tint: string; label: string; value: ReactNode; sub: string }) {
  return (
    <div className="card flex flex-col px-3 py-3">
      <span className="flex h-8 w-8 items-center justify-center rounded-full" style={{ background: `${tint}24`, color: tint }}>
        <Icon name={icon} size={16} />
      </span>
      <div className="mt-2 text-xs font-semibold text-slate-400">{label}</div>
      <div className="font-mono text-xl font-extrabold leading-tight text-slate-50">{value}</div>
      <div className="mt-0.5 line-clamp-2 text-[11px] leading-snug text-slate-500">{sub}</div>
    </div>
  );
}

function LockChip({ active, belt, onClick, children }: { active: boolean; belt?: Belt; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex shrink-0 items-center gap-2 whitespace-nowrap rounded-full border px-3.5 py-1.5 text-[0.8rem] font-bold transition ${
        active ? 'border-brass-400/60 bg-brass-400/15 text-brass-200' : 'border-white/[0.08] bg-white/[0.04] text-slate-400'
      }`}
    >
      {belt && <span className="h-2.5 w-2.5 rounded-full ring-1 ring-white/20" style={{ background: beltOf(belt).color }} />}
      {children}
    </button>
  );
}

type Ranked = { lock: { id: string; brand: string; name: string; belt: Belt }; solves: SolveRecord[]; meanT: number; dnfRate: number };

function LockGroup<T extends Ranked>({
  tone,
  title,
  emoji,
  items,
  metric,
  action,
}: {
  tone: 'comfort' | 'nemesis';
  title: string;
  emoji: string;
  items: T[];
  metric: (r: T) => string;
  action?: (r: T) => ReactNode;
}) {
  const bg =
    tone === 'comfort'
      ? 'bg-[linear-gradient(160deg,rgba(52,211,153,0.14),rgba(30,25,46,0.6)_60%)]'
      : 'bg-[linear-gradient(160deg,rgba(251,113,133,0.15),rgba(30,25,46,0.6)_60%)]';
  return (
    <div className={`overflow-hidden rounded-[1.45rem] border border-white/[0.07] ${bg}`}>
      <div className="flex items-center gap-2 px-4 pb-1 pt-3.5">
        <span className="text-lg">{emoji}</span>
        <span className={`font-display text-base font-semibold ${tone === 'comfort' ? 'text-emerald-200' : 'text-rose-200'}`}>{title}</span>
      </div>
      {items.length ? (
        items.map((r) => {
          const b = beltOf(r.lock.belt);
          return (
            <div key={r.lock.id} className="flex items-center gap-3 px-4 py-2.5">
              <span className="h-3 w-3 shrink-0 rounded-full ring-2 ring-white/10" style={{ background: b.color }} title={`${b.label} pás`} />
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-bold text-slate-100">
                  {r.lock.brand} {r.lock.name}
                </div>
                <div className="text-xs text-slate-400">
                  {metric(r)} · {r.solves.length} {plural(r.solves.length, 'pokus', 'pokusy', 'pokusů')}
                </div>
              </div>
              {action?.(r)}
            </div>
          );
        })
      ) : (
        <p className="px-4 pb-3 text-sm text-slate-500">Zatím bez dat.</p>
      )}
      <div className="h-1.5" />
    </div>
  );
}
