import { motion } from 'framer-motion';
import { useState } from 'react';
import type { PinConfig, PinType } from '../../types';
import { PIN_TYPES } from '../../data/labels';
import { PinShapeArt } from '../../components/svg/Art';

const CYCLE: PinType[] = ['standard', 'spool', 'serrated', 'mushroom', 't-pin', 'unknown'];

export function BindingTracker({
  pins,
  config,
  order,
  onChange,
}: {
  pins: number;
  config: PinConfig[];
  order: number[];
  onChange: (config: PinConfig[], order: number[]) => void;
}) {
  const [recording, setRecording] = useState(false);
  const typeOf = (i: number): PinType => config.find((p) => p.index === i)?.type ?? 'unknown';

  const cycle = (i: number) => {
    const cur = typeOf(i);
    const next = CYCLE[(CYCLE.indexOf(cur) + 1) % CYCLE.length];
    const others = config.filter((p) => p.index !== i);
    onChange([...others, { index: i, type: next }].sort((a, b) => a.index - b.index), order);
  };

  const tapOrder = (i: number) => {
    if (order.includes(i)) return;
    const next = [...order, i];
    onChange(config, next);
    if (next.length >= pins) setRecording(false);
  };

  return (
    <div className="rounded-2xl border border-sep bg-well p-3">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs font-semibold text-steel-400">Binding Order Tracker</span>
        <span className="text-[10px] text-slate-500">{recording ? 'Klepej na piny v pořadí tuhnutí' : 'Klepnutím změníš typ pinu'}</span>
      </div>
      <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${Math.max(1, pins)}, minmax(0, 1fr))` }}>
        {Array.from({ length: pins }, (_, k) => k + 1).map((i) => {
          const t = typeOf(i);
          const pos = order.indexOf(i);
          return (
            <motion.button
              key={i}
              type="button"
              whileTap={{ scale: 0.92 }}
              onClick={() => (recording ? tapOrder(i) : cycle(i))}
              className={`relative flex flex-col items-center rounded-xl border px-1 pb-1.5 pt-2 transition ${
                recording && pos < 0 ? 'border-brass-500/70 bg-brass-500/5' : 'border-sep bg-fill'
              }`}
            >
              <span className="text-[10px] font-mono text-slate-500">#{i}</span>
              <PinShapeArt kind={t === 'unknown' ? 'standard' : t} className={`h-14 ${t === 'unknown' ? 'opacity-30' : ''}`} />
              <span className="mt-0.5 text-[9px] font-semibold" style={{ color: PIN_TYPES[t].color }}>
                {PIN_TYPES[t].short}
              </span>
              {pos >= 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-brass-500 text-[10px] font-bold text-white"
                >
                  {pos + 1}
                </motion.span>
              )}
            </motion.button>
          );
        })}
      </div>
      <div className="mt-3 flex items-center justify-between gap-2">
        <div className="font-mono text-sm text-brass-300">{order.length ? order.join(' → ') : <span className="text-slate-500">pořadí nezaznamenáno</span>}</div>
        <div className="flex gap-2">
          {order.length > 0 && (
            <button type="button" className="rounded-lg border border-sep px-2.5 py-1 text-xs text-slate-300" onClick={() => onChange(config, [])}>
              Vymazat
            </button>
          )}
          <button
            type="button"
            className={`rounded-lg px-2.5 py-1 text-xs font-semibold ${recording ? 'bg-bad/20 text-red-300' : 'bg-brass-500 text-white'}`}
            onClick={() => {
              if (!recording) onChange(config, []);
              setRecording((r) => !r);
            }}
          >
            {recording ? 'Hotovo' : '● Zaznamenat pořadí'}
          </button>
        </div>
      </div>
    </div>
  );
}
