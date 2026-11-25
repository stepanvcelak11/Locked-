/**
 * Animated, step-by-step explainers for every lock mechanism: what the lock looks
 * like, why it will not turn without a key, where the tools go and how they move.
 * Every scene is a pure function of a looping clock t ∈ [0, 1).
 */
import { useEffect, useRef, useState, type ReactNode } from 'react';
import type { Mechanism } from '../../types';
import { Label, Leader, P, driverShape, springPath } from './Diagrams';

/* ───────────────────────── shared bits ───────────────────────── */

export const WRENCH = '#21A44A';
export const PICK = '#0A6CFF';

const cl = (x: number) => Math.max(0, Math.min(1, x));
const seg = (t: number, a: number, b: number) => cl((t - a) / (b - a));
const ease = (x: number) => x * x * (3 - 2 * x);
const sg = (t: number, a: number, b: number) => ease(seg(t, a, b));
const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
const pulse = (t: number, a: number, b: number) => Math.sin(Math.PI * seg(t, a, b));

function Svg({ label, children }: { label: string; children: ReactNode }) {
  return (
    <svg viewBox="0 0 240 140" className="w-full" role="img" aria-label={label}>
      {children}
    </svg>
  );
}

/** Arc arrow around (cx,cy), angles in degrees (0 = right, clockwise). */
function ArcArrow({ cx, cy, r, a0, a1, color, w = 2.2, opacity = 1 }: { cx: number; cy: number; r: number; a0: number; a1: number; color: string; w?: number; opacity?: number }) {
  const rad = (a: number) => (a * Math.PI) / 180;
  const p = (a: number) => [cx + r * Math.cos(rad(a)), cy + r * Math.sin(rad(a))];
  const [x0, y0] = p(a0);
  const [x1, y1] = p(a1);
  const cw = a1 > a0;
  const large = Math.abs(a1 - a0) > 180 ? 1 : 0;
  // tangent direction at the end
  const ta = rad(a1) + (cw ? Math.PI / 2 : -Math.PI / 2);
  const hx = Math.cos(ta);
  const hy = Math.sin(ta);
  const s = 5.5;
  const head = `M${x1 + hx * s} ${y1 + hy * s}L${x1 - hy * s * 0.6} ${y1 + hx * s * 0.6}L${x1 + hy * s * 0.6} ${y1 - hx * s * 0.6}z`;
  return (
    <g opacity={opacity}>
      <path d={`M${x0} ${y0}A${r} ${r} 0 ${large} ${cw ? 1 : 0} ${x1} ${y1}`} fill="none" stroke={color} strokeWidth={w} strokeLinecap="round" />
      <path d={head} fill={color} />
    </g>
  );
}

function LineArrow({ x1, y1, x2, y2, color, w = 2.2, opacity = 1 }: { x1: number; y1: number; x2: number; y2: number; color: string; w?: number; opacity?: number }) {
  const a = Math.atan2(y2 - y1, x2 - x1);
  const s = 5.5;
  const hx = Math.cos(a);
  const hy = Math.sin(a);
  return (
    <g opacity={opacity}>
      <line x1={x1} y1={y1} x2={x2 - hx * 3} y2={y2 - hy * 3} stroke={color} strokeWidth={w} strokeLinecap="round" />
      <path d={`M${x2 + hx * 2} ${y2 + hy * 2}L${x2 - hx * s - hy * s * 0.6} ${y2 - hy * s + hx * s * 0.6}L${x2 - hx * s + hy * s * 0.6} ${y2 - hy * s - hx * s * 0.6}z`} fill={color} />
    </g>
  );
}

/** Pill caption inside a figure. */
function Badge({ x, y, text, color, anchor = 'middle', opacity = 1 }: { x: number; y: number; text: string; color: string; anchor?: 'start' | 'middle' | 'end'; opacity?: number }) {
  const w = text.length * 5.3 + 12;
  const left = anchor === 'middle' ? x - w / 2 : anchor === 'end' ? x - w : x;
  return (
    <g opacity={opacity}>
      <rect x={left} y={y - 10} width={w} height={14} rx={7} fill={color} />
      <text x={left + w / 2} y={y} fontSize={9} fontWeight={700} fill="#fff" textAnchor="middle" fontFamily="-apple-system, 'Inter Variable', sans-serif">
        {text}
      </text>
    </g>
  );
}

/** Tension wrench seen from the front: short tip in the keyway, long arm sticking out. */
function FrontWrench({ tip, end, w = 6 }: { tip: [number, number]; end: [number, number]; w?: number }) {
  return (
    <g>
      <line x1={tip[0]} y1={tip[1]} x2={end[0]} y2={end[1]} stroke={WRENCH} strokeWidth={w} strokeLinecap="round" />
      <circle cx={tip[0]} cy={tip[1]} r={w * 0.62} fill={WRENCH} stroke="#fff" strokeWidth={1.2} />
    </g>
  );
}

/** Pick seen from the front: tip in the keyway, handle going away. */
function FrontPick({ tip, end }: { tip: [number, number]; end: [number, number] }) {
  const mx = lerp(tip[0], end[0], 0.45);
  const my = lerp(tip[1], end[1], 0.45);
  return (
    <g>
      <line x1={tip[0]} y1={tip[1]} x2={mx} y2={my} stroke={PICK} strokeWidth={3.2} strokeLinecap="round" />
      <line x1={mx} y1={my} x2={end[0]} y2={end[1]} stroke={PICK} strokeWidth={8} strokeLinecap="round" />
      <circle cx={tip[0]} cy={tip[1]} r={2.6} fill={PICK} stroke="#fff" strokeWidth={1} />
    </g>
  );
}

/* ───────────────────────── side cutaway of a pin stack ───────────────────────── */

const SH = 62;
const KW = 96;
const XS = [52, 102, 152, 202];
const KEYLEN = [22, 28, 20, 26];
const TARGET = KEYLEN.map((k) => 34 - k); // lift that puts the gap on the shear line

interface Stack {
  lift: number;
  /** y of the driver's bottom; defaults to sitting on the key pin */
  drv?: number;
  glow?: string;
  cone?: boolean;
}

function PinSide({ stacks, shift = 0, shear = P.shear, children, blockFlash = 0 }: { stacks: Stack[]; shift?: number; shear?: string; children?: ReactNode; blockFlash?: number }) {
  return (
    <g>
      <rect x={14} y={8} width={212} height={112} rx={8} fill={P.housing} stroke={P.housingStroke} />
      <g transform={`translate(${shift} 0)`}>
        <rect x={20} y={SH} width={200} height={52} rx={5} fill={P.plug} stroke={P.plugStroke} />
        <rect x={20} y={KW} width={200} height={12} fill={P.keyway} opacity={0.85} />
      </g>
      {stacks.map((s, i) => {
        const x = XS[i];
        const keyTop = KW - s.lift - KEYLEN[i];
        const drvBottom = s.drv ?? keyTop;
        const drvTop = drvBottom - 22;
        const crosses = drvBottom > SH + 1;
        return (
          <g key={i}>
            <rect x={x - 9} y={12} width={18} height={KW - 12} fill="#000" opacity={0.07} />
            <path d={springPath(x, 13, drvTop)} fill="none" stroke={P.spring} strokeWidth={1.2} />
            <path d={driverShape('standard', x - 8, drvTop, 16, 22)} fill={P.driver} stroke={s.glow ?? P.driverStroke} strokeWidth={s.glow ? 2.2 : 0.8} />
            <g transform={`translate(${shift} 0)`}>
              {s.cone ? (
                <path d={`M${x - 8} ${keyTop + 1.5}q0-1.5 1.5-1.5h13q1.5 0 1.5 1.5V${KW - 9 - s.lift}L${x} ${KW - s.lift}L${x - 8} ${KW - 9 - s.lift}z`} fill={P.key} stroke={P.keyStroke} strokeWidth={0.8} />
              ) : (
                <path d={`M${x - 8} ${keyTop + 1.5}q0-1.5 1.5-1.5h13q1.5 0 1.5 1.5V${KW - 6 - s.lift}L${x} ${KW - s.lift}L${x - 8} ${KW - 6 - s.lift}z`} fill={P.key} stroke={P.keyStroke} strokeWidth={0.8} />
              )}
            </g>
            {crosses && blockFlash > 0 && <rect x={x - 10} y={SH - 3} width={20} height={6} rx={2} fill={P.red} opacity={blockFlash} />}
          </g>
        );
      })}
      <line x1={10} x2={230} y1={SH} y2={SH} stroke={shear} strokeWidth={1.4} strokeDasharray="5 3" />
      {children}
    </g>
  );
}

