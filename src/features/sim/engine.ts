/**
 * Pin-tumbler lock physics engine.
 *
 * Units: every vertical quantity is a normalised "lift" — 0 means the key pin rests on the
 * keyway floor, `setLift` is the height at which the top of the key pin is exactly on the shear
 * line. Horizontal positions are 0 (keyway entrance) … 1 (back of the plug).
 *
 * The model reproduces:
 *   - manufacturing tolerances → a single binding pin at a time (binding order)
 *   - stick-slip friction that grows with tension (heavy tension ⇒ jumps ⇒ oversetting)
 *   - setting at the shear line (driver caught on the plug ledge, key pin falls free)
 *   - oversetting (key pin jammed in the shell) → only releasing tension recovers
 *   - spool pins: false set + counter-rotation that requires easing the tension
 *   - serrated pins: several small false clicks before the true set
 *   - the pick shaft levering against the keyway floor (front pins get disturbed by
 *     high lifts with a short hook — the reason deep hooks exist)
 */
import { mulberry32, shuffle } from '../../lib/random';
import type { SimLockSpec } from '../../types';

export type SimPinType = 'standard' | 'spool' | 'serrated';
export type SimPinState = 'free' | 'set' | 'spool' | 'overset';

export interface SimPin {
  index: number;
  type: SimPinType;
  setLift: number;
  spoolLift: number;
  serrations: number[];
  x: number;
  lift: number;
  /** Height at which the driver is currently held by the plug ledge (0 = not held). */
  holdLift: number;
  state: SimPinState;
  pressure: number;
  contact: boolean;
  serrationCaught: number;
  counter: number;
}

export type SimDifficulty = 'easy' | 'normal' | 'hard';

export type ToolKind = 'short-hook' | 'deep-hook' | 'half-diamond' | 'city-rake' | 'snake';

export interface ToolDef {
  kind: ToolKind;
  label: string;
  /** Height of the tip above the top of the shaft (lift units). */
  hookHeight: number;
  /** Contact points relative to the tip [dx in chamber spacings, dy in lift]. */
  points: { dx: number; dy: number }[];
  width: number;
}

export const SIM_TOOLS: Record<ToolKind, ToolDef> = {
  'short-hook': { kind: 'short-hook', label: 'Short Hook', hookHeight: 0.34, points: [{ dx: 0, dy: 0 }], width: 0.32 },
  'deep-hook': { kind: 'deep-hook', label: 'Deep Hook', hookHeight: 0.62, points: [{ dx: 0, dy: 0 }], width: 0.3 },
  'half-diamond': { kind: 'half-diamond', label: 'Half-Diamond', hookHeight: 0.28, points: [{ dx: 0, dy: 0 }, { dx: -0.32, dy: -0.12 }], width: 0.42 },
  'city-rake': {
    kind: 'city-rake',
    label: 'City Rake',
    hookHeight: 0.3,
    points: [
      { dx: 0, dy: 0 },
      { dx: -1, dy: -0.14 },
      { dx: -2, dy: -0.04 },
      { dx: -3, dy: -0.18 },
    ],
    width: 0.36,
  },
  snake: {
    kind: 'snake',
    label: 'Snake Rake',
    hookHeight: 0.26,
    points: [
      { dx: 0, dy: 0 },
      { dx: -1, dy: -0.18 },
      { dx: -2, dy: 0 },
      { dx: -3, dy: -0.18 },
    ],
    width: 0.4,
  },
};

const DIFFICULTY = {
  easy: { margin: 0.11, catchMin: 0.08, counterMax: 0.46, friction: 0.75, oversetTension: 0.6 },
  normal: { margin: 0.075, catchMin: 0.12, counterMax: 0.36, friction: 1, oversetTension: 0.42 },
  hard: { margin: 0.055, catchMin: 0.15, counterMax: 0.3, friction: 1.18, oversetTension: 0.3 },
} as const;

export const RELEASE_THRESHOLD = 0.05;
export const KEYWAY_FLOOR = -0.6;
export const MAX_LIFT = 1.02;

