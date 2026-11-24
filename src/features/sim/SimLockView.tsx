import { motion } from 'framer-motion';
import { memo } from 'react';
import type { SimPin, SimSnapshot, ToolDef } from './engine';
import { KEYWAY_FLOOR } from './engine';

/* Geometry (SVG user units) */
export const VB_W = 440;
export const VB_H = 300;
export const PLUG_X0 = 72;
export const PLUG_W = 346;
export const SHEAR = 118;
export const KEY_REST = 203;
export const L = 62; // px per lift unit
export const CHAMBER_TOP = 22;
export const PLUG_BOTTOM = 262;
const DRIVER_LEN = 36;

export const liftToY = (lift: number) => KEY_REST - lift * L;
export const xToPx = (x: number) => PLUG_X0 + x * PLUG_W;

function keyLen(p: SimPin) {
  return KEY_REST - SHEAR - p.setLift * L;
}

function springPath(x: number, top: number, bottom: number, w: number) {
  const coils = 7;
  const h = Math.max(4, bottom - top);
  let d = `M${x} ${top}`;
  for (let i = 0; i < coils * 2; i++) {
    const y = top + ((i + 0.5) / (coils * 2)) * h;
    d += ` L${x + (i % 2 ? -w / 2 : w / 2)} ${y}`;
  }
  d += ` L${x} ${bottom}`;
  return d;
}

function driverShape(type: SimPin['type'], cx: number, top: number, w: number, len: number) {
  const l = cx - w / 2;
  const r = cx + w / 2;
  const b = top + len;
  if (type === 'spool') {
    const n = w * 0.22;
    const y1 = top + len * 0.3;
    const y2 = top + len * 0.7;
    return `M${l} ${top + 2} Q${l} ${top} ${l + 2} ${top} L${r - 2} ${top} Q${r} ${top} ${r} ${top + 2} L${r} ${y1 - 3} L${r - n} ${y1 + 2} L${r - n} ${y2 - 2} L${r} ${y2 + 3} L${r} ${b} L${l} ${b} L${l} ${y2 + 3} L${l + n} ${y2 - 2} L${l + n} ${y1 + 2} L${l} ${y1 - 3} Z`;
  }
  if (type === 'serrated') {
    let d = `M${l + 2} ${top} L${r - 2} ${top} L${r} ${top + 2}`;
    const teeth = 6;
    for (let i = 0; i < teeth; i++) {
      const y = top + 4 + (i * (len - 6)) / teeth;
      d += ` L${r - 2.5} ${y + (len - 6) / teeth / 2} L${r} ${y + (len - 6) / teeth}`;
    }
    d += ` L${r} ${b} L${l} ${b}`;
    for (let i = teeth - 1; i >= 0; i--) {
      const y = top + 4 + (i * (len - 6)) / teeth;
      d += ` L${l} ${y + (len - 6) / teeth} L${l + 2.5} ${y + (len - 6) / teeth / 2}`;
    }
    d += ` L${l} ${top + 2} Z`;
    return d;
  }
  return `M${l} ${top + 2} Q${l} ${top} ${l + 2} ${top} L${r - 2} ${top} Q${r} ${top} ${r} ${top + 2} L${r} ${b} L${l} ${b} Z`;
}

function keyPinShape(cx: number, bottom: number, w: number, len: number) {
  const l = cx - w / 2;
  const r = cx + w / 2;
  const top = bottom - len;
  const tip = Math.min(8, w * 0.35);
  return `M${l} ${top} L${r} ${top} L${r} ${bottom - tip} Q${cx} ${bottom + 1.5} ${l} ${bottom - tip} Z`;
}

