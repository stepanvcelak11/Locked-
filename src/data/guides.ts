import type { GlossaryArtId } from '../components/svg/Diagrams';
import type { IconName } from '../components/Icon';

export interface GuideStep {
  title: string;
  text: string;
  art?: GlossaryArtId;
  tip?: string;
}

export interface Guide {
  id: string;
  title: string;
  desc: string;
  minutes: number;
  icon: IconName;
  color: string;
  steps: GuideStep[];
  /** where to practise right after reading */
  practice?: 'simulator' | 'timer' | 'quiz';
}

export const GUIDES: Guide[] = [
  {
    id: 'first-open',
    title: 'Tvoje první otevření',
    desc: 'Krok za krokem od napínáku po cvaknutí',
    minutes: 5,
    icon: 'unlock',
    color: '#34C759',
    practice: 'simulator',
    steps: [
      {
        title: 'Vlož napínák',
        text: 'Napínák zasuň do spodní části otvoru pro klíč (BOK). Na začátečnický visací zámek je to nejjednodušší. Krátký konec napínáku míří dovnitř.',
        art: 'tokbok',
        tip: 'Drž napínák ukazováčkem slabší ruky, ne celou dlaní.',
      },
      {
        title: 'Lehce zatoč',
        text: 'Otáčej napínákem ve směru, kterým by se otáčel klíč. Jen tak silně, jako když mačkáš klávesu na mobilu. Bubínek se nepohne, ale stavítka se začnou zasekávat.',
        art: 'binding',
        tip: 'Skoro všichni začátečníci tlačí moc. Když si nejsi jistý, povol.',
      },
      {
        title: 'Najdi tuhé stavítko',
        text: 'Planžetu zasuň nad napínák až dozadu. Postupně se dotkni každého stavítka. Většina jich pruží, ale jedno klade odpor. To je to, které teď otevíráš (binding pin).',
        art: 'order',
      },
      {
        title: 'Zvedej, dokud necvakne',
        text: 'Tuhé stavítko pomalu zvedej. Ucítíš drobné cvaknutí a bubínek se nepatrně pootočí. Stavítko je nastavené na střižné rovině a už nespadne.',
        art: 'set',
        tip: 'Cvaknutí často víc ucítíš v napínáku než v planžetě.',
      },
      {
        title: 'Opakuj s dalším',
        text: 'Teď je tuhé jiné stavítko. Zase ho najdi a zvedni. Pořadí je u každého kusu zámku jiné – a pořád stejné, takže si ho můžeš zapsat do Výbavy.',
        art: 'spp',
      },
      {
        title: 'Když se nic nehýbe',
        text: 'Pokud jsou všechna stavítka tuhá nebo úplně volná, nejspíš jsi jedno zvedl moc vysoko (přemačkl). Povol napětí, stavítka spadnou a začni znovu. To je úplně normální.',
        art: 'overset',
      },
      {
        title: 'Otevřeno!',
        text: 'Když jsou všechna stavítka na střižné rovině, bubínek se volně otočí a zámek se otevře. Zkus to teď v simulátoru – uvidíš dovnitř, co se děje.',
        art: 'shear',
      },
    ],
  },
  {
    id: 'tension',
    title: 'Správné napětí',
    desc: 'Nejdůležitější dovednost, kterou se nikdo nenaučí hned',
    minutes: 3,
    icon: 'tension',
    color: '#007AFF',
    practice: 'simulator',
    steps: [
      {
        title: 'Nahoře, nebo dole?',
        text: 'Spodní napínák (BOK) je jednodušší a vejde se všude. Horní (TOK) nechá planžetě víc místa a dává lepší cit – vyplatí se, jakmile si zvykneš.',
        art: 'tokbok',
      },
      {
        title: 'Kolik síly',
        text: 'Tolik, aby jedno stavítko kladlo odpor, ale ostatní ještě pružila. Moc síly = všechno je tuhé a stavítka přemačkáš. Málo síly = nastavená stavítka zase spadnou.',
        art: 'binding',
      },
      {
        title: 'Napětí se mění',
        text: 'Při práci napětí jemně upravuj. Když stavítko cvakne, neuvolňuj ho. Když se nic neděje, zkus na chvilku lehce povolit.',
        tip: 'V simulátoru vidíš napětí jako procenta. Zkus otevřít zámek pod 40 %.',
      },
      {
        title: 'Poslouchej zpětný tlak',
        text: 'U bezpečnostních stavítek se ti napínák začne vracet proti prstu. To není chyba – to je signál, že jsi na spoolu. Povol a nech bubínek se vrátit.',
        art: 'counter',
      },
    ],
  },
  {
    id: 'raking',
    title: 'Raking – rychlá cesta',
    desc: 'Hrábě na levné zámky během pár vteřin',
    minutes: 2,
    icon: 'zap',
    color: '#FF9500',
    practice: 'timer',
    steps: [
      {
        title: 'Vyber hrábě',
        text: 'Na začátek stačí Bogota nebo City Rake. Mají vlnitý hrot, který zvedá několik stavítek najednou.',
        art: 'raking',
      },
      {
        title: 'Hodně lehké napětí',
        text: 'Ještě lehčí než při zvedání jednotlivých stavítek. Stavítka musí mít šanci zapadnout, když kolem nich hrot projede.',
      },
      {
        title: 'Rychlé tahy',
        text: 'Hrábě zasuň dozadu a rychle je vytahuj a zasouvej, přitom je mírně kolébej nahoru a dolů. Po pár tazích se bubínek často sám pootočí.',
        tip: 'Nefunguje do 10 vteřin? Povol napětí a zkus jiný rytmus.',
      },
      {
        title: 'Dokonči jednotlivě',
        text: 'Když raking nastaví většinu stavítek a zbylá ne, přepni na háček a dorovnej je jedno po druhém.',
        art: 'spp',
      },
    ],
  },
  {
    id: 'spools',
    title: 'Spool a falešné otevření',
    desc: 'Jak projít prvními bezpečnostními stavítky',
    minutes: 4,
    icon: 'pin',
    color: '#FF3B30',
    practice: 'simulator',
    steps: [
      {
        title: 'Co je spool',
        text: 'Horní stavítko ve tvaru cívky. Když jeho úzký pas dojede na střižnou rovinu, bubínek se pootočí víc než obvykle. Vypadá to jako otevření, ale není.',
        art: 'falseset',
      },
      {
        title: 'Poznáš to podle',
        text: 'Bubínek se výrazně pootočí (false set) a zámek se přesto neotevře. Stavítka, která byla nastavená, jsou pořád nahoře.',
      },
      {
        title: 'Najdi spool',
        text: 'Projdi stavítka. To, které při zvedání tlačí napínák zpátky proti tvému prstu, je spool.',
        art: 'counter',
      },
      {
        title: 'Povol a zvedej zároveň',
        text: 'Pomalu zvedej spool a přitom trochu povol napětí. Bubínek se nechá pootočit zpět a spool přeleze přes hranu. Pak zase přitlač.',
        tip: 'Nepovoluj úplně – jinak spadnou i ostatní stavítka.',
      },
    ],
  },
  {
    id: 'first-gear',
    title: 'První výbava',
    desc: 'Co si koupit a co zatím ne',
    minutes: 3,
    icon: 'toolbox',
    color: '#0B8AA3',
    steps: [
      {
        title: 'Vlastní zámek',
        text: 'Otevírej jen zámky, které jsou tvoje. Na začátek se hodí průhledný cvičný zámek a pak levný visací zámek s 4 stavítky.',
        art: 'plug',
      },
      {
        title: 'Malá sada stačí',
        text: 'Short hook, half-diamond, jedny hrábě a dva napínáky (spodní a horní). Velké sady s 30 kusy jsou z větší části zbytečné.',
        tip: 'Tloušťka 0,025" je dobrý kompromis – vejde se a nezlomí se.',
      },
      {
        title: 'Postupuj po pásech',
        text: 'Komunita řadí zámky do pásů od bílého po černý. Až otevřeš několik zámků jednoho pásu, posuň se na další. Pásy najdeš v Příručce.',
        art: 'belts',
      },
    ],
  },
];