export type SimEvent =
  | { type: 'set'; pin: number }
  | { type: 'serration'; pin: number }
  | { type: 'false-set'; pin: number }
  | { type: 'overset'; pin: number }
  | { type: 'touch'; pin: number; binding: boolean }
  | { type: 'reset' }
  | { type: 'open' };

export interface SimInput {
  tension: number;
  /** Desired tip depth 0..1 */
  tx: number;
  /** Desired tip height (lift units) */
  ty: number;
}

export interface SimSnapshot {
  pins: SimPin[];
  tipX: number;
  tipY: number;
  shaftY: number;
  bend: number;
  bindingPin: number | null;
  plugAngle: number;
  open: boolean;
  tension: number;
  scratch: number;
  creak: number;
  vibration: number;
  jammed: boolean;
  falseSet: boolean;
  elapsed: number;
  started: boolean;
  maxTension: number;
  oversets: number;
  resets: number;
}

export function randomSpec(pins: number, opts: { spools?: number; serrated?: number; seed?: number } = {}): SimLockSpec {
  const seed = opts.seed ?? Math.floor(Math.random() * 1e9);
  const rnd = mulberry32(seed);
  const order = shuffle(
    Array.from({ length: pins }, (_, i) => i),
    rnd,
  );
  const types: SimLockSpec['pinTypes'] = Array.from({ length: pins }, () => 'standard');
  const candidates = shuffle(
    Array.from({ length: pins }, (_, i) => i),
    rnd,
  );
  let c = 0;
  for (let i = 0; i < (opts.spools ?? 0) && c < pins; i++) types[candidates[c++]] = 'spool';
  for (let i = 0; i < (opts.serrated ?? 0) && c < pins; i++) types[candidates[c++]] = 'serrated';
  const lifts = Array.from({ length: pins }, () => 0.2 + Math.floor(rnd() * 9) * 0.065);
  return { pins, pinTypes: types, bindingOrder: order, keyPinLengths: lifts, seed };
}

export class LockEngine {
  readonly spec: SimLockSpec;
  readonly difficulty: SimDifficulty;
  tool: ToolDef;
  pins: SimPin[];
  private spacing: number;
  private tipX = 0;
  private tipY = 0;
  private prevTipX = 0;
  private openState = false;
  private elapsed = 0;
  private started = false;
  private maxTension = 0;
  private oversets = 0;
  private resets = 0;
  private lastTension = 0;
  private wasHolding = false;
  private catchMin: number;

  constructor(spec: SimLockSpec, difficulty: SimDifficulty = 'normal', tool: ToolKind = 'short-hook') {
    this.spec = spec;
    this.difficulty = difficulty;
    this.tool = SIM_TOOLS[tool];
    const n = spec.pins;
    this.spacing = 0.84 / n;
    const rnd = mulberry32(spec.seed + 7);
    this.catchMin = DIFFICULTY[difficulty].catchMin + (rnd() - 0.5) * 0.03;
    this.pins = Array.from({ length: n }, (_, i) => {
      const setLift = spec.keyPinLengths[i] ?? 0.5;
      const type = spec.pinTypes[i] ?? 'standard';
      const serrations: number[] = [];
      if (type === 'serrated') {
        for (let k = 3; k >= 1; k--) {
          const lvl = setLift - k * 0.05;
          if (lvl > 0.04) serrations.push(lvl);
        }
      }
      return {
        index: i,
        type,
        setLift,
        spoolLift: Math.max(0.04, setLift - 0.15),
        serrations,
        x: 0.1 + this.spacing * (i + 0.5),
        lift: 0,
        holdLift: 0,
        state: 'free' as SimPinState,
        pressure: 0,
        contact: false,
        serrationCaught: 0,
        counter: 0,
      };
    });
  }

  setTool(kind: ToolKind) {
    this.tool = SIM_TOOLS[kind];
  }

  get pinSpacing() {
    return this.spacing;
  }

  get isOpen() {
    return this.openState;
  }

  minTipY() {
    return KEYWAY_FLOOR + 0.1 + this.tool.hookHeight;
  }

  friction(t: number, pin: SimPin) {
    const d = DIFFICULTY[this.difficulty];
    const base = 0.02 + 0.14 * t * t;
    return base * d.friction * (pin.type === 'serrated' ? 1.25 : 1);
  }

