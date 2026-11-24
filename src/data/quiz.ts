export type KeywayShape =
  | 'kw-standard'
  | 'kw-paracentric'
  | 'kw-schlage'
  | 'kw-abus'
  | 'kw-disc'
  | 'kw-dimple'
  | 'kw-wafer'
  | 'kw-lever'
  | 'kw-tubular'
  | 'kw-master';

export type SilhouetteShape = 'sil-padlock' | 'sil-euro' | 'sil-disc' | 'sil-cam' | 'sil-mortise' | 'sil-tubular' | 'sil-brass-padlock';

export type XrayShape =
  | 'xr-pin'
  | 'xr-spool'
  | 'xr-serrated'
  | 'xr-mushroom'
  | 'xr-wafer'
  | 'xr-disc'
  | 'xr-dimple'
  | 'xr-lever'
  | 'xr-tubular';

export interface KeywayQuestion {
  id: string;
  visual: { kind: 'keyway'; shape: KeywayShape } | { kind: 'silhouette'; shape: SilhouetteShape };
  prompt: string;
  type: string;
  tool: string;
  explain: string;
}

export const KEYWAY_QUESTIONS: KeywayQuestion[] = [
  {
    id: 'q-kw-standard',
    visual: { kind: 'keyway', shape: 'kw-standard' },
    prompt: 'Jaký zámek má tento profil klíčové dírky?',
    type: 'Stavítková vložka (Yale profil)',
    tool: 'Short hook + BOK',
    explain: 'Jednoduchý vlnitý profil se širokým prostorem pod stavítky – klasika s pin tumbler mechanismem.',
  },
  {
    id: 'q-kw-paracentric',
    visual: { kind: 'keyway', shape: 'kw-paracentric' },
    prompt: 'Jaký zámek má tento profil klíčové dírky?',
    type: 'Paracentrická eurovložka',
    tool: 'Offset hook + TOK',
    explain: 'Výstupky (warding) zasahují přes střed – planžeta musí být tenká nebo s posunutou špičkou, napínák nahoře šetří místo.',
  },
  {
    id: 'q-kw-schlage',
    visual: { kind: 'keyway', shape: 'kw-schlage' },
    prompt: 'Jaký zámek má tento profil klíčové dírky?',
    type: 'Stavítkový zámek (profil SC1)',
    tool: 'Short hook + TOK',
    explain: 'Typický americký profil s několika zářezy – otevřený, ideální pro TOK napínák.',
  },
  {
    id: 'q-kw-abus',
    visual: { kind: 'keyway', shape: 'kw-abus' },
    prompt: 'Jaký zámek má tento profil klíčové dírky?',
    type: 'Visací zámek s úzkým profilem (Abus)',
    tool: 'Short hook 0.020" + TOK',
    explain: 'Úzký, mírně zalomený profil – tenčí planžeta projde snáz.',
  },
  {
    id: 'q-kw-disc',
    visual: { kind: 'keyway', shape: 'kw-disc' },
    prompt: 'Jaký zámek má tento profil klíčové dírky?',
    type: 'Diskový zámek (Disc Detainer)',
    tool: 'Disc detainer pick',
    explain: 'Půlměsícový otvor odpovídá polokruhovému klíči, který otáčí disky. Klasická planžeta zde nefunguje.',
  },
  {
    id: 'q-kw-dimple',
    visual: { kind: 'keyway', shape: 'kw-dimple' },
    prompt: 'Jaký zámek má tento profil klíčové dírky?',
    type: 'Důlkový zámek (Dimple)',
    tool: 'Dimple flag pick',
    explain: 'Plochý horizontální otvor – klíč se zasouvá naplocho, stavítka tlačí do důlků.',
  },
  {
    id: 'q-kw-wafer',
    visual: { kind: 'keyway', shape: 'kw-wafer' },
    prompt: 'Jaký zámek má tento profil klíčové dírky?',
    type: 'Lamelový zámek (Wafer)',
    tool: 'Jiggler / Ball pick',
    explain: 'Symetrický obdélníkový profil s jednoduchými drážkami – typické pro schránky a skříňky.',
  },
  {
    id: 'q-kw-lever',
    visual: { kind: 'keyway', shape: 'kw-lever' },
    prompt: 'Jaký zámek má tento profil klíčové dírky?',
    type: 'Dozický zámek (Lever)',
    tool: 'Curtain / lever pick',
    explain: 'Tvar „klíčové dírky“ ze starých dveří – pro klíč s plným zubem (bit key).',
  },
  {
    id: 'q-kw-tubular',
    visual: { kind: 'keyway', shape: 'kw-tubular' },
    prompt: 'Jaký zámek má tento profil klíčové dírky?',
    type: 'Tubulární zámek',
    tool: 'Tubular pick',
    explain: 'Kruhový otvor se středovým trnem – stavítka jsou do kruhu.',
  },
  {
    id: 'q-kw-master',
    visual: { kind: 'keyway', shape: 'kw-master' },
    prompt: 'Jaký zámek má tento profil klíčové dírky?',
    type: 'Levný laminovaný visací zámek',
    tool: 'Bogota rake',
    explain: 'Široký otevřený profil a velké tolerance – raking často otevře během pár sekund.',
  },
  {
    id: 'q-sil-padlock',
    visual: { kind: 'silhouette', shape: 'sil-padlock' },
    prompt: 'Co je to za zámek?',
    type: 'Laminovaný visací zámek',
    tool: 'City rake',
    explain: 'Vrstvené ocelové plechy, stavítkový mechanismus s velkými tolerancemi.',
  },
  {
    id: 'q-sil-euro',
    visual: { kind: 'silhouette', shape: 'sil-euro' },
    prompt: 'Co je to za zámek?',
    type: 'Cylindrická eurovložka',
    tool: 'Short hook + TOK',
    explain: 'Profil „hruška“ s otvorem pro šroub – nejčastější dveřní vložka v Evropě.',
  },
  {
    id: 'q-sil-disc',
    visual: { kind: 'silhouette', shape: 'sil-disc' },
    prompt: 'Co je to za zámek?',
    type: 'Diskový visací zámek',
    tool: 'Disc detainer pick',
    explain: 'Kulaté tělo s krátkým třmenem a půlměsícovou dírkou – diskový mechanismus.',
  },
  {
    id: 'q-sil-cam',
    visual: { kind: 'silhouette', shape: 'sil-cam' },
    prompt: 'Co je to za zámek?',
    type: 'Vačkový zámek skříňky (Wafer)',
    tool: 'Jiggler / Ball pick',
    explain: 'Krátký zámek s vačkou na zadní straně – obvykle lamelový.',
  },
  {
    id: 'q-sil-mortise',
    visual: { kind: 'silhouette', shape: 'sil-mortise' },
    prompt: 'Co je to za zámek?',
    type: 'Zadlabací dozický zámek',
    tool: 'Curtain / lever pick',
    explain: 'Plochá skříň zabudovaná ve dveřích s otvorem pro klíč s plným zubem.',
  },
  {
    id: 'q-sil-tubular',
    visual: { kind: 'silhouette', shape: 'sil-tubular' },
    prompt: 'Co je to za zámek?',
    type: 'Tubulární zámek',
    tool: 'Tubular pick',
    explain: 'Kulaté čelo se stavítky v kruhu – automaty a zámky kol.',
  },
  {
    id: 'q-sil-brass',
    visual: { kind: 'silhouette', shape: 'sil-brass-padlock' },
    prompt: 'Co je to za zámek?',
    type: 'Mosazný visací zámek se spooly',
    tool: 'Short hook + TOK',
    explain: 'Masivní mosazné tělo bývá vybaveno spool piny – nutné SPP s kontrolou napětí.',
  },
];

