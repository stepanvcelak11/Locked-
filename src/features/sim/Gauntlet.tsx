import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useStore } from '../../store/AppStore';
import type { Belt, ChallengeResult, GauntletDifficulty, LockItem, Rank, SimLockSpec } from '../../types';
import { BELTS, beltRank } from '../../data/labels';
import { BeltBadge, Button, Card, Segmented, SectionTitle } from '../../components/ui';
import { formatDate, formatTime } from '../../lib/format';
import { randomSpec } from './engine';
import { LockSimulator } from './LockSimulator';
import { sound } from '../../lib/audio';
import { vibrate } from '../../lib/haptics';
import { shuffle } from '../../lib/random';

interface Preset {
  id: GauntletDifficulty;
  label: string;
  desc: string;
  belts: [Belt, Belt, Belt];
  par: number;
  virtualPar: number;
  virtual: { pins: number; spools: number; serrated: number }[];
}

const PRESETS: Preset[] = [
  {
    id: 'warmup',
    label: 'Warm-up',
    desc: '3× Bílý / Žlutý pás',
    belts: ['white', 'yellow', 'yellow'],
    par: 90000,
    virtualPar: 60000,
    virtual: [
      { pins: 3, spools: 0, serrated: 0 },
      { pins: 4, spools: 0, serrated: 0 },
      { pins: 4, spools: 0, serrated: 0 },
    ],
  },
  {
    id: 'standard',
    label: 'Standard',
    desc: 'Žlutý + 2× Oranžový',
    belts: ['yellow', 'orange', 'orange'],
    par: 180000,
    virtualPar: 100000,
    virtual: [
      { pins: 4, spools: 0, serrated: 0 },
      { pins: 5, spools: 1, serrated: 0 },
      { pins: 5, spools: 1, serrated: 1 },
    ],
  },
  {
    id: 'pro',
    label: 'Pro Gauntlet',
    desc: 'Žlutý + Oranžový + Zelený',
    belts: ['yellow', 'orange', 'green'],
    par: 300000,
    virtualPar: 150000,
    virtual: [
      { pins: 5, spools: 0, serrated: 0 },
      { pins: 5, spools: 2, serrated: 0 },
      { pins: 6, spools: 1, serrated: 2 },
    ],
  },
  {
    id: 'elite',
    label: 'Elite',
    desc: 'Zelený + Modrý + Fialový',
    belts: ['green', 'blue', 'purple'],
    par: 600000,
    virtualPar: 240000,
    virtual: [
      { pins: 6, spools: 2, serrated: 0 },
      { pins: 6, spools: 0, serrated: 3 },
      { pins: 6, spools: 2, serrated: 2 },
    ],
  },
];

interface Slot {
  label: string;
  belt: Belt;
  lockId: string | null;
  spec?: SimLockSpec;
}

function pickLocks(locks: LockItem[], belts: Belt[]): Slot[] {
  const used = new Set<string>();
  return belts.map((b) => {
    const candidates = shuffle(locks.filter((l) => !used.has(l.id))).sort((x, y) => Math.abs(beltRank(x.belt) - beltRank(b)) - Math.abs(beltRank(y.belt) - beltRank(b)));
    const c = candidates[0];
    if (c && Math.abs(beltRank(c.belt) - beltRank(b)) <= 1) {
      used.add(c.id);
      return { label: `${c.brand} ${c.name}`, belt: c.belt, lockId: c.id };
    }
    const bl = BELTS.find((x) => x.id === b)!;
    return { label: `Libovolný zámek – ${bl.label} pás`, belt: b, lockId: null };
  });
}

export function rankFor(time: number, par: number): Rank {
  const r = time / par;
  if (r <= 0.5) return 'S';
  if (r <= 0.75) return 'A';
  if (r <= 1) return 'B';
  return 'C';
}

const RANK_STYLE: Record<Rank, string> = {
  S: 'from-brass-300 via-brass-500 to-amber-700 text-ink-950',
  A: 'from-emerald-300 to-emerald-600 text-ink-950',
  B: 'from-sky-300 to-sky-600 text-ink-950',
  C: 'from-slate-300 to-slate-600 text-ink-950',
};

