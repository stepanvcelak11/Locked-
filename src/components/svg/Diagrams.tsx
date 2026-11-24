/**
 * Technical illustrations in a clean "textbook" style – readable on both the light
 * and dark well surface. Used by the glossary, lock types and security pins.
 */
import { useId, type ReactNode } from 'react';
import type { Mechanism, PinType } from '../../types';

export const P = {
  housing: '#D9DCE3',
  housingStroke: '#8E8E93',
  plug: '#CFE3FF',
  plugStroke: '#4A90E2',
  keyway: '#3A3A3C',
  key: '#F2B544',
  keyStroke: '#B7791F',
  driver: '#B9BFCB',
  driverStroke: '#5E6470',
  spring: '#8E8E93',
  shear: '#FF9500',
  red: '#FF3B30',
  green: '#34C759',
  blue: '#007AFF',
  label: '#8E8E93',
  ink: '#1C1C1E',
};

function Label({ x, y, children, anchor = 'start', color = P.label }: { x: number; y: number; children: ReactNode; anchor?: 'start' | 'middle' | 'end'; color?: string }) {
  return (
    <text
      x={x}
      y={y}
      fontSize={9.5}
      fontWeight={600}
      fill={color}
      textAnchor={anchor}
      stroke="var(--color-well)"
      strokeWidth={3}
      strokeLinejoin="round"
      paintOrder="stroke"
      fontFamily="-apple-system, 'Inter Variable', sans-serif"
    >
      {children}
    </text>
  );
}

function Leader({ x1, y1, x2, y2 }: { x1: number; y1: number; x2: number; y2: number }) {
  return (
    <g>
      <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={P.label} strokeWidth={0.8} />
      <circle cx={x2} cy={y2} r={1.6} fill={P.label} />
    </g>
  );
}

function springPath(x: number, top: number, bottom: number, w = 6) {
  const n = 8;
  let d = `M${x} ${top}`;
  for (let i = 0; i < n; i++) d += ` L${x + (i % 2 ? -w : w)} ${top + ((i + 0.5) / n) * (bottom - top)}`;
  return `${d} L${x} ${bottom}`;
}

/** Driver pin outline for the given kind, drawn in a box (x,y,w,h). */
function driverShape(kind: PinType, x: number, y: number, w: number, h: number) {
  const r = 1.5;
  if (kind === 'spool') {
    const n = w * 0.22;
    const a = h * 0.3;
    const b = h * 0.7;
    return `M${x + r} ${y}h${w - 2 * r}q${r} 0 ${r} ${r}V${y + a}L${x + w - n} ${y + a + 2}V${y + b - 2}L${x + w} ${y + b}V${y + h - r}q0 ${r} ${-r} ${r}H${x + r}q${-r} 0 ${-r} ${-r}V${y + b}L${x + n} ${y + b - 2}V${y + a + 2}L${x} ${y + a}V${y + r}q0 ${-r} ${r} ${-r}z`;
  }
  if (kind === 'mushroom') {
    const n = w * 0.24;
    return `M${x + r} ${y}h${w - 2 * r}q${r} 0 ${r} ${r}V${y + h * 0.35}L${x + w - n} ${y + h * 0.55}V${y + h - r}q0 ${r} ${-r} ${r}H${x + n + r}q${-r} 0 ${-r} ${-r}V${y + h * 0.55}L${x} ${y + h * 0.35}V${y + r}q0 ${-r} ${r} ${-r}z`;
  }
  if (kind === 't-pin') {
    const n = w * 0.26;
    return `M${x + r} ${y}h${w - 2 * r}q${r} 0 ${r} ${r}V${y + h * 0.3}H${x + w - n}V${y + h - r}q0 ${r} ${-r} ${r}H${x + n + r}q${-r} 0 ${-r} ${-r}V${y + h * 0.3}H${x}V${y + r}q0 ${-r} ${r} ${-r}z`;
  }
  if (kind === 'serrated') {
    let d = `M${x + r} ${y}h${w - 2 * r}q${r} 0 ${r} ${r}`;
    const teeth = 5;
    for (let i = 0; i < teeth; i++) {
      const ty = y + 3 + (i * (h - 6)) / teeth;
      d += `V${ty}l${-2} ${(h - 6) / teeth / 2}l2 ${(h - 6) / teeth / 2}`;
    }
    d += `V${y + h - r}q0 ${r} ${-r} ${r}H${x + r}q${-r} 0 ${-r} ${-r}`;
    for (let i = teeth - 1; i >= 0; i--) {
      const ty = y + 3 + ((i + 1) * (h - 6)) / teeth;
      d += `V${ty}l2 ${-(h - 6) / teeth / 2}l-2 ${-(h - 6) / teeth / 2}`;
    }
    return `${d}V${y + r}q0 ${-r} ${r} ${-r}z`;
  }
  return `M${x + r} ${y}h${w - 2 * r}q${r} 0 ${r} ${r}V${y + h - r}q0 ${r} ${-r} ${r}H${x + r}q${-r} 0 ${-r} ${-r}V${y + r}q0 ${-r} ${r} ${-r}z`;
}

