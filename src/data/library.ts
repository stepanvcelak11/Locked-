import type { Mechanism, PinType, ToolProfile } from '../types';
import type { IconName } from '../components/Icon';
import type { GlossaryArtId } from '../components/svg/Diagrams';

export interface ToolGuide {
  profile: ToolProfile;
  name: string;
  group: 'pick' | 'rake' | 'tension' | 'special';
  tagline: string;
  when: string;
  how: string;
  pros: string[];
  cons: string[];
  /** Animation used in the "How to use" mini cutaway */
  motion: 'lift' | 'deep-lift' | 'rake-rock' | 'rake-scrub' | 'zip' | 'yank' | 'extract' | 'tension-tok' | 'tension-bok' | 'disc-rotate' | 'none';
}

export const TOOL_GUIDE: ToolGuide[] = [
  {
    profile: 'short-hook',
    name: 'Short Hook',
    group: 'pick',
    tagline: 'Švýcarský nůž SPP – první planžeta, kterou koupíš.',
    when: 'Na většinu stavítkových zámků se standardním až mírně proměnlivým bittingem. Výchozí volba pro single pin picking.',
    how: 'Opři dřík o spodní hranu klíčové dírky jako o páku a hrotem zvedej jedno stavítko po druhém. Pohyb jde ze zápěstí, ne z prstů – malé, kontrolované páčení.',
    pros: ['Projde i užšími profily', 'Přesná kontrola nad jedním stavítkem', 'Malá šance zavadit o sousední piny'],
    cons: ['Za nízkým předním stavítkem nedosáhne na vysoké zadní'],
    motion: 'lift',
  },
  {
    profile: 'medium-hook',
    name: 'Medium Hook',
    group: 'pick',
    tagline: 'Kompromis mezi dosahem a ovladatelností.',
    when: 'Když short hook nestačí na výšku zadního stavítka, ale deep hook se v profilu zasekává.',
    how: 'Stejně jako short hook, jen hrot zasuň za stavítko, které chceš zvednout, a dbej na to, aby dřík neležel na předních pinech.',
    pros: ['Univerzální dosah'],
    cons: ['Do velmi úzkých profilů se hůře vejde'],
    motion: 'lift',
  },
  {
    profile: 'deep-hook',
    name: 'Deep Hook',
    group: 'pick',
    tagline: 'Specialista na extrémní bitting.',
    when: 'Ideální, když se za velmi nízkým předním stavítkem skrývá vysoké zadní stavítko – dlouhý hrot dosáhne nahoru, aniž bys dříkem přemačkal přední pin.',
    how: 'Hrot zaveď hluboko pod cílové stavítko s dříkem co nejníž. Zvedej pomalu – dlouhá páka znamená větší sílu i větší riziko přemačkání.',
    pros: ['Dosáhne na vysoká stavítka za nízkými', 'Klíčový nástroj pro vysoce bezpečnostní vložky'],
    cons: ['Hůř se manévruje', 'Snadno zavadí o sousední stavítka'],
    motion: 'deep-lift',
  },
  {
    profile: 'gonzo-hook',
    name: 'Gonzo / Offset Hook',
    group: 'pick',
    tagline: 'Hák s posunutou špičkou pro paracentrické profily.',
    when: 'Pro velmi zalomené (paracentrické) profily typu evropských vložek, kde rovný hák nedosáhne ke stavítku.',
    how: 'Natoč hrot podle profilu klíčové dírky; zvedej krátkými pohyby přes boční hranu warding.',
    pros: ['Obchází warding'],
    cons: ['Specifický – na otevřené profily zbytečný'],
    motion: 'lift',
  },
  {
    profile: 'half-diamond',
    name: 'Half-Diamond',
    group: 'pick',
    tagline: 'Hybrid: umí SPP i jemný raking (zipping).',
    when: 'Na lamelové zámky, krátké visací zámky a pro „zipping“ – rychlé vytažení s nadzvednutím přes všechna stavítka.',
    how: 'Pro SPP jako hák. Pro zipping zasuň dozadu, lehce zvedni a plynule vytáhni ven – šikmé hrany zvednou každé stavítko.',
    pros: ['Univerzální', 'Funguje na wafery', 'Šikmé hrany kloužou po pinech'],
    cons: ['Méně přesný než hák na vysoké biting'],
    motion: 'zip',
  },
  {
    profile: 'ball',
    name: 'Ball / Half-Ball',
    group: 'pick',
    tagline: 'Kulatý hrot pro lamely a dvoustranné zámky.',
    when: 'Lamelové zámky (schránky, skříňky), dvouřadé wafery a zámky s lamelami nahoře i dole.',
    how: 'Vjížděj a vyjížděj s mírným kolébáním; kulatý hrot neuvízne za hranou lamely.',
    pros: ['Neuvízne', 'Jemné na wafery'],
    cons: ['Málo přesný pro SPP'],
    motion: 'zip',
  },
  {
    profile: 'bogota',
    name: 'Bogota Rake',
    group: 'rake',
    tagline: 'Tři hrbolky – legenda raking komunity.',
    when: 'Levné visací zámky a vložky se standardními stavítky a velkými tolerancemi. Často otevře zámek za pár sekund.',
    how: 'Rychlý horizontální pohyb dovnitř a ven s lehkým houpáním (rocking/scrubbing) a velmi lehkým napětím. Nech stavítka „tancovat“, dokud nezapadnou.',
    pros: ['Extrémně rychlý na snadné zámky', 'Funguje i jako SPP planžeta (vrchní hrbol)'],
    cons: ['Proti spool/serrated pinům slabý'],
    motion: 'rake-rock',
  },
  {
    profile: 'city-rake',
    name: 'City Rake (L-Rake)',
    group: 'rake',
    tagline: 'Napodobuje profil klíče.',
    when: 'Zámky se střední variabilitou bittingu. Profil připomíná zuby klíče, takže pokrývá běžné kombinace.',
    how: 'Zasuň celý rake, zatlač nahoru a houpej („rocking“) jako při otáčení klíčem. Měň výšku a úhel.',
    pros: ['Velké pokrytí bittingů', 'Rychlé otevření bez SPP'],
    cons: ['Nefunguje na náročné zámky'],
    motion: 'rake-rock',
  },
  {
    profile: 'snake',
    name: 'Snake / S-Rake',
    group: 'rake',
    tagline: 'Vlnitý profil pro scrubbing.',
    when: 'Krátké zámky a cylindry se střídavým bittingem. Skvělý pro „scrubbing“ – rychlé zametání tam a zpět.',
    how: 'Rychle drhni dovnitř–ven s nízkou amplitudou, napětí co nejlehčí. Občas uvolni napětí a začni znovu.',
    pros: ['Rychlý scrubbing'],
    cons: ['Méně přesný než city rake'],
    motion: 'rake-scrub',
  },
  {
    profile: 'w-rake',
    name: 'W-Rake / Wave',
    group: 'rake',
    tagline: 'Hustá vlna pro krátké zámky.',
    when: 'Malé visací zámky, schránky, wafery.',
    how: 'Scrubbing nebo houpání, stejně jako u snake rake.',
    pros: ['Na krátké zámky výborný'],
    cons: ['Pro 6pinové vložky krátký'],
    motion: 'rake-scrub',
  },
  {
    profile: 'batman-2',
    name: 'Batman – oboustranné hrábě (2 vlny)',
    group: 'rake',
    tagline: 'Hrbolky nahoře i dole. Zasunout, zabrat a škubnout ven.',
    when: 'Levné visací zámky, schránky a hlavně oboustranné lamelové zámky (auta, nábytek), kde lamely vyčnívají nahoru i dolů. Na stavítkových zámcích pracuje horní strana jako krátké hrábě.',
    how: 'Zasuň až dozadu, napínákem lehce zaber ve směru otáčení a hrábě rychle vytrhni ven – hrbolky přitom zvednou všechna stavítka a některá zůstanou nahoře. Opakuj několikrát a mezi pokusy měň napětí. Funguje i kolébání nahoru a dolů jako při otáčení klíčem. Hrábě můžeš otočit vzhůru nohama.',
    pros: ['Velmi rychlé na snadné zámky', 'Zabere nahoře i dole – ideální na oboustranné lamely', 'Jde otočit, obě strany jsou stejné'],
    cons: ['Na bezpečnostní stavítka skoro nefunguje', 'Hrubé – snadno stavítka přemačkne'],
    motion: 'yank',
  },
  {
    profile: 'batman-3',
    name: 'Batman – oboustranné hrábě (3 vlny)',
    group: 'rake',
    tagline: 'Delší verze se třemi hrbolky na každé straně.',
    when: 'Delší zámky s 5–6 stavítky nebo lamelami – víc hrbolků zasáhne víc komůrek najednou.',
    how: 'Stejně jako verze se 2 vlnami: zasunout, lehce zabrat napínákem a rychle škubnout ven, případně kolébat. Když se zámek nepohne, zkus kratší verzi – do krátkých zámků se 3 vlny nevejdou celé.',
    pros: ['Pokryje víc stavítek najednou'],
    cons: ['Do krátkých zámků je moc dlouhý', 'Na bezpečnostní stavítka skoro nefunguje'],
    motion: 'yank',
  },
  {
    profile: 'double-ball',
    name: 'Double Ball / Snowman',
    group: 'pick',
    tagline: 'Dvě kuličky za sebou – na lamely.',
    when: 'Lamelové a oboustranné lamelové zámky. Kulaté tvary po lamelách kloužou a nezaseknou se za nimi.',
    how: 'Zasuň a jemně vytahuj a zasouvej s kolébáním, nebo zvedej lamely jednu po druhé.',
    pros: ['Neuvízne za lamelami', 'Funguje nahoru i dolů'],
    cons: ['Na stavítka nepřesné'],
    motion: 'rake-rock',
  },
  {
    profile: 'tok-bar',
    name: 'TOK Pry Bar',
    group: 'tension',
    tagline: 'Napínák na horní hranu klíčové dírky (Top Of Keyway).',
    when: 'Kdykoliv potřebuješ maximum místa pro planžetu – zvlášť u úzkých a paracentrických profilů. Přesnější přenos zpětné vazby.',
    how: 'Vlož plochý konec do horní části klíčové dírky, aby se zaklínil, a ukazováčkem jemně tlač ve směru otáčení. Používej pevné tloušťky (0.040"–0.062") podle profilu.',
    pros: ['Více místa pro planžetu', 'Lepší zpětná vazba', 'Méně prokluzuje u vroubkovaných verzí'],
    cons: ['Potřebuje správnou tloušťku pro profil'],
    motion: 'tension-tok',
  },
  {
    profile: 'bok-wrench',
    name: 'BOK Z-Wrench',
    group: 'tension',
    tagline: 'Klasický napínák na spodní hranu (Bottom Of Keyway).',
    when: 'Široké profily, visací zámky, začátky. Je univerzální, ale zabírá místo pod stavítky.',
    how: 'Zasuň krátký konec do spodní části klíčové dírky a tlač na dlouhé rameno. Napětí drž lehké – zámek otevírá cit, ne síla.',
    pros: ['Univerzální', 'Funguje skoro všude'],
    cons: ['Zabírá místo pro planžetu', 'Snáze sklouzne'],
    motion: 'tension-bok',
  },
  {
    profile: 'twist-wrench',
    name: 'Twist Flex Wrench',
    group: 'tension',
    tagline: 'Pružný napínák s jemnou kontrolou.',
    when: 'Začátečníci, kteří mají tendenci tlačit příliš – pružina tlumí napětí.',
    how: 'Zasuň jako BOK; zkroucené rameno pruží a dávkuje sílu.',
    pros: ['Jemné dávkování'],
    cons: ['Horší zpětná vazba'],
    motion: 'tension-bok',
  },
  {
    profile: 'disc-pick',
    name: 'Disc Detainer Pick',
    group: 'special',
    tagline: 'Speciální nástroj pro diskové zámky.',
    when: 'Zámky typu disc detainer (Abloy-like, Abus Plus). Klasické planžety zde nefungují – nejsou zde pružiny ani stavítka.',
    how: 'Přední hrot napíná poslední disk, zadní jazýček otáčí jednotlivé disky, dokud jejich výřez (gate) nezapadne pod sidebar.',
    pros: ['Jediná rozumná cesta na diskové zámky'],
    cons: ['Drahé, specifické pro výrobce/průměr'],
    motion: 'disc-rotate',
  },
  {
    profile: 'tubular-pick',
    name: 'Tubular Pick',
    group: 'special',
    tagline: 'Válcový nástroj s posuvnými jehlami.',
    when: 'Tubulární zámky (automaty, cyklozámky, zámky notebooků).',
    how: 'Zasuň, aplikuj napětí rotací a jehly se samy přizpůsobí výškám stavítek; nástroj zároveň slouží jako dekodér.',
    pros: ['Současně dekóduje'],
    cons: ['Pro každý průměr jiný nástroj'],
    motion: 'none',
  },
  {
    profile: 'wafer-jiggler',
    name: 'Jiggler / Try-out key',
    group: 'special',
    tagline: 'Sada vzorovaných klíčů pro lamelové zámky.',
    when: 'Lamelové zámky aut a nábytku – velké tolerance umožňují „rozhoupat“ lamely.',
    how: 'Vlož, lehké napětí, a jemně vytahuj a zasouvej s kolébáním.',
    pros: ['Velmi rychlé na wafery'],
    cons: ['Na stavítkové zámky téměř bez účinku'],
    motion: 'rake-rock',
  },
  {
    profile: 'bypass-shim',
    name: 'Shim / Bypass',
    group: 'special',
    tagline: 'Obejití mechanismu místo jeho otevření.',
    when: 'Pouze na vlastních zámcích pro pochopení konstrukčních slabin – např. shim mezi třmen a západku levného visacího zámku.',
    how: 'Tenký plíšek se zasune podél třmenu a odtlačí západku. Ukazuje, proč kvalitní zámky mají kuličkové zajištění.',
    pros: ['Odhaluje konstrukční chyby'],
    cons: ['Neučí picking'],
    motion: 'none',
  },
  {
    profile: 'plug-spinner',
    name: 'Plug Spinner',
    group: 'special',
    tagline: 'Když jsi otevřel špatným směrem.',
    when: 'Zámek ses otevřel otočením na nesprávnou stranu – spinner bubínek rychle přetočí opačným směrem dřív, než stavítka spadnou.',
    how: 'Natáhni pružinu, vlož do bubínku a pusť – rotace je rychlejší než pád driverů.',
    pros: ['Ušetří celý nový pokus'],
    cons: ['Úzce specializovaný'],
    motion: 'none',
  },
  {
    profile: 'dimple-flag',
    name: 'Důlková planžeta (flag)',
    group: 'special',
    tagline: 'Rovná planžeta s malou ohnutou vlaječkou na konci.',
    when: 'Důlkové zámky, kde stavítka jdou z boku do plochého klíče. Obyčejný hák se tam neotočí.',
    how: 'Zasuň ji do vodorovného otvoru naplocho, vlaječku natoč ke stavítku a lehkým pootočením planžety ho zatlač. Napínák dej tenký do rohu otvoru.',
    pros: ['Jediný běžný nástroj na důlkové zámky'],
    cons: ['Potřebuje cit a správnou délku vlaječky'],
    motion: 'lift',
  },
  {
    profile: 'lever-pick',
    name: 'Dozický háček (lever pick)',
    group: 'special',
    tagline: 'Silný drát se zahnutým koncem na páky.',
    when: 'Dozické (zadlabací) zámky ve starších dveřích a zámky s pákami.',
    how: 'Druhý nástroj tlačí na závoru (napětí). Háčkem zvedej páky jednu po druhé, dokud čep závory nezapadne do jejich okének.',
    pros: ['Dosáhne tam, kam planžeta ne'],
    cons: ['Pro různé zámky jiná délka a ohyb'],
    motion: 'none',
  },
  {
    profile: 'key-extractor',
    name: 'Vytahovák zlomených klíčů („harpuna“)',
    group: 'special',
    tagline: 'Tenký plíšek se zpětnými zoubky na vytažení úlomku.',
    when: 'Když se v zámku zlomí klíč nebo ulomí špička planžety.',
    how: 'Bubínek natoč do výchozí polohy, aby stavítka na úlomek netlačila. Vytahovák zasuň vedle úlomku zoubky k zubům klíče, lehce ho pootoč, aby se zakously, a táhni ven. Zoubky drží jen při tahu ven. Do zámku nic netluč.',
    pros: ['Ušetří výměnu vložky', 'Při zasouvání nic nezachytí'],
    cons: ['Úplně zaklíněný úlomek nemusí vytáhnout'],
    motion: 'extract',
  },
  {
    profile: 'comb-pick',
    name: 'Hřebínek (comb pick)',
    group: 'special',
    tagline: 'Zvedne všechna stavítka najednou až nad rovinu.',
    when: 'Jen levné zámky s velkými vůlemi a krátkými stavítky – ukázka konstrukční chyby, ne dovednosti.',
    how: 'Hřebínek zasuň a zvedni celý nahoru, takže všechna stavítka vyjedou až nad střižnou rovinu do těla zámku. Bubínek se pak otočí bez nastavování.',
    pros: ['Ukáže, jak špatně může být zámek vyrobený'],
    cons: ['Na kvalitní zámky nefunguje', 'Neučí picking'],
    motion: 'none',
  },
  {
    profile: 'bump-key',
    name: 'Bump klíč',
    group: 'special',
    tagline: 'Klíč se všemi zuby obroušenými nadoraz.',
    when: 'Jen na vlastních zámcích, abys pochopil, jak funguje bumping a proč existují anti-bump stavítka.',
    how: 'Zasuň klíč o jeden zub méně, lehce otáčej a ťukni do něj. Ráz na okamžik vymrští horní stavítka nad rovinu a bubínek se otočí.',
    pros: ['Ukazuje fyziku rázu'],
    cons: ['Musí sedět na profil zámku', 'Může zámek poškodit'],
    motion: 'none',
  },
];