  bindingPin(t: number): number | null {
    if (this.openState) return null;
    if (this.pins.some((p) => p.state === 'overset')) return null;
    if (t < this.catchMin) return null;
    for (const idx of this.spec.bindingOrder) {
      const p = this.pins[idx];
      if (p && p.state !== 'set') return idx;
    }
    return null;
  }

  private resetPins(events: SimEvent[]) {
    let any = false;
    for (const p of this.pins) {
      if (p.state !== 'free' || p.holdLift > 0) any = true;
      p.state = 'free';
      p.holdLift = 0;
      p.serrationCaught = 0;
      p.counter = 0;
    }
    if (any) {
      this.resets++;
      events.push({ type: 'reset' });
    }
  }

  /** Height the tool pushes a given pin to (or -Infinity if not touching). */
  private pushHeight(pin: SimPin): number {
    if (this.tipX < 0.03) return -Infinity;
    let best = -Infinity;
    const halfW = this.spacing * this.tool.width;
    for (const pt of this.tool.points) {
      const px = this.tipX + pt.dx * this.spacing;
      if (Math.abs(pin.x - px) <= halfW) best = Math.max(best, this.tipY + pt.dy);
    }
    // Shaft levers on the keyway floor at the entrance; it rises linearly towards the tip.
    const shaftEndTop = this.tipY - this.tool.hookHeight;
    const firstPointX = this.tipX + Math.min(...this.tool.points.map((p) => p.dx)) * this.spacing - halfW;
    if (pin.x < firstPointX) {
      const floorTop = KEYWAY_FLOOR + 0.1;
      const h = floorTop + (shaftEndTop - floorTop) * (pin.x / Math.max(0.05, firstPointX));
      best = Math.max(best, h);
    }
    return best;
  }

  /** Check a binding pin that slipped from `from` to `to`; mutates pin, returns events. */
  private resolveSlip(pin: SimPin, from: number, to: number, t: number, events: SimEvent[]) {
    const d = DIFFICULTY[this.difficulty];
    // Spool: waist reaches the shear line → false set (only on the way up)
    if (pin.type === 'spool' && pin.state === 'free' && from < pin.spoolLift && to >= pin.spoolLift) {
      pin.state = 'spool';
      pin.holdLift = pin.spoolLift;
      pin.lift = pin.spoolLift + 0.005;
      events.push({ type: 'false-set', pin: pin.index });
      return;
    }
    // Serrations catch one at a time
    if (pin.type === 'serrated') {
      for (let k = pin.serrationCaught; k < pin.serrations.length; k++) {
        const lvl = pin.serrations[k];
        if (from < lvl && to >= lvl) {
          pin.serrationCaught = k + 1;
          pin.holdLift = lvl;
          pin.lift = lvl + 0.004;
          events.push({ type: 'serration', pin: pin.index });
          return;
        }
      }
    }
    if (to >= pin.setLift) {
      if (to > pin.setLift + d.margin && t < d.oversetTension) {
        // Light tension: the key pin overshoots but does not bind in the shell.
        // It sets on the way back down (handled in the falling branch).
        pin.lift = to;
        return;
      }
      if (to > pin.setLift + d.margin) {
        pin.state = 'overset';
        pin.lift = to;
        this.oversets++;
        events.push({ type: 'overset', pin: pin.index });
      } else {
        pin.state = 'set';
        pin.holdLift = pin.setLift;
        pin.lift = to;
        pin.counter = 0;
        events.push({ type: 'set', pin: pin.index });
      }
      return;
    }
    pin.lift = to;
  }