export interface CutPin {
  keyLen: number;
  lift?: number;
  driver?: PinType;
  /** highlight colour for the whole stack */
  hl?: string;
}

/**
 * Side cutaway of a pin-tumbler lock. Coordinates: viewBox 0 0 240 130,
 * shear line at y=62, keyway top at y=96.
 */
export function Cutaway({
  pins = [{ keyLen: 22 }, { keyLen: 28 }, { keyLen: 20 }, { keyLen: 26 }],
  plugShift = 0,
  focus,
  children,
  showShear = true,
  className = 'w-full',
  title,
}: {
  pins?: CutPin[];
  plugShift?: number;
  focus?: 'plug' | 'shell' | 'key' | 'driver' | 'shear' | 'spring';
  children?: ReactNode;
  showShear?: boolean;
  className?: string;
  title: string;
}) {
  const SHEAR = 62;
  const KW = 96;
  const xs = pins.map((_, i) => 52 + i * (150 / Math.max(1, pins.length - 1)));
  const dim = (part: string) => (focus && focus !== part ? 0.28 : 1);
  return (
    <svg viewBox="0 0 240 130" className={className} role="img" aria-label={title}>
      {/* shell */}
      <g opacity={dim('shell')}>
        <rect x={14} y={8} width={212} height={112} rx={8} fill={P.housing} stroke={focus === 'shell' ? P.blue : P.housingStroke} strokeWidth={focus === 'shell' ? 2 : 1} />
      </g>
      {/* plug */}
      <g transform={`translate(${plugShift} 0)`} opacity={dim('plug')}>
        <rect x={20} y={SHEAR} width={200} height={52} rx={5} fill={P.plug} stroke={focus === 'plug' ? P.blue : P.plugStroke} strokeWidth={focus === 'plug' ? 2 : 1} />
        <rect x={20} y={KW} width={200} height={12} fill={P.keyway} opacity={0.85} />
      </g>
      {/* chambers + pins */}
      {pins.map((p, i) => {
        const x = xs[i];
        const lift = p.lift ?? 0;
        const keyTop = KW - p.keyLen - lift;
        const drvH = 22;
        const drvTop = keyTop - drvH;
        return (
          <g key={i}>
            <rect x={x - 9} y={12} width={18} height={KW - 12} fill="#000" opacity={0.08} />
            <path d={springPath(x, 13, drvTop)} fill="none" stroke={P.spring} strokeWidth={1.2} opacity={dim('spring')} />
            <path
              d={driverShape(p.driver ?? 'standard', x - 8, drvTop, 16, drvH)}
              fill={P.driver}
              stroke={p.hl ?? (focus === 'driver' ? P.blue : P.driverStroke)}
              strokeWidth={p.hl || focus === 'driver' ? 1.8 : 0.8}
              opacity={dim('driver')}
            />
            <path
              d={`M${x - 8} ${keyTop + 1.5}q0 -1.5 1.5 -1.5h13q1.5 0 1.5 1.5V${KW - 6 - lift}L${x} ${KW - lift}L${x - 8} ${KW - 6 - lift}z`}
              fill={P.key}
              stroke={p.hl ?? (focus === 'key' ? P.blue : P.keyStroke)}
              strokeWidth={p.hl || focus === 'key' ? 1.8 : 0.8}
              opacity={dim('key')}
            />
          </g>
        );
      })}
      {showShear && (
        <g opacity={focus && focus !== 'shear' ? 0.5 : 1}>
          <line x1={10} x2={230} y1={SHEAR} y2={SHEAR} stroke={P.shear} strokeWidth={focus === 'shear' ? 2 : 1.2} strokeDasharray="5 3" />
        </g>
      )}
      {children}
    </svg>
  );
}