export interface LockTypeGuide {
  id: Mechanism;
  name: string;
  summary: string;
  howItWorks: string;
  whereFound: string;
  approach: string;
  tools: string[];
  weaknesses: string[];
  difficulty: 1 | 2 | 3 | 4 | 5;
}

export const LOCK_TYPES: LockTypeGuide[] = [
  {
    id: 'pin-tumbler',
    name: 'Stavítkový zámek (Pin Tumbler)',
    summary: 'Nejrozšířenější mechanismus na světě – cylindrické vložky dveří i většina visacích zámků.',
    howItWorks:
      'V těle (shell) se otáčí bubínek (plug). Skrz oba prochází řada komor, v každé leží spodní stavítko (key pin), horní stavítko (driver) a pružina. Bez klíče drivery přesahují přes střižnou rovinu a blokují otočení. Správný klíč zvedne každý pár přesně tak, aby rozhraní mezi key pinem a driverem leželo na střižné rovině.',
    whereFound: 'Dveřní vložky (euro profil), visací zámky, zámky skříněk, schránky.',
    approach: 'Lehké napětí + SPP (hák) nebo raking. Hledej binding pin, zvedni ho na střižnou rovinu, opakuj.',
    tools: ['Short hook', 'Deep hook', 'Bogota / City rake', 'TOK + BOK napínáky'],
    weaknesses: ['Výrobní tolerance → binding order', 'Raking na levných zámcích', 'Bumping bez anti-bump pinů'],
    difficulty: 2,
  },
  {
    id: 'wafer',
    name: 'Lamelový zámek (Wafer)',
    summary: 'Ploché lamely místo válcových stavítek – auta, poštovní schránky, kancelářský nábytek.',
    howItWorks:
      'Bubínek obsahuje ploché lamely s otvorem pro klíč. Pružina tlačí lamely ven do drážky v těle. Klíč posune každou lamelu tak, aby byla celá uvnitř bubínku. Někdy jsou lamely z obou stran (double-sided wafer).',
    whereFound: 'Automobilové zámky, schránky, skříňky, zásuvky, vačkové zámky.',
    approach: 'Jiggling / raking s velmi lehkým napětím, případně ball pick. Tolerance jsou obvykle velké.',
    tools: ['Half-diamond', 'Ball pick', 'Jigglery', 'W-rake'],
    weaknesses: ['Náchylné na raking a jiggling', 'Velké tolerance'],
    difficulty: 1,
  },
  {
    id: 'disc-detainer',
    name: 'Diskový zámek (Disc Detainer)',
    summary: 'Rotující disky bez pružin – vysoce odolný proti klasickému pickingu (např. principy Abloy).',
    howItWorks:
      'Uvnitř je sada disků s výřezem (gate). Klíč každý disk natočí o určitý úhel. Když jsou všechny výřezy v zákrytu, propadne do nich boční lišta (sidebar) a bubínek se otočí. Bez pružin nejde použít klasický raking ani bumping.',
    whereFound: 'Vysoce bezpečnostní visací zámky, průmyslové aplikace, zámky na kola.',
    approach: 'Speciální disc detainer pick: napínej poslední disk, otáčej ostatní a hledej binding disk podobně jako binding pin. Falešné výřezy dávají false gates.',
    tools: ['Disc detainer pick (pro konkrétní průměr)'],
    weaknesses: ['Vyžaduje counter-rotation u false gate', 'Binding order disků'],
    difficulty: 4,
  },
  {
    id: 'dimple',
    name: 'Důlkový zámek (Dimple)',
    summary: 'Klíč s důlky na ploché straně, klíčová dírka je otočená horizontálně.',
    howItWorks:
      'Je to stavítkový mechanismus otočený o 90° – stavítka přichází ze strany, kde má klíč plochu. Často více řad stavítek (i z boku) a aktivní prvky.',
    whereFound: 'Moderní bezpečnostní vložky, některé visací zámky.',
    approach: 'Dimple flag picks (planžety s ohnutým plochým hrotem), napínák do rohu profilu. Nutná trpělivost s více řadami.',
    tools: ['Dimple flag picks', 'Tenký TOK napínák'],
    weaknesses: ['Levné verze mají široké tolerance', 'Obvykle lineární řady stavítek'],
    difficulty: 3,
  },
  {
    id: 'lever',
    name: 'Dozický zámek (Lever)',
    summary: 'Historický princip trezorů a starších dveří – plochá páčka (doza) s výřezem.',
    howItWorks:
      'Závora má výstupek (stump), který musí projít výřezy (gates) ve všech dozách. Klíč zvedne každou dozu do přesné výšky, a teprve pak lze závoru posunout.',
    whereFound: 'Starší dveře v ČR (zadlabací zámky), trezory, britské dveře (BS3621).',
    approach: 'Speciální dvoudílný nástroj (curtain pick): jedna část tlačí na závoru, druhá zvedá dozy, dokud stump nezapadne do výřezu. Pozor na falešné výřezy.',
    tools: ['Lever / curtain pick'],
    weaknesses: ['Starší levné verze s malým počtem doz', 'Zpětná vazba přes závoru'],
    difficulty: 3,
  },
  {
    id: 'tubular',
    name: 'Tubulární zámek (Tubular)',
    summary: 'Stavítka v kruhu kolem středu – automaty, cyklozámky.',
    howItWorks: 'Stavítka jsou uspořádána do kruhu a stlačují se proti čelu zámku. Klíč je trubička s výřezy.',
    whereFound: 'Prodejní automaty, notebookové zámky, starší zámky kol.',
    approach: 'Tubulární planžeta, která současně dekóduje polohu stavítek.',
    tools: ['Tubular pick (7/8pin)'],
    weaknesses: ['Speciální nástroj je rychlý a zároveň dekóduje'],
    difficulty: 2,
  },
];