/** Height a key lifts a pin at distance d behind the key's tip. */
function keyLift(d: number, dimple: boolean) {
  if (d < 0) return 0;
  const cuts = XS.map((x) => 214 - x);
  let best = 99;
  cuts.forEach((c, j) => {
    const dd = Math.abs(d - c);
    const v = dimple ? (dd < 8 ? TARGET[j] + (16 - TARGET[j]) * (dd / 8) ** 2 : 16) : Math.min(16, TARGET[j] + dd * 0.32);
    best = Math.min(best, v);
  });
  return Math.min(best, d * 0.9);
}

function KeyBlade({ tip, dimple }: { tip: number; dimple: boolean }) {
  const pts: string[] = [];
  for (let d = 0; d <= 240; d += 2) pts.push(`${tip - d},${KW - keyLift(d, dimple)}`);
  return <polygon points={`${tip},${KW + 12} ${pts.join(' ')} ${tip - 240},${KW + 12}`} fill={P.key} stroke={P.keyStroke} strokeWidth={0.9} />;
}

/** Without key it jams; the right key lines every gap up on the shear line. */
function PinInside({ t, dimple = false }: { t: number; dimple?: boolean }) {
  const tip = t < 0.88 ? lerp(-12, 214, sg(t, 0.26, 0.6)) : lerp(214, -12, sg(t, 0.88, 0.98));
  const stacks = XS.map((x) => ({ lift: keyLift(tip - x, dimple), cone: dimple }));
  const aligned = t > 0.6 && t < 0.88;
  const open = sg(t, 0.64, 0.74) * (1 - sg(t, 0.84, 0.9));
  const jiggle = t < 0.22 ? Math.sin(t * 90) * 1.6 * pulse(t, 0.02, 0.22) : 0;
  return (
    <Svg label="Uvnitř zámku: bez klíče a se správným klíčem">
      <PinSide stacks={stacks} shift={jiggle + open * 9} shear={aligned ? P.green : P.shear} blockFlash={t < 0.24 ? 0.4 + 0.5 * Math.abs(Math.sin(t * 40)) : 0}>
        <g transform={`translate(${open * 9} 0)`}>
          <KeyBlade tip={tip} dimple={dimple} />
        </g>
      </PinSide>
      {t < 0.24 && <Badge x={120} y={24} text="bez klíče: horní stavítka blokují" color={P.red} />}
      {t >= 0.26 && t < 0.62 && <Badge x={120} y={24} text={dimple ? 'klíč s důlky zvedá stavítka' : 'zuby klíče zvedají stavítka'} color={P.keyStroke} />}
      {aligned && <Badge x={120} y={24} text="mezery na rovině → bubínek se otočí" color="#1f9d47" opacity={sg(t, 0.6, 0.64)} />}
      {aligned && <LineArrow x1={170} y1={132} x2={208} y2={132} color="#1f9d47" opacity={open} />}
    </Svg>
  );
}

/** Single-pin picking with a hook (or a dimple flag pick). */
const ORDER = [1, 3, 0, 2];
function PinPicking({ t, flag = false }: { t: number; flag?: boolean }) {
  const stepLen = 0.17;
  const st = (k: number) => 0.06 + k * stepLen;
  let px = -4;
  let tipLift = 0;
  let activeIdx = -1;
  const stacks: Stack[] = XS.map(() => ({ lift: 0, cone: flag }));
  let setCount = 0;
  ORDER.forEach((i, k) => {
    const s = st(k);
    const prevX = k === 0 ? -4 : XS[ORDER[k - 1]];
    if (t >= s) px = lerp(prevX, XS[i], sg(t, s, s + 0.05));
    const lift = TARGET[i] * sg(t, s + 0.05, s + 0.12);
    if (t >= s && t < s + 0.14) {
      activeIdx = i;
      tipLift = t < s + 0.12 ? lift : TARGET[i] * (1 - sg(t, s + 0.12, s + 0.14));
    }
    if (t >= s + 0.12) {
      setCount++;
      stacks[i] = { lift: t < s + 0.14 ? tipLift : 0, drv: SH, glow: P.green, cone: flag };
    } else if (t >= s) {
      stacks[i] = { lift, glow: P.shear, cone: flag };
    }
  });
  if (t > 0.76) px = lerp(XS[ORDER[3]], -4, sg(t, 0.8, 0.9));
  const open = sg(t, 0.76, 0.82);
  const shift = Math.min(setCount, 4) * 0.8 + open * 7;
  const tipY = KW - tipLift;
  const hook = flag
    ? `M-20 104H${px - 6}L${px - 3} ${tipY + 3}`
    : `M-20 105H${px - 9}Q${px - 2} 105 ${px - 1.5} ${tipY + 5}L${px} ${tipY}`;
  const cur = activeIdx >= 0 ? ORDER.indexOf(activeIdx) : -1;
  return (
    <Svg label="Otevírání planžetou, stavítko po stavítku">
      <PinSide stacks={stacks} shift={shift} shear={setCount === 4 ? P.green : P.shear}>
        {/* wrench in the bottom of the keyway */}
        <path d="M-6 116H26V104" fill="none" stroke={WRENCH} strokeWidth={4.5} strokeLinejoin="round" strokeLinecap="round" />
        <path d={hook} fill="none" stroke={PICK} strokeWidth={3.4} strokeLinecap="round" strokeLinejoin="round" />
        {flag && <rect x={px - 4} y={tipY - 1} width={8} height={4} rx={1} fill={PICK} />}
      </PinSide>
      <ArcArrow cx={36} cy={108} r={16} a0={200} a1={250} color={WRENCH} />
      {cur >= 0 && t < 0.76 && (
        <Badge
          x={120}
          y={24}
          text={t < st(cur) + 0.05 ? 'najdi tuhé stavítko' : t < st(cur) + 0.12 ? 'zvedej, dokud necvakne' : `cvak! nastaveno ${cur + 1}/4`}
          color={t < st(cur) + 0.12 ? '#c46a00' : '#1f9d47'}
        />
      )}
      {open > 0 && <Badge x={120} y={24} text="všechna nastavena → otevřeno" color="#1f9d47" opacity={open} />}
    </Svg>
  );
}

/* ───────────────────────── pin tumbler ───────────────────────── */

