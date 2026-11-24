# 🔐 Locked · Locksport Lab

Kompletní **PWA aplikace pro locksport a lockpicking** – realistický fyzikální simulátor zámků, speed-picking stopky ve stylu csTimeru, herní výzvy, interaktivní encyklopedie (včetně zákonů a etického kodexu), osobní inventář a analytický dashboard. Vše běží **offline** a data zůstávají jen v zařízení.

## Spuštění

```bash
npm install
npm run dev       # vývojový server
npm run build     # produkční build do dist/ (+ vygenerovaný service worker)
npm run preview   # náhled produkčního buildu (PWA / offline funguje jen zde)
npm run icons     # přegeneruje PNG ikony z public/icons/icon.svg (Playwright/Chromium)
```

`dist/` je čistě statický – lze nasadit na GitHub Pages, Netlify, Vercel apod. (relativní `base: './'`).

## Moduly

| Záložka | Co umí |
|---|---|
| **Stopky** | Stackmat start (podržet → zelená → pustit, volitelně 2 prsty), celoobrazovkové STOP tlačítko, mezerník na PC, volitelná prohlídka (inspection) s WCA penalizacemi, **akustické zastavení** mikrofonem (high-pass filtr + práh s živým VU metrem), Ao5/Ao12/Ao50/Ao100 aktuální i nejlepší (WCA trimování), +2 / DNF / poznámky / mazání, historie, Wake Lock. |
| **Simulátor & Hry** | Fyzikální simulátor pin tumbleru (3–6 komor, náhodný binding order, stick-slip tření rostoucí s napětím, přemačkání, spool false set + counter-rotation, serrated mikro-kliky, páčení dříkem – proto existuje deep hook), 5 nástrojů včetně rake, **průhledný** a **blind** režim (zvuk, vibrace, čelo bubínku), simulace zámků z vlastní sbírky. Poznávačka (Keyway Match + Mechanism X-Ray s animovanými řezy), **3-Lock Gauntlet** (reálné i virtuální zámky, splity, S/A/B/C rank, porovnání s PB), **Denní drily** se sérií dní a XP, **18 odznaků**. |
| **Encyklopedie** | Fyzika zámků s interaktivními diagramy (střižná rovina, binding order), typy zámků, bezpečnostní stavítka, katalog 18 nástrojů se siluetami a animací pohybu, belt ranking, **Zákony & Etika** (ČR + zahraničí, etický kodex, rychlý test „smím…?“), slovník. |
| **Moje výbava** | Sbírka zámků (belt ranking, mechanismus, keyway, poznámky, **Binding Order Tracker** – typy pinů + zaznamenání pořadí klepáním) a arzenál nástrojů (výrobce, profil, tloušťka, TOK/BOK). Rychlé „Trénovat“ / „Simulovat“. |
| **Statistiky** | KPI, graf progrese s klouzavým Ao5 (+ tabulkový pohled), heatmapa aktivity, nejpoužívanější nástroje, nejefektivnější kombinace normalizované obtížností zámku, techniky, Comfort / Nemesis zámky s tlačítkem „Trénovat“. |

Nastavení (ikona ozubeného kola): zvuk, vibrace, parametry stopek, obtížnost simulátoru, **export/import zálohy .json**, export časů do CSV, reset dat.

## Architektura

```
src/
  types.ts                 datový model (LockItem, ToolItem, SolveRecord, ChallengeResult, PinConfig…)
  data/                    výchozí data (5 zámků, 6 nástrojů, 25 časů), encyklopedie, kvízy, drily
  lib/                     audio (Web Audio syntéza), statistiky (WCA průměry), úložiště, odznaky
  store/AppStore.tsx       globální stav + persistence do localStorage + navigace
  features/
    timer/                 stopky, mikrofonový trigger, wake lock
    sim/                   engine.ts (fyzika), SimLockView (SVG), hry
    encyclopedia/  gear/  stats/
  components/              UI kit, shell (navigace, etický modal, nastavení), SVG grafika
```

* React 18 + TypeScript (strict), Tailwind CSS v4, Framer Motion, Recharts.
* Žádné zvukové soubory – všechny efekty jsou syntetizované (klik stavítka, false set, cvaknutí třmenu…).
* Service worker se generuje při buildu (precache všech hashovaných souborů, network-first pro HTML).

## Etika

Při prvním spuštění je nutné potvrdit **Zlatá pravidla locksportu**: otevírej jen zámky, které vlastníš, a nikdy zámky, které jsou v provozu. Informace o zákonech jsou orientační a nejsou právní radou.