export interface SecurityPinGuide {
  id: PinType;
  name: string;
  shape: string;
  feedback: string;
  defeat: string;
}

export const SECURITY_PINS: SecurityPinGuide[] = [
  {
    id: 'standard',
    name: 'Standardní stavítko',
    shape: 'Hladký válec s rovnými konci.',
    feedback: 'Zvedání proti tuhému odporu, pak čisté „klik“ a lehké pootočení bubínku.',
    defeat: 'Lehké napětí a plynulé zvednutí až na střižnou rovinu.',
  },
  {
    id: 'spool',
    name: 'Spool (cívka)',
    shape: 'Driver se zúženým pasem uprostřed – tvar cívky.',
    feedback:
      'Když pas dosáhne střižné roviny, bubínek se výrazně pootočí – vznikne FALSE SET (zdánlivě skoro otevřeno). Při dalším zvedání tlačí stavítko bubínek zpět proti napínáku – COUNTER-ROTATION.',
    defeat:
      'Identifikuj stavítko, které po false setu tlačí zpět. Povol napětí přesně tolik, aby se bubínek mohl mírně vrátit, a zvedni stavítko. Moc povolíš = spadnou ostatní piny.',
  },
  {
    id: 'serrated',
    name: 'Serrated (vroubkované)',
    shape: 'Driver i key pin s mnoha drobnými zářezy po obvodu.',
    feedback: 'Řada drobných „klik-klik-klik“ při zvedání – každý vroubek se zachytí na hraně střižné roviny a tváří se jako set.',
    defeat: 'Velmi lehké napětí a pokračovat ve zvedání po každém mikro kliknutí, dokud nepřijde zřetelné pootočení. Hlídej přemačkání.',
  },
  {
    id: 'mushroom',
    name: 'Mushroom (hřib)',
    shape: 'Driver s rozšířenou hlavou a zúženým krčkem – jako houba.',
    feedback: 'Podobně jako spool vytváří false set, ale counter-rotation je jemnější a kratší.',
    defeat: 'Stejně jako spool: mírně povol, zvedej, sleduj návrat bubínku.',
  },
  {
    id: 't-pin',
    name: 'T-pin',
    shape: 'Driver s jedním výrazným osazením – tvar T (půl cívky).',
    feedback: 'Hluboký false set a velmi výrazná counter-rotation.',
    defeat: 'Nutné výrazně povolit napětí; často pomůže TOK napínák pro lepší kontrolu.',
  },
];

