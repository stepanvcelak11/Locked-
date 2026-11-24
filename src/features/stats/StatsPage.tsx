import { useMemo, useState } from 'react';
import { Bar, BarChart, CartesianGrid, Cell, ComposedChart, Legend, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useStore } from '../../store/AppStore';
import { BeltBadge, Button, Card, Empty, PageHeader, SectionTitle, Stat } from '../../components/ui';
import { effectiveTime, median, rollingAverages, summarize } from '../../lib/stats';
import { formatDate, formatDuration, formatTime } from '../../lib/format';
import { TECHNIQUES } from '../../data/labels';
import type { SolveRecord } from '../../types';

/* Chart palette – validated for the dark surface (#1e293b): blue #3987e5 / amber #d97706 */
const C_SINGLE = '#3987e5';
const C_AVG = '#d97706';
const GRID = '#334155';
const AXIS = '#94a3b8';

function TimeTooltip({ active, payload }: { active?: boolean; payload?: { payload: { idx: number; date: number; single: number | null; ao5: number | null; note?: string } }[] }) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload;
  return (
    <div className="rounded-xl border border-edge bg-ink-950/95 px-3 py-2 text-xs shadow-xl">
      <div className="mb-1 text-slate-400">
        #{p.idx} · {formatDate(p.date)}
      </div>
      <div className="flex items-center gap-2">
        <span className="h-2 w-2 rounded-full" style={{ background: C_SINGLE }} />
        <span className="text-slate-300">Čas</span>
        <span className="ml-auto font-mono text-slate-50">{p.single === null ? 'DNF' : formatTime(p.single)}</span>
      </div>
      {p.ao5 !== null && (
        <div className="flex items-center gap-2">
          <span className="h-0.5 w-3" style={{ background: C_AVG }} />
          <span className="text-slate-300">Ao5</span>
          <span className="ml-auto font-mono text-slate-50">{formatTime(p.ao5)}</span>
        </div>
      )}
      {p.note && <div className="mt-1 max-w-[180px] text-slate-400">📝 {p.note}</div>}
    </div>
  );
}

function CountTooltip({ active, payload }: { active?: boolean; payload?: { payload: { name: string; count: number; sub?: string } }[] }) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload;
  return (
    <div className="rounded-xl border border-edge bg-ink-950/95 px-3 py-2 text-xs shadow-xl">
      <div className="font-semibold text-slate-100">{p.name}</div>
      <div className="text-slate-300">{p.count}× otevřeno</div>
      {p.sub && <div className="text-slate-400">{p.sub}</div>}
    </div>
  );
}

