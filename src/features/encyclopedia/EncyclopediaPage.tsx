import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { useStore } from '../../store/AppStore';
import { BeltBadge, Card, Chip, PageHeader, SectionTitle } from '../../components/ui';
import { Icon, type IconName } from '../../components/Icon';
import { BELTS } from '../../data/labels';
import { ETHICS, GLOSSARY, LAW_CZ, LAW_SOURCES, LAW_UPDATED, LAW_WORLD, LOCK_TYPES, SECURITY_PINS, TOOL_GUIDE, type LawSection, type ToolGuide } from '../../data/library';
import { XrayArt, PinShapeArt } from '../../components/svg/Art';
import { ToolArt, ToolMotionDemo } from '../../components/svg/ToolArt';
import { BindingOrderDemo, ShearLineDemo } from './PhysicsDemos';
import type { XrayShape } from '../../data/quiz';
import type { Mechanism } from '../../types';

type Section = 'physics' | 'types' | 'security' | 'tools' | 'belts' | 'ethics' | 'glossary';

const SECTIONS: { id: Section; title: string; desc: string; icon: IconName; accent: string }[] = [
  { id: 'physics', title: 'Základy fyziky zámků', desc: 'Střižná rovina, tolerance, binding order', icon: 'target', accent: 'text-brass-400' },
  { id: 'types', title: 'Typy zámků', desc: 'Stavítkové, lamelové, diskové, důlkové, dozické', icon: 'lock', accent: 'text-azure-400' },
  { id: 'security', title: 'Bezpečnostní stavítka', desc: 'Spool, serrated, mushroom, T-pin', icon: 'shield', accent: 'text-red-400' },
  { id: 'tools', title: 'Katalog nástrojů', desc: 'Planžety, rakes, napínáky + animace', icon: 'toolbox', accent: 'text-steel-300' },
  { id: 'belts', title: 'Belt ranking', desc: 'Komunitní systém obtížnosti', icon: 'trophy', accent: 'text-orange-400' },
  { id: 'ethics', title: 'Zákony & Etika', desc: 'Co je legální, etický kodex locksportu', icon: 'scale', accent: 'text-emerald-400' },
  { id: 'glossary', title: 'Slovník pojmů', desc: 'Od binding pinu po warding', icon: 'list', accent: 'text-violet-400' },
];

const MECH_XRAY: Record<Mechanism, XrayShape | null> = {
  'pin-tumbler': 'xr-pin',
  wafer: 'xr-wafer',
  'disc-detainer': 'xr-disc',
  dimple: 'xr-dimple',
  lever: 'xr-lever',
  tubular: 'xr-tubular',
  other: null,
};

