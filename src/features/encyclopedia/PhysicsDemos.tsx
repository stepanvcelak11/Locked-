import { motion } from 'framer-motion';
import { useState } from 'react';

function spring(x: number, top: number, bottom: number) {
  const n = 10;
  let d = `M${x} ${top}`;
  for (let i = 0; i < n; i++) d += ` L${x + (i % 2 ? -7 : 7)} ${top + ((i + 0.5) / n) * (bottom - top)}`;
  return `${d} L${x} ${bottom}`;
}

/** Interactive: lift each pin with a slider, see whether the gap sits on the shear line. */
export function ShearLineDemo() {
  const targets = [28, 14, 36];
  const [lifts, setLifts] = useState([0, 0, 0]);
  const SHEAR = 60;
  const REST = 110;
  const aligned = lifts.map((l, i) => Math.abs(l - targets[i]) <= 2);
  const all = aligned.every(Boolean);
  return (
    <div>
      <svg viewBox="0 0 240 150" className="w-full">
        <rect x={10} y={8} width={220} height={136} rx={10} fill="#0f2744" fillOpacity={0.7} stroke="#38bdf8" strokeOpacity={0.3} />
        <motion.rect x={16} y={SHEAR} width={208} height={78} rx={6} fill="#38bdf8" fillOpacity={0.12} stroke="#7dd3fc" strokeOpacity={0.4} animate={{ x: all ? 22 : 16 }} />
        <line x1={12} x2={228} y1={SHEAR} y2={SHEAR} stroke="#eab308" strokeDasharray="4 3" />
        <text x={226} y={SHEAR - 4} textAnchor="end" fontSize={8} fill="#eab308">
          shear line
        </text>
        {targets.map((t, i) => {
          const cx = 60 + i * 60;
          const keyLen = REST - SHEAR - t;
          const bottom = REST - lifts[i];
          const keyTop = bottom - keyLen;
          return (
            <g key={i}>
              <rect x={cx - 11} y={14} width={22} height={110} fill="#020617" fillOpacity={0.5} />
              <path d={spring(cx, 16, keyTop - 32)} fill="none" stroke="#94a3b8" />
              <rect x={cx - 10} y={keyTop - 32} width={20} height={32} rx={2} fill={aligned[i] ? '#10b981' : '#94a3b8'} />
              <path d={`M${cx - 10} ${keyTop}h20v${keyLen - 5}l-10 6-10-6z`} fill="#eab308" />
            </g>
          );
        })}
        {all && (
          <text x={120} y={138} textAnchor="middle" fontSize={10} fill="#10b981" fontWeight={700}>
            Všechna rozhraní na střižné rovině → bubínek se otočí!
          </text>
        )}
      </svg>
      <div className="mt-2 space-y-2">
        {targets.map((_, i) => (
          <div key={i} className="flex items-center gap-3 text-xs">
            <span className="w-14 text-slate-400">Pin {i + 1}</span>
            <input
              type="range"
              className="slider flex-1"
              min={0}
              max={45}
              value={lifts[i]}
              onChange={(e) => setLifts((ls) => ls.map((l, k) => (k === i ? +e.target.value : l)))}
            />
            <span className={`w-6 text-right ${aligned[i] ? 'text-emerald-400' : 'text-slate-500'}`}>{aligned[i] ? '✓' : ''}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Interactive: exaggerated drilling tolerances – rotate the plug and see which pin binds first. */
export function BindingOrderDemo() {
  const offsets = [3, -2, 6, 0, -5]; // hole misalignment in px (exaggerated)
  const [rot, setRot] = useState(0);
  const holeW = 18;
  const pinW = 16;
  const contact = offsets.map((o) => {
    // plug shifts right by rot; a pin binds when the plug hole's left edge hits the pin
    const gap = (holeW - pinW) / 2 + o;
    return rot >= gap;
  });
  const order = offsets
    .map((o, i) => ({ i, gap: (holeW - pinW) / 2 + o }))
    .sort((a, b) => a.gap - b.gap)
    .map((x) => x.i + 1);
  return (
    <div>
      <svg viewBox="0 0 240 120" className="w-full">
        <rect x={10} y={8} width={220} height={104} rx={10} fill="#0f2744" fillOpacity={0.7} />
        <rect x={16} y={14} width={208} height={40} fill="#1e293b" />
        <g transform={`translate(${Math.min(rot, 12)} 0)`}>
          <rect x={16} y={56} width={208} height={50} rx={6} fill="#38bdf8" fillOpacity={0.15} stroke="#7dd3fc" strokeOpacity={0.4} />
          {offsets.map((o, i) => (
            <rect key={i} x={40 + i * 40 - holeW / 2 + o} y={56} width={holeW} height={30} fill="#020617" />
          ))}
        </g>
        {offsets.map((_, i) => (
          <g key={i}>
            <rect x={40 + i * 40 - pinW / 2} y={20} width={pinW} height={50} rx={2} fill={contact[i] ? '#ef4444' : '#94a3b8'} />
            <text x={40 + i * 40} y={16} textAnchor="middle" fontSize={8} fill="#64748b">
              {i + 1}
            </text>
          </g>
        ))}
        <line x1={12} x2={228} y1={56} y2={56} stroke="#eab308" strokeDasharray="4 3" />
      </svg>
      <div className="mt-2 flex items-center gap-3 text-xs">
        <span className="w-20 text-slate-400">Napětí</span>
        <input type="range" className="slider flex-1" min={0} max={12} step={0.5} value={rot} onChange={(e) => setRot(+e.target.value)} />
      </div>
      <p className="mt-2 text-xs text-slate-400">
        Otvory v bubínku nejsou nikdy vyvrtané dokonale v řadě (zde 50× zvětšeno). Při otáčení narazí hrana bubínku nejdřív na stavítko s nejmenší vůlí –
        to je <b className="text-red-300">binding pin</b>. Pořadí tohoto zámku: <span className="font-mono text-brass-300">{order.join(' → ')}</span>.
      </p>
    </div>
  );
}