function Badge({ x, y, children, color = P.blue }: { x: number; y: number; children: ReactNode; color?: string }) {
  return (
    <g>
      <circle cx={x} cy={y} r={6.5} fill={color} />
      <text x={x} y={y + 3.2} fontSize={9} fontWeight={700} fill="#fff" textAnchor="middle" fontFamily="-apple-system, 'Inter Variable', sans-serif">
        {children}
      </text>
    </g>
  );
}

function Arrow({ x1, y1, x2, y2, color = P.red }: { x1: number; y1: number; x2: number; y2: number; color?: string }) {
  const a = Math.atan2(y2 - y1, x2 - x1);
  const h = 5;
  return (
    <g stroke={color} strokeWidth={1.8} fill="none" strokeLinecap="round" strokeLinejoin="round">
      <line x1={x1} y1={y1} x2={x2} y2={y2} />
      <path d={`M${x2 - h * Math.cos(a - 0.5)} ${y2 - h * Math.sin(a - 0.5)}L${x2} ${y2}L${x2 - h * Math.cos(a + 0.5)} ${y2 - h * Math.sin(a + 0.5)}`} />
    </g>
  );
}

/* lifts that put each key-pin top exactly on the shear line (KW 96 − len − lift = 62) */
const setLift = (len: number) => 34 - len;

/** Keyway (front view) profile. */
function KeywayFace({ wards = false, tok, bok }: { wards?: boolean; tok?: boolean; bok?: boolean }) {
  return (
    <g>
      <circle cx={120} cy={65} r={52} fill={P.housing} stroke={P.housingStroke} />
      <circle cx={120} cy={65} r={38} fill={P.plug} stroke={P.plugStroke} />
      <path d="M113 30h14v12l-5 6 5 6v14l-6 7 6 7v22h-14V92l5-7-5-7V62l6-7-6-6z" fill={P.keyway} />
      {wards && (
        <g fill="none" stroke={P.red} strokeWidth={2}>
          <path d="M127 42l-5 6 5 6" />
          <path d="M113 62l6 7-6 7" />
          <path d="M127 78l-5 7 5 7" />
        </g>
      )}
      {tok && (
        <g>
          <rect x={114.5} y={31} width={11} height={6} rx={1} fill={P.blue} />
          <Label x={160} y={30}>TOK – nahoře</Label>
          <Leader x1={158} y1={27} x2={126} y2={34} />
        </g>
      )}
      {bok && (
        <g>
          <rect x={114.5} y={93} width={11} height={6} rx={1} fill={P.green} />
          <Label x={160} y={108}>BOK – dole</Label>
          <Leader x1={158} y1={105} x2={126} y2={96} />
        </g>
      )}
    </g>
  );
}

export type GlossaryArtId =
  | 'shear'
  | 'plug'
  | 'shell'
  | 'keypin'
  | 'driver'
  | 'binding'
  | 'order'
  | 'set'
  | 'overset'
  | 'falseset'
  | 'counter'
  | 'bitting'
  | 'keyway'
  | 'warding'
  | 'tokbok'
  | 'spp'
  | 'raking'
  | 'bumping'
  | 'gutting'
  | 'repinning'
  | 'sidebar'
  | 'belts';

const BASE: CutPin[] = [{ keyLen: 22 }, { keyLen: 28 }, { keyLen: 20 }, { keyLen: 26 }];