export function EncyclopediaPage() {
  const { intent, consumeIntent } = useStore();
  const [section, setSection] = useState<Section | null>(null);

  useEffect(() => {
    if (intent?.tab === 'library' && intent.library) {
      setSection(intent.library as Section);
      consumeIntent();
    }
  }, [intent, consumeIntent]);

  const cur = SECTIONS.find((s) => s.id === section);

  return (
    <div>
      {!cur ? (
          <motion.div key="index" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <PageHeader title="Encyklopedie" subtitle="Teorie, mechanika, nástroje a pravidla" />
            <div className="grid gap-3">
              {SECTIONS.map((s, i) => (
                <motion.div key={s.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                  <Card onClick={() => setSection(s.id)} className="flex items-center gap-4 p-4">
                    <div className={`rounded-2xl bg-ink-950 p-3 ${s.accent}`}>
                      <Icon name={s.icon} size={24} />
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-slate-100">{s.title}</div>
                      <div className="text-xs text-slate-400">{s.desc}</div>
                    </div>
                    <Icon name="chevronRight" className="text-slate-500" />
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>
        ) : (
          <motion.div key={cur.id} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
            <button onClick={() => setSection(null)} className="mb-3 inline-flex items-center gap-1 text-sm text-brass-400">
              <Icon name="chevronLeft" size={16} /> Encyklopedie
            </button>
            <PageHeader title={cur.title} subtitle={cur.desc} />
            {cur.id === 'physics' && <Physics />}
            {cur.id === 'types' && <LockTypes />}
            {cur.id === 'security' && <SecurityPins />}
            {cur.id === 'tools' && <ToolsCatalog />}
            {cur.id === 'belts' && <Belts />}
            {cur.id === 'ethics' && <Ethics />}
            {cur.id === 'glossary' && <Glossary />}
          </motion.div>
        )}
    </div>
  );
}

function Prose({ children }: { children: ReactNode }) {
  return <div className="space-y-3 text-[15px] leading-relaxed text-slate-300">{children}</div>;
}

function Physics() {
  const { navigate } = useStore();
  return (
    <div>
      <Prose>
        <p>
          Stavítkový zámek tvoří <b className="text-slate-100">tělo (shell)</b> a v něm otočný <b className="text-slate-100">bubínek (plug)</b>. Hranice mezi nimi se
          jmenuje <b className="text-brass-300">střižná rovina (shear line)</b>. V každé komoře leží spodní stavítko (key pin), horní stavítko (driver) a pružina.
        </p>
        <p>
          Bez klíče drivery přesahují přes střižnou rovinu do bubínku a ten se nemůže otočit. Správný klíč zvedne každý pár přesně tak, aby jejich rozhraní leželo
          na střižné rovině. Zkus to:
        </p>
      </Prose>
      <Card className="my-4 p-3">
        <ShearLineDemo />
      </Card>
      <SectionTitle>Proč stavítka tuhnou jedno po druhém</SectionTitle>
      <Prose>
        <p>
          Žádný výrobní proces není dokonalý. Otvory v bubínku jsou vyvrtané s drobnými odchylkami (setiny milimetru). Když na bubínek působíš napínákem, narazí
          hrana bubínku nejdřív jen na <b className="text-red-300">jedno stavítko</b> – to je <b>binding pin</b>. Ostatní zatím volně pruží.
        </p>
      </Prose>
      <Card className="my-4 p-3">
        <BindingOrderDemo />
      </Card>
      <Prose>
        <p>
          Když binding pin zvedneš na střižnou rovinu, driver se zachytí na hraně bubínku, bubínek se nepatrně pootočí a <b>začne tuhnout další stavítko</b> v pořadí.
          Tomu se říká <b className="text-brass-300">binding order</b>. Celé SPP je o opakování: najdi binding pin → zvedni → klik → další.
        </p>
        <p>
          <b className="text-slate-100">Napětí je klíčové:</b> příliš slabé = driver se nezachytí; příliš silné = stavítko se pohybuje trhavě a snadno ho{' '}
          <b className="text-red-300">přemačkáš</b> (key pin se zasekne nad střižnou rovinou).
        </p>
      </Prose>
      <button className="card mt-4 flex w-full items-center gap-3 p-4 text-left" onClick={() => navigate('arcade', { arcade: 'simulator', sim: { pins: 4 } })}>
        <span className="text-2xl">🔐</span>
        <span className="flex-1">
          <span className="block font-semibold text-brass-300">Vyzkoušej si to v simulátoru</span>
          <span className="block text-xs text-slate-400">4pinový průhledný zámek se zvýrazněným binding pinem</span>
        </span>
        <Icon name="chevronRight" className="text-slate-500" />
      </button>
    </div>
  );
}

function Dots({ n }: { n: number }) {
  return (
    <span className="inline-flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i} className={`h-1.5 w-3 rounded-full ${i <= n ? 'bg-brass-500' : 'bg-edge'}`} />
      ))}
    </span>
  );
}

function LockTypes() {
  const [open, setOpen] = useState<Mechanism | null>('pin-tumbler');
  return (
    <div className="space-y-3">
      {LOCK_TYPES.map((t) => {
        const xr = MECH_XRAY[t.id];
        const isOpen = open === t.id;
        return (
          <Card key={t.id} className="overflow-hidden">
            <button className="flex w-full items-center gap-3 p-4 text-left" onClick={() => setOpen(isOpen ? null : t.id)}>
              <div className="flex-1">
                <div className="font-semibold text-slate-100">{t.name}</div>
                <div className="mt-0.5 text-xs text-slate-400">{t.summary}</div>
                <div className="mt-1.5 flex items-center gap-2 text-[10px] uppercase tracking-wider text-slate-500">
                  obtížnost <Dots n={t.difficulty} />
                </div>
              </div>
              <Icon name="chevronDown" className={`text-slate-500 transition ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
                  <div className="border-t border-edge/60 px-4 pb-4 pt-3">
                    {xr && <XrayArt shape={xr} className="mb-3 h-44 w-full rounded-xl bg-ink-950" />}
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-steel-400">Jak funguje</h4>
                    <p className="mt-1 text-sm leading-relaxed text-slate-300">{t.howItWorks}</p>
                    <h4 className="mt-3 text-xs font-semibold uppercase tracking-wider text-steel-400">Kde ho najdeš</h4>
                    <p className="mt-1 text-sm text-slate-300">{t.whereFound}</p>
                    <h4 className="mt-3 text-xs font-semibold uppercase tracking-wider text-steel-400">Postup</h4>
                    <p className="mt-1 text-sm text-slate-300">{t.approach}</p>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {t.tools.map((x) => (
                        <span key={x} className="rounded-full bg-azure-400/10 px-2.5 py-1 text-xs text-azure-400">
                          🛠 {x}
                        </span>
                      ))}
                      {t.weaknesses.map((x) => (
                        <span key={x} className="rounded-full bg-bad/10 px-2.5 py-1 text-xs text-red-300">
                          ⚠ {x}
                        </span>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </Card>
        );
      })}
    </div>
  );
}

function SecurityPins() {
  const { navigate } = useStore();
  return (
    <div>
      <Card className="mb-4 flex items-end justify-around px-2 pb-2 pt-4">
        {SECURITY_PINS.map((p) => (
          <div key={p.id} className="flex flex-col items-center">
            <PinShapeArt kind={p.id as 'standard'} className="h-24" />
            <span className="mt-1 text-[10px] text-slate-400">{p.name.split(' ')[0]}</span>
          </div>
        ))}
      </Card>
      <div className="space-y-3">
        {SECURITY_PINS.map((p) => (
          <Card key={p.id} className="flex gap-4 p-4">
            <PinShapeArt kind={p.id as 'standard'} className="h-28 w-10 shrink-0" />
            <div>
              <div className="font-semibold text-slate-100">{p.name}</div>
              <div className="mt-0.5 text-xs text-slate-400">{p.shape}</div>
              <div className="mt-2 text-sm text-slate-300">
                <b className="text-azure-400">Zpětná vazba:</b> {p.feedback}
              </div>
              <div className="mt-1.5 text-sm text-slate-300">
                <b className="text-emerald-400">Jak na něj:</b> {p.defeat}
              </div>
            </div>
          </Card>
        ))}
      </div>
      <button className="card mt-4 flex w-full items-center gap-3 p-4 text-left" onClick={() => navigate('arcade', { arcade: 'simulator', sim: { pins: 5, spools: 2, serrated: 1 } })}>
        <span className="text-2xl">🧵</span>
        <span className="flex-1">
          <span className="block font-semibold text-brass-300">Trénuj false set a counter-rotation</span>
          <span className="block text-xs text-slate-400">5 pinů · 2× spool · 1× serrated</span>
        </span>
        <Icon name="chevronRight" className="text-slate-500" />
      </button>
    </div>
  );
}

function ToolsCatalog() {
  const [group, setGroup] = useState<ToolGuide['group'] | 'all'>('all');
  const [sel, setSel] = useState<ToolGuide | null>(null);
  const list = TOOL_GUIDE.filter((t) => group === 'all' || t.group === group);
  return (
    <div>
      <div className="-mx-4 mb-3 flex gap-2 overflow-x-auto px-4 scrollbar-none">
        {(
          [
            ['all', 'Vše'],
            ['pick', 'Planžety'],
            ['rake', 'Hrábě'],
            ['tension', 'Napínáky'],
            ['special', 'Speciální'],
          ] as const
        ).map(([id, label]) => (
          <Chip key={id} active={group === id} onClick={() => setGroup(id)}>
            {label}
          </Chip>
        ))}
      </div>
      <div className="grid gap-3">
        {list.map((t) => (
          <Card key={t.profile} onClick={() => setSel(sel?.profile === t.profile ? null : t)} className="overflow-hidden">
            <div className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold text-slate-100">{t.name}</div>
                  <div className="text-xs text-slate-400">{t.tagline}</div>
                </div>
                <Icon name="chevronDown" className={`text-slate-500 transition ${sel?.profile === t.profile ? 'rotate-180' : ''}`} />
              </div>
              <div className="mt-3 rounded-xl bg-ink-950 px-3 py-2">
                <ToolArt profile={t.profile} className="h-12 w-full" />
              </div>
            </div>
            <AnimatePresence initial={false}>
              {sel?.profile === t.profile && (
                <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden" onClick={(e) => e.stopPropagation()}>
                  <div className="border-t border-edge/60 px-4 pb-4 pt-3">
                    <div className="mb-3 h-40 overflow-hidden rounded-xl bg-ink-950">
                      <ToolMotionDemo guide={t} />
                    </div>
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-brass-400">Kdy ho použít</h4>
                    <p className="mt-1 text-sm text-slate-300">{t.when}</p>
                    <h4 className="mt-3 text-xs font-semibold uppercase tracking-wider text-azure-400">Jak s ním pracovat</h4>
                    <p className="mt-1 text-sm text-slate-300">{t.how}</p>
                    <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                      <ul className="space-y-1 rounded-xl bg-ok/5 p-2.5 text-emerald-200">
                        {t.pros.map((p) => (
                          <li key={p}>+ {p}</li>
                        ))}
                      </ul>
                      <ul className="space-y-1 rounded-xl bg-bad/5 p-2.5 text-red-200">
                        {t.cons.map((p) => (
                          <li key={p}>− {p}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </Card>
        ))}
      </div>
    </div>
  );
}

function Belts() {
  return (
    <div>
      <Prose>
        <p>
          Belt ranking je komunitní systém (inspirovaný bojovými sporty), který řadí zámky podle obtížnosti. Pomáhá vybrat další zámek, na kterém se zlepšíš. Zařazení
          konkrétních modelů se mezi komunitami může mírně lišit.
        </p>
      </Prose>
      <div className="mt-4 space-y-2">
        {BELTS.map((b, i) => (
          <motion.div key={b.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}>
            <Card className="flex items-center gap-3 p-3">
              <span className="w-6 text-center font-mono text-sm text-slate-500">{i + 1}</span>
              <BeltBadge belt={b.id} />
              <span className="flex-1 text-sm text-slate-300">{b.desc}</span>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function LawCard({ s }: { s: LawSection }) {
  const tone = s.status === 'ok' ? 'bg-ok/15 text-emerald-300' : s.status === 'caution' ? 'bg-brass-500/15 text-brass-300' : 'bg-bad/15 text-red-300';
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between gap-2">
        <div className="font-semibold text-slate-100">
          <span className="mr-2">{s.flag}</span>
          {s.title}
        </div>
        <span className={`shrink-0 whitespace-nowrap rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${tone}`}>{s.statusLabel}</span>
      </div>
      <ul className="mt-3 space-y-2 text-sm leading-relaxed text-slate-300">
        {s.points.map((p) => (
          <li key={p} className="flex gap-2">
            <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-steel-400" />
            <span>{p}</span>
          </li>
        ))}
      </ul>
    </Card>
  );
}

function Ethics() {
  const [tab, setTab] = useState<'code' | 'law'>('code');
  return (
    <div>
      <div className="mb-4 grid grid-cols-2 gap-2">
        <button
          onClick={() => setTab('code')}
          className={`rounded-2xl border p-3 text-left ${tab === 'code' ? 'border-emerald-500/60 bg-ok/10' : 'border-edge bg-panel/60'}`}
        >
          <div className="text-xl">🤝</div>
          <div className="mt-1 text-sm font-semibold">Etický kodex</div>
          <div className="text-[11px] text-slate-400">Nepsaná pravidla komunity</div>
        </button>
        <button onClick={() => setTab('law')} className={`rounded-2xl border p-3 text-left ${tab === 'law' ? 'border-brass-500/60 bg-brass-500/10' : 'border-edge bg-panel/60'}`}>
          <div className="text-xl">⚖️</div>
          <div className="mt-1 text-sm font-semibold">Zákony</div>
          <div className="text-[11px] text-slate-400">ČR a svět – co smíš a nesmíš</div>
        </button>
      </div>

      {tab === 'code' ? (
        <div>
          <Prose>
            <p>
              Locksport stojí na důvěře. Vychází z kodexů organizací jako <b>TOOOL</b> nebo <b>Locksport International</b>. Tato pravidla nejsou zákon – jsou to
              závazky, které si komunita dobrovolně dává, aby koníček zůstal legální, bezpečný a respektovaný.
            </p>
          </Prose>
          <SectionTitle>Dvě zlatá pravidla</SectionTitle>
          <div className="space-y-3">
            {ETHICS.filter((e) => e.golden).map((e, i) => (
              <Card key={e.title} className="border-brass-500/40 p-4">
                <div className="flex gap-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brass-500 font-bold text-ink-950">{i + 1}</span>
                  <div>
                    <div className="font-semibold text-brass-300">{e.title}</div>
                    <p className="mt-1 text-sm leading-relaxed text-slate-300">{e.text}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
          <SectionTitle>Další zásady</SectionTitle>
          <div className="space-y-2">
            {ETHICS.filter((e) => !e.golden).map((e) => (
              <Card key={e.title} className="flex gap-3 p-4">
                <span className="text-2xl">{e.icon}</span>
                <div>
                  <div className="font-semibold text-slate-100">{e.title}</div>
                  <p className="mt-1 text-sm leading-relaxed text-slate-300">{e.text}</p>
                </div>
              </Card>
            ))}
          </div>
          <Card className="mt-4 p-4">
            <div className="text-sm font-semibold text-slate-100">Rychlý test: smím…?</div>
            <ul className="mt-2 space-y-1.5 text-sm">
              {[
                ['Otevřít svůj visací zámek z šuplíku', true],
                ['Otevřít svou vložku vyndanou ze dveří', true],
                ['Otevřít zámek kamaráda s jeho svolením (mimo provoz)', true],
                ['Otevřít zámek na vlastním kole, které je zamčené na ulici', false],
                ['Otevřít sousedovi zabouchnuté dveře „z ochoty“', false],
                ['Otevřít firemní skříňku bez souhlasu správce', false],
                ['Zkoušet zámky v obchodě „jen na zkoušku“', false],
              ].map(([q, ok]) => (
                <li key={q as string} className="flex items-start gap-2">
                  <span className={ok ? 'text-emerald-400' : 'text-red-400'}>{ok ? '✔' : '✘'}</span>
                  <span className="text-slate-300">{q}</span>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="rounded-2xl border border-brass-500/40 bg-brass-500/5 p-3 text-xs leading-relaxed text-brass-200">
            ⚠️ Informace jsou orientační (stav: {LAW_UPDATED}) a <b>nejsou právní radou</b>. Zákony se mění – v konkrétní situaci si ověř aktuální znění nebo se obrať na
            právníka.
          </div>
          <LawCard s={LAW_CZ} />
          <SectionTitle>V zahraničí</SectionTitle>
          {LAW_WORLD.map((s) => (
            <LawCard key={s.title} s={s} />
          ))}
          <Card className="p-4">
            <div className="text-xs font-semibold uppercase tracking-wider text-steel-400">Zdroje</div>
            <ul className="mt-2 space-y-1 text-xs text-slate-400">
              {LAW_SOURCES.map((s) => (
                <li key={s}>• {s}</li>
              ))}
            </ul>
          </Card>
        </div>
      )}
    </div>
  );
}

function Glossary() {
  const [q, setQ] = useState('');
  const list = useMemo(() => GLOSSARY.filter((g) => (g.term + g.def).toLowerCase().includes(q.toLowerCase())), [q]);
  return (
    <div>
      <div className="relative mb-3">
        <Icon name="search" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
        <input className="field pl-9" placeholder="Hledat pojem…" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      <Card className="divide-y divide-edge/50">
        {list.map((g) => (
          <div key={g.term} className="px-4 py-3">
            <div className="text-sm font-semibold text-brass-300">{g.term}</div>
            <div className="mt-0.5 text-sm text-slate-300">{g.def}</div>
          </div>
        ))}
        {!list.length && <div className="px-4 py-6 text-center text-sm text-slate-500">Nic nenalezeno.</div>}
      </Card>
    </div>
  );
}
