// ─────────────────────────────────────────────────────────────
//  Locked — core domain types
// ─────────────────────────────────────────────────────────────

export type Belt =
  | 'white'
  | 'yellow'
  | 'orange'
  | 'green'
  | 'blue'
  | 'purple'
  | 'brown'
  | 'red'
  | 'black';

export type Mechanism = 'pin-tumbler' | 'wafer' | 'disc-detainer' | 'dimple' | 'lever' | 'tubular' | 'other';

export type LockFormFactor = 'padlock' | 'cylinder' | 'rim' | 'cam' | 'other';

export type PinType = 'standard' | 'spool' | 'serrated' | 'mushroom' | 't-pin' | 'unknown';

export interface PinConfig {
  /** 1-based chamber index counted from the front of the lock (keyway opening). */
  index: number;
  type: PinType;
  note?: string;
}

export interface LockItem {
  id: string;
  name: string;
  brand: string;
  mechanism: Mechanism;
  formFactor: LockFormFactor;
  pins: number;
  belt: Belt;
  keyway?: string;
  pinConfig: PinConfig[];
  /** Recorded binding order — chamber indices (1-based). May be partial. */
  bindingOrder: number[];
  notes: string;
  favorite?: boolean;
  createdAt: number;
}

export type ToolCategory = 'pick' | 'rake' | 'tension' | 'special';

export type ToolProfile =
  | 'short-hook'
  | 'medium-hook'
  | 'deep-hook'
  | 'gonzo-hook'
  | 'half-diamond'
  | 'ball'
  | 'bogota'
  | 'city-rake'
  | 'snake'
  | 'w-rake'
  | 'batman-2'
  | 'double-ball'
  | 'tok-bar'
  | 'bok-wrench'
  | 'twist-wrench'
  | 'disc-pick'
  | 'tubular-pick'
  | 'wafer-jiggler'
  | 'bypass-shim'
  | 'plug-spinner'
  | 'dimple-flag'
  | 'lever-pick'
  | 'key-extractor'
  | 'comb-pick'
  | 'bump-key'
  | 'other';

export type ToolThickness = '0.015' | '0.018' | '0.020' | '0.022' | '0.025' | '0.030' | '0.035' | '0.040' | '0.050' | '0.062';

export type WrenchPosition = 'TOK' | 'BOK' | 'n/a';

export interface ToolItem {
  id: string;
  name: string;
  manufacturer: string;
  category: ToolCategory;
  profile: ToolProfile;
  thickness: ToolThickness;
  position: WrenchPosition;
  notes: string;
  createdAt: number;
}

export type Technique = 'SPP' | 'Raking' | 'Bumping' | 'Bypass';

export type Penalty = 'none' | '+2' | 'DNF';

export type SolveSource = 'timer' | 'audio' | 'gauntlet' | 'manual';

export interface SolveRecord {
  id: string;
  /** Raw time in milliseconds (without penalty). */
  time: number;
  penalty: Penalty;
  lockId: string | null;
  pickId: string | null;
  tensionId: string | null;
  technique: Technique;
  note: string;
  date: number;
  source: SolveSource;
}

export type ChallengeKind = 'quiz-keyway' | 'quiz-xray' | 'gauntlet' | 'drill' | 'sim';

export type Rank = 'S' | 'A' | 'B' | 'C';

export type GauntletDifficulty = 'warmup' | 'standard' | 'pro' | 'elite';

export interface ChallengeResult {
  id: string;
  kind: ChallengeKind;
  date: number;
  /** Points (quiz) */
  score?: number;
  /** Total time in ms (gauntlet, sim) */
  time?: number;
  /** Cumulative split times in ms */
  splits?: number[];
  rank?: Rank;
  difficulty?: GauntletDifficulty;
  lockIds?: string[];
  /** Mode qualifiers – e.g. virtual gauntlet, blind sim etc. */
  virtual?: boolean;
  blind?: boolean;
  pins?: number;
  maxTension?: number;
  correct?: number;
  total?: number;
  bestStreak?: number;
  drillId?: string;
  dnf?: boolean;
}

export interface Settings {
  sound: boolean;
  volume: number;
  haptics: boolean;
  holdToStartMs: number;
  requireTwoFingers: boolean;
  inspectionSec: number;
  audioTrigger: boolean;
  audioThreshold: number;
  hideTimeWhileRunning: boolean;
  simDifficulty: 'easy' | 'normal' | 'hard';
  showBindingHint: boolean;
  theme: 'light' | 'dark' | 'system';
}

export interface TimerConfig {
  lockId: string | null;
  pickId: string | null;
  tensionId: string | null;
  technique: Technique;
}

export interface DrillProgress {
  /** YYYY-MM-DD → completed drill ids */
  [day: string]: string[];
}

export interface AppData {
  version: number;
  ethicsAccepted: boolean;
  locks: LockItem[];
  tools: ToolItem[];
  solves: SolveRecord[];
  challenges: ChallengeResult[];
  settings: Settings;
  timerConfig: TimerConfig;
  badges: Record<string, number>;
  drills: DrillProgress;
  /** Set once the old auto-seeded demo history (ids `seed-*`) has been removed. */
  demoCleaned?: boolean;
}

/** Simulator lock definition (also derivable from a LockItem). */
export interface SimLockSpec {
  pins: number;
  pinTypes: Exclude<PinType, 'unknown' | 'mushroom' | 't-pin'>[];
  bindingOrder: number[]; // 0-based chamber indices
  keyPinLengths: number[]; // normalised set lift for each chamber (0..1)
  seed: number;
  label?: string;
}

export type TabId = 'timer' | 'arcade' | 'library' | 'gear' | 'stats';