function Padlock({ t }: { t: number }) {
  const keyIn = sg(t, 0.12, 0.3);
  const turn = 90 * sg(t, 0.36, 0.52) * (1 - sg(t, 0.86, 0.96));
  const shackle = -12 * sg(t, 0.55, 0.62) * (1 - sg(t, 0.82, 0.88));
  return (
    <Svg label="Visací zámek zepředu">
      <path d={`M92 66V44a28 28 0 0 1 56 0v22`} transform={`translate(0 ${shackle})`} fill="none" stroke="#9aa0aa" strokeWidth={10} strokeLinecap="round" />
      <rect x={70} y={58} width={100} height={76} rx={12} fill="#E8B64C" stroke="#B7791F" />
      <rect x={76} y={64} width={88} height={6} rx={3} fill="#fff" opacity={0.3} />
      <g transform={`rotate(${turn} 120 102)`}>
        <circle cx={120} cy={102} r={17} fill="#d9dce3" stroke="#8E8E93" />
        <path d="M117.5 89h5l-1.6 5 2.6 4-2.6 4 1.6 4v7h-5v-5l1.8-4-2.6-4 2.6-4z" fill={P.keyway} />
        {keyIn > 0.98 && <rect x={115} y={84} width={10} height={36} rx={3} fill={P.key} stroke={P.keyStroke} opacity={0.95} />}
      </g>
      {/* side view of the key coming in */}
      <g opacity={1 - keyIn} transform={`translate(${lerp(0, -26, keyIn)} 0)`}>
        <rect x={186} y={92} width={44} height={20} rx={10} fill={P.key} stroke={P.keyStroke} />
        <circle cx={220} cy={102} r={4} fill="var(--color-well)" />
        <path d="M186 98h-44l-4 4 4 4 4-3 4 3 4-3 4 3 4-3 4 3h20z" fill={P.key} stroke={P.keyStroke} />
      </g>
      <Label x={6} y={86}>
        bubínek
      </Label>
      <Leader x1={40} y1={83} x2={104} y2={98} />
      <Label x={6} y={122}>
        otvor pro klíč
      </Label>
      <Leader x1={64} y1={119} x2={117} y2={112} />
      {turn > 80 && <Badge x={120} y={16} text="klíč otočí bubínkem → zámek se otevře" color="#1f9d47" />}
    </Svg>
  );
}

/** Generic front view of a cylinder with tools placed in it. */
function FrontTools({
  t,
  keyway,
  wrenchTip,
  wrenchEnd,
  pickTip,
  pickEnd,
  rock = false,
  wrenchLabel,
  pickLabel,
}: {
  t: number;
  keyway: ReactNode;
  wrenchTip: [number, number];
  wrenchEnd: [number, number];
  pickTip: [number, number];
  pickEnd: [number, number];
  rock?: boolean;
  wrenchLabel: string;
  pickLabel: string;
}) {
  const press = 4 * Math.sin(t * Math.PI * 2) ** 2;
  const wob = rock ? Math.sin(t * Math.PI * 8) * 7 : Math.sin(t * Math.PI * 4) * 3;
  return (
    <Svg label="Kam dát napínák a planžetu">
      <circle cx={120} cy={70} r={56} fill={P.housing} stroke={P.housingStroke} />
      <g transform={`rotate(${press} 120 70)`}>
        <circle cx={120} cy={70} r={40} fill={P.plug} stroke={P.plugStroke} />
        {keyway}
        <FrontWrench tip={wrenchTip} end={[wrenchEnd[0], wrenchEnd[1] + press * 0.8]} />
      </g>
      <FrontPick tip={[pickTip[0], pickTip[1] + wob * 0.35]} end={[pickEnd[0], pickEnd[1] + wob]} />
      <ArcArrow cx={120} cy={70} r={48} a0={-60} a1={-20} color={WRENCH} w={2.6} />
      <Badge x={232} y={22} text={wrenchLabel} color={WRENCH} anchor="end" />
      <Badge x={8} y={136} text={pickLabel} color={PICK} anchor="start" />
    </Svg>
  );
}

const PIN_KEYWAY = <path d="M116 38h8l-2.5 8 4 7-4 7 4 7-4 7 2.5 7v22h-8v-14l3-7-4-7 4-7-4-7 4-7z" fill={P.keyway} />;

/* ───────────────────────── wafer ───────────────────────── */

function Mailbox({ t }: { t: number }) {
  const keyIn = sg(t, 0.12, 0.3);
  const turn = 90 * sg(t, 0.36, 0.5) * (1 - sg(t, 0.86, 0.96));
  const door = sg(t, 0.52, 0.62) * (1 - sg(t, 0.8, 0.88));
  return (
    <Svg label="Poštovní schránka s lamelovým zámkem">
      <rect x={40} y={14} width={124} height={120} rx={8} fill="#6E8FB5" stroke="#4c6a8c" />
      <g transform={`translate(${-door * 10} 0) skewY(${door * -6})`} style={{ transformOrigin: '46px 70px' }}>
        <rect x={46} y={20} width={112} height={108} rx={5} fill="#86A6CB" stroke="#4c6a8c" />
        <rect x={64} y={34} width={76} height={8} rx={4} fill="#3d5470" />
        <g transform={`rotate(${turn} 132 94)`}>
          <circle cx={132} cy={94} r={11} fill="#d9dce3" stroke="#8E8E93" />
          <rect x={130} y={86} width={4} height={16} rx={1} fill={P.keyway} />
          <rect x={128} y={86} width={2} height={4} fill={P.keyway} />
          {keyIn > 0.98 && <rect x={127} y={80} width={10} height={28} rx={3} fill={P.key} stroke={P.keyStroke} />}
        </g>
      </g>
      <g opacity={1 - keyIn} transform={`translate(${lerp(0, -22, keyIn)} 0)`}>
        <rect x={190} y={86} width={34} height={16} rx={8} fill={P.key} stroke={P.keyStroke} />
        <path d="M190 90h-26l-3 4 3 4 3-2 3 2 3-2 3 2h14z" fill={P.key} stroke={P.keyStroke} />
      </g>
      <Label x={174} y={128}>
        malý zámek
      </Label>
      <Leader x1={176} y1={124} x2={142} y2={100} />
      {door > 0.5 && <Badge x={102} y={10} text="otevřeno" color="#1f9d47" />}
    </Svg>
  );
}

/** Front cross-section: the wafer sticks out of the plug until the key centres it. */
function WaferInside({ t }: { t: number }) {
  const keyIn = sg(t, 0.28, 0.4) * (1 - sg(t, 0.9, 0.98));
  const raise = 14 * (1 - keyIn);
  const jiggle = t < 0.24 ? Math.sin(t * 90) * 3 * pulse(t, 0.02, 0.22) : 0;
  const turn = 70 * sg(t, 0.48, 0.62) * (1 - sg(t, 0.82, 0.9));
  return (
    <Svg label="Lamela v řezu">
      <rect x={56} y={4} width={128} height={132} rx={14} fill={P.housing} stroke={P.housingStroke} />
      <rect x={103} y={4} width={34} height={22} fill="#000" opacity={0.13} />
      <g transform={`rotate(${turn + jiggle} 120 70)`}>
        <circle cx={120} cy={70} r={40} fill={P.plug} stroke={P.plugStroke} />
        <g transform={`translate(0 ${-raise})`}>
          <rect x={104} y={37} width={32} height={66} rx={3} fill={P.driver} stroke={raise > 2 && t < 0.24 ? P.red : P.driverStroke} strokeWidth={raise > 2 && t < 0.24 ? 2 : 0.8} />
          <rect x={112} y={60} width={16} height={24} rx={2} fill={P.keyway} />
        </g>
        <path d={springPath(144, 40 - raise, 62 - raise, 3)} fill="none" stroke={P.spring} strokeWidth={1.1} />
        {keyIn > 0 && <rect x={113} y={61} width={14} height={22} rx={3} fill={P.key} stroke={P.keyStroke} opacity={keyIn} />}
      </g>
      {t < 0.26 && <Badge x={120} y={132} text="lamela trčí ven → nejde otočit" color={P.red} />}
      {t >= 0.28 && t < 0.48 && <Badge x={120} y={132} text="klíč stáhne lamelu do středu" color={P.keyStroke} />}
      {turn > 30 && <Badge x={120} y={132} text="nic netrčí → bubínek se otočí" color="#1f9d47" />}
      <Label x={190} y={20}>
        lamela
      </Label>
      <Leader x1={190} y1={17} x2={134} y2={30} />
      <Label x={4} y={60}>
        bubínek
      </Label>
      <Leader x1={40} y1={57} x2={84} y2={64} />
    </Svg>
  );
}