type Phase = 'setup' | 'countdown' | 'running' | 'done';

export function Gauntlet() {
  const { data, addChallenge, addSolve } = useStore();
  const [preset, setPreset] = useState<GauntletDifficulty>('warmup');
  const [virtual, setVirtual] = useState(false);
  const [slots, setSlots] = useState<Slot[] | null>(null);
  const [phase, setPhase] = useState<Phase>('setup');
  const [count, setCount] = useState(3);
  const [splits, setSplits] = useState<number[]>([]);
  const [now, setNow] = useState(0);
  const [result, setResult] = useState<ChallengeResult | null>(null);
  const startRef = useRef(0);
  const p = PRESETS.find((x) => x.id === preset)!;

  const history = useMemo(
    () => data.challenges.filter((c) => c.kind === 'gauntlet' && c.difficulty === preset && !!c.virtual === virtual && !c.dnf).sort((a, b) => (a.time ?? 0) - (b.time ?? 0)),
    [data.challenges, preset, virtual],
  );
  const pb = history[0];

  const generate = () => {
    sound.unlock();
    if (virtual) {
      setSlots(
        p.virtual.map((v, i) => ({
          label: `Virtuální zámek ${i + 1} · ${v.pins} pin${v.spools ? ` · ${v.spools}× spool` : ''}${v.serrated ? ` · ${v.serrated}× serrated` : ''}`,
          belt: p.belts[i],
          lockId: null,
          spec: randomSpec(v.pins, { spools: v.spools, serrated: v.serrated }),
        })),
      );
    } else setSlots(pickLocks(data.locks, p.belts));
    setPhase('setup');
    setSplits([]);
    setResult(null);
  };

  useEffect(() => {
    setSlots(null);
    setPhase('setup');
  }, [preset, virtual]);

  // countdown
  useEffect(() => {
    if (phase !== 'countdown') return;
    if (count <= 0) {
      sound.countdown(true);
      startRef.current = performance.now();
      setPhase('running');
      return;
    }
    sound.countdown(false);
    const t = window.setTimeout(() => setCount((c) => c - 1), 800);
    return () => window.clearTimeout(t);
  }, [phase, count]);

  // ticking
  useEffect(() => {
    if (phase !== 'running') return;
    let raf = 0;
    const tick = () => {
      setNow(performance.now() - startRef.current);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [phase]);

  const finish = (all: number[], dnf = false) => {
    setPhase('done');
    const total = all[all.length - 1] ?? 0;
    const par = virtual ? p.virtualPar : p.par;
    const rank = dnf ? undefined : rankFor(total, par);
    const rec = addChallenge({
      kind: 'gauntlet',
      difficulty: preset,
      time: total,
      splits: all,
      rank,
      virtual,
      dnf,
      lockIds: slots?.map((s) => s.lockId ?? '') ?? [],
    });
    setResult(rec);
    if (!virtual && slots && !dnf) {
      all.forEach((t, i) => {
        const prev = i === 0 ? 0 : all[i - 1];
        addSolve({
          time: Math.round(t - prev),
          penalty: 'none',
          lockId: slots[i].lockId,
          pickId: data.timerConfig.pickId,
          tensionId: data.timerConfig.tensionId,
          technique: data.timerConfig.technique,
          note: `3-Lock Gauntlet (${p.label}) – zámek ${i + 1}`,
          date: Date.now() - Math.round(total - t),
          source: 'gauntlet',
        });
      });
    }
    if (!dnf) {
      sound.open();
      vibrate([40, 40, 120]);
    }
  };

  const split = (at?: number) => {
    if (phase !== 'running') return;
    const t = at ?? performance.now() - startRef.current;
    const next = [...splits, t];
    setSplits(next);
    sound.split();
    vibrate(20);
    if (next.length >= 3) finish(next);
  };

  const pbSplit = (i: number) => pb?.splits?.[i];

  // ───────── running (real) – full-screen tap target
  if (phase === 'running' && !virtual) {
    const current = splits.length;
    return (
      <div className="no-select fixed inset-0 z-50 flex flex-col bg-ink-950" onPointerDown={() => split()}>
        <div className="flex items-center justify-between px-5 pt-[calc(1rem+var(--safe-top))] text-sm text-slate-400">
          <span>
            Zámek <b className="text-slate-100">{current + 1}</b>/3
          </span>
          <button
            className="rounded-full border border-bad/50 px-3 py-1 text-xs text-red-300"
            onPointerDown={(e) => {
              e.stopPropagation();
              finish([...splits, performance.now() - startRef.current], true);
            }}
          >
            DNF
          </button>
        </div>
        <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
          <div className="mb-2 text-base text-brass-300">{slots?.[current]?.label}</div>
          <div className="font-mono text-[22vw] font-bold leading-none tabular text-slate-50 sm:text-8xl">{formatTime(now)}</div>
          <div className="mt-6 w-full max-w-sm space-y-2">
            {splits.map((s, i) => {
              const ref = pbSplit(i);
              const delta = ref !== undefined ? s - ref : null;
              return (
                <div key={i} className="flex justify-between rounded-xl bg-panel px-4 py-2 font-mono text-sm">
                  <span className="text-slate-400">Split {i + 1}</span>
                  <span>
                    {formatTime(s)}
                    {delta !== null && <span className={delta <= 0 ? 'ml-2 text-emerald-400' : 'ml-2 text-red-400'}>{`${delta <= 0 ? '−' : '+'}${formatTime(Math.abs(delta))}`}</span>}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
        <div className="pb-[calc(2rem+var(--safe-bottom))] text-center text-sm text-slate-500">Klepni kamkoliv po otevření zámku</div>
      </div>
    );
  }

  return (
    <div>
      <Segmented
        value={virtual ? 'virtual' : 'real'}
        onChange={(v) => setVirtual(v === 'virtual')}
        options={[
          { id: 'real', label: '🔒 Reálné zámky' },
          { id: 'virtual', label: '🧪 Virtuální' },
        ]}
      />
      <div className="mt-3 grid grid-cols-2 gap-2">
        {PRESETS.map((x) => (
          <button
            key={x.id}
            onClick={() => setPreset(x.id)}
            className={`rounded-2xl border p-3 text-left transition ${preset === x.id ? 'border-brass-500 bg-brass-500/10' : 'border-edge bg-panel/60'}`}
          >
            <div className={`text-sm font-semibold ${preset === x.id ? 'text-brass-300' : 'text-slate-200'}`}>{x.label}</div>
            <div className="mt-0.5 text-[11px] text-slate-400">{x.desc}</div>
            <div className="mt-2 flex gap-1">
              {x.belts.map((b, i) => (
                <BeltBadge key={i} belt={b} size="sm" showLabel={false} />
              ))}
            </div>
          </button>
        ))}
      </div>

      {phase === 'setup' && (
        <>
          <Button variant="brass" size="lg" className="mt-4 w-full" icon="refresh" onClick={generate}>
            Generovat výzvu
          </Button>
          {slots && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <Card className="mt-3 divide-y divide-edge/60">
                {slots.map((s, i) => (
                  <div key={i} className="flex items-center gap-3 px-4 py-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-ink-950 font-mono font-bold text-brass-400">{i + 1}</span>
                    <div className="flex-1 text-sm text-slate-100">{s.label}</div>
                    <BeltBadge belt={s.belt} size="sm" />
                  </div>
                ))}
              </Card>
              <p className="mt-2 text-xs text-slate-500">
                {virtual
                  ? 'Časovač běží celou dobu, každý otevřený zámek automaticky uloží split.'
                  : 'Připrav si zámky na stůl v tomto pořadí. Po otevření každého zámku klepni kamkoliv na obrazovku (loktem, kloubem…).'}{' '}
                Par: {formatTime(virtual ? p.virtualPar : p.par)}
              </p>
              <Button
                variant="ok"
                size="lg"
                className="mt-3 w-full"
                icon="play"
                onClick={() => {
                  setSplits([]);
                  setCount(3);
                  setPhase('countdown');
                }}
              >
                Start
              </Button>
            </motion.div>
          )}
        </>
      )}

      <AnimatePresence>
        {phase === 'countdown' && (
          <motion.div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-950/95" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div key={count} initial={{ scale: 2, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="font-mono text-9xl font-bold brass-text">
              {count > 0 ? count : 'GO'}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {phase === 'running' && virtual && slots && (
        <div className="mt-4">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm text-slate-400">
              Zámek <b className="text-slate-100">{splits.length + 1}</b>/3
            </span>
            <span className="font-mono text-2xl font-bold text-slate-50 tabular">{formatTime(now)}</span>
            <button className="rounded-full border border-bad/50 px-3 py-1 text-xs text-red-300" onClick={() => finish([...splits, now], true)}>
              Vzdát
            </button>
          </div>
          <LockSimulator key={splits.length} spec={slots[splits.length].spec!} blind={false} compact onOpen={() => {
              const t = performance.now() - startRef.current;
              window.setTimeout(() => split(t), 700);
            }} />
        </div>
      )}

      {phase === 'done' && result && (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
          <Card className="mt-4 p-5 text-center">
            {result.dnf ? (
              <div className="text-2xl font-bold text-red-300">DNF</div>
            ) : (
              <motion.div
                initial={{ rotate: -25, scale: 0.3 }}
                animate={{ rotate: 0, scale: 1 }}
                transition={{ type: 'spring', stiffness: 220, damping: 10 }}
                className={`mx-auto flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-br text-6xl font-black shadow-2xl ${RANK_STYLE[result.rank!]}`}
              >
                {result.rank}
              </motion.div>
            )}
            <div className="mt-3 font-mono text-4xl font-bold text-slate-50">{formatTime(result.time)}</div>
            {pb && pb.id !== result.id && !result.dnf && (
              <div className={`text-sm ${result.time! <= pb.time! ? 'text-emerald-300' : 'text-slate-400'}`}>
                {result.time! <= pb.time! ? '🎉 Nový osobní rekord!' : `PB ${formatTime(pb.time)} (+${formatTime(result.time! - pb.time!)})`}
              </div>
            )}
            <div className="mt-4 space-y-1.5 text-left">
              {result.splits?.map((s, i) => {
                const seg = s - (i ? result.splits![i - 1] : 0);
                const ref = pb && pb.id !== result.id ? pb.splits?.[i] : undefined;
                const d = ref !== undefined ? s - ref : null;
                return (
                  <div key={i} className="flex items-center justify-between rounded-xl bg-ink-950 px-3 py-2 font-mono text-sm">
                    <span className="text-slate-400">#{i + 1} {formatTime(seg)}</span>
                    <span>
                      {formatTime(s)}
                      {d !== null && <span className={d <= 0 ? 'ml-2 text-emerald-400' : 'ml-2 text-red-400'}>{`${d <= 0 ? '−' : '+'}${formatTime(Math.abs(d))}`}</span>}
                    </span>
                  </div>
                );
              })}
            </div>
            <Button variant="brass" className="mt-4 w-full" icon="refresh" onClick={generate}>
              Nová výzva
            </Button>
          </Card>
        </motion.div>
      )}

      <SectionTitle sub={`${p.label} · ${virtual ? 'virtuální' : 'reálné'} · hodnocení: S ≤ 50 % paru, A ≤ 75 %, B ≤ 100 %`}>Nejlepší pokusy</SectionTitle>
      {history.length ? (
        <Card className="divide-y divide-edge/60">
          {history.slice(0, 5).map((h, i) => (
            <div key={h.id} className="flex items-center gap-3 px-4 py-2.5 text-sm">
              <span className={`w-6 font-mono font-bold ${i === 0 ? 'text-brass-400' : 'text-slate-500'}`}>#{i + 1}</span>
              <span className={`flex h-6 w-6 items-center justify-center rounded-md bg-gradient-to-br text-xs font-black ${RANK_STYLE[h.rank ?? 'C']}`}>{h.rank}</span>
              <span className="flex-1 font-mono">{formatTime(h.time)}</span>
              <span className="text-xs text-slate-500">{formatDate(h.date, false)}</span>
            </div>
          ))}
        </Card>
      ) : (
        <p className="text-sm text-slate-500">Zatím žádný pokus v této kategorii.</p>
      )}
    </div>
  );
}