/** Small explanatory picture for a glossary term. */
export function GlossaryArt({ id, className = 'w-full' }: { id: GlossaryArtId; className?: string }) {
  switch (id) {
    case 'shear':
      return (
        <Cutaway title="Střižná rovina" className={className} focus="shear" pins={BASE.map((p) => ({ ...p, lift: setLift(p.keyLen) }))}>
          <Label x={226} y={57} anchor="end" color={P.shear}>
            střižná rovina
          </Label>
        </Cutaway>
      );
    case 'plug':
      return (
        <Cutaway title="Bubínek" className={className} focus="plug">
          <Label x={120} y={126} anchor="middle" color={P.blue}>
            bubínek (plug) – otáčí se
          </Label>
        </Cutaway>
      );
    case 'shell':
      return (
        <Cutaway title="Tělo zámku" className={className} focus="shell">
          <Label x={120} y={6.5} anchor="middle" color={P.blue}>
            tělo (shell) – pevné
          </Label>
        </Cutaway>
      );
    case 'keypin':
      return (
        <Cutaway title="Spodní stavítka" className={className} focus="key">
          <Label x={226} y={126} anchor="end" color={P.keyStroke}>
            spodní stavítka – různé délky
          </Label>
        </Cutaway>
      );
    case 'driver':
      return (
        <Cutaway title="Horní stavítka" className={className} focus="driver">
          <Label x={226} y={6.5} anchor="end" color={P.blue}>
            horní stavítka + pružiny
          </Label>
        </Cutaway>
      );
    case 'binding':
      return (
        <Cutaway title="Binding pin" className={className} plugShift={2} pins={BASE.map((p, i) => (i === 2 ? { ...p, hl: P.red } : p))}>
          <Arrow x1={60} y1={124} x2={92} y2={124} color={P.blue} />
          <Label x={62} y={118}>napětí</Label>
          <Label x={152} y={10} anchor="middle" color={P.red}>
            tuhne jako první
          </Label>
        </Cutaway>
      );
    case 'order':
      return (
        <Cutaway title="Binding order" className={className} pins={BASE}>
          {[3, 1, 4, 2].map((n, i) => (
            <Badge key={i} x={52 + i * 50} y={124} color={P.blue}>
              {n}
            </Badge>
          ))}
        </Cutaway>
      );
    case 'set':
      return (
        <Cutaway
          title="Set"
          className={className}
          plugShift={2}
          pins={BASE.map((p, i) => (i < 2 ? { ...p, lift: setLift(p.keyLen), hl: P.green } : p))}
        >
          <Label x={77} y={8} anchor="middle" color={P.green}>
            nasazeno (set)
          </Label>
        </Cutaway>
      );
    case 'overset':
      return (
        <Cutaway title="Overset" className={className} plugShift={2} pins={BASE.map((p, i) => (i === 1 ? { ...p, lift: setLift(p.keyLen) + 9, hl: P.red } : p))}>
          <Label x={102} y={8} anchor="middle" color={P.red}>
            spodní stavítko nad rovinou
          </Label>
        </Cutaway>
      );
    case 'falseset':
      return (
        <Cutaway
          title="False set"
          className={className}
          plugShift={5}
          pins={[
            { keyLen: 22, lift: setLift(22) },
            { keyLen: 28, lift: setLift(28) - 9, driver: 'spool', hl: P.shear },
            { keyLen: 20, lift: setLift(20) },
            { keyLen: 26, lift: setLift(26) },
          ]}
        >
          <Label x={102} y={8} anchor="middle" color={P.shear}>
            spool zaklíněný pasem
          </Label>
          <Arrow x1={40} y1={124} x2={78} y2={124} color={P.blue} />
          <Label x={84} y={127}>bubínek se výrazně pootočí</Label>
        </Cutaway>
      );
    case 'counter':
      return (
        <Cutaway title="Counter-rotation" className={className} plugShift={2} pins={[{ keyLen: 22, lift: setLift(22) }, { keyLen: 28, lift: setLift(28) - 4, driver: 'spool', hl: P.shear }, { keyLen: 20 }, { keyLen: 26 }]}>
          <Arrow x1={130} y1={124} x2={92} y2={124} color={P.red} />
          <Label x={134} y={127} color={P.red}>
            bubínek tlačí zpět
          </Label>
          <Arrow x1={102} y1={112} x2={102} y2={92} color={P.blue} />
        </Cutaway>
      );
    case 'spp':
      return (
        <Cutaway title="SPP" className={className} plugShift={2} pins={BASE.map((p, i) => (i === 1 ? { ...p, lift: 5, hl: P.blue } : i === 0 ? { ...p, lift: setLift(p.keyLen) } : p))}>
          <path d="M4 104H90q8 0 9 -8l1 -4" fill="none" stroke={P.ink} strokeWidth={2.4} strokeLinecap="round" />
          <Label x={232} y={127} anchor="end">
            hák zvedá jedno stavítko
          </Label>
        </Cutaway>
      );
    case 'raking':
      return (
        <Cutaway title="Raking" className={className} pins={BASE.map((p, i) => ({ ...p, lift: [4, 9, 2, 7][i] }))}>
          <path d="M4 105H40L50 97L60 103L70 95L80 103L92 96L104 103L116 97L128 103L140 96L150 105" fill="none" stroke={P.ink} strokeWidth={2.4} strokeLinejoin="round" />
          <Arrow x1={160} y1={124} x2={200} y2={124} color={P.blue} />
          <Arrow x1={200} y1={124} x2={160} y2={124} color={P.blue} />
          <Label x={150} y={118} anchor="end">
            rychlé tahy tam a zpět
          </Label>
        </Cutaway>
      );
    case 'bumping':
      return (
        <Cutaway title="Bumping" className={className} pins={BASE.map((p) => ({ ...p, lift: 0 }))}>
          {[52, 102, 152, 202].map((x) => (
            <line key={x} x1={x - 9} x2={x + 9} y1={60} y2={60} stroke={P.red} strokeWidth={1.4} />
          ))}
          <path d="M4 106H210l6 -4" fill="none" stroke={P.keyStroke} strokeWidth={3} />
          <Arrow x1={10} y1={124} x2={34} y2={124} color={P.red} />
          <Label x={40} y={127}>úder → horní stavítka na okamžik odskočí</Label>
        </Cutaway>
      );
    case 'gutting':
      return (
        <svg viewBox="0 0 240 130" className={className} role="img" aria-label="Gutting">
          <rect x={10} y={14} width={110} height={60} rx={8} fill={P.housing} stroke={P.housingStroke} />
          {[30, 52, 74, 96].map((x) => (
            <rect key={x} x={x - 6} y={18} width={12} height={40} fill="#000" opacity={0.08} />
          ))}
          <rect x={128} y={44} width={100} height={34} rx={6} fill={P.plug} stroke={P.plugStroke} />
          {[146, 166, 186, 206].map((x, i) => (
            <path key={x} d={`M${x - 5} ${44 - [6, 10, 4, 8][i]}h10v${[6, 10, 4, 8][i] + 10}l-5 5-5-5z`} fill={P.key} stroke={P.keyStroke} strokeWidth={0.8} />
          ))}
          <Arrow x1={118} y1={96} x2={160} y2={96} color={P.blue} />
          <Label x={120} y={116} anchor="middle">
            bubínek vytažený z těla – vidíš všechna stavítka
          </Label>
        </svg>
      );
    case 'repinning':
      return (
        <svg viewBox="0 0 240 130" className={className} role="img" aria-label="Repinning">
          <rect x={14} y={20} width={150} height={84} rx={10} fill={P.housing} stroke={P.housingStroke} />
          {[0, 1, 2, 3, 4].map((c) =>
            [0, 1].map((r) => (
              <g key={`${c}${r}`}>
                <rect x={24 + c * 28} y={30 + r * 38} width={22} height={30} rx={4} fill="#fff" opacity={0.7} />
                {r === 0 ? (
                  <path d={`M${31 + c * 28} ${36}h8v${10 + c * 2}l-4 4-4-4z`} fill={P.key} stroke={P.keyStroke} strokeWidth={0.6} />
                ) : (
                  <path d={driverShape(c % 2 ? 'spool' : 'standard', 31 + c * 28, 74, 8, 18)} fill={P.driver} stroke={P.driverStroke} strokeWidth={0.6} />
                )}
              </g>
            )),
          )}
          <path d="M180 22L214 96M196 20L218 96" stroke={P.ink} strokeWidth={2.4} strokeLinecap="round" />
          <Label x={120} y={122} anchor="middle">
            sada stavítek + pinzeta → vlastní kombinace
          </Label>
        </svg>
      );
    case 'bitting':
      return (
        <svg viewBox="0 0 240 130" className={className} role="img" aria-label="Bitting klíče">
          <circle cx={34} cy={66} r={22} fill={P.key} stroke={P.keyStroke} />
          <circle cx={34} cy={66} r={7} fill="var(--color-well)" stroke={P.keyStroke} />
          <path d="M56 56H72L80 70L92 56L104 78L116 56L128 64L140 56L152 74L164 56H200L214 66L200 82H56Z" fill={P.key} stroke={P.keyStroke} />
          {[
            [80, '3'],
            [104, '7'],
            [128, '2'],
            [152, '5'],
          ].map(([x, n]) => (
            <Badge key={x as number} x={x as number} y={40} color={P.blue}>
              {n}
            </Badge>
          ))}
          <Label x={120} y={110} anchor="middle">
            hloubky zářezů = bitting (zde 3-7-2-5)
          </Label>
        </svg>
      );
    case 'keyway':
      return (
        <svg viewBox="0 0 240 130" className={className} role="img" aria-label="Profil klíčové dírky">
          <KeywayFace />
          <Label x={186} y={64}>profil</Label>
          <Leader x1={184} y1={61} x2={128} y2={62} />
        </svg>
      );
    case 'warding':
      return (
        <svg viewBox="0 0 240 130" className={className} role="img" aria-label="Warding">
          <KeywayFace wards />
          <Label x={186} y={64} color={P.red}>
            výstupky
          </Label>
          <Leader x1={184} y1={61} x2={128} y2={62} />
        </svg>
      );
    case 'tokbok':
      return (
        <svg viewBox="0 0 240 130" className={className} role="img" aria-label="TOK a BOK">
          <KeywayFace tok bok />
        </svg>
      );
    case 'sidebar':
      return (
        <svg viewBox="0 0 240 130" className={className} role="img" aria-label="Sidebar">
          <circle cx={120} cy={65} r={52} fill={P.housing} stroke={P.housingStroke} />
          <circle cx={120} cy={65} r={38} fill={P.plug} stroke={P.plugStroke} />
          <path d="M150 40v50" stroke="none" />
          <rect x={154} y={45} width={10} height={40} rx={2} fill={P.shear} />
          <rect x={164} y={50} width={6} height={30} fill="#000" opacity={0.15} />
          <path d="M114 30h12v70h-12z" fill={P.keyway} />
          <Label x={176} y={30}>boční lišta</Label>
          <Leader x1={182} y1={33} x2={162} y2={48} />
          <Label x={120} y={126} anchor="middle">
            lišta zapadne až při správné poloze všech prvků
          </Label>
        </svg>
      );
    case 'belts':
      return (
        <svg viewBox="0 0 240 130" className={className} role="img" aria-label="Pásy obtížnosti">
          {['#f1f5f9', '#facc15', '#f97316', '#22c55e', '#3b82f6', '#a855f7', '#92400e', '#dc2626', '#0a0a0a'].map((c, i) => (
            <rect key={c} x={14 + i * 24} y={40 + (8 - i) * 2} width={20} height={56 - (8 - i) * 2} rx={4} fill={c} stroke="#8E8E93" strokeWidth={0.6} />
          ))}
          <Label x={14} y={112}>bílý</Label>
          <Label x={226} y={112} anchor="end">
            černý
          </Label>
          <Label x={120} y={26} anchor="middle">
            od začátečnických po nejtěžší zámky světa
          </Label>
        </svg>
      );
  }
}