export const GLOSSARY: { term: string; def: string; art: GlossaryArtId }[] = [
  { term: 'Shear Line (střižná rovina)', def: 'Rozhraní mezi bubínkem a tělem zámku. Když na ní leží všechna rozhraní stavítek, bubínek se otočí.', art: 'shear' },
  { term: 'Plug (bubínek)', def: 'Otočná část zámku, do které se zasouvá klíč.', art: 'plug' },
  { term: 'Shell / Housing (tělo)', def: 'Pevná vnější část zámku, ve které se bubínek otáčí.', art: 'shell' },
  { term: 'Key pin (spodní stavítko)', def: 'Stavítko, které se dotýká klíče. Různé délky = bitting.', art: 'keypin' },
  { term: 'Driver pin (horní stavítko)', def: 'Stavítko tlačené pružinou, které blokuje otočení bubínku.', art: 'driver' },
  { term: 'Binding pin', def: 'Stavítko, které je pod napětím jako první sevřené kvůli výrobním tolerancím.', art: 'binding' },
  { term: 'Binding order', def: 'Pořadí, ve kterém stavítka tuhnou. Pro každý zámek (a směr otáčení) je jiné.', art: 'order' },
  { term: 'Set', def: 'Stavítko zvednuté na střižnou rovinu – driver sedí na hraně bubínku.', art: 'set' },
  { term: 'Overset (přemačknutí)', def: 'Key pin zvednutý nad střižnou rovinu – zasekne se v těle zámku. Nutné povolit napětí.', art: 'overset' },
  { term: 'False set', def: 'Výrazné pootočení bubínku způsobené bezpečnostním stavítkem (spool), zámek ale ještě není otevřený.', art: 'falseset' },
  { term: 'Counter-rotation', def: 'Zpětný tlak bubínku na napínák při zvedání spool stavítka z false setu.', art: 'counter' },
  { term: 'Bitting', def: 'Kombinace výšek zářezů klíče / délek key pinů.', art: 'bitting' },
  { term: 'Keyway (profil)', def: 'Tvar klíčové dírky. Paracentrický profil má výstupky přes střed, což ztěžuje přístup.', art: 'keyway' },
  { term: 'Warding', def: 'Výstupky v klíčové dírce, které omezují, jaký nástroj projde.', art: 'warding' },
  { term: 'TOK / BOK', def: 'Top / Bottom Of Keyway – pozice napínáku nahoře nebo dole v klíčové dírce.', art: 'tokbok' },
  { term: 'SPP', def: 'Single Pin Picking – otevírání stavítko po stavítku.', art: 'spp' },
  { term: 'Raking', def: 'Rychlé zametání více stavítek najednou, spoléhá na štěstí a tolerance.', art: 'raking' },
  { term: 'Bumping', def: 'Úder do speciálně zbroušeného klíče, impuls na okamžik oddělí stavítka.', art: 'bumping' },
  { term: 'Gutting', def: 'Rozebrání zámku za účelem prozkoumání (a přepinování) jeho vnitřku.', art: 'gutting' },
  { term: 'Repinning', def: 'Výměna stavítek v zámku – tvorba vlastních tréninkových kombinací.', art: 'repinning' },
  { term: 'Sidebar', def: 'Boční lišta, která musí zapadnout do výřezů – další vrstva zabezpečení.', art: 'sidebar' },
  { term: 'Belt ranking', def: 'Komunitní systém obtížnosti zámků od bílého po černý pás.', art: 'belts' },
];