/** Side view: a rake rocks in and out until every wafer sits inside the plug. */
function WaferRaking({ t }: { t: number }) {
  const xs = [56, 88, 120, 152, 184];
  const dir = [-1, 1, -1, 1, -1];
  const setAt = [0.18, 0.3, 0.42, 0.52, 0.62];
  const rakeX = Math.sin(t * Math.PI * 14) * 14 * (t < 0.7 ? 1 : 0) + (t < 0.7 ? 0 : -60 * sg(t, 0.72, 0.8));
  const open = sg(t, 0.66, 0.74) * (1 - sg(t, 0.9, 0.97));
  return (
    <Svg label="Raking lamelového zámku">
      <rect x={14} y={8} width={212} height={124} rx={8} fill={P.housing} stroke={P.housingStroke} />
      <rect x={20} y={32} width={200} height={76} rx={5} fill={open > 0.5 ? '#d6f5df' : P.plug} stroke={P.plugStroke} />
      <rect x={20} y={62} width={200} height={16} fill={P.keyway} opacity={0.85} />
      {xs.map((x, i) => {
        const set = t >= setAt[i] && t < 0.92;
        const bump = set ? 0 : 3 * Math.abs(Math.sin(t * Math.PI * 14 + i));
        const off = set ? 0 : dir[i] * (12 - bump);
        return (
          <g key={x} transform={`translate(0 ${off})`}>
            <rect x={x - 5} y={38} width={10} height={64} rx={2} fill={P.driver} stroke={set ? P.green : P.driverStroke} strokeWidth={set ? 1.8 : 0.8} />
            <rect x={x - 3} y={60} width={6} height={20} fill={P.keyway} />
          </g>
        );
      })}
      <line x1={10} x2={230} y1={32} y2={32} stroke={P.shear} strokeDasharray="5 3" />
      <line x1={10} x2={230} y1={108} y2={108} stroke={P.shear} strokeDasharray="5 3" />
      <g transform={`translate(${rakeX} 0)`}>
        <path d="M-30 74H40l8-6 8 6 8-6 8 6 8-6 8 6 8-6 8 6 8-6 8 6 8-6 8 6 8-6 8 6" fill="none" stroke={PICK} strokeWidth={3} strokeLinejoin="round" strokeLinecap="round" />
      </g>
      <path d="M-6 128H26V100" fill="none" stroke={WRENCH} strokeWidth={4.5} strokeLinejoin="round" />
      {t < 0.66 && <Badge x={120} y={22} text="hrábě rychle tam a zpět, napínák jen lehce" color={PICK} />}
      {open > 0 && <Badge x={120} y={22} text="všechny lamely uvnitř → otevřeno" color="#1f9d47" opacity={open} />}
    </Svg>
  );
}

const WAFER_KEYWAY = (
  <g>
    <rect x={115} y={40} width={10} height={60} rx={2} fill={P.keyway} />
    <rect x={112} y={52} width={4} height={14} fill={P.keyway} />
  </g>
);

/* ───────────────────────── disc detainer ───────────────────────── */

function DiscPadlock({ t }: { t: number }) {
  const keyIn = sg(t, 0.12, 0.3);
  const turn = 90 * sg(t, 0.36, 0.52) * (1 - sg(t, 0.86, 0.96));
  return (
    <Svg label="Diskový visací zámek">
      <path d="M96 40a24 24 0 0 1 48 0" fill="none" stroke="#9aa0aa" strokeWidth={9} />
      <circle cx={120} cy={78} r={52} fill="#C9CED8" stroke="#8E8E93" />
      <circle cx={120} cy={78} r={44} fill="#dfe3ea" />
      <rect x={88} y={24} width={64} height={18} rx={9} fill="#C9CED8" />
      <g transform={`rotate(${turn} 120 86)`}>
        <circle cx={120} cy={86} r={14} fill="#b9bfcb" stroke="#8E8E93" />
        <path d="M110 86a10 10 0 0 1 20 0z" fill={P.keyway} />
        {keyIn > 0.98 && <path d="M111 86a9 9 0 0 1 18 0z" fill={P.key} stroke={P.keyStroke} />}
      </g>
      <g opacity={1 - keyIn} transform={`translate(${lerp(0, -26, keyIn)} 0)`}>
        <rect x={194} y={92} width={36} height={18} rx={9} fill={P.key} stroke={P.keyStroke} />
        <path d="M194 96h-40l-3 5h43z" fill={P.key} stroke={P.keyStroke} />
        <path d="M160 96l4 5M170 96l3 5M180 96l5 5" stroke={P.keyStroke} />
      </g>
      <Label x={4} y={128}>
        půlkulatý otvor
      </Label>
      <Leader x1={66} y1={125} x2={112} y2={88} />
      {turn > 80 && <Badge x={120} y={14} text="klíč natočí disky → otevře" color="#1f9d47" />}
    </Svg>
  );
}

const DISC_START = [55, -40, 80, -70, 30];

/** One disc from the front + the whole stack from the side. */
function DiscInside({ t, tool = false }: { t: number; tool?: boolean }) {
  // with the tool, discs are turned one after another; with the key all at once
  const k = (i: number) => (tool ? sg(t, 0.08 + i * 0.12, 0.16 + i * 0.12) : sg(t, 0.12, 0.5));
  const back = 1 - sg(t, 0.9, 0.98);
  const ang = DISC_START.map((a, i) => a * (1 - k(i) * back) + 0);
  const aligned = ang.every((a) => Math.abs(a) < 2);
  const drop = aligned ? sg(t, tool ? 0.7 : 0.55, tool ? 0.76 : 0.62) * back : 0;
  const coreTurn = aligned ? 40 * sg(t, tool ? 0.78 : 0.64, tool ? 0.86 : 0.74) * back : 0;
  const active = tool ? Math.min(4, Math.floor((t - 0.08) / 0.12)) : -1;
  return (
    <Svg label={tool ? 'Otevírání disků speciálním nástrojem' : 'Disky uvnitř zámku'}>
      {/* front view of the first disc */}
      <circle cx={62} cy={72} r={50} fill={P.housing} stroke={P.housingStroke} />
      <g transform={`rotate(${coreTurn} 62 72)`}>
        <rect x={55} y={14 + drop * 7} width={14} height={14} rx={2} fill={P.shear} />
      </g>
      <g transform={`rotate(${ang[0] + coreTurn} 62 72)`}>
        <circle cx={62} cy={72} r={42} fill={P.driver} stroke={P.driverStroke} />
        <rect x={56} y={29} width={12} height={9} fill={P.housing} />
        <path d="M50 72a12 12 0 0 1 24 0z" fill={P.keyway} />
      </g>
      <Label x={4} y={12}>
        lišta
      </Label>
      <Leader x1={26} y1={10} x2={55} y2={18} />
      {/* side view of the stack */}
      {DISC_START.map((_, i) => {
        const x = 134 + i * 19;
        const ny = 32 + Math.abs(ang[i]) * 0.75;
        return (
          <g key={i}>
            <rect x={x} y={30} width={13} height={88} rx={3} fill={P.driver} stroke={i === active ? PICK : P.driverStroke} strokeWidth={i === active ? 2 : 0.8} />
            <rect x={x} y={ny} width={13} height={8} fill={P.housing} />
          </g>
        );
      })}
      <rect x={130} y={20 + drop * 9} width={100} height={10} rx={2} fill={P.shear} />
      <line x1={128} x2={234} y1={34} y2={34} stroke={aligned ? P.green : P.shear} strokeDasharray="4 3" />
      {tool && (
        <g>
          <line x1={124} y1={74} x2={230} y2={74} stroke="#6b7280" strokeWidth={4} />
          <rect x={210} y={66} width={8} height={16} rx={2} fill={WRENCH} />
          {active >= 0 && active < 4 && <rect x={134 + active * 19 + 2} y={64} width={9} height={8} rx={2} fill={PICK} />}
        </g>
      )}
      {!aligned && !tool && <Badge x={120} y={134} text="klíč natočí každý disk jinak" color={P.keyStroke} />}
      {!aligned && tool && <Badge x={120} y={134} text="otáčej disky jeden po druhém" color={PICK} />}
      {aligned && <Badge x={120} y={134} text="výřezy v řadě → lišta zapadne" color="#1f9d47" />}
    </Svg>
  );
}

