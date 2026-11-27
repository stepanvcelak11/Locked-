import { motion } from 'framer-motion';
import type { ToolProfile } from '../../types';
import type { ToolGuide } from '../../data/library';

/*
 * Tool drawings traced from reference photos (SouthOrd, Peterson, Sparrows,
 * HPC). A pick is a flat handle, a long thin shaft and a small tip; the tip is
 * also shown magnified. Tip geometry is in "shaft units": the shaft centre line
 * is y = 0, the shaft is ~3 units thick, the tip region runs x = 0…22 and
 * features rise towards negative y.
 */

const STEEL = '#8b93a1';
const STEEL_DARK = '#5f6673';
const SW = 3; // shaft thickness

/** Strip bent into a wave of n humps (Bogota / snake / S-rake are bent strips, not bumps on a flat bar). */
function wave(n: number, len: number, up: number, down: number, start = 2, tail = 0) {
  const end = len - 2;
  const wl = (end - start) / n;
  const pts: string[] = ['0,0', `${start},0`];
  for (let x = start; x <= end + 0.01; x += 0.4) {
    const ph = ((x - start) / wl) * Math.PI * 2;
    const s = Math.sin(ph);
    pts.push(`${x.toFixed(2)},${(-s * (s > 0 ? up : down)).toFixed(2)}`);
  }
  let d = `M${pts.join('L')}`;
  if (tail) d += `Q${end + 1.6} 0 ${end + 2.2} ${-tail}`;
  return d;
}

type Tip = { stroke?: string; fill?: string; w?: number; key?: boolean; sheet?: boolean };

const TIPS: Record<string, Tip> = {
  'short-hook': { stroke: 'M0 0H15Q19.5 0 19.8 -4L20 -5.6' },
  'medium-hook': { stroke: 'M0 0H14Q19 0 19.4 -5.5L19.8 -9' },
  'deep-hook': { stroke: 'M0 0H9Q15 0 17.5 -6Q19.5 -11 19.6 -15' },
  'gonzo-hook': { stroke: 'M0 0H6Q10 0 12 2.2Q14 3.4 16 2.4Q19 0.5 19.6 -4L20 -7' },
  'half-diamond': { stroke: 'M0 0H11', fill: 'M10 -1.5L15.6 -7.2L21.4 1.5H10Z' },
  ball: { stroke: 'M0 0H15.5', fill: 'M15 1.5A4 4 0 1 1 22.5 0.2A4 4 0 0 1 15 1.5Z' },
  'double-ball': { stroke: 'M0 0H9', fill: 'M8.4 1.4A3.3 3.3 0 1 1 14.6 0.6A3.3 3.3 0 1 1 20.8 0.4A3.3 3.3 0 1 1 14.6 0.6A3.3 3.3 0 0 1 8.4 1.4Z' },
  bogota: { stroke: wave(3, 30, 4.6, 2.4, 2, 2) },
  'batman-2': { stroke: wave(2, 24, 5, 2.6, 3, 2) },
  snake: { stroke: wave(2, 24, 3, 3, 6, 3) },
  'city-rake': { fill: 'M0 -1.5H3Q4 -1.5 4 -3.2Q5 -5 6 -3.2Q6.6 -2 7.4 -2Q8.4 -6.4 10 -6.2Q11.4 -6 11.6 -2.6Q12.4 -1.6 13.2 -3.6Q14.4 -5.4 15.6 -3.4Q16.3 -2 17 -2.4L18.4 -4.2L21.5 1.5H0Z' },
  'w-rake': { fill: 'M0 -1.5H5L7 -5.4L9 -1.5L11 -5.4L13 -1.5L15 -5.4L17 -1.5L21.5 1.5H0Z' },
  'wafer-jiggler': { key: true },
  'bump-key': { key: true },
  'dimple-flag': { stroke: 'M0 0H19.5V-5.5H21.6', w: 2.6 },
  'lever-pick': { stroke: 'M0 0H14Q17.5 0 17.5 -3.5V-13', w: 3.6 },
  'key-extractor': { fill: 'M0 -1.7H6L8.5 -3.1V-1.7H11L13.5 -3.1V-1.7H16L18.5 -3.1V-1.7H19L22.5 0L19 1.7H0Z' },
  'comb-pick': { fill: 'M0 -2.2H2.6V-8.4H3.9V-2.2H5.6V-8.4H6.9V-2.2H8.6V-8.4H9.9V-2.2H11.6V-8.4H12.9V-2.2H14.6V-8.4H15.9V-2.2H17.6V-8.4H18.9V-2.2H20.4Q21.6 -2.2 21.6 0V2.2H0Z' },
  'plug-spinner': { stroke: 'M0 0H18', fill: 'M17 -3.4H22V3.4H17Z' },
  'disc-pick': { stroke: 'M0 0H17', fill: 'M16 -3.6H18.4V-1.2H22V1.2H18.4V3.6H16Z' },
  'tubular-pick': { fill: 'M0 -5H20V5H0ZM20 -4.4H22.4V-3.4H20ZM20 -2.2H22.8V-1.2H20ZM20 0H22.2V1H20ZM20 2.2H22.6V3.2H20Z' },
  'bypass-shim': { sheet: true },
  other: { stroke: 'M0 0H18Q20.5 0 20.6 -2.6' },
};

