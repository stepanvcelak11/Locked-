import { IOS } from '../../lib/colors';
import { IconTile } from '../../components/ui';
import { AnimatePresence, motion } from 'framer-motion';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { LockEngine, SIM_TOOLS, type SimEvent, type SimSnapshot, type ToolKind, KEYWAY_FLOOR } from './engine';
import { SimLockView, PlugFace, VB_W, VB_H, PLUG_X0, PLUG_W, KEY_REST, L } from './SimLockView';
import type { SimLockSpec } from '../../types';
import { sound } from '../../lib/audio';
import { vibrate } from '../../lib/haptics';
import { useStore } from '../../store/AppStore';
import { formatTime } from '../../lib/format';

export interface SimOpenResult {
  time: number;
  maxTension: number;
  oversets: number;
  resets: number;
  tool: ToolKind;
}

const PRESETS = [
  { id: 'light', label: 'Lehké', value: 0.22 },
  { id: 'medium', label: 'Střední', value: 0.45 },
  { id: 'heavy', label: 'Silné', value: 0.8 },
] as const;

export function LockSimulator({
  spec,
  blind,
  initialTool = 'short-hook',
  onOpen,
  compact = false,
  lockedTool = false,
}: {
  spec: SimLockSpec;
  blind: boolean;
  initialTool?: ToolKind;
  onOpen?: (r: SimOpenResult) => void;
  compact?: boolean;
  lockedTool?: boolean;
}) {
  const { data } = useStore();
  const difficulty = data.settings.simDifficulty;
  const showBinding = data.settings.showBindingHint;
  const [tool, setTool] = useState<ToolKind>(initialTool);
  const engine = useMemo(() => new LockEngine(spec, difficulty, tool), [spec, difficulty]); // eslint-disable-line react-hooks/exhaustive-deps
  const input = useRef({ tension: 0, tx: 0, ty: engine.minTipY() });
  const [tension, setTensionState] = useState(0);
  const [snap, setSnap] = useState<SimSnapshot>(() => engine.snapshot(0, 0, 0, 0, 0));
  const [shake, setShake] = useState(0);
  const [reveal, setReveal] = useState(false);
  const [result, setResult] = useState<SimOpenResult | null>(null);
  const svgRef = useRef<HTMLDivElement | null>(null);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const dragRef = useRef<{ id: number; mode: 'abs' | 'rel'; lastX: number; lastY: number } | null>(null);
  const lastTouchSound = useRef(0);
  const onOpenRef = useRef(onOpen);
  onOpenRef.current = onOpen;

  useEffect(() => {
    engine.setTool(tool);
    input.current.ty = Math.max(input.current.ty, engine.minTipY());
  }, [tool, engine]);

  useEffect(() => {
    input.current = { tension: 0, tx: 0, ty: engine.minTipY() };
    setTensionState(0);
    setReveal(false);
    setResult(null);
    setSnap(engine.snapshot(0, 0, 0, 0, 0));
  }, [engine]);

  const setTension = useCallback((v: number) => {
    sound.unlock();
    input.current.tension = v;
    setTensionState(v);
  }, []);

  const handleEvents = useCallback(
    (events: SimEvent[], s: SimSnapshot) => {
      for (const ev of events) {
        switch (ev.type) {
          case 'touch': {
            const now = performance.now();
            if (now - lastTouchSound.current > 45) {
              lastTouchSound.current = now;
              sound.touch(ev.binding ? 1 : 0.35);
              if (ev.binding) vibrate(4);
            }
            break;
          }
          case 'set':
            sound.pinSet(1);
            vibrate(14);
            setShake(0.6);
            break;
          case 'serration':
            sound.serration();
            vibrate(5);
            break;
          case 'false-set':
            sound.falseSet();
            vibrate([18, 30, 18]);
            setShake(1.5);
            break;
          case 'overset':
            sound.overset();
            vibrate(35);
            break;
          case 'reset':
            sound.reset();
            break;
          case 'open': {
            sound.open();
            vibrate([30, 40, 90]);
            setShake(2);
            setReveal(true);
            const r: SimOpenResult = {
              time: Math.round(s.elapsed * 1000),
              maxTension: s.maxTension,
              oversets: s.oversets,
              resets: s.resets,
              tool: engine.tool.kind,
            };
            setResult(r);
            onOpenRef.current?.(r);
            break;
          }
        }
      }
    },
    [engine],
  );

  // main loop
  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    const loop = (now: number) => {
      const dt = (now - last) / 1000;
      last = now;
      const { snapshot, events } = engine.step(dt, input.current);
      if (events.length) handleEvents(events, snapshot);
      sound.scratch(snapshot.open ? 0 : snapshot.scratch);
      sound.creak(snapshot.open ? 0 : snapshot.creak);
      setSnap(snapshot);
      setShake((s) => (s > 0.02 ? s * 0.86 : 0));
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      sound.scratch(0);
      sound.creak(0);
    };
  }, [engine, handleEvents]);

  // pointer → tool
  const toSvg = (clientX: number, clientY: number) => {
    const svg = svgRef.current;
    if (!svg) return { x: 0, y: 0 };
    const r = svg.getBoundingClientRect();
    const scale = Math.min(r.width / VB_W, r.height / VB_H);
    const offX = (r.width - VB_W * scale) / 2;
    const offY = (r.height - VB_H * scale) / 2;
    return { x: (clientX - r.left - offX) / scale, y: (clientY - r.top - offY) / scale };
  };

  const onPointerDown = (e: React.PointerEvent) => {
    sound.unlock();
    (e.currentTarget as Element).setPointerCapture(e.pointerId);
    const mode = e.pointerType === 'mouse' ? 'abs' : 'rel';
    dragRef.current = { id: e.pointerId, mode, lastX: e.clientX, lastY: e.clientY };
    if (mode === 'abs') applyAbs(e.clientX, e.clientY);
  };
  const applyAbs = (cx: number, cy: number) => {
    const p = toSvg(cx, cy);
    input.current.tx = Math.max(0, Math.min(1, (p.x - PLUG_X0) / PLUG_W));
    input.current.ty = Math.max(KEYWAY_FLOOR, Math.min(1.1, (KEY_REST - p.y) / L));
  };
  const onPointerMove = (e: React.PointerEvent) => {
    const d = dragRef.current;
    if (!d || d.id !== e.pointerId) {
      if (e.pointerType === 'mouse' && e.buttons === 0) return;
      return;
    }
    if (d.mode === 'abs') applyAbs(e.clientX, e.clientY);
    else {
      const svg = svgRef.current;
      if (!svg) return;
      const r = svg.getBoundingClientRect();
      const scale = Math.min(r.width / VB_W, r.height / VB_H);
      const dx = (e.clientX - d.lastX) / scale;
      const dy = (e.clientY - d.lastY) / scale;
      d.lastX = e.clientX;
      d.lastY = e.clientY;
      input.current.tx = Math.max(0, Math.min(1, input.current.tx + (dx * 1.15) / PLUG_W));
      input.current.ty = Math.max(engine.minTipY(), Math.min(1.1, input.current.ty - (dy * 1.1) / L));
    }
  };
  const onPointerUp = (e: React.PointerEvent) => {
    if (dragRef.current?.id === e.pointerId) dragRef.current = null;
    // releasing the finger lets the pick tip relax slightly
    input.current.ty = Math.max(engine.minTipY(), input.current.ty - 0.08);
  };

  // keyboard
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const onKey = (e: KeyboardEvent) => {
      const i = input.current;
      const step = e.shiftKey ? 0.01 : 0.03;
      let handled = true;
      switch (e.key) {
        case 'ArrowLeft':
          i.tx = Math.max(0, i.tx - step);
          break;
        case 'ArrowRight':
          i.tx = Math.min(1, i.tx + step);
          break;
        case 'ArrowUp':
          i.ty = Math.min(1.1, i.ty + step);
          break;
        case 'ArrowDown':
          i.ty = Math.max(engine.minTipY(), i.ty - step);
          break;
        case '1':
          setTension(PRESETS[0].value);
          break;
        case '2':
          setTension(PRESETS[1].value);
          break;
        case '3':
          setTension(PRESETS[2].value);
          break;
        case ' ':
        case '0':
          setTension(0);
          break;
        case 'q':
          setTension(Math.max(0, i.tension - 0.03));
          break;
        case 'e':
          setTension(Math.min(1, i.tension + 0.03));
          break;
        default:
          handled = false;
      }
      if (handled) e.preventDefault();
    };
    el.addEventListener('keydown', onKey);
    return () => el.removeEventListener('keydown', onKey);
  }, [engine, setTension]);

  const setCount = snap.pins.filter((p) => p.state === 'set').length;
  const status = (() => {
    if (snap.open) return { text: 'OTEVŘENO!', tone: 'text-emerald-300' };
    if (blind) {
      if (snap.tension < 0.05) return { text: 'Nastav napětí a začni zkoumat stavítka', tone: 'text-steel-400' };
      return { text: 'Poslouchej cvaknutí a sleduj čelo bubínku…', tone: 'text-steel-400' };
    }
    if (snap.tension < 0.05) return { text: 'Bez napětí – stavítka nemohou tuhnout', tone: 'text-steel-400' };
    if (snap.jammed) return { text: 'Přemačknuto! Povol napínák (reset).', tone: 'text-red-300' };
    if (snap.falseSet) return { text: 'FALSE SET – najdi spool a jemně povol napětí', tone: 'text-amber-300' };
    if (snap.bindingPin === null) return { text: 'Napětí je příliš slabé – nic netuhne', tone: 'text-steel-400' };
    return { text: `Tuhne stavítko ${snap.bindingPin + 1} · ${setCount}/${snap.pins.length} nastaveno`, tone: 'text-brass-300' };
  })();

  const tensionColor = tension > 0.7 ? '#ef4444' : tension > 0.5 ? '#f59e0b' : '#10b981';

  return (
    <div ref={wrapRef} tabIndex={0} className="outline-none">
      <div className="card relative overflow-hidden p-2">
        <div className="relative">
          <div
            ref={svgRef}
            className="no-select touch-none aspect-[44/30] w-full cursor-crosshair"
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
          >
            <SimLockView snap={snap} tool={engine.tool} spacing={engine.pinSpacing} blind={blind} reveal={reveal} showBinding={showBinding} shake={shake} />
          </div>
        </div>
        <div className="flex items-center gap-3 px-1 pb-1 pt-1.5">
          <div className="h-16 w-16 shrink-0 rounded-full bg-ink-950/70 p-0.5 ring-1 ring-edge" title="Čelo bubínku – pootočení">
            <PlugFace angle={snap.plugAngle} tension={snap.tension} open={snap.open} creak={snap.creak} />
          </div>
          <div className={`flex-1 text-sm font-medium leading-snug ${status.tone}`}>{status.text}</div>
          <div className="rounded-lg bg-ink-950/75 px-2 py-1 font-mono text-xs text-slate-300">{formatTime(snap.elapsed * 1000)}</div>
        </div>
      </div>

      {/* Controls */}
      <div className={`card mt-3 p-3.5 ${compact ? '' : ''}`}>
        <div className="mb-2 flex items-center justify-between">
          <span className="text-xs font-semibold text-steel-400">Napínák</span>
          <span className="font-mono text-sm" style={{ color: tensionColor }}>
            {Math.round(tension * 100)} %
          </span>
        </div>
        <input
          type="range"
          className="slider w-full"
          min={0}
          max={1}
          step={0.01}
          value={tension}
          onChange={(e) => setTension(+e.target.value)}
          aria-label="Napětí napínáku"
          style={{ background: `linear-gradient(90deg, ${tensionColor} ${tension * 100}%, rgba(255,255,255,0.1) ${tension * 100}%)` }}
        />
        <div className="mt-3 grid grid-cols-4 gap-2">
          {PRESETS.map((p) => (
            <button
              key={p.id}
              onClick={() => setTension(p.value)}
              className={`rounded-xl border px-2 py-2 text-xs font-semibold transition ${
                Math.abs(tension - p.value) < 0.02 ? 'border-brass-500 bg-brass-500/15 text-brass-300' : 'border-sep text-steel-400 hover:text-slate-100'
              }`}
            >
              {p.label}
            </button>
          ))}
          <button onClick={() => setTension(0)} className="rounded-xl border border-bad/40 bg-bad/10 px-2 py-2 text-xs font-semibold text-red-300">
            Povolit
          </button>
        </div>
        {!lockedTool && (
          <div className="mt-3 flex gap-1.5 overflow-x-auto scrollbar-none">
            {(Object.keys(SIM_TOOLS) as ToolKind[]).map((k) => (
              <button
                key={k}
                onClick={() => setTool(k)}
                className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium ${
                  tool === k ? 'border-azure-400 bg-azure-400/10 text-azure-400' : 'border-sep text-steel-400'
                }`}
              >
                {SIM_TOOLS[k].label}
              </button>
            ))}
          </div>
        )}
        {!compact && (
          <p className="mt-3 text-[11px] leading-relaxed text-slate-500">
            Táhni prstem / myší v zámku: <b className="text-slate-400">vodorovně</b> = hloubka planžety, <b className="text-slate-400">svisle</b> = zvedání. Klávesy: šipky,
            1/2/3 napětí, Q/E jemně, mezerník povolit.
          </p>
        )}
      </div>

      <AnimatePresence>
        {result && !compact && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="card mt-3 border-ok/50 p-4">
            <div className="flex items-center gap-3">
              <motion.div initial={{ rotate: -20, scale: 0.5 }} animate={{ rotate: 0, scale: 1 }} transition={{ type: 'spring', stiffness: 300, damping: 10 }} className="flex">
                <IconTile icon="unlock" color={IOS.green} size={44} />
              </motion.div>
              <div className="flex-1">
                <div className="font-semibold text-emerald-300">Zámek otevřen za {formatTime(result.time)}</div>
                <div className="text-xs text-slate-400">
                  Max. napětí {Math.round(result.maxTension * 100)} % · přemačknutí {result.oversets} · resetů {result.resets}
                </div>
              </div>
            </div>
            {blind && <p className="mt-2 text-xs text-slate-400">Zámek se zprůhlednil – prohlédni si stavítka, která jsi zdolal.</p>}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
