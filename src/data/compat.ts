import type { Mechanism, ToolProfile } from '../types';

/** 2 = ideální volba, 1 = použitelné / doplněk, 0 (nebo chybí) = nevhodné */
export type Fit = 0 | 1 | 2;

export const LOCK_KINDS: { id: Exclude<Mechanism, 'other'>; short: string }[] = [
  { id: 'pin-tumbler', short: 'Stavítkový' },
  { id: 'wafer', short: 'Lamelový' },
  { id: 'disc-detainer', short: 'Diskový' },
  { id: 'dimple', short: 'Důlkový' },
  { id: 'lever', short: 'Dozický' },
  { id: 'tubular', short: 'Trubkový' },
];

type Row = Partial<Record<Exclude<Mechanism, 'other'>, Fit>>;

/** Which catalogue tool suits which mechanism. Notes explain the less obvious pairings. */
export const COMPAT: Record<ToolProfile, { fit: Row; note?: string }> = {
  'short-hook': { fit: { 'pin-tumbler': 2, wafer: 1 }, note: 'Základní SPP nástroj pro většinu stavítkových zámků.' },
  'medium-hook': { fit: { 'pin-tumbler': 2, wafer: 1 } },
  'deep-hook': { fit: { 'pin-tumbler': 2 }, note: 'Na vysoké/nízké kombinace (high-low bitting).' },
  'gonzo-hook': { fit: { 'pin-tumbler': 2 }, note: 'Na paracentrické profily, kde rovný hák neprojde.' },
  'half-diamond': { fit: { 'pin-tumbler': 1, wafer: 2 }, note: 'U stavítkových hlavně na zipping a jednotlivé piny.' },
  ball: { fit: { wafer: 2, 'pin-tumbler': 1 }, note: 'Kulatá špička klouže po lamelách.' },
  bogota: { fit: { 'pin-tumbler': 2, wafer: 1 } },
  'city-rake': { fit: { 'pin-tumbler': 2, wafer: 1 } },
  snake: { fit: { wafer: 2, 'pin-tumbler': 1 } },
  'w-rake': { fit: { wafer: 2, 'pin-tumbler': 1 } },
  'tok-bar': { fit: { 'pin-tumbler': 2, dimple: 2, wafer: 1 }, note: 'Tenký TOK je jediná rozumná cesta do důlkových zámků.' },
  'bok-wrench': { fit: { 'pin-tumbler': 2, wafer: 2, dimple: 1, lever: 1 } },
  'twist-wrench': { fit: { 'pin-tumbler': 2, wafer: 1, dimple: 1 } },
  'disc-pick': { fit: { 'disc-detainer': 2 }, note: 'Musí odpovídat průměru a profilu konkrétního zámku.' },
  'tubular-pick': { fit: { tubular: 2 }, note: 'Podle počtu stavítek (7 nebo 8).' },
  'wafer-jiggler': { fit: { wafer: 2 }, note: 'Sada zkušebních klíčů pro lamelové zámky.' },
  'bypass-shim': { fit: { 'pin-tumbler': 1, wafer: 1 }, note: 'Jen visací zámky – obchází mechanismus přes třmen.' },
  'plug-spinner': { fit: { 'pin-tumbler': 1, wafer: 1 }, note: 'Pomocník, když otevřeš špatným směrem.' },
  other: { fit: {} },
} as Record<ToolProfile, { fit: Row; note?: string }>;

/** Specialised tools that exist but are not in the tool catalogue. */
export const EXTRA_TOOLS: Partial<Record<Mechanism, string>> = {
  dimple: 'Speciální důlkové planžety (flag picks) s ohnutou špičkou.',
  lever: 'Dozický háček (lever/curtain pick) a napínák do klíčové dírky.',
  'disc-detainer': 'Planžeta s předním napínacím prvkem přesně pro daný zámek.',
};

export const fitOf = (tool: ToolProfile, lock: Exclude<Mechanism, 'other'>): Fit => COMPAT[tool]?.fit[lock] ?? 0;
