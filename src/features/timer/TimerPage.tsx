import { AnimatePresence, motion } from 'framer-motion';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useStore } from '../../store/AppStore';
import { formatSolve, formatTime, formatDate, relativeDay } from '../../lib/format';
import { effectiveTime, summarize } from '../../lib/stats';
import { sound } from '../../lib/audio';
import { vibrate } from '../../lib/haptics';
import { BeltBadge, Button, Card, SectionTitle, Segmented, Sheet } from '../../components/ui';
import { Icon } from '../../components/Icon';
import { TECHNIQUES, TOOL_PROFILES, thicknessLabel } from '../../data/labels';
import type { Penalty, SolveRecord, Technique } from '../../types';
import { useAudioTrigger } from './useAudioTrigger';
import { useWakeLock } from './useWakeLock';

type Phase = 'idle' | 'inspect' | 'holding' | 'ready' | 'running' | 'stopped';

export function TimerPage() {
  const { data, setTimerConfig, addSolve, updateSolve, deleteSolve, updateSettings } = useStore();
  const { settings, timerConfig: cfg } = data;
  const [phase, setPhase] = useState<Phase>('idle');
  const [display, setDisplay] = useState(0);
  const [inspectLeft, setInspectLeft] = useState(0);
  const [lastId, setLastId] = useState<string | null>(null);
  const [scope, setScope] = useState<'lock' | 'all'>('lock');
  const [detail, setDetail] = useState<SolveRecord | null>(null);
  const [noteFor, setNoteFor] = useState<SolveRecord | null>(null);
  const [showMic, setShowMic] = useState(false);

  const startAt = useRef(0);
  const inspectStart = useRef(0);
  const holdTimer = useRef<number | undefined>(undefined);
  const pointers = useRef(new Set<number>());
  const phaseRef = useRef<Phase>('idle');
  const prevPhase = useRef<Phase>('idle');
  const inspectionPenalty = useRef<Penalty>('none');
  const needRelease = useRef(false);
  phaseRef.current = phase;

  const required = settings.requireTwoFingers ? 2 : 1;

  const lock = data.locks.find((l) => l.id === cfg.lockId) ?? null;
  const picks = data.tools.filter((t) => t.category === 'pick' || t.category === 'rake' || t.category === 'special');
  const tensions = data.tools.filter((t) => t.category === 'tension');

  const scoped = useMemo(() => {
    const list = scope === 'lock' && cfg.lockId ? data.solves.filter((s) => s.lockId === cfg.lockId) : data.solves;
    return [...list].sort((a, b) => a.date - b.date);
  }, [data.solves, scope, cfg.lockId]);
  const stats = useMemo(() => summarize(scoped), [scoped]);
  const last = lastId ? (data.solves.find((s) => s.id === lastId) ?? null) : null;

  useWakeLock(phase === 'running' || phase === 'inspect' || phase === 'ready');

  // ── timing loop
  useEffect(() => {
    if (phase !== 'running' && phase !== 'inspect') return;
    let raf = 0;
    const tick = () => {
      const now = performance.now();
      if (phaseRef.current === 'running') setDisplay(now - startAt.current);
      else if (phaseRef.current === 'inspect') {
        const left = settings.inspectionSec * 1000 - (now - inspectStart.current);
        setInspectLeft(left);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [phase, settings.inspectionSec]);

  // inspection beeps at 8s / 12s like WCA
  const beeped = useRef<Set<number>>(new Set());
  useEffect(() => {
    if (phase !== 'inspect' && phase !== 'holding' && phase !== 'ready') return;
    if (!settings.inspectionSec) return;
    const elapsed = settings.inspectionSec * 1000 - inspectLeft;
    for (const mark of [settings.inspectionSec * 1000 - 7000, settings.inspectionSec * 1000 - 3000]) {
      if (mark > 0 && elapsed >= mark && !beeped.current.has(mark)) {
        beeped.current.add(mark);
        sound.countdown(false);
      }
    }
  }, [inspectLeft, phase, settings.inspectionSec]);

  const begin = useCallback(() => {
    startAt.current = performance.now();
    setDisplay(0);
    setPhase('running');
    sound.timerStart();
    vibrate(15);
    if (settings.inspectionSec) {
      const over = performance.now() - inspectStart.current - settings.inspectionSec * 1000;
      inspectionPenalty.current = over > 2000 ? 'DNF' : over > 0 ? '+2' : 'none';
    } else inspectionPenalty.current = 'none';
  }, [settings.inspectionSec]);

  const stop = useCallback(
    (source: 'timer' | 'audio' = 'timer') => {
      if (phaseRef.current !== 'running') return;
      const t = Math.round(performance.now() - startAt.current);
      phaseRef.current = 'stopped';
      setPhase('stopped');
      setDisplay(t);
      needRelease.current = false;
      sound.timerStop();
      vibrate([20, 30, 20]);
      const rec = addSolve({
        time: t,
        penalty: inspectionPenalty.current,
        lockId: cfg.lockId,
        pickId: cfg.pickId,
        tensionId: cfg.tensionId,
        technique: cfg.technique,
        note: '',
        date: Date.now(),
        source,
      });
      setLastId(rec.id);
    },
    [addSolve, cfg],
  );

  const mic = useAudioTrigger({
    enabled: settings.audioTrigger,
    threshold: settings.audioThreshold,
    armed: phase === 'running' && display > 600,
    onTrigger: () => stop('audio'),
  });

  // ── Stackmat-style hold & release
  const press = useCallback(() => {
    sound.unlock();
    const p = phaseRef.current;
    if (needRelease.current) return;
    if (p === 'idle' || p === 'stopped' || p === 'inspect') {
      if (pointers.current.size < required) return;
      prevPhase.current = p === 'stopped' ? 'idle' : p;
      setPhase('holding');
      window.clearTimeout(holdTimer.current);
      holdTimer.current = window.setTimeout(() => {
        if (phaseRef.current === 'holding') {
          setPhase('ready');
          sound.timerReady();
          vibrate(8);
        }
      }, settings.holdToStartMs);
    }
  }, [required, settings.holdToStartMs]);

  const release = useCallback(() => {
    const p = phaseRef.current;
    if (needRelease.current && pointers.current.size === 0) {
      needRelease.current = false;
      return;
    }
    if (p === 'holding' && pointers.current.size < required) {
      window.clearTimeout(holdTimer.current);
      // a quick tap in idle starts inspection (if enabled)
      if (prevPhase.current === 'idle' && settings.inspectionSec > 0) {
        inspectStart.current = performance.now();
        beeped.current = new Set();
        setInspectLeft(settings.inspectionSec * 1000);
        setPhase('inspect');
      } else setPhase(prevPhase.current);
    } else if (p === 'ready' && pointers.current.size < required) {
      begin();
    }
  }, [begin, required, settings.inspectionSec]);

  // keyboard (space) — desktop
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      if (phaseRef.current === 'running') {
        e.preventDefault();
        stop();
        return;
      }
      if (e.code === 'Space' && !e.repeat) {
        e.preventDefault();
        pointers.current.add(-1);
        press();
      }
    };
    const up = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        pointers.current.delete(-1);
        release();
      }
    };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
    };
  }, [press, release, stop]);

  const onPadDown = (e: React.PointerEvent) => {
    pointers.current.add(e.pointerId);
    press();
  };
  const onPadUp = (e: React.PointerEvent) => {
    pointers.current.delete(e.pointerId);
    release();
  };

  const setPenalty = (s: SolveRecord, p: Penalty) => updateSolve(s.id, { penalty: s.penalty === p ? 'none' : p });

  const padColor =
    phase === 'ready'
      ? 'border-ok bg-ok/15 shadow-[0_0_60px_-10px_rgba(16,185,129,0.6)]'
      : phase === 'holding'
        ? 'border-bad/70 bg-bad/10'
        : phase === 'inspect'
          ? 'border-brass-500 bg-brass-500/10'
          : 'border-white/[0.07] bg-[radial-gradient(120%_90%_at_50%_0%,rgba(255,173,51,0.13),rgba(182,156,255,0.06)_45%,rgba(255,255,255,0.03)_80%)] shadow-[0_24px_50px_-30px_rgba(0,0,0,0.9)]';
  const digitColor = phase === 'ready' ? 'text-emerald-300' : phase === 'holding' ? 'text-red-300' : 'text-slate-50';

  const mainText = (() => {
    if (phase === 'inspect' || ((phase === 'holding' || phase === 'ready') && prevPhase.current === 'inspect')) {
      const s = Math.ceil(inspectLeft / 1000);
      return s > 0 ? String(s) : s > -2 ? '+2' : 'DNF';
    }
    if (phase === 'stopped' && last) return formatSolve(last.time, last.penalty);
    if (phase === 'idle' && last) return formatSolve(last.time, last.penalty);
    return formatTime(display);
  })();

  const recent = [...scoped].reverse().slice(0, 50);

  return (
    <div>
      {/* Config */}
      <Card className="p-3">
        <div className="grid grid-cols-2 gap-2">
          <label className="col-span-2">
            <span className="mb-1 block text-xs font-semibold text-steel-400">Zámek</span>
            <select className="field" value={cfg.lockId ?? ''} onChange={(e) => setTimerConfig({ lockId: e.target.value || null })}>
              <option value="">— bez zámku —</option>
              {data.locks.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.brand} {l.name} ({l.pins} pin)
                </option>
              ))}
            </select>
          </label>
          <label>
            <span className="mb-1 block text-xs font-semibold text-steel-400">Planžeta</span>
            <select className="field text-sm" value={cfg.pickId ?? ''} onChange={(e) => setTimerConfig({ pickId: e.target.value || null })}>
              <option value="">—</option>
              {picks.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} · {t.thickness}"
                </option>
              ))}
            </select>
          </label>
          <label>
            <span className="mb-1 block text-xs font-semibold text-steel-400">Napínák</span>
            <select className="field text-sm" value={cfg.tensionId ?? ''} onChange={(e) => setTimerConfig({ tensionId: e.target.value || null })}>
              <option value="">—</option>
              {tensions.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name.includes(t.position) ? '' : `${t.position} `}
                  {t.name} · {t.thickness}"
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="mt-2">
          <Segmented<Technique> size="sm" value={cfg.technique} onChange={(v) => setTimerConfig({ technique: v })} options={TECHNIQUES.map((t) => ({ id: t.id, label: t.label }))} />
        </div>
        {lock && (
          <div className="mt-2 flex items-center gap-2 px-1 text-xs text-slate-400">
            <BeltBadge belt={lock.belt} size="sm" />
            <span>{lock.pinConfig.filter((p) => p.type !== 'standard' && p.type !== 'unknown').length} bezpečnostních pinů</span>
            {lock.bindingOrder.length > 0 && <span className="font-mono text-slate-500">BO: {lock.bindingOrder.join('→')}</span>}
          </div>
        )}
      </Card>

      {/* Stackmat pad */}
      <div
        className={`no-select touch-none relative mt-3 flex h-[42vh] min-h-[260px] cursor-pointer flex-col items-center justify-center rounded-[2.2rem] border-2 transition-colors duration-150 ${padColor}`}
        onPointerDown={onPadDown}
        onPointerUp={onPadUp}
        onPointerCancel={onPadUp}
        onPointerLeave={(e) => {
          if (pointers.current.has(e.pointerId)) onPadUp(e);
        }}
        onContextMenu={(e) => e.preventDefault()}
      >
        <div className="absolute left-4 top-3 flex gap-2 text-xs font-semibold">
          {settings.audioTrigger && (
            <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 ${mic.status === 'on' ? 'bg-ok/15 text-emerald-300' : 'bg-bad/15 text-red-300'}`}>
              <Icon name="mic" size={11} /> {mic.status === 'on' ? 'mic' : mic.status}
            </span>
          )}
          {settings.inspectionSec > 0 && <span className="rounded-full bg-brass-500/15 px-2 py-0.5 text-brass-300">insp {settings.inspectionSec}s</span>}
          {required === 2 && <span className="rounded-full bg-azure-400/15 px-2 py-0.5 text-azure-400">2 prsty</span>}
        </div>
        <motion.div key={phase === 'stopped' ? lastId : 'live'} initial={phase === 'stopped' ? { scale: 1.08 } : false} animate={{ scale: 1 }} className={`font-mono text-[19vw] font-extrabold leading-none tracking-tight sm:text-8xl ${digitColor}`}>
          {mainText}
        </motion.div>
        <div className="mt-3 text-sm text-slate-400">
          {phase === 'idle' && (settings.inspectionSec ? 'Klepni pro prohlídku · podrž pro start' : `Podrž ${required === 2 ? 'dvěma prsty' : 'prst'} a pusť pro start`)}
          {phase === 'inspect' && 'Prohlídka – podrž a pusť pro start'}
          {phase === 'holding' && 'Drž…'}
          {phase === 'ready' && <span className="font-semibold text-emerald-300">PŘIPRAVENO – pusť!</span>}
          {phase === 'stopped' && 'Podrž znovu pro další pokus'}
        </div>
        <div className="absolute bottom-3 hidden text-[11px] text-slate-500 sm:block">Na počítači: mezerník</div>
      </div>

      {/* Last solve actions */}
      <AnimatePresence>
        {last && (phase === 'stopped' || phase === 'idle') && (
          <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-3 grid grid-cols-4 gap-2">
            <Button size="sm" variant={last.penalty === '+2' ? 'brass' : 'steel'} onClick={() => setPenalty(last, '+2')}>
              +2
            </Button>
            <Button size="sm" variant={last.penalty === 'DNF' ? 'danger' : 'steel'} onClick={() => setPenalty(last, 'DNF')}>
              DNF
            </Button>
            <Button size="sm" icon="note" onClick={() => setNoteFor(last)}>
              {last.note ? '✓' : ''}
            </Button>
            <Button
              size="sm"
              variant="danger"
              icon="trash"
              onClick={() => {
                deleteSolve(last.id);
                setLastId(null);
                setPhase('idle');
                setDisplay(0);
              }}
              aria-label="Smazat"
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Averages */}
      <SectionTitle
        action={
          <Segmented
            size="sm"
            value={scope}
            onChange={setScope}
            options={[
              { id: 'lock', label: 'Tento zámek' },
              { id: 'all', label: 'Vše' },
            ]}
          />
        }
      >
        Průměry (WCA)
      </SectionTitle>
      <div className="grid grid-cols-2 gap-2">
        {stats.averages.map((a) => (
          <div key={a.n} className="card px-3.5 py-3">
            <div className="flex items-baseline justify-between">
              <span className="text-xs font-semibold text-steel-400">Ao{a.n}</span>
              <span className="text-[10px] text-slate-500">best {formatTime(a.best)}</span>
            </div>
            <div className="mt-1 font-mono text-xl font-semibold tabular text-slate-50">{formatTime(a.current)}</div>
          </div>
        ))}
      </div>
      <div className="mt-2 grid grid-cols-3 gap-2 text-center">
        <div className="card px-2 py-2.5">
          <div className="text-xs text-steel-400">PB single</div>
          <div className="font-mono font-semibold text-brass-300">{formatTime(stats.best)}</div>
        </div>
        <div className="card px-2 py-2.5">
          <div className="text-xs text-steel-400">Mean</div>
          <div className="font-mono font-semibold">{formatTime(stats.mean)}</div>
        </div>
        <div className="card px-2 py-2.5">
          <div className="text-xs text-steel-400">Otevřeno</div>
          <div className="font-mono font-semibold">
            {stats.solved}/{stats.count}
          </div>
        </div>
      </div>

      {/* Mic trigger */}
      <Card className="mt-3 p-3.5">
        <button className="flex w-full items-center justify-between" onClick={() => setShowMic((v) => !v)}>
          <span className="inline-flex items-center gap-2 text-sm font-semibold">
            <Icon name="mic" size={16} className="text-azure-400" /> Akustické zastavení
            <span className={`rounded-full px-2 py-0.5 text-[10px] ${settings.audioTrigger ? 'bg-ok/15 text-emerald-300' : 'bg-edge text-slate-400'}`}>{settings.audioTrigger ? 'ZAP' : 'VYP'}</span>
          </span>
          <Icon name="chevronDown" size={16} className={showMic ? 'rotate-180' : ''} />
        </button>
        {showMic && (
          <div className="mt-3">
            <p className="mb-3 text-xs text-slate-400">
              Mikrofon zachytí ostré cvaknutí třmenu visacího zámku a stopky se samy zastaví. Nastav práh tak, aby ho běžný hluk nepřekročil.
            </p>
            <Button size="sm" variant={settings.audioTrigger ? 'danger' : 'ok'} icon="mic" onClick={() => updateSettings({ audioTrigger: !settings.audioTrigger })}>
              {settings.audioTrigger ? 'Vypnout mikrofon' : 'Zapnout mikrofon'}
            </Button>
            {mic.status === 'denied' && <p className="mt-2 text-xs text-red-300">Přístup k mikrofonu byl odepřen.</p>}
            {mic.status === 'unsupported' && <p className="mt-2 text-xs text-red-300">Prohlížeč nepodporuje mikrofon.</p>}
            <div className="mt-3">
              <div className="mb-1 flex justify-between text-xs">
                <span className="text-slate-400">Citlivost (práh)</span>
                <span className="font-mono text-brass-300">{Math.round(settings.audioThreshold * 100)} %</span>
              </div>
              <div className="relative h-3 overflow-hidden rounded-full bg-black/25">
                <div className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-ok via-brass-500 to-bad transition-[width] duration-75" style={{ width: `${mic.level * 100}%` }} />
                <div className="absolute inset-y-0 w-0.5 bg-white" style={{ left: `${settings.audioThreshold * 100}%` }} />
              </div>
              <input type="range" className="slider mt-2 w-full" min={0.15} max={0.98} step={0.01} value={settings.audioThreshold} onChange={(e) => updateSettings({ audioThreshold: +e.target.value })} />
            </div>
          </div>
        )}
      </Card>

      {/* Solve list */}
      <SectionTitle sub={scope === 'lock' && lock ? `${lock.brand} ${lock.name}` : 'Všechny zámky'}>Historie ({scoped.length})</SectionTitle>
      {recent.length === 0 ? (
        <p className="text-sm text-slate-500">Zatím žádné časy. Podrž stopky a jdi na to!</p>
      ) : (
        <Card className="divide-y divide-white/[0.06]">
          {recent.map((s, i) => {
            const n = scoped.length - i;
            const l = data.locks.find((x) => x.id === s.lockId);
            const isPb = Number.isFinite(effectiveTime(s)) && effectiveTime(s) === stats.best;
            return (
              <button key={s.id} className="flex w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-white/[0.02]" onClick={() => setDetail(s)}>
                <span className="w-8 font-mono text-xs text-slate-500">{n}.</span>
                <span className={`w-24 font-mono font-semibold tabular ${s.penalty === 'DNF' ? 'text-red-400' : isPb ? 'text-brass-300' : 'text-slate-100'}`}>
                  {formatSolve(s.time, s.penalty)}
                  {isPb && ' ★'}
                </span>
                <span className="flex-1 truncate text-xs text-slate-400">
                  {scope === 'all' && l ? `${l.name} · ` : ''}
                  {s.technique}
                  {s.source === 'audio' && ' · 🎤'}
                  {s.source === 'gauntlet' && ' · ⏱️'}
                  {s.note && ' · 📝'}
                </span>
                <span className="text-[11px] text-slate-500">{relativeDay(s.date)}</span>
              </button>
            );
          })}
        </Card>
      )}

      {/* Full-screen running hitbox */}
      <AnimatePresence>
        {phase === 'running' && (
          <motion.div
            className="no-select touch-none fixed inset-0 z-[70] flex cursor-pointer flex-col items-center justify-center bg-black/25"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.08 }}
            onPointerDown={() => stop()}
          >
            <div className="font-mono text-[24vw] font-bold leading-none tabular text-slate-50">{settings.hideTimeWhileRunning ? '••.••' : formatTime(display)}</div>
            <div className="mt-6 rounded-full border-2 border-bad/60 px-8 py-3 text-lg font-bold tracking-[0.3em] text-red-300">STOP</div>
            <div className="absolute bottom-[calc(1.5rem+var(--safe-bottom))] text-center text-sm text-slate-500">
              Klepni kamkoliv – kloubem, dlaní, loktem
              {settings.audioTrigger && mic.status === 'on' && (
                <div className="mt-2 flex items-center justify-center gap-2">
                  <Icon name="mic" size={14} className="text-emerald-400" />
                  <div className="h-1.5 w-32 overflow-hidden rounded-full bg-white/[0.07]">
                    <div className="h-full bg-emerald-400" style={{ width: `${mic.level * 100}%` }} />
                  </div>
                </div>
              )}
            </div>
            {lock && <div className="absolute top-[calc(1.5rem+var(--safe-top))] text-sm text-slate-500">{lock.brand} {lock.name}</div>}
          </motion.div>
        )}
      </AnimatePresence>

      <SolveSheet solve={detail} onClose={() => setDetail(null)} onNote={(s) => setNoteFor(s)} />
      <NoteSheet solve={noteFor} onClose={() => setNoteFor(null)} />
    </div>
  );
}

function SolveSheet({ solve, onClose, onNote }: { solve: SolveRecord | null; onClose: () => void; onNote: (s: SolveRecord) => void }) {
  const { data, updateSolve, deleteSolve } = useStore();
  const s = solve ? (data.solves.find((x) => x.id === solve.id) ?? null) : null;
  const tool = (id: string | null) => data.tools.find((t) => t.id === id);
  const l = s ? data.locks.find((x) => x.id === s.lockId) : null;
  return (
    <Sheet open={!!s} onClose={onClose} title="Detail pokusu">
      {s && (
        <div>
          <div className="text-center">
            <div className={`font-mono text-5xl font-bold ${s.penalty === 'DNF' ? 'text-red-400' : 'text-slate-50'}`}>{formatSolve(s.time, s.penalty)}</div>
            {s.penalty !== 'none' && <div className="text-xs text-slate-500">surový čas {formatTime(s.time)}</div>}
            <div className="mt-1 text-xs text-slate-400">{formatDate(s.date)}</div>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-2">
            {(['none', '+2', 'DNF'] as Penalty[]).map((p) => (
              <Button key={p} size="sm" variant={s.penalty === p ? (p === 'DNF' ? 'danger' : 'brass') : 'steel'} onClick={() => updateSolve(s.id, { penalty: p })}>
                {p === 'none' ? 'OK' : p}
              </Button>
            ))}
          </div>
          <dl className="mt-4 space-y-2 rounded-2xl bg-black/25 p-3 text-sm">
            <Row k="Zámek" v={l ? `${l.brand} ${l.name}` : '—'} />
            <Row k="Planžeta" v={tool(s.pickId) ? `${tool(s.pickId)!.name} (${TOOL_PROFILES[tool(s.pickId)!.profile].label}, ${thicknessLabel(tool(s.pickId)!.thickness)})` : '—'} />
            <Row k="Napínák" v={tool(s.tensionId) ? `${tool(s.tensionId)!.position} ${tool(s.tensionId)!.name}` : '—'} />
            <Row k="Technika" v={s.technique} />
            <Row k="Zdroj" v={s.source === 'audio' ? 'Akustické zastavení' : s.source === 'gauntlet' ? '3-Lock Gauntlet' : 'Stopky'} />
          </dl>
          <div className="mt-3 rounded-2xl border border-white/10 p-3 text-sm">
            <div className="mb-1 text-xs text-steel-400">Poznámka</div>
            <div className="text-slate-300">{s.note || <span className="text-slate-500">Bez poznámky</span>}</div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <Button icon="note" onClick={() => onNote(s)}>
              Upravit poznámku
            </Button>
            <Button
              variant="danger"
              icon="trash"
              onClick={() => {
                deleteSolve(s.id);
                onClose();
              }}
            >
              Smazat
            </Button>
          </div>
        </div>
      )}
    </Sheet>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-slate-500">{k}</dt>
      <dd className="text-right text-slate-200">{v}</dd>
    </div>
  );
}

function NoteSheet({ solve, onClose }: { solve: SolveRecord | null; onClose: () => void }) {
  const { updateSolve } = useStore();
  const [text, setText] = useState('');
  useEffect(() => setText(solve?.note ?? ''), [solve]);
  const suggestions = ['Spool na pinu ', 'Přemačknuto, reset', 'Lehčí napětí pomohlo', 'False set', 'Raking selhal → SPP', 'Napínák sklouzl'];
  return (
    <Sheet
      open={!!solve}
      onClose={onClose}
      title="Poznámka k pokusu"
      footer={
        <Button
          variant="brass"
          className="w-full"
          onClick={() => {
            if (solve) updateSolve(solve.id, { note: text.trim() });
            onClose();
          }}
        >
          Uložit
        </Button>
      }
    >
      <textarea className="field min-h-[120px]" autoFocus value={text} onChange={(e) => setText(e.target.value)} placeholder="např. 3. stavítko bylo spool, pomohlo povolit napínák" />
      <div className="mt-3 flex flex-wrap gap-2">
        {suggestions.map((s) => (
          <button key={s} className="rounded-full border border-white/10 px-3 py-1 text-xs text-slate-300" onClick={() => setText((t) => (t ? `${t} ${s}` : s))}>
            {s}
          </button>
        ))}
      </div>
    </Sheet>
  );
}