function TipShape({ profile, scale = 1, color = STEEL }: { profile: ToolProfile; scale?: number; color?: string }) {
  const t = TIPS[profile] ?? TIPS.other;
  return (
    <g transform={`scale(${scale})`}>
      {t.stroke && <path d={t.stroke} fill="none" stroke={color} strokeWidth={t.w ?? SW} strokeLinecap="round" strokeLinejoin="round" />}
      {t.fill && <path d={t.fill} fill={color} />}
    </g>
  );
}

function Handle({ x, w }: { x: number; w: number }) {
  return (
    <g>
      <rect x={x} y={20} width={w} height={16} rx={8} fill="#2f343c" />
      <rect x={x + 6} y={22.5} width={w - 14} height={2.5} rx={1.2} fill="#fff" opacity={0.12} />
      <circle cx={x + 9} cy={28} r={2} fill="#14171b" />
    </g>
  );
}

/** Key-shaped tools: try-out (jiggler) keys and bump keys. */
function KeyTool({ profile }: { profile: ToolProfile }) {
  const blade =
    profile === 'bump-key'
      ? 'M72 22H82L88 30L94 22L100 30L106 22L112 30L118 22L124 30L130 22H170L182 29L170 36H72Z'
      : 'M72 24H90Q96 16 104 24Q112 32 120 22Q128 14 136 24Q144 32 152 24H170L182 29L170 36H72Z';
  return (
    <g>
      <rect x={14} y={12} width={60} height={32} rx={10} fill={STEEL} />
      <circle cx={30} cy={28} r={6} fill="var(--color-well)" />
      <path d={blade} fill={STEEL} />
      <line x1={78} x2={168} y1={31} y2={31} stroke={STEEL_DARK} strokeWidth={1} opacity={0.6} />
    </g>
  );
}