  step(dtRaw: number, input: SimInput): { snapshot: SimSnapshot; events: SimEvent[] } {
    const dt = Math.min(0.034, Math.max(0.001, dtRaw));
    const events: SimEvent[] = [];
    const d = DIFFICULTY[this.difficulty];
    const t = Math.max(0, Math.min(1, input.tension));

    if (this.openState) {
      return { snapshot: this.snapshot(t, 0, 0, 0, 0), events };
    }

    // ── Tension release resets the attempt ───────────────────────────
    if (t < RELEASE_THRESHOLD) this.resetPins(events);

    // ── Move the tool towards the requested position (speed-limited) ─
    const minY = this.minTipY();
    const targetX = Math.max(0, Math.min(1, input.tx));
    const targetY = Math.max(minY, Math.min(MAX_LIFT + 0.05, input.ty));
    const maxDX = 5 * dt;
    const maxDY = 6 * dt;
    this.prevTipX = this.tipX;
    this.tipX += Math.max(-maxDX, Math.min(maxDX, targetX - this.tipX));
    this.tipY += Math.max(-maxDY, Math.min(maxDY, targetY - this.tipY));
    if (this.tipY < minY) this.tipY = minY;

    if (!this.started && (this.tipX > 0.05 || t > 0.1)) this.started = true;
    if (this.started) this.elapsed += dt;
    if (t > this.maxTension && this.started) this.maxTension = t;

    let binding = this.bindingPin(t);
    let maxPressureRatio = 0;
    let creak = 0;
    let contacts = 0;

    for (const pin of this.pins) {
      const P = this.pushHeight(pin);
      const touching = P > pin.lift - 0.002;
      if (touching && !pin.contact) events.push({ type: 'touch', pin: pin.index, binding: binding === pin.index });
      pin.contact = touching;
      pin.pressure = 0;
      if (touching) contacts++;
      const isBinding = binding === pin.index;

      if (touching && P > pin.lift) {
        const excess = P - pin.lift;
        if (pin.state === 'overset') {
          pin.pressure = Math.min(1, excess / 0.08);
          maxPressureRatio = Math.max(maxPressureRatio, pin.pressure);
        } else if (pin.state === 'set') {
          pin.lift = Math.min(MAX_LIFT, P);
          if (pin.lift > pin.setLift + d.margin * 1.6 && t >= d.oversetTension) {
            pin.state = 'overset';
            pin.holdLift = 0;
            this.oversets++;
            events.push({ type: 'overset', pin: pin.index });
          }
        } else if (pin.state === 'spool') {
          if (P <= pin.holdLift) {
            pin.lift = P;
          } else if (isBinding) {
            if (pin.lift < pin.holdLift) pin.lift = pin.holdLift;
            const ex = P - pin.lift;
            if (t <= d.counterMax) {
              // eased tension → the plug may rotate back; the spool climbs
              pin.lift += Math.min(ex, 0.9 * dt);
              pin.counter = Math.max(0, Math.min(1, (pin.lift - pin.spoolLift) / (pin.setLift - pin.spoolLift)));
              creak = Math.max(creak, 0.4 + pin.counter * 0.6);
              pin.pressure = Math.min(1, ex / 0.05) * 0.6;
              if (pin.lift >= pin.setLift) {
                pin.state = 'set';
                pin.holdLift = pin.setLift;
                pin.counter = 0;
                events.push({ type: 'set', pin: pin.index });
              }
            } else {
              // too much tension – the spool lip pushes back but will not move
              pin.pressure = Math.min(1, ex / 0.06);
              creak = Math.max(creak, pin.pressure * 0.8);
              pin.counter = Math.min(0.35, pin.pressure * 0.35);
            }
            maxPressureRatio = Math.max(maxPressureRatio, pin.pressure);
          } else {
            pin.lift = Math.min(MAX_LIFT, P);
          }
        } else {
          // free pin
          if (P <= pin.holdLift || !isBinding) {
            pin.lift = Math.min(MAX_LIFT, P);
          } else {
            if (pin.lift < pin.holdLift) pin.lift = pin.holdLift;
            const f = this.friction(t, pin);
            const ex = P - pin.lift;
            if (ex > f) {
              const from = pin.lift;
              const to = Math.min(MAX_LIFT, P - f * 0.1);
              this.resolveSlip(pin, from, to, t, events);
            } else {
              pin.pressure = ex / f;
              maxPressureRatio = Math.max(maxPressureRatio, pin.pressure);
            }
          }
        }
        void excess;
      } else {
        // ── Not pushed: pins fall back (spring / gravity / friction) ──
        const floor = touching ? P : 0;
        if (pin.state === 'overset') {
          // jammed in the shell
        } else {
          let speed: number;
          if (pin.lift > pin.holdLift) {
            if (pin.state === 'spool') speed = 2.2;
            else if (isBinding) speed = 6 * Math.max(0.05, 1 - t * 1.8);
            else speed = 6.5;
          } else {
            speed = 3.2; // free key pin falling under gravity
          }
          const target = Math.max(0, floor);
          const before = pin.lift;
          if (pin.lift > target) pin.lift = Math.max(target, pin.lift - speed * dt);
          // A binding pin that overshot drops back through the shear line → driver catches.
          if (
            isBinding &&
            pin.state === 'free' &&
            before > pin.setLift &&
            pin.lift <= pin.setLift + d.margin &&
            (pin.type !== 'spool' || before < pin.spoolLift)
          ) {
            pin.state = 'set';
            pin.holdLift = pin.setLift;
            pin.lift = Math.min(pin.lift, pin.setLift + d.margin * 0.5);
            events.push({ type: 'set', pin: pin.index });
          }
          if (pin.state === 'spool' && pin.lift <= pin.holdLift) pin.counter = 0;
          else if (pin.state === 'spool')
            pin.counter = Math.max(0, Math.min(1, (pin.lift - pin.spoolLift) / (pin.setLift - pin.spoolLift)));
        }
      }
    }

    // ── A newly binding pin that is already pushed too far ───────────
    for (let guard = 0; guard < this.pins.length; guard++) {
      const nb = this.bindingPin(t);
      if (nb === null || nb === binding) break;
      binding = nb;
      const p = this.pins[nb];
      if (p.state === 'free' && p.lift >= p.setLift) {
        if (p.lift > p.setLift + d.margin) {
          // With light tension the springy pin simply drops back below the shear line.
          if (t < d.oversetTension) break;
          p.state = 'overset';
          this.oversets++;
          events.push({ type: 'overset', pin: p.index });
        } else {
          p.state = 'set';
          p.holdLift = p.setLift;
          events.push({ type: 'set', pin: p.index });
        }
      } else break;
    }

    // ── Open? ─────────────────────────────────────────────────────────
    if (t >= this.catchMin && this.pins.every((p) => p.state === 'set' && p.lift <= p.setLift + d.margin)) {
      this.openState = true;
      events.push({ type: 'open' });
    }

    // feedback
    const dx = Math.abs(this.tipX - this.prevTipX) / dt;
    const scratch = this.tipX > 0.03 ? Math.min(1, dx / 2.2) * (contacts > 0 ? 1 : 0.35) : 0;
    const vibration = Math.min(1, maxPressureRatio);
    const holding = this.pins.some((p) => p.state !== 'free' || p.holdLift > 0);
    this.wasHolding = holding;
    this.lastTension = t;
    return { snapshot: this.snapshot(t, scratch, creak, vibration, maxPressureRatio), events };
  }

