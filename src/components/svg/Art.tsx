import { motion } from 'framer-motion';
import type { KeywayShape, SilhouetteShape, XrayShape } from '../../data/quiz';

/* ───────────────────────── Shared defs ───────────────────────── */
function Defs({ id }: { id: string }) {
  return (
    <defs>
      <radialGradient id={`${id}-face`} cx="0.4" cy="0.35" r="0.75">
        <stop offset="0" stopColor="#fef3c7" />
        <stop offset="0.5" stopColor="#eab308" />
        <stop offset="1" stopColor="#713f12" />
      </radialGradient>
      <radialGradient id={`${id}-steelface`} cx="0.4" cy="0.35" r="0.8">
        <stop offset="0" stopColor="#f1f5f9" />
        <stop offset="0.55" stopColor="#94a3b8" />
        <stop offset="1" stopColor="#334155" />
      </radialGradient>
      <linearGradient id={`${id}-steel`} x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stopColor="#475569" />
        <stop offset="0.4" stopColor="#e2e8f0" />
        <stop offset="0.65" stopColor="#94a3b8" />
        <stop offset="1" stopColor="#334155" />
      </linearGradient>
      <linearGradient id={`${id}-steelv`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#e2e8f0" />
        <stop offset="0.5" stopColor="#94a3b8" />
        <stop offset="1" stopColor="#334155" />
      </linearGradient>
      <linearGradient id={`${id}-brass`} x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stopColor="#a16207" />
        <stop offset="0.35" stopColor="#fde68a" />
        <stop offset="0.6" stopColor="#eab308" />
        <stop offset="1" stopColor="#854d0e" />
      </linearGradient>
      <linearGradient id={`${id}-brassv`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#fde68a" />
        <stop offset="0.5" stopColor="#eab308" />
        <stop offset="1" stopColor="#854d0e" />
      </linearGradient>
      <linearGradient id={`${id}-red`} x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stopColor="#7f1d1d" />
        <stop offset="0.4" stopColor="#fca5a5" />
        <stop offset="0.65" stopColor="#ef4444" />
        <stop offset="1" stopColor="#7f1d1d" />
      </linearGradient>
    </defs>
  );
}

/* ───────────────────────── Keyways ───────────────────────── */
const KEYWAY_PATHS: Record<Exclude<KeywayShape, 'kw-tubular' | 'kw-lever'>, string> = {
  'kw-standard': 'M27 14h7v12l4 5-4 5v10l5 6-5 6v12l3 4-3 4v8h-7v-9l-4-5 4-5v-11l-5-6 5-5v-10l-3-5 3-5z',
  'kw-paracentric': 'M25 12h9v11l-9 8v5l13 9v6l-13 9v5l11 8v12h-9v-8l-9-6v-6l13-9v-5l-13-9v-6l8-6z',
  'kw-schlage': 'M26 12h9v20l4 3v8l-4 3v18l5 4v10l-5 4v6h-9v-11l-3-3v-8l3-3v-17l-4-3v-8l4-3z',
  'kw-abus': 'M28 12h6v17l5 6v7l-6 6v12l6 6v9l-6 6v7h-6v-14l-5-5v-8l5-5v-11l-4-5v-8l4-5z',
  'kw-disc': 'M30 24a22 22 0 0 1 0 44v-10a12 12 0 0 0 0-24z',
  'kw-dimple': 'M9 44h42v9H9zM9 47h-2v3h2z',
  'kw-wafer': 'M24 16h12v14h-2v4h2v26h-2v4h2v14H24V64h2v-4h-2V34h2v-4h-2z',
  'kw-master': 'M22 12h16v19l-3 4 3 4v26l-4 4 4 4v13H22V73l3-4-3-4V39l3-4-3-4z',
};

export function KeywayArt({ shape, className = '' }: { shape: KeywayShape; className?: string }) {
  const id = `kw-${shape}`;
  if (shape === 'kw-lever') {
    return (
      <svg viewBox="0 0 60 92" className={className}>
        <Defs id={id} />
        <rect x={4} y={2} width={52} height={88} rx={8} fill={`url(#${id}-steelface)`} stroke="#1f2937" />
        <circle cx={30} cy={10} r={2.5} fill="#1f2937" />
        <circle cx={30} cy={82} r={2.5} fill="#1f2937" />
        <path d="M30 24a10 10 0 0 1 6 18l6 26H18l6-26a10 10 0 0 1 6-18z" fill="#020617" />
      </svg>
    );
  }
  if (shape === 'kw-tubular') {
    return (
      <svg viewBox="0 0 60 92" className={className}>
        <Defs id={id} />
        <circle cx={30} cy={46} r={28} fill={`url(#${id}-steelface)`} stroke="#1f2937" />
        <circle cx={30} cy={46} r={16} fill="#020617" />
        <circle cx={30} cy={46} r={9} fill={`url(#${id}-face)`} />
        <rect x={28.5} y={28} width={3} height={5} fill={`url(#${id}-face)`} />
        {Array.from({ length: 7 }).map((_, i) => {
          const a = (i / 7) * Math.PI * 2 + 0.4;
          return <circle key={i} cx={30 + Math.cos(a) * 12.5} cy={46 + Math.sin(a) * 12.5} r={1.6} fill="#eab308" opacity={0.85} />;
        })}
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 60 92" className={className}>
      <Defs id={id} />
      <circle cx={30} cy={46} r={29} fill={`url(#${id}-steelface)`} stroke="#1f2937" />
      <circle cx={30} cy={46} r={24} fill={`url(#${id}-face)`} stroke="#422006" strokeWidth={0.6} />
      <circle cx={30} cy={46} r={24} fill="none" stroke="#000" strokeOpacity={0.25} strokeWidth={2} />
      <g transform="translate(0 0)">
        <path d={KEYWAY_PATHS[shape]} fill="#020617" transform="translate(0 0) scale(1 0.62) translate(0 28)" />
      </g>
    </svg>
  );
}

/* ───────────────────────── Silhouettes ───────────────────────── */
export function SilhouetteArt({ shape, className = '' }: { shape: SilhouetteShape; className?: string }) {
  const id = `sil-${shape}`;
  switch (shape) {
    case 'sil-padlock':
      return (
        <svg viewBox="0 0 160 160" className={className}>
          <Defs id={id} />
          <path d="M52 76V48a28 28 0 0 1 56 0v28" fill="none" stroke={`url(#${id}-steel)`} strokeWidth={12} strokeLinecap="round" />
          <rect x={30} y={70} width={100} height={78} rx={6} fill={`url(#${id}-steelv)`} stroke="#1f2937" />
          {Array.from({ length: 11 }).map((_, i) => (
            <line key={i} x1={30} x2={130} y1={76 + i * 6.6} y2={76 + i * 6.6} stroke="#334155" strokeWidth={1} />
          ))}
          <rect x={60} y={124} width={40} height={18} rx={3} fill="#1e293b" />
          <path d="M78 128h4v10h-4z" fill="#020617" />
        </svg>
      );
    case 'sil-brass-padlock':
      return (
        <svg viewBox="0 0 160 160" className={className}>
          <Defs id={id} />
          <path d="M56 78V50a24 24 0 0 1 48 0v28" fill="none" stroke={`url(#${id}-steel)`} strokeWidth={11} strokeLinecap="round" />
          <rect x={34} y={72} width={92} height={76} rx={14} fill={`url(#${id}-brassv)`} stroke="#713f12" />
          <rect x={40} y={78} width={80} height={6} rx={3} fill="#fff" opacity={0.18} />
          <circle cx={80} cy={124} r={11} fill={`url(#${id}-face)`} stroke="#713f12" />
          <path d="M78.5 116h3v6l2 2-2 2v6h-3v-5l-1.5-2 1.5-2z" fill="#020617" />
        </svg>
      );
    case 'sil-euro':
      return (
        <svg viewBox="0 0 160 160" className={className}>
          <Defs id={id} />
          <path d="M80 18a28 28 0 0 1 20 47.6V138a8 8 0 0 1-8 8H68a8 8 0 0 1-8-8V65.6A28 28 0 0 1 80 18z" fill={`url(#${id}-brassv)`} stroke="#713f12" />
          <circle cx={80} cy={46} r={20} fill={`url(#${id}-face)`} stroke="#713f12" />
          <path d="M78 32h4v7l3 3-3 3v6l2 3-2 3v5h-4v-6l-3-3 3-3v-5l-2-3 2-3z" fill="#020617" />
          <circle cx={80} cy={112} r={6} fill="#713f12" />
          <circle cx={80} cy={112} r={3} fill="#1f2937" />
        </svg>
      );
    case 'sil-disc':
      return (
        <svg viewBox="0 0 160 160" className={className}>
          <Defs id={id} />
          <path d="M62 54V40a18 18 0 0 1 36 0v14" fill="none" stroke={`url(#${id}-steel)`} strokeWidth={10} />
          <circle cx={80} cy={96} r={52} fill={`url(#${id}-steelface)`} stroke="#1f2937" />
          <circle cx={80} cy={96} r={40} fill="none" stroke="#475569" strokeWidth={2} />
          <circle cx={80} cy={96} r={14} fill={`url(#${id}-face)`} />
          <path d="M80 86a10 10 0 0 1 0 20z" fill="#020617" />
        </svg>
      );
    case 'sil-cam':
      return (
        <svg viewBox="0 0 160 160" className={className}>
          <Defs id={id} />
          <rect x={20} y={58} width={22} height={44} rx={4} fill={`url(#${id}-steelv)`} stroke="#1f2937" />
          <rect x={42} y={66} width={56} height={28} fill={`url(#${id}-brassv)`} stroke="#713f12" />
          {Array.from({ length: 9 }).map((_, i) => (
            <line key={i} x1={50 + i * 5} x2={50 + i * 5} y1={66} y2={94} stroke="#713f12" strokeOpacity={0.5} />
          ))}
          <polygon points="58,58 72,58 78,66 72,74 58,74 52,66" fill="#94a3b8" stroke="#1f2937" transform="translate(4 14) scale(0.9)" />
          <rect x={98} y={74} width={10} height={12} fill="#64748b" />
          <rect x={108} y={40} width={12} height={74} rx={3} fill={`url(#${id}-steel)`} stroke="#1f2937" />
          <circle cx={31} cy={80} r={6} fill="#1f2937" />
        </svg>
      );
    case 'sil-mortise':
      return (
        <svg viewBox="0 0 160 160" className={className}>
          <Defs id={id} />
          <rect x={40} y={14} width={82} height={134} rx={3} fill={`url(#${id}-steelv)`} stroke="#1f2937" />
          <rect x={118} y={8} width={12} height={146} rx={2} fill={`url(#${id}-brassv)`} stroke="#713f12" />
          <rect x={124} y={40} width={18} height={14} rx={2} fill={`url(#${id}-steel)`} stroke="#1f2937" />
          <rect x={124} y={98} width={22} height={18} rx={2} fill={`url(#${id}-steel)`} stroke="#1f2937" />
          <rect x={72} y={36} width={22} height={22} rx={2} fill="#1f2937" />
          <path d="M80 90a8 8 0 0 1 5 14l4 22H71l4-22a8 8 0 0 1 5-14z" fill="#020617" />
          {[22, 140].map((y) => (
            <circle key={y} cx={124} cy={y} r={2.5} fill="#713f12" />
          ))}
        </svg>
      );
    case 'sil-tubular':
      return (
        <svg viewBox="0 0 160 160" className={className}>
          <Defs id={id} />
          <rect x={52} y={60} width={92} height={40} rx={6} fill={`url(#${id}-steelv)`} stroke="#1f2937" />
          <circle cx={56} cy={80} r={42} fill={`url(#${id}-steelface)`} stroke="#1f2937" />
          <circle cx={56} cy={80} r={22} fill="#020617" />
          <circle cx={56} cy={80} r={12} fill={`url(#${id}-face)`} />
          {Array.from({ length: 7 }).map((_, i) => {
            const a = (i / 7) * Math.PI * 2;
            return <circle key={i} cx={56 + Math.cos(a) * 17} cy={80 + Math.sin(a) * 17} r={2.2} fill="#eab308" />;
          })}
        </svg>
      );
  }
}

/* ───────────────────────── X-Ray mechanisms ───────────────────────── */
type DriverKind = 'standard' | 'spool' | 'serrated' | 'mushroom';

function driverPath(kind: DriverKind, x: number, y: number, w: number, h: number) {
  const b = y + h;
  if (kind === 'spool') {
    const n = w * 0.25;
    return `M${x} ${y}h${w}v${h * 0.28}l-${n} 3v${h * 0.36}l${n} 3V${b}H${x}V${y + h * 0.72}l${n}-3v-${h * 0.36}l-${n}-3z`;
  }
  if (kind === 'mushroom') {
    const n = w * 0.25;
    return `M${x} ${y}h${w}v${h * 0.55}l-${n} ${h * 0.15}v${h * 0.15}l${n} ${h * 0.15}H${x}l${n}-${h * 0.15}v-${h * 0.15}l-${n}-${h * 0.15}z`;
  }
  if (kind === 'serrated') {
    let d = `M${x} ${y}h${w}`;
    const t = 6;
    for (let i = 0; i < t; i++) d += `l-2 ${h / t / 2}l2 ${h / t / 2}`;
    d += `H${x}`;
    for (let i = 0; i < t; i++) d += `l2 -${h / t / 2}l-2 -${h / t / 2}`;
    return d + 'z';
  }
  return `M${x} ${y}h${w}v${h}H${x}z`;
}

function PinXray({ id, driver }: { id: string; driver: DriverKind }) {
  const cols = [40, 70, 100, 130, 160];
  const keyLens = [26, 34, 20, 30, 24];
  const secure = driver !== 'standard';
  return (
    <svg viewBox="0 0 200 140" className="h-full w-full">
      <Defs id={id} />
      <rect x={14} y={8} width={176} height={124} rx={10} fill="#0f2744" fillOpacity={0.7} stroke="#38bdf8" strokeOpacity={0.35} />
      <motion.g animate={{ x: [0, 0, 3, 3, 0] }} transition={{ duration: 4, repeat: Infinity, times: [0, 0.45, 0.55, 0.85, 1] }}>
        <rect x={20} y={66} width={164} height={56} rx={6} fill="#38bdf8" fillOpacity={0.12} stroke="#7dd3fc" strokeOpacity={0.4} />
      </motion.g>
      <line x1={18} x2={186} y1={66} y2={66} stroke="#eab308" strokeDasharray="4 3" strokeWidth={1} />
      {cols.map((cx, i) => {
        const lift = 66 - (104 - keyLens[i]);
        return (
          <g key={cx}>
            <rect x={cx - 9} y={14} width={18} height={92} fill="#020617" fillOpacity={0.5} />
            <path d={`M${cx} 14 l5 2 -10 2 10 2 -10 2 10 2 -5 2`} fill="none" stroke="#94a3b8" strokeWidth={1.2} />
            <motion.g animate={{ y: [0, 0, lift, lift, 0] }} transition={{ duration: 4, repeat: Infinity, times: [0, 0.2, 0.45, 0.85, 1], delay: i * 0.05 }}>
              <path d={driverPath(secure && i % 2 === 1 ? driver : 'standard', cx - 8, 104 - keyLens[i] - 30, 16, 30)} fill={secure && i % 2 === 1 ? `url(#${id}-red)` : `url(#${id}-steel)`} stroke="#0f172a" strokeWidth={0.6} />
              <path d={`M${cx - 8} ${104 - keyLens[i]}h16v${keyLens[i] - 4}l-8 5-8-5z`} fill={`url(#${id}-brass)`} stroke="#422006" strokeWidth={0.6} />
            </motion.g>
          </g>
        );
      })}
      <motion.g animate={{ x: [-170, -170, 0, 0, -170] }} transition={{ duration: 4, repeat: Infinity, times: [0, 0.05, 0.45, 0.85, 1] }}>
        <path
          d="M12 118 L26 118 L32 108 L40 108 L46 112 L58 100 L62 100 L70 106 L88 112 L92 116 L98 116 L106 104 L112 104 L118 110 L130 104 L136 104 L148 110 L156 110 L162 106 L168 106 L176 116 L180 122 L12 122 Z"
          fill={`url(#${id}-brassv)`}
          opacity={0.9}
        />
        <rect x={-60} y={112} width={74} height={14} rx={4} fill={`url(#${id}-brassv)`} />
      </motion.g>
    </svg>
  );
}

function WaferXray({ id }: { id: string }) {
  const offs = [10, -8, 14, -12, 6];
  return (
    <svg viewBox="0 0 200 140" className="h-full w-full">
      <Defs id={id} />
      <rect x={8} y={8} width={184} height={124} rx={10} fill="#0f2744" fillOpacity={0.7} stroke="#38bdf8" strokeOpacity={0.35} />
      <rect x={20} y={36} width={160} height={68} rx={34} fill="#38bdf8" fillOpacity={0.1} stroke="#7dd3fc" strokeOpacity={0.4} />
      {offs.map((o, i) => (
        <motion.g key={i} animate={{ y: [o, o, 0, 0, o] }} transition={{ duration: 3.6, repeat: Infinity, times: [0, 0.2, 0.5, 0.85, 1], delay: i * 0.04 }}>
          <rect x={30 + i * 30} y={20} width={20} height={100} rx={3} fill={`url(#${id}-brass)`} stroke="#422006" strokeWidth={0.6} />
          <rect x={35 + i * 30} y={56} width={10} height={28} rx={2} fill="#020617" />
          <path d={`M${40 + i * 30} 14 l4 2 -8 2 8 2 -8 2 4 2`} fill="none" stroke="#94a3b8" />
        </motion.g>
      ))}
      <line x1={14} x2={186} y1={36} y2={36} stroke="#eab308" strokeDasharray="4 3" />
      <line x1={14} x2={186} y1={104} y2={104} stroke="#eab308" strokeDasharray="4 3" />
    </svg>
  );
}

function DiscXray({ id }: { id: string }) {
  const discs = [0, 1, 2, 3];
  return (
    <svg viewBox="0 0 200 140" className="h-full w-full">
      <Defs id={id} />
      <rect x={8} y={8} width={184} height={124} rx={10} fill="#0f2744" fillOpacity={0.7} stroke="#38bdf8" strokeOpacity={0.35} />
      {discs.map((i) => {
        const cx = 46 + i * 36;
        return (
          <g key={i}>
            <motion.g
              style={{ originX: `${cx}px`, originY: '70px' }}
              animate={{ rotate: [i * 60 - 90, i * 60 - 90, 0, 0, i * 60 - 90] }}
              transition={{ duration: 4.5, repeat: Infinity, times: [0, 0.1, 0.5, 0.85, 1] }}
            >
              <circle cx={cx} cy={70} r={30} fill={`url(#${id}-steelface)`} stroke="#1f2937" />
              <path d={`M${cx} 60 a10 10 0 0 1 0 20 z`} fill="#020617" />
              <rect x={cx - 4} y={39} width={8} height={7} fill="#020617" />
              <rect x={cx + 12} y={64} width={6} height={4} fill="#020617" opacity={0.7} />
            </motion.g>
          </g>
        );
      })}
      <motion.rect x={30} y={30} width={140} height={7} rx={2} fill={`url(#${id}-brassv)`} animate={{ y: [24, 24, 30, 30, 24] }} transition={{ duration: 4.5, repeat: Infinity, times: [0, 0.5, 0.58, 0.85, 1] }} />
      <text x={100} y={128} textAnchor="middle" fontSize={8} fill="#64748b">
        sidebar
      </text>
    </svg>
  );
}

function DimpleXray({ id }: { id: string }) {
  const xs = [40, 68, 96, 124, 152];
  const depths = [6, 12, 4, 10, 8];
  return (
    <svg viewBox="0 0 200 140" className="h-full w-full">
      <Defs id={id} />
      <rect x={8} y={8} width={184} height={124} rx={10} fill="#0f2744" fillOpacity={0.7} stroke="#38bdf8" strokeOpacity={0.35} />
      <rect x={20} y={70} width={164} height={50} fill="#38bdf8" fillOpacity={0.1} />
      <line x1={14} x2={186} y1={70} y2={70} stroke="#eab308" strokeDasharray="4 3" />
      <motion.g animate={{ x: [-160, -160, 0, 0, -160] }} transition={{ duration: 4, repeat: Infinity, times: [0, 0.05, 0.45, 0.85, 1] }}>
        <rect x={16} y={92} width={170} height={10} rx={2} fill={`url(#${id}-steelv)`} />
        {xs.map((x, i) => (
          <ellipse key={x} cx={x} cy={92} rx={6} ry={depths[i] / 2.5} fill="#1e293b" />
        ))}
      </motion.g>
      {xs.map((x, i) => (
        <motion.g key={x} animate={{ y: [0, 0, -depths[i], -depths[i], 0] }} transition={{ duration: 4, repeat: Infinity, times: [0, 0.2, 0.45, 0.85, 1] }}>
          <rect x={x - 7} y={18} width={14} height={30} rx={2} fill={`url(#${id}-steel)`} />
          <path d={`M${x - 7} ${50}h14v${24 + depths[i]}l-7 6-7-6z`} fill={`url(#${id}-brass)`} />
        </motion.g>
      ))}
      <text x={100} y={128} textAnchor="middle" fontSize={8} fill="#64748b">
        plochý klíč s důlky · piny shora
      </text>
    </svg>
  );
}

function LeverXray({ id }: { id: string }) {
  const lifts = [10, 18, 6, 14];
  return (
    <svg viewBox="0 0 200 140" className="h-full w-full">
      <Defs id={id} />
      <rect x={8} y={8} width={184} height={124} rx={10} fill="#1f2937" stroke="#64748b" />
      {lifts.map((l, i) => (
        <motion.g key={i} animate={{ y: [0, 0, -l, -l, 0] }} transition={{ duration: 4, repeat: Infinity, times: [0, 0.2, 0.45, 0.85, 1] }} opacity={1 - i * 0.12}>
          <path
            d={`M${30 + i * 4} ${44 + i * 3} h120 v30 h-40 v-12 h-14 v12 h-66 z`}
            fill={`url(#${id}-brassv)`}
            stroke="#422006"
            strokeWidth={0.8}
          />
        </motion.g>
      ))}
      <motion.g animate={{ x: [0, 0, 0, -40, -40, 0] }} transition={{ duration: 4, repeat: Infinity, times: [0, 0.45, 0.5, 0.75, 0.85, 1] }}>
        <rect x={110} y={92} width={90} height={18} fill={`url(#${id}-steelv)`} />
        <rect x={118} y={78} width={10} height={16} fill={`url(#${id}-steelv)`} />
      </motion.g>
      <circle cx={64} cy={104} r={8} fill="#020617" />
      <text x={150} y={126} textAnchor="middle" fontSize={8} fill="#94a3b8">
        závora + stump
      </text>
    </svg>
  );
}

function TubularXray({ id }: { id: string }) {
  return (
    <svg viewBox="0 0 200 140" className="h-full w-full">
      <Defs id={id} />
      <rect x={8} y={8} width={184} height={124} rx={10} fill="#0f2744" fillOpacity={0.7} />
      <circle cx={100} cy={70} r={56} fill={`url(#${id}-steelface)`} />
      <circle cx={100} cy={70} r={36} fill="#020617" />
      <circle cx={100} cy={70} r={20} fill={`url(#${id}-face)`} />
      {Array.from({ length: 7 }).map((_, i) => {
        const a = (i / 7) * Math.PI * 2;
        return (
          <motion.circle
            key={i}
            cx={100 + Math.cos(a) * 28}
            cy={70 + Math.sin(a) * 28}
            fill="#eab308"
            animate={{ r: [4, 4, 2.2, 2.2, 4] }}
            transition={{ duration: 3.5, repeat: Infinity, times: [0, 0.2, 0.5, 0.85, 1], delay: i * 0.1 }}
          />
        );
      })}
    </svg>
  );
}

export function XrayArt({ shape, className = '' }: { shape: XrayShape; className?: string }) {
  const id = `xr-${shape}`;
  const inner = (() => {
    switch (shape) {
      case 'xr-pin':
        return <PinXray id={id} driver="standard" />;
      case 'xr-spool':
        return <PinXray id={id} driver="spool" />;
      case 'xr-serrated':
        return <PinXray id={id} driver="serrated" />;
      case 'xr-mushroom':
        return <PinXray id={id} driver="mushroom" />;
      case 'xr-wafer':
        return <WaferXray id={id} />;
      case 'xr-disc':
        return <DiscXray id={id} />;
      case 'xr-dimple':
        return <DimpleXray id={id} />;
      case 'xr-lever':
        return <LeverXray id={id} />;
      case 'xr-tubular':
        return <TubularXray id={id} />;
    }
  })();
  return <div className={className}>{inner}</div>;
}

/* ───────────────────────── Pin shapes (security pins lesson) ───────────────────────── */
export function PinShapeArt({ kind, className = '' }: { kind: 'standard' | 'spool' | 'serrated' | 'mushroom' | 't-pin'; className?: string }) {
  const id = `ps-${kind}`;
  const d =
    kind === 't-pin'
      ? 'M10 6h20v26h-6v26h-8V32h-6z'
      : driverPath(kind === 'standard' ? 'standard' : (kind as DriverKind), 10, 6, 20, 52);
  return (
    <svg viewBox="0 0 40 100" className={className}>
      <Defs id={id} />
      <path d={d} fill={kind === 'standard' ? `url(#${id}-steel)` : `url(#${id}-red)`} stroke="#0f172a" strokeWidth={0.8} />
      <path d="M10 62h20v26l-10 8-10-8z" fill={`url(#${id}-brass)`} stroke="#422006" strokeWidth={0.8} />
    </svg>
  );
}