/* ─────────────────────────── Law & ethics ─────────────────────────── */

export interface LawSection {
  title: string;
  flag: string;
  status: 'ok' | 'caution' | 'restricted';
  statusLabel: string;
  points: string[];
}

export const LAW_UPDATED = 'listopad 2026';

export const LAW_CZ: LawSection = {
  title: 'Česká republika',
  flag: 'CZ',
  status: 'ok',
  statusLabel: 'Vlastnictví legální',
  points: [
    'Vlastnit, kupovat a používat planžety a napínáky je v ČR legální. Žádný zákon jejich držení nezakazuje a nejsou potřeba žádná povolení.',
    'Trestné je teprve jejich použití k protiprávnímu jednání. Relevantní jsou zejména paragrafy trestního zákoníku (z. č. 40/2009 Sb.): § 205 krádež (včetně vloupání), § 178 porušování domovní svobody, § 207 neoprávněné užívání cizí věci, § 228 poškození cizí věci a § 182 porušení tajemství dopravovaných zpráv (např. otevření cizí poštovní schránky a čtení dopisů).',
    'U přestupků přichází v úvahu např. přestupek proti majetku (z. č. 251/2016 Sb.) – i drobné poškození cizího zámku může být problém.',
    'Nalezení nástrojů u osoby v souvislosti s podezřelým jednáním může sloužit jako důkaz úmyslu. Nos je proto na veřejnosti jen tehdy, když k tomu máš důvod (sraz, přednáška), ideálně v pouzdře, ne po kapsách.',
    'Otevírání zámků jako služba (nouzové otevírání bytů, aut) je podnikání – spadá pod řemeslnou živnost „Zámečnictví, nástrojářství“ a vyžaduje živnostenské oprávnění a odbornou kvalifikaci. Bez něj nikomu cizímu zámky neotvírej, ani zdarma.',
    'Otevírání vlastního zámku je legální. Uvedené informace jsou orientační a nejsou právní radou – zákony se mění, v konkrétní situaci se obrať na právníka. Pozor ale na zámky, které „patří“ i někomu jinému (pronajatý byt, firemní skříňka, sdílené kolo) – potřebuješ souhlas vlastníka.',
  ],
};