/** Tension tools are drawn whole – the bend is the point. */
function TensionTool({ profile, caption = true }: { profile: ToolProfile; caption?: boolean }) {
  if (profile === 'tok-bar') {
    return (
      <g>
        <path d="M12 26H196V32H12Z" fill={STEEL} />
        <path d="M196 26H214V40H208V32H196Z" fill={STEEL} />
        {[0, 1, 2].map((i) => (
          <line key={i} x1={209} x2={213} y1={34 + i * 2.2} y2={34 + i * 2.2} stroke={STEEL_DARK} strokeWidth={0.8} />
        ))}
        {caption && <Caption2 x={110} y={50}>
          plochý prut, krátký zahnutý konec jde nahoru do otvoru
        </Caption2>}
      </g>
    );
  }
  if (profile === 'bok-wrench') {
    return (
      <g>
        <path d="M24 30H200" stroke={STEEL} strokeWidth={4} strokeLinecap="round" />
        <path d="M200 30V44" stroke={STEEL} strokeWidth={4} strokeLinecap="round" />
        <path d="M24 30V20Q24 16 28 16" fill="none" stroke={STEEL} strokeWidth={4} strokeLinecap="round" />
        {caption && (
          <Caption2 x={112} y={52}>
            tvar L / Z – krátký konec jde dolů do otvoru
          </Caption2>
        )}
      </g>
    );
  }
  return (
    <g>
      <path d="M20 30H64" stroke={STEEL} strokeWidth={4} strokeLinecap="round" />
      <path d="M64 30Q70 24 76 30T88 30T100 30T112 30T124 30" fill="none" stroke={STEEL} strokeWidth={3.4} strokeLinecap="round" />
      <path d="M124 30H196V42" fill="none" stroke={STEEL} strokeWidth={3.2} strokeLinecap="round" strokeLinejoin="round" />
      {caption && (
        <Caption2 x={112} y={52}>
          zkroucený pružný prut s ohnutým koncem
        </Caption2>
      )}
    </g>
  );
}

function Caption2({ x, y, children }: { x: number; y: number; children: string }) {
  return (
    <text x={x} y={y} fontSize={7.5} fontWeight={600} fill="#8E8E93" textAnchor="middle" fontFamily="-apple-system, 'Inter Variable', sans-serif">
      {children}
    </text>
  );
}

/**
 * `full` – the whole tool in proportion plus a magnified tip;
 * `tip` – just the tip, for small thumbnails.
 */
export function ToolArt({ profile, className = '', variant = 'full' }: { profile: ToolProfile; className?: string; variant?: 'full' | 'tip' }) {
  const isTension = profile === 'tok-bar' || profile === 'bok-wrench' || profile === 'twist-wrench';
  const tip = TIPS[profile] ?? TIPS.other;
  if (isTension) {
    return (
      <svg viewBox={variant === 'tip' ? '0 8 224 40' : '0 0 224 56'} className={className} aria-hidden="true">
        <TensionTool profile={profile} caption={variant === 'full'} />
      </svg>
    );
  }
  if (tip.key) {
    return (
      <svg viewBox="0 0 196 56" className={className} aria-hidden="true">
        <KeyTool profile={profile} />
      </svg>
    );
  }
  if (tip.sheet) {
    // padlock shim: a thin sheet curved to wrap round the shackle
    return (
      <svg viewBox="0 0 196 56" className={className} aria-hidden="true">
        <path d="M60 10H120V40Q120 48 112 48H68Q60 48 60 40Z" fill={STEEL} />
        <path d="M60 22H120" stroke={STEEL_DARK} strokeWidth={0.8} opacity={0.6} />
        <path d="M120 18Q140 18 140 29Q140 40 120 40" fill="none" stroke={STEEL} strokeWidth={3} />
        {variant === 'full' && <Caption2 x={98} y={8}>tenký plíšek ohnutý do tvaru třmenu</Caption2>}
      </svg>
    );
  }
  if (variant === 'tip') {
    const long = profile === 'bogota' || profile === 'batman-2' || profile === 'snake';
    return (
      <svg viewBox={long ? '-6 -12 40 22' : '-12 -14 38 24'} className={className} aria-hidden="true">
        <line x1={-14} x2={0.5} y1={0} y2={0} stroke={STEEL} strokeWidth={SW} />
        <TipShape profile={profile} />
      </svg>
    );
  }
  // whole tool: handle, shaft, tip at 1:1 from x = 158, magnified tip in the circle
  const special = profile === 'tubular-pick' || profile === 'disc-pick' || profile === 'plug-spinner';
  return (
    <svg viewBox="0 0 252 56" className={className} aria-hidden="true">
      <Handle x={6} w={90} />
      {special ? (
        <path d="M96 25H158V31H96Z" fill={STEEL} />
      ) : (
        <path d={`M96 26L112 ${28 - SW / 2}H158V${28 + SW / 2}H112L96 30Z`} fill={STEEL} />
      )}
      {profile === 'disc-pick' && (
        <g>
          <rect x={98} y={12} width={14} height={32} rx={4} fill="#b9bfcb" stroke={STEEL_DARK} strokeWidth={0.8} />
          {[0, 1, 2, 3, 4, 5, 6].map((i) => (
            <line key={i} x1={100 + i * 1.7} x2={100 + i * 1.7} y1={14} y2={42} stroke={STEEL_DARK} strokeWidth={0.5} />
          ))}
        </g>
      )}
      <g transform="translate(158 28)">
        <TipShape profile={profile} />
      </g>
      {/* magnifier */}
      <line x1={192} y1={24} x2={204} y2={18} stroke="#c7c7cc" strokeWidth={0.8} />
      <line x1={192} y1={32} x2={204} y2={38} stroke="#c7c7cc" strokeWidth={0.8} />
      <circle cx={226} cy={28} r={24} fill="var(--color-card)" stroke="#c7c7cc" strokeWidth={1} />
      <clipPath id={`clip-${profile}`}>
        <circle cx={226} cy={28} r={23} />
      </clipPath>
      <g clipPath={`url(#clip-${profile})`}>
        <g transform={`translate(${long(profile) ? 203 : 208} 34)`}>
          <line x1={-40} x2={0.5} y1={0} y2={0} stroke={STEEL} strokeWidth={SW * 1.55} />
          <TipShape profile={profile} scale={long(profile) ? 1.45 : 1.6} />
        </g>
      </g>
    </svg>
  );
}

