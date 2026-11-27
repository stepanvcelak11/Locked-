import type { Belt, LockFormFactor, Mechanism, PinType, Technique, ToolCategory, ToolProfile, ToolThickness } from '../types';

export const BELTS: { id: Belt; label: string; color: string; text: string; desc: string }[] = [
  { id: 'white', label: 'Bílý', color: '#f1f5f9', text: '#0f172a', desc: 'Úplné začátky – průhledné a nejlevnější zámky.' },
  { id: 'yellow', label: 'Žlutý', color: '#facc15', text: '#1c1917', desc: 'Jednoduché visací zámky se standardními stavítky.' },
  { id: 'orange', label: 'Oranžový', color: '#f97316', text: '#1c1917', desc: 'První bezpečnostní stavítka (spool), false sety.' },
  { id: 'green', label: 'Zelený', color: '#22c55e', text: '#052e16', desc: 'Kombinace spool + serrated, užší profily.' },
  { id: 'blue', label: 'Modrý', color: '#3b82f6', text: '#eff6ff', desc: 'Paracentrické profily, náročná kontrola napětí.' },
  { id: 'purple', label: 'Fialový', color: '#a855f7', text: '#faf5ff', desc: 'Vysoce bezpečnostní vložky, aktivní prvky.' },
  { id: 'brown', label: 'Hnědý', color: '#92400e', text: '#fef3c7', desc: 'Sidebary, magnetické a hybridní systémy.' },
  { id: 'red', label: 'Červený', color: '#dc2626', text: '#fef2f2', desc: 'Elitní zámky, otevřené jen pár lidmi.' },
  { id: 'black', label: 'Černý', color: '#0a0a0a', text: '#fafafa', desc: 'Nejtěžší zámky světa – vyžadují vlastní nástroje.' },
];

export const beltOf = (b: Belt) => BELTS.find((x) => x.id === b) ?? BELTS[0];
export const beltRank = (b: Belt) => BELTS.findIndex((x) => x.id === b);

export const MECHANISMS: Record<Mechanism, string> = {
  'pin-tumbler': 'Stavítkový (Pin Tumbler)',
  wafer: 'Lamelový (Wafer)',
  'disc-detainer': 'Diskový (Disc Detainer)',
  dimple: 'Důlkový (Dimple)',
  lever: 'Dozický (Lever)',
  tubular: 'Tubulární (Tubular)',
  other: 'Jiný',
};

export const FORM_FACTORS: Record<LockFormFactor, string> = {
  padlock: 'Visací zámek',
  cylinder: 'Cylindrická vložka',
  rim: 'Rim / nástavná',
  cam: 'Vačkový (skříňky)',
  other: 'Jiné',
};

export const PIN_TYPES: Record<PinType, { label: string; short: string; color: string }> = {
  standard: { label: 'Standard', short: 'STD', color: '#94a3b8' },
  spool: { label: 'Spool (cívka)', short: 'SPL', color: '#f59e0b' },
  serrated: { label: 'Serrated (vroubky)', short: 'SER', color: '#38bdf8' },
  mushroom: { label: 'Mushroom (hřib)', short: 'MSH', color: '#a78bfa' },
  't-pin': { label: 'T-pin', short: 'T', color: '#f472b6' },
  unknown: { label: 'Neznámé', short: '?', color: '#475569' },
};

export const TOOL_CATEGORIES: Record<ToolCategory, string> = {
  pick: 'Planžety (SPP)',
  rake: 'Hrábě (Rakes)',
  tension: 'Napínáky',
  special: 'Speciální',
};

export const TOOL_PROFILES: Record<ToolProfile, { label: string; category: ToolCategory }> = {
  'short-hook': { label: 'Short Hook', category: 'pick' },
  'medium-hook': { label: 'Medium Hook', category: 'pick' },
  'deep-hook': { label: 'Deep Hook', category: 'pick' },
  'gonzo-hook': { label: 'Gonzo / Offset Hook', category: 'pick' },
  'half-diamond': { label: 'Half-Diamond', category: 'pick' },
  ball: { label: 'Ball / Half-Ball', category: 'pick' },
  bogota: { label: 'Bogota / „Batman“ (3 vlny)', category: 'rake' },
  'city-rake': { label: 'City Rake (L-Rake)', category: 'rake' },
  snake: { label: 'Snake / S-Rake', category: 'rake' },
  'w-rake': { label: 'W-Rake / Wave', category: 'rake' },
  'batman-2': { label: 'Bogota / „Batman“ (2 vlny)', category: 'rake' },
  'double-ball': { label: 'Double Ball / Snowman', category: 'pick' },
  'tok-bar': { label: 'TOK Pry Bar', category: 'tension' },
  'bok-wrench': { label: 'BOK Z-Wrench', category: 'tension' },
  'twist-wrench': { label: 'Twist Flex Wrench', category: 'tension' },
  'disc-pick': { label: 'Disc Detainer Pick', category: 'special' },
  'tubular-pick': { label: 'Tubular Pick', category: 'special' },
  'wafer-jiggler': { label: 'Jiggler / Wafer Pick', category: 'special' },
  'bypass-shim': { label: 'Shim / Bypass', category: 'special' },
  'plug-spinner': { label: 'Plug Spinner', category: 'special' },
  'dimple-flag': { label: 'Důlková planžeta (flag)', category: 'special' },
  'lever-pick': { label: 'Dozický háček', category: 'special' },
  'key-extractor': { label: 'Vytahovák zlomených klíčů', category: 'special' },
  'comb-pick': { label: 'Hřebínek (comb)', category: 'special' },
  'bump-key': { label: 'Bump klíč', category: 'special' },
  other: { label: 'Jiný', category: 'special' },
};

export const THICKNESSES: { id: ToolThickness; mm: string }[] = [
  { id: '0.015', mm: '0.38' },
  { id: '0.018', mm: '0.46' },
  { id: '0.020', mm: '0.5' },
  { id: '0.022', mm: '0.56' },
  { id: '0.025', mm: '0.6' },
  { id: '0.030', mm: '0.76' },
  { id: '0.035', mm: '0.89' },
  { id: '0.040', mm: '1.0' },
  { id: '0.050', mm: '1.27' },
  { id: '0.062', mm: '1.57' },
];

export const thicknessLabel = (t: ToolThickness) => {
  const m = THICKNESSES.find((x) => x.id === t);
  return `${t}" / ${m?.mm ?? '?'} mm`;
};

export const TECHNIQUES: { id: Technique; label: string; desc: string }[] = [
  { id: 'SPP', label: 'SPP', desc: 'Single Pin Picking – stavítko po stavítku' },
  { id: 'Raking', label: 'Raking', desc: 'Hrábě – rychlé zametání více stavítek' },
  { id: 'Bumping', label: 'Bumping', desc: 'Bump klíč – přenos impulsu' },
  { id: 'Bypass', label: 'Bypass', desc: 'Obejití mechanismu (shim, decoder)' },
];
