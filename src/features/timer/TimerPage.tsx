import { AnimatePresence, motion } from 'framer-motion';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useStore } from '../../store/AppStore';
import { formatSolve, formatTime, formatDate, relativeDay } from '../../lib/format';
import { effectiveTime, summarize } from '../../lib/stats';
import { sound } from '../../lib/audio';
import { vibrate } from '../../lib/haptics';
import { BeltBadge, Button, Card, GroupLabel, IconTile, ListGroup, ListRow, PageHeader, SectionTitle, Segmented, SelectRow, Sheet, Switch } from '../../components/ui';
import { IOS } from '../../lib/colors';
import { Icon } from '../../components/Icon';
import { TECHNIQUES, TOOL_PROFILES, thicknessLabel } from '../../data/labels';
import type { Penalty, SolveRecord, Technique } from '../../types';
import { useAudioTrigger } from './useAudioTrigger';
import { useWakeLock } from './useWakeLock';

type Phase = 'idle' | 'inspect' | 'holding' | 'ready' | 'running' | 'stopped';

export function TimerPage() {
  const { data, addSolve, updateSolve, deleteSolve, navigate } = useStore();
  const { settings, timerConfig: cfg } = data;
  const [phase, setPhase] = useState<Phase>('idle');
  const [display, setDisplay] = useState(0);
  const [inspectLeft, setInspectLeft] = useState(0);
  const [lastId, setLastId] = useState<string | null>(null);
  const [setupOpen, setSetupOpen] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [detail, setDetail] = useState<SolveRecord | null>(null);
  const [noteFor, setNoteFor] = useState<SolveRecord | null>(null);

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

  const scoped = useMemo(() => {
    const list = cfg.lockId ? data.solves.filter((s) => s.lockId === cfg.lockId) : data.solves;
    return [...list].sort((a, b) => a.date - b.date);
  }, [data.solves, cfg.lockId]);
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
  // ring: last result relative to the record (full = new record); inspection counts down
  const ringProgress = (() => {
    if (phase === 'ready' || phase === 'holding') return 1;
    if (phase === 'inspect') return Math.max(0, inspectLeft / Math.max(1, settings.inspectionSec * 1000));
    if (last && stats.best != null && Number.isFinite(stats.best) && Number.isFinite(effectiveTime(last))) return Math.min(1, stats.best / effectiveTime(last));
    return 0;
  })();

  const avg5 = stats.averages[0];
  const shown = showAll ? recent : recent.slice(0, 5);
  const pick = data.tools.find((t) => t.id === cfg.pickId);

  return (
    <div>
      <PageHeader title="Stopky" />

      {/* What am I training on – one row, details in a sheet */}
      <button type="button" onClick={() => setSetupOpen(true)} className="card flex w-full items-center gap-3 px-4 py-3 text-left transition active:opacity-70">
        <IconTile icon="lock" color={IOS.orange} size={40} />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[17px] font-semibold text-slate-50">{lock ? `${lock.brand} ${lock.name}` : 'Vyber zámek'}</span>
          <span className="block truncate text-[13px] text-slate-400">
            {pick ? pick.name : 'bez planžety'} · {cfg.technique}
            {settings.audioTrigger ? ' · mikrofon' : ''}
          </span>
        </span>
        {lock && <BeltBadge belt={lock.belt} size="sm" />}
        <Icon name="chevronRight" size={16} strokeWidth={2.6} className="shrink-0 text-slate-600" />
      </button>

      {/* Stackmat pad with ring dial */}
      <div
        className={`card no-select touch-none relative mt-3 flex h-[42vh] min-h-[300px] cursor-pointer flex-col items-center justify-center transition-colors duration-150 ${
          phase === 'ready' ? 'bg-ok/10' : phase === 'holding' ? 'bg-bad/[0.07]' : ''
        }`}
        onPointerDown={onPadDown}
        onPointerUp={onPadUp}
        onPointerCancel={onPadUp}
        onPointerLeave={(e) => {
          if (pointers.current.has(e.pointerId)) onPadUp(e);
        }}
        onContextMenu={(e) => e.preventDefault()}
      >
        <div className="absolute left-3 top-3 flex gap-1.5 text-[12px] font-semibold">
          {settings.audioTrigger && (
            <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 ${mic.status === 'on' ? 'bg-ok/15 text-emerald-300' : 'bg-bad/15 text-red-300'}`}>
              <Icon name="mic" size={11} /> {mic.status === 'on' ? 'mikrofon' : mic.status}
            </span>
          )}
          {settings.inspectionSec > 0 && <span className="rounded-full bg-fill px-2 py-0.5 text-slate-300">prohlídka {settings.inspectionSec} s</span>}
          {required === 2 && <span className="rounded-full bg-fill px-2 py-0.5 text-slate-300">2 prsty</span>}
        </div>
        <TimerRing phase={phase} progress={ringProgress}>
          <div className="text-[13px] font-semibold text-slate-400">
            {phase === 'idle' && (last ? 'Poslední pokus' : 'Připraveno')}
            {phase === 'inspect' && 'Prohlídka'}
            {phase === 'holding' && 'Drž…'}
            {phase === 'ready' && <span className="text-emerald-300">Pusť!</span>}
            {phase === 'stopped' && 'Hotovo'}
          </div>
          <motion.div
            key={phase === 'stopped' ? lastId : 'live'}
            initial={phase === 'stopped' ? { scale: 1.08 } : false}
            animate={{ scale: 1 }}
            className={`font-mono font-semibold leading-none tracking-tight ${mainText.length > 6 ? 'text-[44px]' : 'text-[58px]'} ${digitColor}`}
          >
            {mainText}
          </motion.div>
          <div className="mt-1 h-5 text-[13px] font-semibold text-brass-500">{Number.isFinite(stats.best) ? `Rekord ${formatTime(stats.best)}` : ''}</div>
        </TimerRing>
        <div className="mt-4 text-[15px] text-slate-400">
          {phase === 'idle' && (settings.inspectionSec ? 'Klepni pro prohlídku · podrž pro start' : `Podrž ${required === 2 ? 'dvěma prsty' : 'prst'} a pusť pro start`)}
          {phase === 'inspect' && 'Podrž a pusť pro start'}
          {phase === 'holding' && 'Drž, dokud se kruh nezazelená'}
          {phase === 'ready' && 'Pusť pro start'}
          {phase === 'stopped' && 'Podrž znovu pro další pokus'}
        </div>
        <div className="absolute bottom-3 hidden text-[12px] text-slate-500 sm:block">Na počítači: mezerník</div>
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
            <Button size="sm" icon="note" onClick={() => setNoteFor(last)} aria-label="Poznámka">
              {last.note ? 'upravit' : ''}
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

      {/* Three numbers that matter; the rest lives in Statistiky */}
      <div className="mt-3 grid grid-cols-3 gap-2 text-center">
        <QuickStat label="Rekord" value={formatTime(stats.best)} accent />
        <QuickStat label="Průměr z 5" value={formatTime(avg5?.current ?? NaN)} />
        <QuickStat label="Otevřeno" value={`${stats.solved}/${stats.count}`} />
      </div>
      <button type="button" onClick={() => navigate('stats')} className="mt-2 flex w-full items-center justify-center gap-1 py-2 text-[15px] text-brass-500 active:opacity-50">
        Průměry a grafy ve Statistikách <Icon name="chevronRight" size={15} strokeWidth={2.6} />
      </button>

      {/* Recent attempts */}
      <SectionTitle sub={lock ? `${lock.brand} ${lock.name}` : 'Všechny zámky'}>Poslední pokusy</SectionTitle>
      {recent.length === 0 ? (
        <Card className="px-4 py-6 text-center text-[15px] text-slate-400">Zatím žádné časy. Podrž stopky a jdi na to!</Card>
      ) : (
        <Card className="divide-y divide-sep">
          {shown.map((s, i) => {
            const n = scoped.length - i;
            const isPb = Number.isFinite(effectiveTime(s)) && effectiveTime(s) === stats.best;
            return (
              <button key={s.id} className="flex w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-fill-strong" onClick={() => setDetail(s)}>
                <span className="w-7 font-mono text-[13px] text-slate-500">{n}</span>
                <span className={`flex w-24 items-center gap-1 font-mono text-[17px] font-semibold ${s.penalty === 'DNF' ? 'text-red-300' : isPb ? 'text-brass-500' : 'text-slate-50'}`}>
                  {formatSolve(s.time, s.penalty)}
                  {isPb && <Icon name="star" size={13} strokeWidth={2.6} />}
                </span>
                <span className="flex flex-1 items-center gap-1.5 truncate text-[13px] text-slate-400">
                  {s.technique}
                  {s.source === 'audio' && <Icon name="mic" size={13} />}
                  {s.source === 'gauntlet' && <Icon name="flag" size={13} />}
                  {s.note && <Icon name="note" size={13} />}
                </span>
                <span className="text-[13px] text-slate-500">{relativeDay(s.date)}</span>
              </button>
            );
          })}
          {recent.length > 5 && (
            <button className="w-full px-4 py-3 text-center text-[15px] text-brass-500" onClick={() => setShowAll((v) => !v)}>
              {showAll ? 'Zobrazit méně' : `Zobrazit všechny (${recent.length})`}
            </button>
          )}
        </Card>
      )}

      <SetupSheet open={setupOpen} onClose={() => setSetupOpen(false)} micLevel={mic.level} micStatus={mic.status} />

      {/* Full-screen running hitbox */}
      <AnimatePresence>
        {phase === 'running' && (
          <motion.div
            className="no-select touch-none fixed inset-0 z-[70] flex cursor-pointer flex-col items-center justify-center bg-well"
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
                  <div className="h-1.5 w-32 overflow-hidden rounded-full bg-fill">
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
          <dl className="mt-4 space-y-2 rounded-2xl bg-well p-3 text-sm">
            <Row k="Zámek" v={l ? `${l.brand} ${l.name}` : '—'} />
            <Row k="Planžeta" v={tool(s.pickId) ? `${tool(s.pickId)!.name} (${TOOL_PROFILES[tool(s.pickId)!.profile].label}, ${thicknessLabel(tool(s.pickId)!.thickness)})` : '—'} />
            <Row k="Napínák" v={tool(s.tensionId) ? `${tool(s.tensionId)!.position} ${tool(s.tensionId)!.name}` : '—'} />
            <Row k="Technika" v={s.technique} />
            <Row k="Zdroj" v={s.source === 'audio' ? 'Akustické zastavení' : s.source === 'gauntlet' ? '3-Lock Gauntlet' : 'Stopky'} />
          </dl>
          <div className="mt-3 rounded-2xl border border-sep p-3 text-sm">
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
          <button key={s} className="rounded-full border border-sep px-3 py-1 text-xs text-slate-300" onClick={() => setText((t) => (t ? `${t} ${s}` : s))}>
            {s}
          </button>
        ))}
      </div>
    </Sheet>
  );
}

function QuickStat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="card px-2 py-2.5">
      <div className="text-[13px] text-slate-400">{label}</div>
      <div className={`font-mono text-[19px] font-semibold ${accent ? 'text-brass-500' : 'text-slate-50'}`}>{value}</div>
    </div>
  );
}

/** Lock, tools, technique and the microphone stop – everything that is set once per session. */
function SetupSheet({ open, onClose, micLevel, micStatus }: { open: boolean; onClose: () => void; micLevel: number; micStatus: string }) {
  const { data, setTimerConfig, updateSettings, navigate } = useStore();
  const { settings, timerConfig: cfg } = data;
  const lock = data.locks.find((l) => l.id === cfg.lockId) ?? null;
  const picks = data.tools.filter((t) => t.category === 'pick' || t.category === 'rake' || t.category === 'special');
  const tensions = data.tools.filter((t) => t.category === 'tension');
  return (
    <Sheet open={open} onClose={onClose} title="Na čem trénuješ" footer={<Button variant="brass" className="w-full" onClick={onClose}>Hotovo</Button>}>
      <ListGroup>
        <SelectRow
          icon="lock"
          color={IOS.orange}
          title="Zámek"
          placeholder="bez zámku"
          value={cfg.lockId ?? ''}
          onChange={(v) => setTimerConfig({ lockId: v || null })}
          options={data.locks.map((l) => ({ value: l.id, label: `${l.brand} ${l.name}` }))}
        />
        <SelectRow
          icon="pick"
          color={IOS.blue}
          title="Planžeta"
          value={cfg.pickId ?? ''}
          onChange={(v) => setTimerConfig({ pickId: v || null })}
          options={picks.map((t) => ({ value: t.id, label: `${t.name} · ${t.thickness}"` }))}
        />
        <SelectRow
          icon="tension"
          color={IOS.green}
          title="Napínák"
          value={cfg.tensionId ?? ''}
          onChange={(v) => setTimerConfig({ tensionId: v || null })}
          options={tensions.map((t) => ({ value: t.id, label: `${t.name.includes(t.position) ? '' : `${t.position} `}${t.name} · ${t.thickness}"` }))}
          last
        />
      </ListGroup>
      {lock && (
        <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 px-4 text-[13px] text-slate-400">
          <BeltBadge belt={lock.belt} size="sm" />
          <span>
            {lock.pins} pinů · {lock.pinConfig.filter((p) => p.type !== 'standard' && p.type !== 'unknown').length} bezpečnostních
          </span>
          {lock.bindingOrder.length > 0 && <span className="font-mono">pořadí {lock.bindingOrder.join('→')}</span>}
        </div>
      )}
      {data.locks.length === 0 && (
        <button
          className="mt-2 px-4 text-[15px] text-brass-500"
          onClick={() => {
            onClose();
            navigate('gear');
          }}
        >
          Přidat první zámek ve Výbavě
        </button>
      )}

      <GroupLabel>Technika</GroupLabel>
      <Segmented<Technique> value={cfg.technique} onChange={(v) => setTimerConfig({ technique: v })} options={TECHNIQUES.map((t) => ({ id: t.id, label: t.label }))} />

      <GroupLabel>Zastavení zvukem</GroupLabel>
      <ListGroup>
        <ListRow icon="mic" color={IOS.red} title="Mikrofon" sub="Cvaknutí třmenu stopky zastaví samo" last={!settings.audioTrigger}>
          <Switch checked={settings.audioTrigger} onChange={(v) => updateSettings({ audioTrigger: v })} label="Mikrofon" />
        </ListRow>
        {settings.audioTrigger && (
          <div className="px-4 py-3">
            {micStatus === 'denied' && <p className="mb-2 text-[13px] text-red-300">Přístup k mikrofonu byl odepřen.</p>}
            {micStatus === 'unsupported' && <p className="mb-2 text-[13px] text-red-300">Prohlížeč nepodporuje mikrofon.</p>}
            <div className="mb-1 flex justify-between text-[13px]">
              <span className="text-slate-400">Citlivost (práh)</span>
              <span className="font-mono text-brass-500">{Math.round(settings.audioThreshold * 100)} %</span>
            </div>
            <div className="relative h-3 overflow-hidden rounded-full bg-well">
              <div className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-ok via-brass-500 to-bad transition-[width] duration-75" style={{ width: `${micLevel * 100}%` }} />
              <div className="absolute inset-y-0 w-0.5 bg-slate-50" style={{ left: `${settings.audioThreshold * 100}%` }} />
            </div>
            <input type="range" aria-label="Práh" className="slider mt-3 w-full" min={0.15} max={0.98} step={0.01} value={settings.audioThreshold} onChange={(e) => updateSettings({ audioThreshold: +e.target.value })} />
          </div>
        )}
      </ListGroup>
    </Sheet>
  );
}

function TimerRing({ phase, progress, children }: { phase: string; progress: number; children: React.ReactNode }) {
  const size = 232;
  const r = 104;
  const c = 2 * Math.PI * r;
  const color = phase === 'ready' ? 'var(--color-ok)' : phase === 'holding' ? 'var(--color-bad)' : phase === 'inspect' ? '#FF9500' : 'var(--color-brass-500)';
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true" className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--color-fill)" strokeWidth={14} />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={14}
          strokeLinecap="round"
          strokeDasharray={c}
          animate={{ strokeDashoffset: c * (1 - progress) }}
          transition={{ duration: phase === 'holding' ? 0.1 : 0.5, ease: 'easeOut' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">{children}</div>
    </div>
  );
}
