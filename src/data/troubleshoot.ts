import type { GlossaryArtId } from '../components/svg/Diagrams';
import type { IconName } from '../components/Icon';

export type ProblemAnim = 'overset' | 'gaps' | 'drop' | 'tension';

export interface Problem {
  id: string;
  /** what the person experiences, in their words */
  title: string;
  short: string;
  icon: IconName;
  color: string;
  anim?: ProblemAnim;
  art?: GlossaryArtId;
  /** most likely first */
  causes: string[];
  steps: string[];
  tip?: string;
  practice?: 'simulator';
}

export const PROBLEMS: Problem[] = [
  {
    id: 'looks-set',
    title: 'Vypadá to nastavené, ale neotočí se',
    short: 'Hlavně u průhledných zámků',
    icon: 'eye',
    color: '#FF3B30',
    anim: 'overset',
    causes: [
      'Jedno stavítko je přemačknuté: zvedl jsi ho o kousek moc a zlaté spodní stavítko teď trčí přes hranici bubínku. Nejčastěji to bývá zadní stavítko.',
      'Díváš se na špatnou věc. Do řady nemají přijít špičky stavítek, ale mezery mezi zlatým a šedým stavítkem. Každé spodní stavítko je jinak dlouhé.',
      'Tlačíš na napínák moc. Nastavený zámek se otočí skoro sám – když se nehne, sílou to nespravíš.',
      'Průhledný plast láme světlo. Když se díváš šikmo, čáry se zdánlivě posunou.',
    ],
    steps: [
      'Drž lehké napětí a planžetou se postupně dotkni všech stavítek.',
      'Najdi to, které je tvrdé a nejde nahoru ani nepruží – to je přemačknuté.',
      'Trochu povol napínák, dokud stavítko necvakne dolů. Ostatní by měla zůstat nahoře.',
      'Zvedni ho znovu, pomaleji a méně.',
      'Dívej se na zámek přesně z boku, v úrovni očí.',
    ],
    tip: 'Zkus otočit i na druhou stranu – některé visací zámky jdou snáz jedním směrem.',
    practice: 'simulator',
  },
  {
    id: 'gaps',
    title: 'Nevím, na co se v průhledném zámku dívat',
    short: 'Špičky vs. mezery',
    icon: 'search',
    color: '#5856D6',
    anim: 'gaps',
    causes: ['Spodní (zlatá) stavítka mají každé jinou délku – podle toho se liší zuby na klíči. Když jsou správně, jejich špičky nejsou v jedné řadě.'],
    steps: [
      'Najdi oranžovou čáru – hranici mezi bubínkem a tělem zámku.',
      'U každé komůrky sleduj mezeru mezi zlatým a šedým stavítkem.',
      'Stavítko je nastavené, když je tahle mezera přesně na čáře a šedé stavítko zůstane nahoře.',
    ],
    tip: 'Až to budeš umět, zkus otevírat se zavřenýma očima. Hmat tě naučí víc než pohled.',
  },
  {
    id: 'drop',
    title: 'Stavítka mi padají zpátky',
    short: 'Nastavené se ztratí, když jdu na další',
    icon: 'arrowUp',
    color: '#FF9500',
    anim: 'drop',
    causes: [
      'Když přesouváš planžetu, nevědomky povolíš napínák.',
      'Napětí je celkově moc slabé – nastavené stavítko se nemá o co opřít.',
      'Napínák ti v otvoru klouže nebo se posouvá.',
    ],
    steps: [
      'Opři prst o napínák a drž ho pořád stejně, i když druhá ruka pracuje.',
      'Přidej trochu síly – jen tolik, aby bylo vždy jedno stavítko tuhé.',
      'Zkus jinou tloušťku napínáku nebo ho dej nahoru (TOK), kde lépe drží.',
    ],
    practice: 'simulator',
  },
  {
    id: 'all-stiff',
    title: 'Všechna stavítka jsou tuhá',
    short: 'Nic se nedá zvednout',
    icon: 'lock',
    color: '#AF52DE',
    anim: 'tension',
    causes: ['Moc velké napětí – zaseknou se všechna stavítka najednou a žádné nejde zvednout.', 'Některé stavítko je přemačknuté a drží bubínek.'],
    steps: [
      'Povol napínák skoro na nulu a pomalu přidávej, dokud neucítíš jedno tuhé stavítko.',
      'Když to nepomůže, povol úplně, nech stavítka spadnout a začni znovu.',
    ],
    tip: 'Síla jako když mačkáš klávesu na mobilu. Víc na začátek nepotřebuješ.',
    practice: 'simulator',
  },
  {
    id: 'all-springy',
    title: 'Všechno pruží, nic není tuhé',
    short: 'Nenajdu tuhé stavítko',
    icon: 'zap',
    color: '#34C759',
    art: 'binding',
    causes: [
      'Napětí je moc slabé.',
      'Otáčíš na stranu, kam se bubínek otočit nemůže, a napínák tlačí jen do zarážky.',
      'Planžeta stavítka zvedá jen kousek a na tuhé nedosáhne.',
    ],
    steps: ['Přidej trochu napětí.', 'Zkus otáčet na druhou stranu.', 'Projdi stavítka od zadu dopředu a každé zvedni o něco výš – pozor ale na přemačknutí.'],
  },
  {
    id: 'false-set',
    title: 'Bubínek se pootočil víc, ale neotevřelo se',
    short: 'Falešné otevření (false set)',
    icon: 'rotate',
    color: '#FF2D55',
    art: 'falseset',
    causes: ['V zámku je bezpečnostní stavítko, nejčastěji spool. Je to vlastně dobrá zpráva: většina stavítek už je nastavená.'],
    steps: [
      'Nepovoluj úplně – přišel bys o všechna nastavená stavítka.',
      'Najdi stavítko, které při zvedání tlačí napínák zpátky proti prstu.',
      'Zvedej ho a zároveň lehce povol, aby se bubínek mohl kousek vrátit.',
      'Jakmile cvakne, zase přitlač a pokračuj.',
    ],
    tip: 'Podrobně to popisuje návod „Spool a falešné otevření“.',
    practice: 'simulator',
  },
  {
    id: 'rake',
    title: 'Hrábě nic nedělají',
    short: 'Zasouvám a vysouvám a nic',
    icon: 'sliders',
    color: '#30B0C7',
    art: 'raking',
    causes: [
      'Moc velké napětí – u hrábí musí být ještě lehčí než s hákem.',
      'Taháš pořád stejně rychle a ve stejné výšce.',
      'Zámek má bezpečnostní stavítka – na ta hrábě moc nefungují.',
    ],
    steps: [
      'Povol napětí skoro na nulu.',
      'Při tazích hrábě kolébej nahoru a dolů, měň rychlost i hloubku.',
      'Během hrabání napětí lehce pulzuj – chvilku víc, chvilku míň.',
      'Když se bubínek pootočí, ale neotevře, dokonči zbytek hákem.',
    ],
  },
  {
    id: 'back-pin',
    title: 'Nedosáhnu na zadní stavítko',
    short: 'Zvedám i ta přední',
    icon: 'pick',
    color: '#007AFF',
    art: 'order',
    causes: ['Dřík planžety se opírá o přední stavítka a zvedá je spolu se zadním.', 'Hák je na vysoké zadní stavítko moc krátký.'],
    steps: [
      'Opři dřík o spodek otvoru a zvedej jen špičkou, jako páčkou.',
      'Drž rukojeť níž, aby planžeta šla dovnitř trochu šikmo.',
      'Zkus delší hák (Deep Hook), nebo dej napínák nahoru (TOK), ať je víc místa.',
    ],
  },
  {
    id: 'wrench',
    title: 'Napínák vyklouzává nebo překáží',
    short: 'Nedrží v otvoru',
    icon: 'tension',
    color: '#21A44A',
    art: 'tokbok',
    causes: ['Napínák je pro tenhle otvor moc tenký nebo moc tlustý.', 'Je dole (BOK) a planžeta ho při práci vytlačuje.'],
    steps: [
      'Zkus jinou tloušťku – napínák má zapadnout bez vůle.',
      'Dej ho nahoru (TOK) – drží pevněji a planžeta má víc místa.',
      'Tlač na něj blízko zámku, ne za konec ramene.',
    ],
  },
  {
    id: 'stuck',
    title: 'Planžeta se zasekla v zámku',
    short: 'Nejde vytáhnout',
    icon: 'x',
    color: '#8E8E93',
    causes: ['Stavítko spadlo za hák a drží ho.', 'Planžeta se zachytila o výstupek v otvoru.'],
    steps: [
      'Netahej silou – planžetu můžeš zlomit.',
      'Úplně povol a vyndej napínák.',
      'Natoč planžetu doprostřed otvoru a jemně ji vytahuj, přitom ji lehce zvedej a spouštěj.',
      'Kdyby se ulomila, vytáhni úlomek pinzetou nebo vytahovákem na zlomené klíče. Nic do zámku netluč.',
    ],
  },
  {
    id: 'lucky',
    title: 'Otevřelo se, ale nevím jak',
    short: 'Náhoda, nebo dovednost?',
    icon: 'help',
    color: '#FFCC00',
    causes: ['Běžné hlavně při hrabání nebo u levných zámků s velkými vůlemi.'],
    steps: [
      'Zavři zámek a zkus to znovu úplně stejně.',
      'Potom ho otevři jen hákem, stavítko po stavítku.',
      'Až zjistíš pořadí, v jakém stavítka tuhnou, zapiš si ho do Výbavy.',
    ],
  },
];