  plugAngle(t: number): number {
    if (this.openState) return 90;
    if (t < RELEASE_THRESHOLD) return 0;
    let a = 0.4 + t * 0.6;
    for (const p of this.pins) {
      if (p.state === 'set') a += 1.4;
      else if (p.state === 'spool') a += 7 * (1 - p.counter) + 1.4 * p.counter;
      a += p.serrationCaught * 0.45;
    }
    return a;
  }

  snapshot(t: number, scratch: number, creak: number, vibration: number, bendRatio: number): SimSnapshot {
    const binding = this.bindingPin(t);
    return {
      pins: this.pins.map((p) => ({ ...p })),
      tipX: this.tipX,
      tipY: this.tipY,
      shaftY: this.tipY - this.tool.hookHeight,
      bend: bendRatio,
      bindingPin: binding,
      plugAngle: this.plugAngle(t),
      open: this.openState,
      tension: t,
      scratch,
      creak,
      vibration,
      jammed: this.pins.some((p) => p.state === 'overset'),
      falseSet: this.pins.some((p) => p.state === 'spool'),
      elapsed: this.elapsed,
      started: this.started,
      maxTension: this.maxTension,
      oversets: this.oversets,
      resets: this.resets,
    };
  }

  /** Debug / test helper: is the lock currently holding anything. */
  get holding() {
    return this.wasHolding && this.lastTension >= 0;
  }
}