/** Labelled drawing of each lock mechanism. */
export function LockTypeDiagram({ mech, className = 'w-full' }: { mech: Mechanism; className?: string }) {
  const id = useId();
  if (mech === 'pin-tumbler') {
    return (
      <Cutaway title="Stavítkový zámek v řezu" className={className} pins={[{ keyLen: 22 }, { keyLen: 28 }, { keyLen: 20 }, { keyLen: 26 }]}>
        <Label x={232} y={56} anchor="end" color={P.shear}>
          střižná rovina
        </Label>
        <Label x={8} y={126}>klíčový kanál</Label>
        <Leader x1={70} y1={122} x2={80} y2={104} />
        <Label x={232} y={126} anchor="end">
          bubínek
        </Label>
        <Leader x1={196} y1={122} x2={190} y2={88} />
      </Cutaway>
    );
  }
  if (mech === 'wafer') {
    return (
      <svg viewBox="0 0 240 130" className={className} role="img" aria-label="Lamelový zámek, čelní řez">
        <rect x={60} y={6} width={120} height={118} rx={14} fill={P.housing} stroke={P.housingStroke} />
        <rect x={108} y={6} width={24} height={14} fill="#000" opacity={0.12} />
        <rect x={108} y={110} width={24} height={14} fill="#000" opacity={0.12} />
        <circle cx={120} cy={65} r={40} fill={P.plug} stroke={P.plugStroke} />
        <rect x={104} y={14} width={32} height={78} rx={3} fill={P.driver} stroke={P.driverStroke} />
        <rect x={112} y={52} width={16} height={26} rx={2} fill={P.keyway} />
        <path d={springPath(140, 30, 50, 4)} fill="none" stroke={P.spring} strokeWidth={1.2} />
        <Label x={186} y={20}>lamela</Label>
        <Leader x1={188} y1={17} x2={132} y2={18} />
        <Label x={186} y={70}>okénko</Label>
        <Leader x1={188} y1={67} x2={126} y2={66} />
        <Label x={4} y={46}>bubínek</Label>
        <Leader x1={40} y1={43} x2={84} y2={52} />
        <Label x={4} y={118}>drážka v těle</Label>
        <Leader x1={60} y1={115} x2={108} y2={116} />
      </svg>
    );
  }
  if (mech === 'disc-detainer') {
    return (
      <svg viewBox="0 0 240 130" className={className} role="img" aria-label="Diskový zámek">
        <circle cx={70} cy={65} r={52} fill={P.housing} stroke={P.housingStroke} />
        <circle cx={70} cy={65} r={40} fill={P.driver} stroke={P.driverStroke} />
        <path d="M70 65m-12 0a12 12 0 0 1 24 0z" fill={P.keyway} />
        <rect x={64} y={25} width={12} height={9} fill={P.housing} />
        <rect x={60} y={14} width={20} height={11} rx={2} fill={P.shear} />
        <Label x={4} y={12}>boční lišta</Label>
        <Leader x1={46} y1={10} x2={60} y2={18} />
        <Label x={4} y={124}>disk s výřezem</Label>
        <Leader x1={54} y1={120} x2={58} y2={100} />
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <g key={i}>
            <rect x={140 + i * 15} y={30} width={11} height={70} rx={2} fill={P.driver} stroke={P.driverStroke} strokeWidth={0.8} />
            <rect x={140 + i * 15} y={30 + [6, 14, 2, 10, 18, 4][i]} width={11} height={7} fill={P.housing} />
          </g>
        ))}
        <line x1={136} x2={234} y1={36} y2={36} stroke={P.shear} strokeDasharray="4 3" />
        <Label x={186} y={118} anchor="middle">
          výřezy v jedné řadě
        </Label>
      </svg>
    );
  }
  if (mech === 'dimple') {
    return (
      <svg viewBox="0 0 240 130" className={className} role="img" aria-label="Důlkový zámek">
        <rect x={14} y={8} width={212} height={112} rx={8} fill={P.housing} stroke={P.housingStroke} />
        <rect x={20} y={62} width={200} height={52} rx={5} fill={P.plug} stroke={P.plugStroke} />
        <rect x={20} y={88} width={200} height={14} fill={P.key} stroke={P.keyStroke} />
        {[52, 92, 132, 172].map((x, i) => (
          <g key={x}>
            <ellipse cx={x} cy={88} rx={7} ry={3 + i} fill={P.keyStroke} />
            <path d={springPath(x, 13, 34)} fill="none" stroke={P.spring} strokeWidth={1.2} />
            <rect x={x - 6} y={34} width={12} height={24 + [0, 4, -2, 6][i]} rx={2} fill={P.driver} stroke={P.driverStroke} strokeWidth={0.8} />
            <path d={`M${x - 6} ${60 + [0, 4, -2, 6][i]}h12v${26 - [0, 4, -2, 6][i] - 6}l-6 6-6-6z`} fill={P.key} stroke={P.keyStroke} strokeWidth={0.8} />
          </g>
        ))}
        <line x1={10} x2={230} y1={62} y2={62} stroke={P.shear} strokeDasharray="5 3" />
        <Label x={120} y={126} anchor="middle">
          klíč leží naplocho, stavítka míří do důlků
        </Label>
      </svg>
    );
  }
  if (mech === 'lever') {
    return (
      <svg viewBox="0 0 240 130" className={className} role="img" aria-label="Dozický zámek">
        <rect x={10} y={10} width={220} height={110} rx={8} fill={P.housing} stroke={P.housingStroke} />
        {[0, 1, 2].map((i) => (
          <g key={i} transform={`translate(${i * 5} ${i * -4})`}>
            <path d="M24 40H140V78H24z" fill={P.driver} stroke={P.driverStroke} strokeWidth={0.8} />
            <rect x={92} y={48} width={30} height={12} rx={2} fill={P.housing} />
          </g>
        ))}
        <rect x={94} y={52} width={10} height={6} rx={1} fill={P.shear} />
        <rect x={40} y={88} width={110} height={14} rx={3} fill={P.key} stroke={P.keyStroke} />
        <circle cx={44} cy={95} r={8} fill={P.keyway} />
        <Label x={164} y={30}>páky</Label>
        <Leader x1={162} y1={27} x2={140} y2={36} />
        <Label x={164} y={58}>čep závory</Label>
        <Leader x1={162} y1={55} x2={104} y2={55} />
        <Label x={164} y={98}>závora</Label>
        <Leader x1={162} y1={95} x2={150} y2={95} />
        <Label x={120} y={116} anchor="middle">
          každá páka musí mít okénko přesně u čepu
        </Label>
      </svg>
    );
  }
  if (mech === 'tubular') {
    return (
      <svg viewBox="0 0 240 130" className={className} role="img" aria-label="Trubkový zámek">
        <circle cx={90} cy={65} r={54} fill={P.housing} stroke={P.housingStroke} />
        <circle cx={90} cy={65} r={38} fill={P.plug} stroke={P.plugStroke} />
        <circle cx={90} cy={65} r={14} fill={P.housing} stroke={P.housingStroke} />
        {Array.from({ length: 7 }, (_, i) => {
          const a = (i / 7) * Math.PI * 2 - Math.PI / 2;
          return <circle key={i} cx={90 + Math.cos(a) * 26} cy={65 + Math.sin(a) * 26} r={5.5} fill={i === 0 ? P.shear : P.key} stroke={P.keyStroke} strokeWidth={0.8} />;
        })}
        <Label x={160} y={30}>7 stavítek v kruhu</Label>
        <Leader x1={158} y1={27} x2={95} y2={38} />
        <Label x={160} y={70}>středový čep</Label>
        <Leader x1={158} y1={67} x2={104} y2={65} />
        <Label x={160} y={110}>trubkový klíč</Label>
        <Leader x1={158} y1={107} x2={124} y2={90} />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 240 130" className={className} role="img" aria-label="Zámek" id={id}>
      <rect x={14} y={8} width={212} height={112} rx={8} fill={P.housing} stroke={P.housingStroke} />
    </svg>
  );
}

/** Profile of a single driver pin (security pins page). */
export function PinProfile({ kind, className = 'h-28 w-12' }: { kind: PinType; className?: string }) {
  const gid = useId().replace(/:/g, '');
  return (
    <svg viewBox="0 0 40 100" className={className} role="img" aria-label={`Profil stavítka ${kind}`}>
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#8A909C" />
          <stop offset="0.35" stopColor="#E9ECF2" />
          <stop offset="0.65" stopColor="#B9BFCB" />
          <stop offset="1" stopColor="#7A808C" />
        </linearGradient>
      </defs>
      <path d={driverShape(kind === 'unknown' ? 'standard' : kind, 8, 6, 24, 88)} fill={`url(#${gid})`} stroke={P.driverStroke} strokeWidth={1} />
    </svg>
  );
}