function DiscTool({ t }: { t: number }) {
  const turn = Math.sin(t * Math.PI * 2) * 25;
  return (
    <Svg label="Nástroj na diskové zámky">
      <rect x={8} y={58} width={70} height={24} rx={12} fill="#4b5563" />
      <circle cx={70} cy={70} r={22} fill="#e5e7eb" stroke="#9ca3af" />
      {Array.from({ length: 12 }, (_, i) => {
        const a = (i / 12) * Math.PI * 2;
        return <line key={i} x1={70 + Math.cos(a) * 17} y1={70 + Math.sin(a) * 17} x2={70 + Math.cos(a) * 21} y2={70 + Math.sin(a) * 21} stroke="#6b7280" />;
      })}
      <line x1={70} y1={70} x2={70 + Math.cos(((turn - 90) * Math.PI) / 180) * 15} y2={70 + Math.sin(((turn - 90) * Math.PI) / 180) * 15} stroke={P.red} strokeWidth={2} />
      <rect x={92} y={66} width={120} height={8} rx={2} fill="#9ca3af" />
      <rect x={210} y={62} width={10} height={16} rx={2} fill={WRENCH} />
      <g transform={`rotate(${turn} 150 70)`}>
        <rect x={146} y={58} width={8} height={10} rx={2} fill={PICK} />
      </g>
      <Badge x={215} y={100} text="zadní konec = napínák" color={WRENCH} anchor="end" />
      <Badge x={150} y={44} text="hrot otáčí jeden disk" color={PICK} />
      <Badge x={70} y={112} text="ručička ukazuje natočení" color={P.red} />
    </Svg>
  );
}

/* ───────────────────────── dimple ───────────────────────── */

function EuroCylinder({ t }: { t: number }) {
  const keyIn = sg(t, 0.12, 0.3);
  const turn = 90 * sg(t, 0.36, 0.52) * (1 - sg(t, 0.86, 0.96));
  return (
    <Svg label="Dveřní vložka s důlkovým klíčem">
      <rect x={60} y={6} width={92} height={128} rx={10} fill="#e6e8ed" stroke="#b3b8c2" />
      <path d="M86 46a20 20 0 1 1 40 0v38l-8 30h-24l-8-30z" fill="#C9CED8" stroke="#8E8E93" />
      <g transform={`rotate(${turn} 106 46)`}>
        <circle cx={106} cy={46} r={16} fill="#d9dce3" stroke="#8E8E93" />
        <rect x={92} y={43} width={28} height={6} rx={1.5} fill={P.keyway} />
        {keyIn > 0.98 && <rect x={90} y={41} width={32} height={10} rx={3} fill="#cfd4dc" stroke="#8E8E93" />}
      </g>
      <g opacity={1 - keyIn} transform={`translate(${lerp(0, -30, keyIn)} 0)`}>
        <rect x={168} y={60} width={56} height={14} rx={3} fill="#cfd4dc" stroke="#8E8E93" />
        {[176, 188, 200, 212].map((x, i) => (
          <circle key={x} cx={x} cy={67} r={[2.5, 3.5, 2, 3][i]} fill="#8E8E93" />
        ))}
        <rect x={210} y={52} width={30} height={30} rx={8} fill="#cfd4dc" stroke="#8E8E93" />
      </g>
      <Label x={160} y={100}>
        klíč s důlky
      </Label>
      <Label x={4} y={30}>
        vodorovný otvor
      </Label>
      <Leader x1={60} y1={33} x2={94} y2={44} />
      {turn > 80 && <Badge x={106} y={128} text="otočeno" color="#1f9d47" />}
    </Svg>
  );
}

const DIMPLE_KEYWAY = <rect x={96} y={66} width={48} height={8} rx={2} fill={P.keyway} />;

/* ───────────────────────── lever ───────────────────────── */

function DoorLever({ t }: { t: number }) {
  const keyIn = sg(t, 0.1, 0.28);
  const turn = sg(t, 0.32, 0.5);
  const bolt = 22 * sg(t, 0.46, 0.56) * (1 - sg(t, 0.84, 0.94));
  return (
    <Svg label="Dveře se zadlabacím dozickým zámkem">
      <rect x={30} y={4} width={150} height={132} fill="#C79A6B" stroke="#9c7447" />
      <rect x={180} y={4} width={8} height={132} fill="#a57c50" />
      <rect x={184} y={78} width={bolt + 4} height={14} rx={2} fill="#b9bfcb" stroke="#8E8E93" />
      <rect x={140} y={30} width={26} height={90} rx={13} fill="#d9dce3" stroke="#8E8E93" />
      <circle cx={153} cy={46} r={6} fill="#8E8E93" />
      <circle cx={153} cy={90} r={6} fill={P.keyway} />
      <path d="M150 92h6l2 14h-10z" fill={P.keyway} />
      {keyIn > 0.98 && (
        <g transform={`rotate(${turn * 270} 153 92)`}>
          <circle cx={153} cy={92} r={4} fill={P.key} stroke={P.keyStroke} />
          <rect x={151} y={92} width={4} height={13} fill={P.key} stroke={P.keyStroke} />
        </g>
      )}
      <g opacity={1 - keyIn} transform={`translate(${lerp(0, 30, keyIn)} 0)`}>
        <circle cx={48} cy={60} r={9} fill="none" stroke={P.key} strokeWidth={4} />
        <rect x={56} y={58} width={56} height={4} rx={2} fill={P.key} />
        <rect x={104} y={62} width={8} height={10} fill={P.key} stroke={P.keyStroke} />
      </g>
      <Label x={36} y={128}>
        velká klíčová dírka
      </Label>
      <Leader x1={100} y1={125} x2={147} y2={100} />
      <Label x={196} y={74} anchor="start">
        závora
      </Label>
      {bolt > 18 && <Badge x={100} y={16} text="zamčeno – závora vyjela" color="#1f9d47" />}
    </Svg>
  );
}

const LEVER_G = [44, 52, 50];
const LEVER_L = LEVER_G.map((g, i) => 24 - 5 * i + g - 61);

function LeverCase({ lifts, bolt, stumpPush = 0, blockFlash = 0, children, binding = -1 }: { lifts: number[]; bolt: number; stumpPush?: number; blockFlash?: number; children?: ReactNode; binding?: number }) {
  const sx = 58 + bolt + stumpPush;
  return (
    <g>
      <rect x={8} y={8} width={224} height={124} rx={8} fill={P.housing} stroke={P.housingStroke} />
      {/* bolt with its stump */}
      <rect x={20 + bolt} y={98} width={190} height={16} rx={3} fill="#b0b6c2" stroke="#7a808c" />
      {[2, 1, 0].map((i) => {
        const lx = 72 + i * 9;
        const ly = 24 - i * 5 - lifts[i];
        return (
          <g key={i}>
            <rect x={lx} y={ly} width={100} height={66} rx={4} fill={['#c3c8d2', '#b4bac6', '#a7aebb'][i]} stroke={i === binding ? PICK : '#7a808c'} strokeWidth={i === binding ? 2 : 0.8} />
            <rect x={lx} y={ly + LEVER_G[i]} width={70} height={12} rx={2} fill="#4a4f5c" opacity={0.45} />
            {blockFlash > 0 && i === 0 && <rect x={lx - 2} y={58} width={5} height={18} fill={P.red} opacity={blockFlash} />}
          </g>
        );
      })}
      <line x1={sx + 12} x2={176} y1={67} y2={67} stroke={P.shear} strokeWidth={1} strokeDasharray="4 3" />
      <rect x={sx + 3} y={73} width={6} height={25} fill="#b0b6c2" stroke="#7a808c" />
      <rect x={sx} y={61} width={12} height={12} rx={2} fill={P.shear} stroke="#c46a00" />
      {children}
    </g>
  );
}