const long = (p: ToolProfile) => p === 'bogota' || p === 'batman-2' || p === 'snake';

/** Mini cutaway showing the hand motion for a tool. */
const C = {
  housing: '#D9DCE3',
  housingStroke: '#8E8E93',
  plug: '#CFE3FF',
  plugStroke: '#4A90E2',
  keyway: '#3A3A3C',
  driver: '#B9BFCB',
  key: '#F2B544',
  shear: '#FF9500',
  tool: '#0A6CFF',
  wrench: '#21A44A',
  text: '#8E8E93',
};

function Caption({ children }: { children: string }) {
  return (
    <text x={112} y={117} textAnchor="middle" fontSize={8} fontWeight={600} fill={C.text} fontFamily="-apple-system, 'Inter Variable', sans-serif">
      {children}
    </text>
  );
}

export function ToolMotionDemo({ guide }: { guide: ToolGuide }) {
  const pins = [0, 1, 2, 3, 4];
  const pinX = (i: number) => 60 + i * 28;
  const keyLens = [22, 30, 16, 26, 20];
  const D = guide.motion === 'yank' ? 2.6 : 3.2;
  const repeat = { repeat: Infinity, duration: D, ease: 'easeInOut' as const };

  const motionFor = () => {
    switch (guide.motion) {
      case 'lift':
        return { x: [0, 84, 84, 84, 0], y: [0, 0, -10, 0, 0], rotate: [0, 0, -4, 0, 0] };
      case 'deep-lift':
        return { x: [0, 112, 112, 112, 0], y: [0, 0, -14, 0, 0], rotate: [0, 0, -4, 0, 0] };
      case 'rake-rock':
        return { x: [0, 90, 40, 95, 30, 90, 0], y: [0, -6, 0, -8, -2, -6, 0], rotate: [0, -5, 3, -6, 2, -4, 0] };
      case 'rake-scrub':
        return { x: [0, 110, 20, 110, 20, 110, 0], y: [0, -4, -4, -4, -4, -4, 0], rotate: [0, 0, 0, 0, 0, 0, 0] };
      case 'zip':
        return { x: [0, 120, 120, 0, 0], y: [0, 0, -9, -9, 0], rotate: [0, 0, 0, 0, 0] };
      case 'yank':
        // slide in, small wiggle under light tension, then a fast pull out
        return { x: [0, 112, 112, 110, 0, 0], y: [0, 0, -3, 2, -2, 0], rotate: [0, 0, -2, 2, 0, 0] };
      default:
        return { x: [0, 60, 0], y: [0, 0, 0], rotate: [0, 0, 0] };
    }
  };

  if (guide.motion === 'tension-tok' || guide.motion === 'tension-bok') {
    const top = guide.motion === 'tension-tok';
    return (
      <svg viewBox="0 0 200 120" className="h-full w-full">
        <circle cx={100} cy={56} r={48} fill={C.housing} stroke={C.housingStroke} />
        <motion.g style={{ originX: '100px', originY: '56px' }} animate={{ rotate: [0, 0, 8, 8, 0] }} transition={repeat}>
          <circle cx={100} cy={56} r={33} fill={C.plug} stroke={C.plugStroke} />
          <path d="M96 28h8v10l4 5-4 5v8l3 4-3 4v14h-8v-10l-3-4 3-4v-8l-4-5 4-5z" fill={C.keyway} />
          {top ? <rect x={95} y={26} width={10} height={5} rx={1} fill={C.wrench} /> : <rect x={95} y={80} width={10} height={5} rx={1} fill={C.wrench} />}
        </motion.g>
        <motion.g animate={{ rotate: [0, 0, 8, 8, 0] }} transition={repeat} style={{ originX: '100px', originY: '56px' }}>
          {top ? <rect x={98} y={0} width={4} height={28} rx={2} fill={C.wrench} /> : <rect x={98} y={84} width={4} height={24} rx={2} fill={C.wrench} />}
        </motion.g>
        <Caption>{top ? 'TOK – napínák nahoře, pod stavítky zůstane místo' : 'BOK – napínák dole v otvoru'}</Caption>
      </svg>
    );
  }
  if (guide.motion === 'disc-rotate') {
    return (
      <svg viewBox="0 0 200 120" className="h-full w-full">
        {[0, 1, 2].map((i) => (
          <motion.g key={i} style={{ originX: `${60 + i * 40}px`, originY: '56px' }} animate={{ rotate: [i * 50, i * 50, 0, 0, i * 50] }} transition={{ ...repeat, delay: i * 0.2 }}>
            <circle cx={60 + i * 40} cy={56} r={26} fill={C.driver} stroke={C.housingStroke} />
            <rect x={56 + i * 40} y={30} width={8} height={6} fill={C.keyway} />
            <path d={`M${60 + i * 40} 48a8 8 0 0 1 0 16z`} fill={C.keyway} />
          </motion.g>
        ))}
        <Caption>disky se otáčí, dokud výřezy nejsou v řadě</Caption>
      </svg>
    );
  }
  if (guide.motion === 'extract') {
    const t = { repeat: Infinity, duration: 4, ease: 'easeInOut' as const, times: [0, 0.35, 0.5, 0.85, 1] };
    return (
      <svg viewBox="0 0 200 120" className="h-full w-full">
        <rect x={30} y={10} width={164} height={96} rx={8} fill={C.housing} stroke={C.housingStroke} />
        <rect x={34} y={52} width={156} height={50} rx={5} fill={C.plug} stroke={C.plugStroke} />
        <line x1={30} x2={194} y1={52} y2={52} stroke={C.shear} strokeDasharray="4 3" />
        {/* broken key fragment */}
        <motion.g animate={{ x: [0, 0, 0, -150, -150] }} transition={t}>
          <path d="M100 76L108 70L116 76L124 68L132 76L140 70L148 76L160 76L168 82L160 90H100Z" fill={C.key} stroke="#B7791F" strokeWidth={0.8} />
          <path d="M100 76V90" stroke="#B7791F" strokeWidth={1.2} strokeDasharray="2 2" />
        </motion.g>
        {/* extractor slides in under the fragment's cuts, then pulls it out */}
        <motion.g animate={{ x: [-150, 0, 0, -150, -150], y: [0, 0, -3, -3, 0] }} transition={t}>
          <path d="M0 90H104V86L112 90V86L120 90V86L128 90V86L136 90H160L170 92L160 95H0Z" fill={C.tool} />
        </motion.g>
        <rect x={20} y={88} width={14} height={8} fill="#cbd5e1" />
        <Caption>zasunout, zakousnout do zubů klíče, vytáhnout</Caption>
      </svg>
    );
  }
  if (guide.motion === 'none') {
    return (
      <div className="flex h-full items-center justify-center">
        <ToolArt profile={guide.profile} className="w-4/5" />
      </div>
    );
  }

  const m = motionFor();
  const times = m.x.length === 5 ? [0, 0.3, 0.55, 0.75, 1] : m.x.length === 6 ? [0, 0.35, 0.5, 0.62, 0.72, 1] : undefined;
  const liftsFor = (i: number) => {
    if (guide.motion === 'lift') return i === 3 ? [0, 0, -10, 0, 0] : [0, 0, 0, 0, 0];
    if (guide.motion === 'deep-lift') return i === 4 ? [0, 0, -14, 0, 0] : [0, 0, 0, 0, 0];
    if (guide.motion === 'zip') return [0, 0, -6, -6, 0].map((v, k) => (k === 3 ? 0 : v));
    if (guide.motion === 'yank') return [0, -6 - (i % 2) * 3, -4, -2, -10 + (i % 3) * 2, 0];
    return [0, -6 - (i % 2) * 4, 0, -8 + (i % 3) * 2, -2, -6, 0];
  };
  return (
    <svg viewBox="0 0 200 120" className="h-full w-full">
      <rect x={30} y={10} width={164} height={96} rx={8} fill={C.housing} stroke={C.housingStroke} />
      <rect x={34} y={52} width={156} height={50} rx={5} fill={C.plug} stroke={C.plugStroke} />
      <rect x={34} y={84} width={156} height={12} fill={C.keyway} opacity={0.85} />
      {pins.map((i) => (
        <g key={i}>
          <rect x={pinX(i) - 7} y={14} width={14} height={70} fill="#000" opacity={0.07} />
          <motion.g animate={{ y: liftsFor(i) }} transition={{ ...repeat, times: liftsFor(i).length === 5 ? [0, 0.3, 0.55, 0.75, 1] : liftsFor(i).length === 6 ? times : undefined, delay: guide.motion.startsWith('rake') ? i * 0.04 : 0 }}>
            <rect x={pinX(i) - 6} y={84 - keyLens[i] - 26} width={12} height={26} rx={1.5} fill={C.driver} stroke="#5E6470" strokeWidth={0.6} />
            <path d={`M${pinX(i) - 6} ${84 - keyLens[i]}h12v${keyLens[i] - 3}l-6 4-6-4z`} fill={C.key} stroke="#B7791F" strokeWidth={0.6} />
          </motion.g>
        </g>
      ))}
      <line x1={30} x2={194} y1={52} y2={52} stroke={C.shear} strokeDasharray="4 3" />
      <motion.g animate={m} transition={{ ...repeat, times }} style={{ originX: '20px', originY: '92px' }}>
        <g transform="translate(36 90) scale(1.5)">
          <line x1={-60} x2={0.5} y1={0} y2={0} stroke={C.tool} strokeWidth={SW} />
          <TipShape profile={guide.profile} color={C.tool} />
        </g>
      </motion.g>
      <path d="M22 104H44V96" fill="none" stroke={C.wrench} strokeWidth={4} strokeLinejoin="round" strokeLinecap="round" />
      <Caption>{guide.motion === 'yank' ? 'zasunout, lehce zabrat napínákem, škubnout ven' : guide.motion.startsWith('rake') ? 'rychle tam a zpět, napínák jen lehce' : 'pohyb nástroje'}</Caption>
    </svg>
  );
}