export const LAW_WORLD: LawSection[] = [
  {
    title: 'Slovensko',
    flag: 'SK',
    status: 'ok',
    statusLabel: 'Vlastnictví legální',
    points: ['Podobně jako v ČR: držení není trestné, postihuje se zneužití (krádež, porušování domovní svobody).'],
  },
  {
    title: 'Německo, Rakousko, Polsko, Nizozemsko',
    flag: 'EU',
    status: 'ok',
    statusLabel: 'Vlastnictví legální',
    points: [
      'Držení je obecně legální; v Německu a Nizozemsku je locksport velmi rozvinutý (soutěže, kluby jako SSDeV nebo TOOOL NL).',
      'Nošení u sebe bez důvodu může v kombinaci s podezřelým jednáním vyvolat potíže.',
    ],
  },
  {
    title: 'Velká Británie a Irsko',
    flag: 'UK',
    status: 'caution',
    statusLabel: 'Pozor na nošení venku',
    points: [
      'Vlastnictví doma je legální. Nošení mimo domov však může naplnit skutkovou podstatu „going equipped“ (UK: Theft Act 1968, s. 25), pokud nelze prokázat legitimní důvod.',
      'Na cesty si je neber, pokud nejedeš na locksport akci.',
    ],
  },
  {
    title: 'USA',
    flag: 'US',
    status: 'caution',
    statusLabel: 'Liší se podle státu',
    points: [
      'Ve většině států legální. Některé státy ale považují držení nástrojů za tzv. prima facie důkaz zločinného úmyslu, pokud nemáš zámečnickou licenci, nebo omezují jejich nošení.',
      'Před cestou si ověř zákony konkrétního státu.',
    ],
  },
  {
    title: 'Japonsko',
    flag: 'JP',
    status: 'restricted',
    statusLabel: 'Výrazně omezeno',
    points: [
      'Zákon o zákazu držení speciálních otevíracích nástrojů (2003) zakazuje držení a nošení planžet bez oprávněného důvodu (např. zámečnická profese). Nevoz je tam.',
    ],
  },
  {
    title: 'Letadla a cestování',
    flag: 'plane',
    status: 'caution',
    statusLabel: 'Raději do kufru',
    points: [
      'Planžety obecně nejsou na seznamu zakázaných předmětů, ale kontrolu mohou zdržet nebo být zabaveny podle uvážení ostrahy. Bezpečnější je dát je do odbaveného zavazadla.',
      'Pravidla cílové země mají přednost (viz Japonsko, UK).',
    ],
  },
];