function LeverInside({ t }: { t: number }) {
  const lift = sg(t, 0.3, 0.46) * (1 - sg(t, 0.86, 0.94));
  const bolt = t < 0.24 ? 4 * pulse(t, 0.04, 0.22) : 40 * sg(t, 0.5, 0.64) * (1 - sg(t, 0.8, 0.88));
  const keyAng = 90 + 200 * sg(t, 0.28, 0.62) * (1 - sg(t, 0.84, 0.94));
  return (
    <Svg label="Dozický zámek uvnitř">
      <LeverCase lifts={LEVER_L.map((l) => l * lift)} bolt={bolt} blockFlash={t < 0.24 ? pulse(t, 0.04, 0.22) : 0}>
        {t >= 0.26 && (
          <g transform={`rotate(${keyAng} 130 92)`}>
            <circle cx={130} cy={92} r={5} fill={P.key} stroke={P.keyStroke} />
            <rect x={128} y={92} width={5} height={16} fill={P.key} stroke={P.keyStroke} />
          </g>
        )}
      </LeverCase>
      {t < 0.24 && <Badge x={120} y={20} text="čep narazí do pák → zaseknuto" color={P.red} />}
      {t >= 0.26 && t < 0.5 && <Badge x={120} y={20} text="klíč zvedne každou páku jinak" color={P.keyStroke} />}
      {t >= 0.5 && t < 0.84 && <Badge x={120} y={20} text="okénka v řadě → závora projede" color="#1f9d47" />}
      <Label x={180} y={36}>
        páky
      </Label>
      <Label x={14} y={58}>
        čep
      </Label>
      <Label x={180} y={84}>
        okénka
      </Label>
      <Leader x1={28} y1={60} x2={56} y2={66} />
    </Svg>
  );
}

function LeverFront({ t }: { t: number }) {
  const lift = Math.abs(Math.sin(t * Math.PI * 4)) * 5;
  return (
    <Svg label="Nástroj v klíčové dírce">
      <rect x={70} y={6} width={100} height={128} rx={16} fill="#d9dce3" stroke="#8E8E93" />
      <circle cx={120} cy={56} r={14} fill={P.keyway} />
      <path d="M112 60h16l6 40h-28z" fill={P.keyway} />
      {/* curtain/tension part pushes the bolt */}
      <line x1={114} y1={94} x2={60} y2={132} stroke={WRENCH} strokeWidth={6} strokeLinecap="round" />
      <circle cx={114} cy={94} r={3.8} fill={WRENCH} stroke="#fff" strokeWidth={1.2} />
      <LineArrow x1={92} y1={96} x2={60} y2={96} color={WRENCH} />
      {/* lifter */}
      <FrontPick tip={[124, 54 - lift]} end={[200, 132]} />
      <LineArrow x1={146} y1={52} x2={146} y2={30} color={PICK} opacity={0.6 + 0.4 * Math.sin(t * Math.PI * 4)} />
      <Badge x={6} y={22} text="tlač na závoru" color={WRENCH} anchor="start" />
      <Badge x={234} y={22} text="zvedej páky" color={PICK} anchor="end" />
    </Svg>
  );
}

function LeverPicking({ t }: { t: number }) {
  const order = [1, 0, 2];
  const lifts = [0, 0, 0];
  let push = 0;
  let binding = -1;
  let lx = 150;
  let ly = 84;
  order.forEach((i, k) => {
    const s = 0.08 + k * 0.2;
    const l = LEVER_L[i] * sg(t, s + 0.04, s + 0.14);
    if (t >= s) lifts[i] = t > 0.9 ? LEVER_L[i] * (1 - sg(t, 0.9, 0.97)) : l;
    if (t >= s && t < s + 0.15) {
      binding = i;
      lx = 72 + i * 9 + 44;
      ly = 24 - i * 5 + 66 - l;
    }
    if (t >= s + 0.14) push = Math.min(3 * (k + 1), 9);
  });
  const open = sg(t, 0.7, 0.8) * (1 - sg(t, 0.88, 0.95));
  return (
    <Svg label="Otevírání dozického zámku">
      <LeverCase lifts={lifts} bolt={open * 34} stumpPush={open > 0 ? 0 : push * 0.4} binding={binding}>
        <path d={`M240 124H${lx}V${ly + 1}h-7`} fill="none" stroke={PICK} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
        <path d="M0 106H22" stroke={WRENCH} strokeWidth={5} strokeLinecap="round" />
        <LineArrow x1={4} y1={92} x2={30} y2={92} color={WRENCH} />
      </LeverCase>
      {open === 0 && binding >= 0 && <Badge x={120} y={20} text="zvedej páku, o kterou se čep opírá" color={PICK} />}
      {open > 0 && <Badge x={120} y={20} text="všechny páky v řadě → závora jede" color="#1f9d47" opacity={open} />}
    </Svg>
  );
}

/* ───────────────────────── tubular ───────────────────────── */

function RingFace({ cx, cy, r, pins, children }: { cx: number; cy: number; r: number; pins: string[]; children?: ReactNode }) {
  return (
    <g>
      <circle cx={cx} cy={cy} r={r} fill="#d9dce3" stroke="#8E8E93" />
      <circle cx={cx} cy={cy} r={r * 0.62} fill={P.keyway} />
      <circle cx={cx} cy={cy} r={r * 0.32} fill="#c9ced8" stroke="#8E8E93" />
      {pins.map((c, i) => {
        const a = (i / pins.length) * Math.PI * 2 - Math.PI / 2;
        return <circle key={i} cx={cx + Math.cos(a) * r * 0.47} cy={cy + Math.sin(a) * r * 0.47} r={r * 0.09} fill={c} />;
      })}
      {children}
    </g>
  );
}

function Vending({ t }: { t: number }) {
  const keyIn = sg(t, 0.12, 0.3);
  const turn = 90 * sg(t, 0.36, 0.52) * (1 - sg(t, 0.86, 0.96));
  return (
    <Svg label="Trubkový zámek na automatu">
      <rect x={20} y={6} width={120} height={128} rx={8} fill="#E05252" stroke="#b03a3a" />
      <rect x={32} y={18} width={70} height={90} rx={4} fill="#fbe3e3" />
      <g transform={`rotate(${turn} 120 70)`}>
        <RingFace cx={120} cy={70} r={16} pins={Array(7).fill(P.key)}>
          <rect x={118} y={52} width={4} height={6} fill="#c9ced8" />
        </RingFace>
      </g>
      <g opacity={1 - keyIn} transform={`translate(${lerp(0, -24, keyIn)} 0)`}>
        <rect x={160} y={63} width={40} height={14} rx={2} fill="#cfd4dc" stroke="#8E8E93" />
        <path d="M160 63v4l3 0v-4M168 73v4h3v-4M176 63v3h3v-3" fill={P.keyway} />
        <rect x={198} y={56} width={36} height={28} rx={8} fill="#cfd4dc" stroke="#8E8E93" />
      </g>
      <Label x={146} y={110}>
        kruhový otvor
      </Label>
      <Leader x1={150} y1={106} x2={128} y2={82} />
      <Label x={160} y={52}>
        trubkový klíč
      </Label>
      {turn > 80 && <Badge x={80} y={128} text="otočeno" color="#1f9d47" />}
    </Svg>
  );
}

const TUB_KL = [70, 62, 78];
const TUB_P = TUB_KL.map((k) => 120 - (34 + k));
const TUB_Y = [38, 70, 102];

function TubularSide({ push, front, children }: { push: number[]; front?: string; children?: ReactNode }) {
  return (
    <g>
      <rect x={30} y={14} width={196} height={112} rx={6} fill={P.housing} stroke={P.housingStroke} />
      <rect x={30} y={14} width={90} height={112} fill={front ?? P.plug} stroke={P.plugStroke} />
      {TUB_Y.map((y, i) => {
        const kx = 34 + push[i];
        const dx = kx + TUB_KL[i];
        return (
          <g key={y}>
            <rect x={32} y={y - 8} width={190} height={16} fill="#000" opacity={0.07} />
            <rect x={kx} y={y - 7} width={TUB_KL[i]} height={14} rx={3} fill={P.key} stroke={P.keyStroke} strokeWidth={0.8} />
            <rect x={dx} y={y - 7} width={30} height={14} rx={3} fill={P.driver} stroke={P.driverStroke} strokeWidth={0.8} />
            <path d={springPath(y, dx + 30, 222, 5).replace(/([ML])(\S+) (\S+)/g, (_, c, a, b) => `${c}${b} ${a}`)} fill="none" stroke={P.spring} strokeWidth={1.1} />
          </g>
        );
      })}
      <line x1={120} x2={120} y1={8} y2={132} stroke={P.shear} strokeWidth={1.4} strokeDasharray="5 3" />
      {children}
    </g>
  );
}