/** Outline of the tool's top profile → filled path. */
function toolPath(snap: SimSnapshot, tool: ToolDef, spacing: number) {
  const tipX = xToPx(snap.tipX);
  const bendPx = snap.bend * 3;
  const tipY = liftToY(snap.tipY) + bendPx;
  const halfW = spacing * tool.width * PLUG_W;
  const floorTop = liftToY(KEYWAY_FLOOR + 0.1);
  const shaftEndTopY = liftToY(snap.tipY - tool.hookHeight) + bendPx * 0.6;
  const pts = [...tool.points].sort((a, b) => a.dx - b.dx);
  const firstX = tipX + pts[0].dx * spacing * PLUG_W - halfW;
  const thick = 7;
  const top: [number, number][] = [];
  top.push([-20, floorTop + 2]);
  top.push([PLUG_X0 - 4, floorTop]);
  top.push([Math.max(PLUG_X0, firstX), shaftEndTopY]);
  pts.forEach((p) => {
    const px = tipX + p.dx * spacing * PLUG_W;
    const py = tipY - p.dy * L;
    const base = shaftEndTopY;
    if (p.dx !== 0 || pts.length > 1) {
      top.push([px - halfW * 0.8, base]);
      top.push([px - 2, py]);
      top.push([px + 2, py]);
      if (p.dx !== 0) top.push([px + halfW * 0.8, base]);
    } else {
      top.push([px - 6, base]);
      top.push([px - 3, py + 2]);
      top.push([px + 1, py]);
    }
  });
  const end = top[top.length - 1];
  const bottomY = shaftEndTopY + thick;
  const d =
    'M' +
    top.map(([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`).join(' L') +
    ` L${(end[0] + 3).toFixed(1)} ${(end[1] + 3).toFixed(1)}` +
    ` L${(end[0] + 2).toFixed(1)} ${bottomY.toFixed(1)}` +
    ` L${(Math.max(PLUG_X0, firstX) + 2).toFixed(1)} ${bottomY.toFixed(1)}` +
    ` L${PLUG_X0 - 4} ${floorTop + thick} L-20 ${floorTop + thick + 2} Z`;
  return { d, tipX, tipY };
}

export interface ViewProps {
  snap: SimSnapshot;
  tool: ToolDef;
  spacing: number;
  blind: boolean;
  reveal: boolean;
  showBinding: boolean;
  shake: number;
}

export const SimLockView = memo(function SimLockView({ snap, tool, spacing, blind, reveal, showBinding, shake }: ViewProps) {
  const pinW = Math.min(26, spacing * PLUG_W * 0.56);
  const plugShift = snap.open ? 0 : Math.min(10, snap.plugAngle * 0.85);
  const covered = blind && !reveal;
  const tp = toolPath(snap, tool, spacing);
  const jitter = snap.vibration > 0.15 ? (Math.random() - 0.5) * snap.vibration * 1.6 : 0;
  const shakeX = shake ? (Math.random() - 0.5) * shake * 2 : 0;
  const keywayTop = KEY_REST - 4;
  const keywayBottom = liftToY(KEYWAY_FLOOR) + 4;

  return (
    <svg viewBox={`0 0 ${VB_W} ${VB_H}`} className="h-full w-full" role="img" aria-label="Řez stavítkovým zámkem">
      <defs>
        <linearGradient id="sv-shell" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={blind ? '#4b5563' : '#b8bdc9'} stopOpacity={blind ? 1 : 0.55} />
          <stop offset="1" stopColor={blind ? '#1f2937' : '#8b92a3'} stopOpacity={blind ? 1 : 0.55} />
        </linearGradient>
        <linearGradient id="sv-plug" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#7dd3fc" stopOpacity="0.22" />
          <stop offset="1" stopColor="#0ea5e9" stopOpacity="0.12" />
        </linearGradient>
        <linearGradient id="sv-brass" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#a16207" />
          <stop offset="0.35" stopColor="#fde68a" />
          <stop offset="0.6" stopColor="#eab308" />
          <stop offset="1" stopColor="#854d0e" />
        </linearGradient>
        <linearGradient id="sv-steel" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#475569" />
          <stop offset="0.4" stopColor="#e2e8f0" />
          <stop offset="0.65" stopColor="#94a3b8" />
          <stop offset="1" stopColor="#334155" />
        </linearGradient>
        <linearGradient id="sv-red" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#7f1d1d" />
          <stop offset="0.4" stopColor="#fca5a5" />
          <stop offset="0.65" stopColor="#ef4444" />
          <stop offset="1" stopColor="#7f1d1d" />
        </linearGradient>
        <linearGradient id="sv-tool" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f1f5f9" />
          <stop offset="1" stopColor="#64748b" />
        </linearGradient>
        <linearGradient id="sv-cover" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#6b7280" />
          <stop offset="0.12" stopColor="#d1d5db" />
          <stop offset="0.3" stopColor="#9ca3af" />
          <stop offset="0.75" stopColor="#4b5563" />
          <stop offset="1" stopColor="#374151" />
        </linearGradient>
        <pattern id="sv-brush" width="6" height="6" patternUnits="userSpaceOnUse">
          <path d="M0 3h6" stroke="#fff" strokeOpacity="0.05" />
        </pattern>
        <filter id="sv-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3" />
        </filter>
      </defs>

      <g transform={`translate(${shakeX} 0)`}>
        {/* Shell */}
        <rect x={PLUG_X0 - 12} y={8} width={PLUG_W + 22} height={PLUG_BOTTOM + 22} rx={14} fill="url(#sv-shell)" stroke="#8e8e93" strokeOpacity={0.5} />

        {/* Plug */}
        <g transform={`translate(${plugShift} 0)`}>
          <rect x={PLUG_X0} y={SHEAR} width={PLUG_W} height={PLUG_BOTTOM - SHEAR} rx={6} fill="url(#sv-plug)" stroke="#7dd3fc" strokeOpacity={0.45} />
          <rect x={PLUG_X0} y={keywayTop} width={PLUG_W} height={keywayBottom - keywayTop} fill="#020617" fillOpacity={0.72} />
        </g>

        {/* Chambers */}
        {snap.pins.map((p) => {
          const cx = xToPx(p.x);
          const isBinding = showBinding && !blind && snap.bindingPin === p.index;
          return (
            <g key={`ch${p.index}`}>
              <rect x={cx - pinW / 2 - 2} y={CHAMBER_TOP} width={pinW + 4} height={SHEAR - CHAMBER_TOP} fill="#020617" fillOpacity={0.55} />
              <rect
                x={cx - pinW / 2 - 2 + plugShift}
                y={SHEAR}
                width={pinW + 4}
                height={keywayTop - SHEAR}
                fill="#020617"
                fillOpacity={0.45}
              />
              {isBinding && (
                <rect
                  className="binding-glow"
                  x={cx - pinW / 2 - 4 + plugShift}
                  y={SHEAR - 16}
                  width={pinW + 8}
                  height={32}
                  rx={4}
                  fill="none"
                  stroke="#f97316"
                  strokeWidth={3}
                  filter="url(#sv-glow)"
                />
              )}
            </g>
          );
        })}

        {/* Pins */}
        {snap.pins.map((p) => {
          const cx = xToPx(p.x);
          const kl = keyLen(p);
          const keyBottom = liftToY(p.lift);
          const driverLift = p.state === 'overset' ? p.lift : Math.max(p.holdLift, p.lift);
          const driverBottom = KEY_REST - driverLift * L - kl;
          const driverTop = driverBottom - DRIVER_LEN;
          const security = p.type !== 'standard';
          const keyX = cx + (p.state === 'overset' ? 0 : plugShift);
          return (
            <g key={`p${p.index}`}>
              <path d={springPath(cx, CHAMBER_TOP + 2, driverTop, pinW * 0.7)} fill="none" stroke="#94a3b8" strokeWidth={1.4} strokeOpacity={0.85} />
              <path
                d={driverShape(p.type, cx, driverTop, pinW, DRIVER_LEN)}
                fill={security ? 'url(#sv-red)' : 'url(#sv-steel)'}
                stroke={p.state === 'set' ? '#10b981' : p.state === 'spool' ? '#f59e0b' : '#0f172a'}
                strokeWidth={p.state === 'set' || p.state === 'spool' ? 2 : 0.8}
              />
              <path
                d={keyPinShape(keyX, keyBottom, pinW - 1, kl)}
                fill="url(#sv-brass)"
                stroke={p.state === 'overset' ? '#ef4444' : p.contact ? '#fde68a' : '#422006'}
                strokeWidth={p.state === 'overset' ? 2.4 : p.contact ? 1.4 : 0.8}
              />
              <text x={cx} y={CHAMBER_TOP - 6} textAnchor="middle" fontSize={10} fill="#64748b" fontFamily="monospace">
                {p.index + 1}
              </text>
            </g>
          );
        })}

        {/* Shear line */}
        <line x1={PLUG_X0 - 6} x2={PLUG_X0 + PLUG_W + 6} y1={SHEAR} y2={SHEAR} stroke="#eab308" strokeWidth={1.2} strokeDasharray="5 4" opacity={0.9} />
        {!covered && (
          <text x={PLUG_X0 + PLUG_W + 4} y={SHEAR - 4} textAnchor="end" fontSize={8.5} fill="#eab308" opacity={0.8}>
            střižná rovina
          </text>
        )}

        {/* Blind cover */}
        <motion.g initial={false} animate={{ opacity: covered ? 1 : 0 }} transition={{ duration: reveal ? 1.4 : 0.3 }} style={{ pointerEvents: 'none' }}>
          <rect x={PLUG_X0 - 12} y={8} width={PLUG_W + 22} height={PLUG_BOTTOM + 22} rx={14} fill="url(#sv-cover)" />
          <rect x={PLUG_X0 - 12} y={8} width={PLUG_W + 22} height={PLUG_BOTTOM + 22} rx={14} fill="url(#sv-brush)" />
          {[
            [PLUG_X0 + 6, 24],
            [PLUG_X0 + PLUG_W - 6, 24],
            [PLUG_X0 + 6, PLUG_BOTTOM + 14],
            [PLUG_X0 + PLUG_W - 6, PLUG_BOTTOM + 14],
          ].map(([x, y]) => (
            <g key={`${x}-${y}`}>
              <circle cx={x} cy={y} r={5} fill="#374151" stroke="#9ca3af" />
              <path d={`M${x - 3} ${y}h6`} stroke="#111827" strokeWidth={1.5} />
            </g>
          ))}
          {snap.pins.map((p) => (
            <g key={`tick${p.index}`}>
              <line x1={xToPx(p.x)} x2={xToPx(p.x)} y1={10} y2={20} stroke="#111827" strokeWidth={2} />
              <text x={xToPx(p.x)} y={34} textAnchor="middle" fontSize={11} fill="#1f2937" fontWeight={700} fontFamily="monospace">
                {p.index + 1}
              </text>
            </g>
          ))}
          <text x={PLUG_X0 + PLUG_W / 2} y={160} textAnchor="middle" fontSize={13} fill="#1f2937" fontWeight={800} letterSpacing={4}>
            BLIND MODE
          </text>
          <text x={PLUG_X0 + PLUG_W / 2} y={178} textAnchor="middle" fontSize={9} fill="#374151">
            poslouchej · cítit · sleduj čelo bubínku
          </text>
          <rect x={PLUG_X0 - 2} y={keywayTop - 1} width={10} height={keywayBottom - keywayTop + 2} fill="#020617" />
        </motion.g>

        {/* Tension wrench (BOK) */}
        <g>
          <rect x={PLUG_X0 - 2} y={keywayBottom - 9} width={24} height={6} fill="url(#sv-steel)" />
          <path
            d={`M${PLUG_X0 - 2} ${keywayBottom - 9} L${PLUG_X0 - 16} ${keywayBottom - 9} L${PLUG_X0 - 16} ${VB_H - 4} L${PLUG_X0 - 10} ${VB_H - 4} L${PLUG_X0 - 10} ${keywayBottom - 3} L${PLUG_X0 - 2} ${keywayBottom - 3} Z`}
            fill="url(#sv-steel)"
            stroke="#0f172a"
            strokeWidth={0.6}
            transform={`rotate(${-snap.tension * 6} ${PLUG_X0 - 13} ${keywayBottom - 6})`}
          />
        </g>

        {/* Tool */}
        <g transform={`translate(0 ${jitter})`}>
          <path d={tp.d} fill="url(#sv-tool)" stroke="#0f172a" strokeWidth={0.8} opacity={covered ? 0 : 1} />
          {/* handle (always visible – outside the lock) */}
          <rect x={-30} y={liftToY(KEYWAY_FLOOR + 0.1) - 4} width={PLUG_X0 - 18 + 30} height={16} rx={5} fill="#0f172a" stroke="#eab308" strokeOpacity={0.5} />
          <rect x={-30} y={liftToY(KEYWAY_FLOOR + 0.1) - 1} width={PLUG_X0 - 20 + 30} height={2} fill="#eab308" opacity={0.25} />
        </g>

        {/* Depth marker (blind) */}
        {covered && (
          <g>
            <line x1={tp.tipX} x2={tp.tipX} y1={PLUG_BOTTOM + 22} y2={PLUG_BOTTOM + 30} stroke="#eab308" strokeWidth={2} />
            <path d={`M${tp.tipX - 5} ${PLUG_BOTTOM + 37} L${tp.tipX} ${PLUG_BOTTOM + 30} L${tp.tipX + 5} ${PLUG_BOTTOM + 37} Z`} fill="#eab308" />
          </g>
        )}

        {/* Open flash */}
        {snap.open && (
          <motion.rect
            x={PLUG_X0 - 12}
            y={8}
            width={PLUG_W + 22}
            height={PLUG_BOTTOM + 22}
            rx={14}
            fill="none"
            stroke="#10b981"
            strokeWidth={4}
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 1, 0.5] }}
            transition={{ duration: 1 }}
          />
        )}
      </g>
    </svg>
  );
});

/** Front face of the cylinder – shows plug rotation (false set / counter-rotation). */
export function PlugFace({ angle, tension, open, creak }: { angle: number; tension: number; open: boolean; creak: number }) {
  const shown = open ? 90 : angle * 2.2;
  return (
    <svg viewBox="0 0 120 120" className="h-full w-full" aria-label="Čelo bubínku">
      <defs>
        <radialGradient id="pf-shell" cx="0.4" cy="0.35">
          <stop offset="0" stopColor="#e5e7eb" />
          <stop offset="0.6" stopColor="#9ca3af" />
          <stop offset="1" stopColor="#374151" />
        </radialGradient>
        <radialGradient id="pf-plug" cx="0.4" cy="0.35">
          <stop offset="0" stopColor="#fef3c7" />
          <stop offset="0.55" stopColor="#eab308" />
          <stop offset="1" stopColor="#854d0e" />
        </radialGradient>
      </defs>
      <circle cx={60} cy={60} r={54} fill="url(#pf-shell)" />
      <circle cx={60} cy={60} r={36} fill="#111827" />
      {/* degree ticks */}
      {[0, 10, 20, 30].map((d) => (
        <line key={d} x1={60} y1={8} x2={60} y2={14} stroke="#1f2937" strokeWidth={1.5} transform={`rotate(${d} 60 60)`} />
      ))}
      <motion.g animate={{ rotate: shown }} transition={open ? { type: 'spring', stiffness: 60, damping: 12 } : { type: 'spring', stiffness: 320, damping: 22 }} style={{ originX: '60px', originY: '60px' }}>
        <circle cx={60} cy={60} r={34} fill="url(#pf-plug)" stroke={open ? '#10b981' : '#422006'} strokeWidth={open ? 2.5 : 1} />
        <path d="M57 34 h6 v8 l3 4 -3 4 v4 l2 3 -2 3 v16 h-6 v-10 l-3 -3 3 -3 v-8 l-2 -3 2 -3 z" fill="#020617" />
        <line x1={60} y1={27} x2={60} y2={31} stroke="#020617" strokeWidth={2} />
        {/* wrench */}
        <rect x={56} y={86} width={8} height={30} rx={1.5} fill="#cbd5e1" stroke="#0f172a" strokeWidth={0.6} />
      </motion.g>
      {creak > 0.05 && <circle cx={60} cy={60} r={52} fill="none" stroke="#f59e0b" strokeWidth={2} opacity={Math.min(0.9, creak)} strokeDasharray="4 5" />}
      <text x={60} y={117} textAnchor="middle" fontSize={8} fill="#64748b">
        {open ? 'OTEVŘENO' : `${(angle * 1).toFixed(1)}° · ${Math.round(tension * 100)}%`}
      </text>
    </svg>
  );
}