export interface EthicsRule {
  title: string;
  text: string;
  golden?: boolean;
  icon: IconName;
  /** iOS system colour for the icon tile */
  color: string;
}

export const ETHICS: EthicsRule[] = [
  {
    golden: true,
    icon: 'key',
    color: '#FF9500',
    title: 'Otevírej jen to, co je tvoje',
    text: 'Nikdy neotevírej zámek, který nevlastníš, nebo ke kterému nemáš výslovný souhlas majitele. Ani „jen na zkoušku“, ani u kamaráda bez jeho svolení.',
  },
  {
    golden: true,
    icon: 'door',
    color: '#FF3B30',
    title: 'Nikdy zámek, který je v provozu',
    text: 'Neotevírej zámek, který je aktuálně nainstalovaný a něco chrání (dveře, brány, kola, schránky) – ani když je tvůj. Picking může zámek poškodit (vylomené stavítko, poškrábaný bubínek) a ten pak přestane spolehlivě fungovat nebo selže v nejhorší chvíli.',
  },
  {
    icon: 'flask',
    color: '#30B0C7',
    title: 'Trénuj na tréninkových zámcích',
    text: 'Používej zámky určené k tréninku: průhledné akrylové, přepinovatelné (repinnable) vložky, progresivní sady nebo zámky koupené speciálně pro locksport. Nikdy nepoužívej zámek, jehož selhání by ohrozilo bezpečí tvoje nebo jiných.',
  },
  {
    icon: 'lifebuoy',
    color: '#FF2D55',
    title: 'Nejsi záchranná služba',
    text: 'Když tě někdo poprosí, ať mu otevřeš „zabouchnuté dveře“, odmítni a doporuč profesionálního zámečníka. Nemůžeš ověřit, že byt opravdu patří jemu, a zároveň bys mohl zámek poškodit a nést za to odpovědnost.',
  },
  {
    icon: 'eyeOff',
    color: '#5856D6',
    title: 'Odpovědné sdílení (Responsible Disclosure)',
    text: 'Když objevíš vážnou slabinu konkrétního modelu, nejdřív kontaktuj výrobce a dej mu čas na opravu, než to zveřejníš. Nikdy nepublikuj informace, které by umožnily otevřít konkrétní zámek konkrétní osoby (fotky klíčů, kódy, bitting cizích zámků).',
  },
  {
    icon: 'school',
    color: '#007AFF',
    title: 'Uč dál, ale s rozmyslem',
    text: 'Locksport je o vzdělávání – ukazuj lidem, jak fungují zámky a proč investovat do kvalitních. Neuč techniky někoho, kdo dává najevo, že je chce zneužít.',
  },
  {
    icon: 'bag',
    color: '#A2845E',
    title: 'Nástroje nos rozumně',
    text: 'Planžety nos jen tam, kam je potřebuješ (sraz, přednáška), v pouzdře. Nikdy je nevytahuj u cizích zámků na veřejnosti – i nevinná „ukázka“ na kole souseda může vypadat jako pokus o krádež.',
  },
  {
    icon: 'users',
    color: '#34C759',
    title: 'Respektuj zámečníky a komunitu',
    text: 'Zámečníci jsou profesionálové s odpovědností a oprávněním. Nenabízej jejich služby „načerno“. Na fórech a srazech buď vstřícný k začátečníkům a uváděj zdroje.',
  },
  {
    icon: 'wrench',
    color: '#8E8E93',
    title: 'Neničit, ale rozumět',
    text: 'Cílem je zámek otevřít bez poškození a pochopit ho. Destruktivní metody (vrtání, lámání vložek) patří jen na vlastní vyřazené zámky a jen pro studijní účely.',
  },
  {
    icon: 'scale',
    color: '#AF52DE',
    title: 'Znej zákony',
    text: 'Ověř si legislativu země, kde se nacházíš – zvlášť při cestování. Neznalost zákona neomlouvá.',
  },
];

export const LAW_SOURCES = [
  'Zákon č. 40/2009 Sb., trestní zákoník',
  'Zákon č. 251/2016 Sb., o některých přestupcích',
  'Zákon č. 455/1991 Sb., živnostenský zákon (příloha – řemeslné živnosti)',
  'TOOOL (The Open Organisation Of Lockpickers) – Code of Ethics',
  'Locksport International – Code of Ethics',
];