function TubularInside({ t }: { t: number }) {
  const k = sg(t, 0.28, 0.5) * (1 - sg(t, 0.88, 0.96));
  const aligned = k > 0.99;
  const keyFront = (i: number) => 34 + TUB_P[i] * k;
  return (
    <Svg label="Trubkový zámek v řezu">
      <TubularSide push={TUB_P.map((p) => p * k)} front={aligned ? '#d6f5df' : undefined}>
        {k > 0 && (
          <g>
            {TUB_Y.map((y, i) => (
              <rect key={y} x={-20} y={y - 5} width={keyFront(i) + 20} height={10} fill="#cfd4dc" stroke="#8E8E93" strokeWidth={0.8} />
            ))}
            <rect x={-20} y={30} width={lerp(0, 46, k)} height={80} fill="#cfd4dc" opacity={0.6} />
          </g>
        )}
      </TubularSide>
      {t < 0.26 && <Badge x={120} y={10} text="horní stavítka přes hranici → drží" color={P.red} />}
      {t >= 0.28 && !aligned && <Badge x={120} y={10} text="klíč zatlačí stavítka dovnitř" color={P.keyStroke} />}
      {aligned && <Badge x={120} y={10} text="na hranici → přední část se otočí" color="#1f9d47" />}
    </Svg>
  );
}

function TubularFront({ t }: { t: number }) {
  const done = Math.floor(seg(t, 0.1, 0.85) * 7.99);
  const pins = Array.from({ length: 7 }, (_, i) => (i < done ? P.green : PICK));
  const turn = 6 * sg(t, 0.05, 0.15);
  return (
    <Svg label="Trubkový nástroj v zámku">
      <g transform={`rotate(${turn} 100 70)`}>
        <RingFace cx={100} cy={70} r={58} pins={pins} />
      </g>
      <ArcArrow cx={100} cy={70} r={64} a0={-70} a1={-30} color={WRENCH} w={2.6} />
      <Badge x={236} y={30} text="lehce otáčej" color={WRENCH} anchor="end" />
      <Badge x={236} y={110} text="drátky po jednom" color={PICK} anchor="end" />
      <Badge x={236} y={126} text="zatlač, až cvaknou" color={P.green} anchor="end" />
    </Svg>
  );
}

function TubularPicking({ t }: { t: number }) {
  const order = [1, 2, 0];
  const push = [0, 0, 0];
  let active = -1;
  order.forEach((i, k) => {
    const s = 0.08 + k * 0.22;
    if (t >= s) push[i] = TUB_P[i] * sg(t, s + 0.04, s + 0.16) * (1 - sg(t, 0.9, 0.97));
    if (t >= s && t < s + 0.18) active = i;
  });
  const all = t > 0.74 && t < 0.9;
  return (
    <Svg label="Otevírání trubkovým nástrojem">
      <TubularSide push={push} front={all ? '#d6f5df' : undefined}>
        {TUB_Y.map((y, i) => (
          <line key={y} x1={-10} y1={y} x2={34 + push[i]} y2={y} stroke={i === active ? PICK : '#7aa7ff'} strokeWidth={i === active ? 3 : 2} />
        ))}
      </TubularSide>
      <ArcArrow cx={14} cy={70} r={12} a0={-120} a1={-40} color={WRENCH} />
      {!all && <Badge x={120} y={10} text="drátek tlač, dokud stavítko necvakne" color={PICK} />}
      {all && <Badge x={120} y={10} text="vše na hranici → otevřeno" color="#1f9d47" />}
    </Svg>
  );
}

/* ───────────────────────── registry + player ───────────────────────── */

export interface ExplainerScene {
  title: string;
  text: string;
  ms: number;
  /** frame shown when motion is reduced */
  still: number;
  render: (t: number) => ReactNode;
}