export interface XrayQuestion {
  id: string;
  shape: XrayShape;
  mechanism: string;
  weakness: string;
  explain: string;
}

export const XRAY_QUESTIONS: XrayQuestion[] = [
  {
    id: 'x-pin',
    shape: 'xr-pin',
    mechanism: 'Stavítkový se standardními piny',
    weakness: 'náchylné na raking',
    explain: 'Hladká stavítka bez bezpečnostních prvků – raking nebo rychlé SPP.',
  },
  {
    id: 'x-spool',
    shape: 'xr-spool',
    mechanism: 'Stavítkový se spool piny',
    weakness: 'vyžaduje counter-rotation',
    explain: 'Zúžený pas driveru způsobí false set; při zvedání je nutné povolit napětí.',
  },
  {
    id: 'x-serrated',
    shape: 'xr-serrated',
    mechanism: 'Stavítkový se serrated piny',
    weakness: 'falešná kliknutí – nutné lehké napětí',
    explain: 'Vroubky dávají mikro-sety; pokračuj ve zvedání až do zřetelného pootočení.',
  },
  {
    id: 'x-mushroom',
    shape: 'xr-mushroom',
    mechanism: 'Stavítkový s mushroom piny',
    weakness: 'mělký false set, jemná counter-rotation',
    explain: 'Hřibová hlava se zachytí podobně jako spool, ale reakce je jemnější.',
  },
  {
    id: 'x-wafer',
    shape: 'xr-wafer',
    mechanism: 'Lamelový (Wafer)',
    weakness: 'náchylné na jiggling a raking',
    explain: 'Ploché lamely s velkými tolerancemi – rychle se „rozhoupou“.',
  },
  {
    id: 'x-disc',
    shape: 'xr-disc',
    mechanism: 'Diskový (Disc Detainer)',
    weakness: 'binding order disků, nutný speciální nástroj',
    explain: 'Bez pružin nejde rakovat; disky se nastavují jeden po druhém speciálním nástrojem.',
  },
  {
    id: 'x-dimple',
    shape: 'xr-dimple',
    mechanism: 'Důlkový (Dimple)',
    weakness: 'lineární řada pinů – dimple flag pick',
    explain: 'Stavítko jde z boku na plochu klíče; levné modely mají velké tolerance.',
  },
  {
    id: 'x-lever',
    shape: 'xr-lever',
    mechanism: 'Dozický (Lever)',
    weakness: 'zpětná vazba přes závoru (stump)',
    explain: 'Tlak na závoru určí, která doza je sevřená – dozy se zvedají postupně.',
  },
  {
    id: 'x-tubular',
    shape: 'xr-tubular',
    mechanism: 'Tubulární',
    weakness: 'tubular pick zároveň dekóduje',
    explain: 'Kruhové uspořádání stavítek – nástroj s jehlami je nastaví i zapamatuje.',
  },
];