const fmtAxis = (v: number) => {
  if (v >= 60000) return `${Math.floor(v / 60000)}:${String(Math.round((v % 60000) / 1000)).padStart(2, '0')}`;
  return `${Math.round(v / 1000)}s`;
};

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
  const lockName = (id: string | null) => {
    const l = data.locks.find((x) => x.id === id);
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
        return { name: t ? t.name : 'Smazaný nástroj', count, sub: t ? `${t.manufacturer} · ${t.thickness}"${t.position !== 'n/a' ? ` · ${t.position}` : ''}` : '' };
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);
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
    return { name: t.label, count: valid.length, sub: valid.length ? `průměr ${formatTime(valid.reduce((a, b) => a + b, 0) / valid.length)}` : '' };
  }).filter((t) => t.count > 0);

  // heatmap (12 weeks)
  const heat = useMemo(() => {
    const days = 84;
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    start.setDate(start.getDate() - days + 1);
    const counts = new Map<number, number>();
    solves.forEach((s) => {
      const d = new Date(s.date);
      d.setHours(0, 0, 0, 0);
      counts.set(d.getTime(), (counts.get(d.getTime()) ?? 0) + 1);
    });
    const cells: { t: number; c: number }[] = [];
    for (let i = 0; i < days; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      cells.push({ t: d.getTime(), c: counts.get(d.getTime()) ?? 0 });
    }
    const max = Math.max(1, ...cells.map((c) => c.c));
    return { cells, max };
  }, [solves]);

  // games summary
  const sims = data.challenges.filter((c) => c.kind === 'sim' && !c.dnf);
  const quizBest = Math.max(0, ...data.challenges.filter((c) => c.kind.startsWith('quiz')).map((c) => c.score ?? 0));
  const gauntletPb = data.challenges.filter((c) => c.kind === 'gauntlet' && !c.dnf && !c.virtual).sort((a, b) => (a.time ?? 0) - (b.time ?? 0))[0];

  if (!solves.length && !data.challenges.length) {
    return (
      <div>
        <PageHeader title="Statistiky" />
        <Empty icon="chart" title="Zatím žádná data">
          Změř první otevření ve Stopkách a statistiky se začnou plnit.
        </Empty>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Statistiky" subtitle={`${all.count} pokusů · ${perLock.length} zámků`} />

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        <Stat label="Otevření celkem" value={all.solved} sub={`z ${all.count} pokusů`} />
        <Stat label="Čas tréninku" value={formatDuration(all.totalTime)} sub="čistý čas na stopkách" />
        <Stat label="PB single" value={formatTime(all.best)} accent="text-brass-300" sub={pbSolve ? lockName(pbSolve.lockId) : undefined} />
        <Stat label="Nejlepší Ao5" value={formatTime(ao5?.v)} sub={ao5?.lock ?? 'potřeba 5 pokusů'} />
        <Stat label="Nejlepší Ao12" value={formatTime(ao12?.v)} sub={ao12?.lock ?? 'potřeba 12 pokusů'} />
        <Stat
          label="Úspěšnost"
          value={`${all.count ? Math.round((all.solved / all.count) * 100) : 0} %`}
          accent={all.count && all.solved / all.count >= 0.8 ? 'text-emerald-300' : 'text-slate-100'}
          sub={`${all.dnf}× DNF`}
        />
      </div>

      {/* Progress */}
      <SectionTitle sub="Jednotlivé časy a klouzavý průměr Ao5">Progrese v čase</SectionTitle>
      <Card className="p-3">
        <select className="field mb-3 text-sm" value={lockId ?? ''} onChange={(e) => setLockId(e.target.value || null)}>
          <option value="">Všechny zámky</option>
          {lockIds.map((id) => (
            <option key={id} value={id}>
              {lockName(id)}
            </option>
          ))}
        </select>
        {progress.length < 2 ? (
          <p className="py-8 text-center text-sm text-slate-500">Pro graf jsou potřeba alespoň 2 pokusy.</p>
        ) : (
          <>
            {firstVsLast && (
              <div className="mb-2 flex items-baseline gap-2 px-1">
                <span className={`whitespace-nowrap font-mono text-2xl font-bold ${firstVsLast.pct >= 0 ? 'text-emerald-300' : 'text-red-300'}`}>
                  {firstVsLast.pct >= 0 ? '−' : '+'}
                  {Math.abs(firstVsLast.pct)} %
                </span>
                <span className="text-xs text-slate-400">
                  {formatTime(firstVsLast.first)} → {formatTime(firstVsLast.last)} (průměr prvních vs. posledních pokusů)
                </span>
              </div>
            )}
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={progress} margin={{ top: 8, right: 8, bottom: 0, left: -8 }}>
                  <CartesianGrid stroke={GRID} strokeDasharray="2 4" vertical={false} />
                  <XAxis dataKey="idx" tick={{ fill: AXIS, fontSize: 11 }} tickLine={false} axisLine={{ stroke: GRID }} />
                  <YAxis tickFormatter={fmtAxis} tick={{ fill: AXIS, fontSize: 11 }} tickLine={false} axisLine={false} width={48} />
                  <Tooltip content={<TimeTooltip />} cursor={{ stroke: '#64748b', strokeDasharray: '3 3' }} />
                  <Legend wrapperStyle={{ fontSize: 12, color: AXIS }} iconType="plainline" />
                  <Line name="Čas" dataKey="single" stroke={C_SINGLE} strokeWidth={1.5} strokeOpacity={0.6} dot={{ r: 4, fill: C_SINGLE, stroke: '#1e293b', strokeWidth: 2 }} activeDot={{ r: 6 }} connectNulls isAnimationActive={false} />
                  <Line name="Ao5" dataKey="ao5" stroke={C_AVG} strokeWidth={2.5} dot={false} connectNulls isAnimationActive={false} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
            <button className="mt-2 text-xs text-brass-400" onClick={() => setShowTable((v) => !v)}>
              {showTable ? 'Skrýt tabulku' : 'Zobrazit jako tabulku'}
            </button>
            {showTable && (
              <div className="mt-2 max-h-56 overflow-y-auto rounded-xl bg-ink-950">
                <table className="w-full text-xs">
                  <thead className="sticky top-0 bg-ink-950 text-slate-500">
                    <tr>
                      <th className="px-3 py-1.5 text-left">#</th>
                      <th className="px-3 py-1.5 text-left">Datum</th>
                      <th className="px-3 py-1.5 text-right">Čas</th>
                      <th className="px-3 py-1.5 text-right">Ao5</th>
                    </tr>
                  </thead>
                  <tbody className="font-mono">
                    {progress.map((p) => (
                      <tr key={p.idx} className="border-t border-edge/40">
                        <td className="px-3 py-1 text-slate-500">{p.idx}</td>
                        <td className="px-3 py-1 text-slate-400">{formatDate(p.date, false)}</td>
                        <td className="px-3 py-1 text-right">{p.single === null ? 'DNF' : formatTime(p.single)}</td>
                        <td className="px-3 py-1 text-right text-slate-400">{formatTime(p.ao5)}</td>
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
      <SectionTitle sub="Počet pokusů za den – posledních 12 týdnů">Aktivita</SectionTitle>
      <Card className="p-3">
        <div className="grid grid-flow-col grid-rows-7 gap-[3px]" style={{ gridTemplateColumns: 'repeat(12, minmax(0, 1fr))' }}>
          {heat.cells.map((c) => (
            <div
              key={c.t}
              title={`${formatDate(c.t, false)}: ${c.c} pokusů`}
              className="aspect-square rounded-[3px]"
              style={{ background: c.c ? `rgba(234, 179, 8, ${0.25 + 0.75 * (c.c / heat.max)})` : '#0f172a' }}
            />
          ))}
        </div>
        <div className="mt-2 flex items-center justify-end gap-1 text-[10px] text-slate-500">
          méně
          {[0, 0.33, 0.66, 1].map((v) => (
            <span key={v} className="h-2.5 w-2.5 rounded-[2px]" style={{ background: v ? `rgba(234,179,8,${0.25 + 0.75 * v})` : '#0f172a' }} />
          ))}
          více
        </div>
      </Card>

      {/* Tools */}
      <SectionTitle sub="Počet otevření (planžety i napínáky)">Nejpoužívanější nástroje</SectionTitle>
      <Card className="p-3">
        {toolUsage.length ? (
          <div style={{ height: Math.max(120, toolUsage.length * 34) }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={toolUsage} layout="vertical" margin={{ top: 0, right: 28, bottom: 0, left: 0 }} barCategoryGap={6}>
                <XAxis type="number" hide />
                <YAxis type="category" dataKey="name" width={118} tick={{ fill: '#cbd5e1', fontSize: 11 }} tickLine={false} axisLine={false} />
                <Tooltip content={<CountTooltip />} cursor={{ fill: 'rgba(148,163,184,0.08)' }} />
                <Bar dataKey="count" fill={C_SINGLE} radius={[0, 4, 4, 0]} label={{ position: 'right', fill: '#cbd5e1', fontSize: 11 }} isAnimationActive={false} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p className="py-4 text-center text-sm text-slate-500">Přiřaď nástroje ke svým pokusům ve Stopkách.</p>
        )}
      </Card>

      <SectionTitle sub="Seřazeno podle času relativně k obtížnosti zámku (1.00 = medián zámku)">Nejefektivnější kombinace</SectionTitle>
      <Card className="divide-y divide-edge/50">
        {combos.slice(0, 6).map((c, i) => (
          <div key={`${c.pick}|${c.tension}`} className="flex items-center gap-3 px-4 py-2.5">
            <span className={`w-6 font-mono text-sm font-bold ${i === 0 ? 'text-brass-400' : 'text-slate-500'}`}>{i + 1}.</span>
            <div className="flex-1 text-sm">
              <div className="text-slate-100">
                {toolName(c.pick)} <span className="text-slate-500">+</span> {toolName(c.tension)}
              </div>
              <div className="text-[11px] text-slate-500">
                {c.times.length}× · průměr {formatTime(c.mean)} · best {formatTime(c.best)}
                {c.dnf ? ` · ${c.dnf}× DNF` : ''}
              </div>
            </div>
            <span className={`font-mono text-sm ${c.index <= 1 ? 'text-emerald-300' : 'text-slate-300'}`}>{c.index.toFixed(2)}</span>
          </div>
        ))}
        {!combos.length && <p className="px-4 py-4 text-sm text-slate-500">Zatím bez dat.</p>}
      </Card>

      {tech.length > 0 && (
        <>
          <SectionTitle>Techniky</SectionTitle>
          <Card className="p-3">
            <div className="h-32">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={tech} margin={{ top: 16, right: 8, bottom: 0, left: 8 }}>
                  <XAxis dataKey="name" tick={{ fill: '#cbd5e1', fontSize: 11 }} tickLine={false} axisLine={{ stroke: GRID }} />
                  <YAxis hide />
                  <Tooltip content={<CountTooltip />} cursor={{ fill: 'rgba(148,163,184,0.08)' }} />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]} label={{ position: 'top', fill: '#cbd5e1', fontSize: 11 }} isAnimationActive={false}>
                    {tech.map((t) => (
                      <Cell key={t.name} fill={C_SINGLE} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </>
      )}

      {/* Locks ranking */}
      <SectionTitle sub="Nejrychlejší průměrný čas">😌 Comfort Locks</SectionTitle>
      <LockList items={comfort} metric={(r) => formatTime(r.meanT)} />

      <SectionTitle sub="Nejpomalejší průměr nebo nejvíc DNF">😈 Nemesis (Bête Noire)</SectionTitle>
      <LockList
        items={nemesis}
        metric={(r) => (r.dnfRate > 0 ? `${formatTime(r.meanT)} · ${Math.round(r.dnfRate * 100)} % DNF` : formatTime(r.meanT))}
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

      {/* Games */}
      <SectionTitle>Simulátor & hry</SectionTitle>
      <div className="grid grid-cols-3 gap-2">
        <Stat label="Sim. otevření" value={sims.length} sub={sims.length ? `best ${formatTime(Math.min(...sims.map((s) => s.time ?? Infinity)))}` : undefined} />
        <Stat label="Kvíz rekord" value={quizBest || '—'} sub="bodů" />
        <Stat label="Gauntlet PB" value={formatTime(gauntletPb?.time)} sub={gauntletPb ? `${gauntletPb.difficulty} · ${gauntletPb.rank}` : 'reálné zámky'} />
      </div>
    </div>
  );
}

type Ranked = { lock: { id: string; brand: string; name: string; belt: import('../../types').Belt }; solves: SolveRecord[]; meanT: number; dnfRate: number };

function LockList<T extends Ranked>({ items, metric, action }: { items: T[]; metric: (r: T) => string; action?: (r: T) => React.ReactNode }) {
  if (!items.length) return <p className="text-sm text-slate-500">Zatím bez dat.</p>;
  return (
    <Card className="divide-y divide-edge/50">
      {items.map((r, i) => (
        <div key={r.lock.id} className="flex items-center gap-3 px-4 py-2.5">
          <span className="w-5 font-mono text-sm text-slate-500">{i + 1}.</span>
          <div className="flex-1">
            <div className="text-sm text-slate-100">
              {r.lock.brand} {r.lock.name}
            </div>
            <div className="flex items-center gap-2 text-[11px] text-slate-500">
              <BeltBadge belt={r.lock.belt} size="sm" /> {r.solves.length} pokusů
            </div>
          </div>
          <span className="font-mono text-xs text-slate-300">{metric(r)}</span>
          {action?.(r)}
        </div>
      ))}
    </Card>
  );
}