export const EXPLAINERS: Record<Exclude<Mechanism, 'other'>, ExplainerScene[]> = {
  'pin-tumbler': [
    { title: 'Jak vypadá', text: 'Nejběžnější zámek na světě: visací zámky i dveřní vložky. Klíč zasuneš do otvoru a otočíš bubínkem – kulatou částí uprostřed, která se točí.', ms: 6500, still: 0.6, render: (t) => <Padlock t={t} /> },
    {
      title: 'Proč se bez klíče neotočí',
      text: 'Nad otvorem je řada komůrek. V každé je zlaté spodní stavítko, šedé horní stavítko a pružina. Bez klíče šedá stavítka zasahují přes oranžovou čáru (hranice bubínku) a drží ho. Klíč zvedne každou dvojici tak, aby mezera byla přesně na čáře.',
      ms: 8000,
      still: 0.7,
      render: (t) => <PinInside t={t} />,
    },
    {
      title: 'Kam dát nástroje',
      text: 'Zelený napínák zasuň do spodní části otvoru a jemně ho tlač ve směru, kterým by se točil klíč. Modrou planžetu zasuň nad něj až dozadu.',
      ms: 4000,
      still: 0.25,
      render: (t) => <FrontTools t={t} keyway={PIN_KEYWAY} wrenchTip={[120, 99]} wrenchEnd={[226, 99]} pickTip={[120, 46]} pickEnd={[22, 128]} wrenchLabel="napínák dole, jemně otáčej" pickLabel="planžeta nad ním" />,
    },
    {
      title: 'Jak otevírat',
      text: 'Díky napětí se vždy zasekne jen jedno stavítko (oranžový obrys). Planžetou ho najdi a zvedej, dokud necvakne – šedé stavítko zůstane nahoře. Pak hledej další. Když jsou nahoře všechna, bubínek se otočí.',
      ms: 9000,
      still: 0.5,
      render: (t) => <PinPicking t={t} />,
    },
  ],
  wafer: [
    { title: 'Jak vypadá', text: 'Poštovní schránky, skříňky, šuplíky, starší auta. Zvenku vypadá jako malý stavítkový zámek, uvnitř jsou ale ploché plíšky – lamely.', ms: 6000, still: 0.6, render: (t) => <Mailbox t={t} /> },
    {
      title: 'Proč se bez klíče neotočí',
      text: 'Pohled zepředu do řezu. Lamela je plíšek s okénkem pro klíč. Pružina ji vytlačí ven z bubínku do drážky v těle zámku – tím drží. Klíč lamelu stáhne přesně doprostřed, nic netrčí a bubínek se otočí.',
      ms: 7000,
      still: 0.6,
      render: (t) => <WaferInside t={t} />,
    },
    {
      title: 'Kam dát nástroje',
      text: 'Napínák do spodní části otvoru, nad něj half-diamond, jiggler nebo hrábě. Napětí musí být opravdu jemné.',
      ms: 3000,
      still: 0.25,
      render: (t) => <FrontTools t={t} rock keyway={WAFER_KEYWAY} wrenchTip={[120, 96]} wrenchEnd={[226, 96]} pickTip={[120, 50]} pickEnd={[22, 128]} wrenchLabel="napínák dole, lehce" pickLabel="nástrojem kolébej" />,
    },
    {
      title: 'Jak otevírat',
      text: 'Lamely mají velké vůle, takže většinou stačí nástrojem rychle jezdit tam a zpět a trochu jím kolébat. Lamely postupně zapadnou do bubínku a ten se otočí.',
      ms: 7000,
      still: 0.75,
      render: (t) => <WaferRaking t={t} />,
    },
  ],
  'disc-detainer': [
    { title: 'Jak vypadá', text: 'Kulatý visací zámek s půlkulatým otvorem. Najdeš ho tam, kde musí zámek hodně vydržet – garáže, sklady, kola.', ms: 6000, still: 0.6, render: (t) => <DiscPadlock t={t} /> },
    {
      title: 'Proč se bez klíče neotočí',
      text: 'Uvnitř nejsou pružiny, ale řada disků (vpravo z boku, vlevo jeden zepředu). Každý disk má na okraji výřez. Klíč natočí každý disk o jiný kus. Až jsou všechny výřezy v jedné řadě, spadne do nich oranžová lišta a zámek se otočí.',
      ms: 8000,
      still: 0.7,
      render: (t) => <DiscInside t={t} />,
    },
    {
      title: 'Nástroj',
      text: 'Obyčejná planžeta tu nefunguje. Potřebuješ speciální nástroj pro daný průměr zámku. Jeho zadní konec drží poslední disk napnutý (dělá napínák), malý hrot vepředu otáčí jedním diskem a ručička ukazuje, o kolik jsi ho natočil.',
      ms: 4000,
      still: 0.3,
      render: (t) => <DiscTool t={t} />,
    },
    {
      title: 'Jak otevírat',
      text: 'Hrotem otáčej disky jeden po druhém. Disk, který drhne, je ten, na kterém právě záleží – otáčej s ním, dokud nepovolí. Když jsou všechny výřezy v řadě, lišta zapadne.',
      ms: 9000,
      still: 0.8,
      render: (t) => <DiscInside t={t} tool />,
    },
  ],
  dimple: [
    { title: 'Jak vypadá', text: 'Moderní dveřní vložka. Klíč je plochý a místo zubů má na ploše důlky. Otvor je proto vodorovný.', ms: 6000, still: 0.6, render: (t) => <EuroCylinder t={t} /> },
    {
      title: 'Proč se bez klíče neotočí',
      text: 'Funguje jako stavítkový zámek, jen otočený na bok: stavítka míří do důlků na plochém klíči. Hloubka důlku určí, kam stavítko dosedne – správný klíč dá všechny mezery na oranžovou čáru.',
      ms: 8000,
      still: 0.7,
      render: (t) => <PinInside t={t} dimple />,
    },
    {
      title: 'Kam dát nástroje',
      text: 'Napínák do kraje vodorovného otvoru. Planžeta na důlky má na konci malou ohnutou „vlaječku“ – zasuň ji do otvoru naplocho.',
      ms: 4000,
      still: 0.25,
      render: (t) => (
        <FrontTools t={t} keyway={DIMPLE_KEYWAY} wrenchTip={[98, 70]} wrenchEnd={[40, 130]} pickTip={[132, 70]} pickEnd={[226, 124]} wrenchLabel="napínák na kraj otvoru" pickLabel="planžeta s vlaječkou" />
      ),
    },
    {
      title: 'Jak otevírat',
      text: 'Vlaječkou tlačíš na stavítka – lehkým pootočením nebo zvednutím planžety. Postup je stejný jako u stavítkového zámku: najdi tuhé stavítko, zatlač, až cvakne, a pokračuj.',
      ms: 9000,
      still: 0.5,
      render: (t) => <PinPicking t={t} flag />,
    },
  ],
  lever: [
    { title: 'Jak vypadá', text: 'Starší dveře se zadlabacím zámkem, trezory, britské dveře. Velká klíčová dírka a klíč s „vousem“ na konci.', ms: 6500, still: 0.6, render: (t) => <DoorLever t={t} /> },
    {
      title: 'Proč se bez klíče neotočí',
      text: 'Uvnitř leží na sobě ploché páky (dozy) a každá má okénko. Závora má oranžový čep, který musí okénky projet. Klíč se otočí, zvedne každou páku do jiné výšky a pak odsune závoru.',
      ms: 8000,
      still: 0.6,
      render: (t) => <LeverInside t={t} />,
    },
    {
      title: 'Kam dát nástroje',
      text: 'Používá se dvoudílný nástroj. Zelená část dole tlačí na závoru (to je napětí), modrá část nahoře zvedá páky.',
      ms: 3000,
      still: 0.25,
      render: (t) => <LeverFront t={t} />,
    },
    {
      title: 'Jak otevírat',
      text: 'Tlakem na závoru se čep opře o jednu páku. Tu zvedej, dokud čep nezapadne do jejího okénka. Pak najdi další. Když jsou zvednuté všechny, závora se posune.',
      ms: 8000,
      still: 0.75,
      render: (t) => <LeverPicking t={t} />,
    },
  ],
  tubular: [
    { title: 'Jak vypadá', text: 'Kulatý zámek s otvorem do kruhu – automaty, zámky na kola, starší notebooky. Klíč je trubička se zářezy na konci.', ms: 6000, still: 0.6, render: (t) => <Vending t={t} /> },
    {
      title: 'Proč se bez klíče neotočí',
      text: 'Pohled z boku: stavítka leží v kruhu a míří dovnitř zámku. Šedá horní stavítka zasahují přes oranžovou hranici. Zářezy klíče zatlačí každé stavítko do správné hloubky a přední část se otočí.',
      ms: 7000,
      still: 0.6,
      render: (t) => <TubularInside t={t} />,
    },
    {
      title: 'Nástroj',
      text: 'Trubkový nástroj má po obvodu tenké drátky. Zasuneš ho do kruhu a lehce s ním otáčíš – drátky pak jeden po druhém zatlačíš.',
      ms: 6000,
      still: 0.6,
      render: (t) => <TubularFront t={t} />,
    },
    {
      title: 'Jak otevírat',
      text: 'Při lehkém otáčení tlač drátky jeden po druhém, až stavítka cvaknou na hranici. Drátky pak drží tvar klíče, takže nástroj klíč zároveň „opíše“.',
      ms: 8000,
      still: 0.8,
      render: (t) => <TubularPicking t={t} />,
    },
  ],
};

/** Big front view used as the thumbnail in the list. */
export function LockThumb({ mech }: { mech: Exclude<Mechanism, 'other'> }) {
  return <>{EXPLAINERS[mech][0].render(0.02)}</>;
}

function useLoop(ms: number, playing: boolean) {
  const [t, setT] = useState(0);
  const tRef = useRef(0);
  tRef.current = t;
  useEffect(() => {
    if (!playing) return;
    let raf = 0;
    const start = performance.now() - tRef.current * ms;
    const tick = (now: number) => {
      setT(((now - start) % ms) / ms);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [ms, playing]);
  return t;
}

export function SceneCard({ n, scene }: { n: number; scene: ExplainerScene }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [paused, setPaused] = useState(false);
  const reduce = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined') {
      setVisible(true);
      return;
    }
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { threshold: 0.25 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  const playing = visible && !paused && !reduce;
  const t = useLoop(scene.ms, playing);
  return (
    <div ref={ref} className="card overflow-hidden">
      <div className="relative bg-well px-2 pt-2">
        {scene.render(reduce ? scene.still : t)}
        <div className="h-[3px] bg-fill">
          <div className="h-full bg-brass-500" style={{ width: `${(reduce ? 1 : t) * 100}%` }} />
        </div>
      </div>
      <div className="flex gap-3 p-4">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brass-500 text-[14px] font-bold text-white">{n}</span>
        <div className="min-w-0 flex-1">
          <div className="text-[17px] font-semibold leading-tight text-slate-50">{scene.title}</div>
          <p className="mt-1 text-[15px] leading-relaxed text-slate-300">{scene.text}</p>
        </div>
      {!reduce && (
          <button
            type="button"
            onClick={() => setPaused((p) => !p)}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-fill text-slate-300"
            aria-label={paused ? 'Přehrát' : 'Pozastavit'}
          >
            {paused ? (
              <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
                <path d="M3 1.5v9l7.5-4.5z" fill="currentColor" />
              </svg>
            ) : (
              <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
                <path d="M2.5 1.5h2.5v9H2.5zM7 1.5h2.5v9H7z" fill="currentColor" />
              </svg>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
