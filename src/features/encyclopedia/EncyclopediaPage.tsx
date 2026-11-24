import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { useStore } from '../../store/AppStore';
import { BeltBadge, Card, Chip, GroupLabel, IconTile, ListGroup, ListRow, PageHeader, SectionTitle, Segmented, SelectRow } from '../../components/ui';
import { Icon, isIconName, type IconName } from '../../components/Icon';
import { BELTS } from '../../data/labels';
import { ETHICS, GLOSSARY, LAW_CZ, LAW_SOURCES, LAW_UPDATED, LAW_WORLD, LOCK_TYPES, SECURITY_PINS, TOOL_GUIDE, type LawSection, type ToolGuide } from '../../data/library';
import { COMPAT, EXTRA_TOOLS, LOCK_KINDS, fitOf, type Fit } from '../../data/compat';
import { ToolArt, ToolMotionDemo } from '../../components/svg/ToolArt';
import { Cutaway, GlossaryArt, LockTypeDiagram, PinProfile, P } from '../../components/svg/Diagrams';
import { BindingOrderDemo, ShearLineDemo } from './PhysicsDemos';
import { IOS } from '../../lib/colors';
import type { Mechanism, PinType, ToolProfile } from '../../types';

type Section = 'physics' | 'types' | 'security' | 'tools' | 'compat' | 'belts' | 'ethics' | 'glossary';

const SECTIONS: { id: Section; title: string; desc: string; icon: IconName; color: string; group: 'basics' | 'gear' }[] = [
  { id: 'physics', title: 'Jak funguje zámek', desc: 'Střižná rovina, tolerance, binding order', icon: 'target', color: IOS.orange, group: 'basics' },
  { id: 'types', title: 'Typy zámků', desc: 'Stavítkové, lamelové, diskové, důlkové…', icon: 'lock', color: IOS.blue, group: 'basics' },
  { id: 'security', title: 'Bezpečnostní stavítka', desc: 'Spool, serrated, mushroom, T-pin', icon: 'pin', color: IOS.red, group: 'basics' },
  { id: 'glossary', title: 'Slovník pojmů', desc: 'S obrázkem u každého pojmu', icon: 'book', color: IOS.gray, group: 'basics' },
  { id: 'tools', title: 'Katalog nástrojů', desc: 'Planžety, hrábě, napínáky + animace', icon: 'wrench', color: IOS.green, group: 'gear' },
  { id: 'compat', title: 'Co na co?', desc: 'Který nástroj na jaký zámek', icon: 'grid', color: IOS.teal, group: 'gear' },
  { id: 'belts', title: 'Pásy obtížnosti', desc: 'Komunitní žebříček zámků', icon: 'trophy', color: IOS.yellow, group: 'gear' },
  { id: 'ethics', title: 'Zákony a etický kodex', desc: 'Co smíš, co ne a proč', icon: 'shield', color: IOS.indigo, group: 'gear' },
];


export function EncyclopediaPage() {
  const { intent, consumeIntent } = useStore();
  const [section, setSection] = useState<Section | null>(null);

  useEffect(() => {
    if (intent?.tab === 'library' && intent.library) {
      setSection(intent.library as Section);
      consumeIntent();
    }
  }, [intent, consumeIntent]);

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [section]);

  const cur = SECTIONS.find((s) => s.id === section);

  if (!cur) {
    return (
      <motion.div key="index" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <PageHeader title="Encyklopedie" />
        <CompatTeaser onOpen={() => setSection('compat')} />
        <GroupLabel>Základy</GroupLabel>
        <ListGroup>
          {SECTIONS.filter((s) => s.group === 'basics').map((s, i, arr) => (
            <ListRow key={s.id} icon={s.icon} color={s.color} title={s.title} sub={s.desc} onClick={() => setSection(s.id)} last={i === arr.length - 1} />
          ))}
        </ListGroup>
        <GroupLabel>Výbava a pravidla</GroupLabel>
        <ListGroup>
          {SECTIONS.filter((s) => s.group === 'gear').map((s, i, arr) => (
            <ListRow key={s.id} icon={s.icon} color={s.color} title={s.title} sub={s.desc} onClick={() => setSection(s.id)} last={i === arr.length - 1} />
          ))}
        </ListGroup>
      </motion.div>
    );
  }

  return (
    <motion.div key={cur.id} initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} transition={{ type: 'spring', stiffness: 400, damping: 38 }}>
      <button onClick={() => setSection(null)} className="-ml-1 mb-1 inline-flex items-center text-[17px] text-brass-500 active:opacity-50">
        <Icon name="chevronLeft" size={22} strokeWidth={2.4} /> Encyklopedie
      </button>
      <PageHeader title={cur.title} />
      {cur.id === 'physics' && <Physics />}
      {cur.id === 'types' && <LockTypes />}
      {cur.id === 'security' && <SecurityPins />}
      {cur.id === 'tools' && <ToolsCatalog />}
      {cur.id === 'compat' && <Compat />}
      {cur.id === 'belts' && <Belts />}
      {cur.id === 'ethics' && <Ethics />}
      {cur.id === 'glossary' && <Glossary />}
    </motion.div>
  );
}

function Prose({ children }: { children: ReactNode }) {
  return <div className="space-y-3 px-1 text-[16px] leading-relaxed text-slate-300">{children}</div>;
}

function Figure({ children, caption }: { children: ReactNode; caption?: ReactNode }) {
  return (
    <figure className="card my-4 overflow-hidden">
      <div className="bg-well p-3">{children}</div>
      {caption && <figcaption className="px-4 py-2.5 text-[13px] text-slate-400">{caption}</figcaption>}
    </figure>
  );
}

function FitDot({ fit, size = 12 }: { fit: Fit; size?: number }) {
  if (fit === 2) return <span className="inline-block rounded-full" style={{ width: size, height: size, background: IOS.green }} aria-label="ideální" />;
  if (fit === 1) return <span className="inline-block rounded-full border-[2.5px]" style={{ width: size, height: size, borderColor: IOS.orange }} aria-label="použitelné" />;
  return <span className="inline-block rounded-full border-2 border-sep" style={{ width: size, height: size }} aria-label="nevhodné" />;
}

/* ───────────────────────── Co na co? ───────────────────────── */

const GROUPS: { id: ToolGuide['group'] | 'diamond'; label: string; tools: ToolProfile[] }[] = [
  { id: 'pick', label: 'Háky', tools: ['short-hook', 'medium-hook', 'deep-hook', 'gonzo-hook'] },
  { id: 'diamond', label: 'Diamant', tools: ['half-diamond', 'ball'] },
  { id: 'rake', label: 'Hrábě', tools: ['bogota', 'city-rake', 'snake', 'w-rake'] },
  { id: 'tension', label: 'Napínák', tools: ['tok-bar', 'bok-wrench', 'twist-wrench'] },
  { id: 'special', label: 'Speciál', tools: ['disc-pick', 'tubular-pick', 'wafer-jiggler'] },
];
const groupFit = (tools: ToolProfile[], lock: Exclude<Mechanism, 'other'>): Fit => Math.max(0, ...tools.map((t) => fitOf(t, lock))) as Fit;

function CompatTeaser({ onOpen }: { onOpen: () => void }) {
  return (
    <button type="button" onClick={onOpen} className="card block w-full p-4 text-left transition active:opacity-70">
      <div className="flex items-center justify-between">
        <span className="text-[17px] font-semibold text-slate-50">Co na co?</span>
        <span className="text-[15px] text-brass-500">Celý přehled</span>
      </div>
      <p className="text-[13px] text-slate-400">Který nástroj se hodí na jaký zámek</p>
      <CompatTable rows={LOCK_KINDS.slice(0, 3)} compact />
    </button>
  );
}

function CompatTable({ rows = LOCK_KINDS, compact = false }: { rows?: typeof LOCK_KINDS; compact?: boolean }) {
  return (
    <table className="mt-2 w-full border-collapse text-[13px]">
      <thead>
        <tr className="text-slate-400">
          <th className="py-1 text-left font-medium">Zámek</th>
          {GROUPS.map((g) => (
            <th key={g.id} className="px-0.5 py-1 text-center font-medium">
              {g.label}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <tr key={r.id} className="border-t border-sep">
            <td className={`${compact ? 'py-1.5' : 'py-2.5'} text-slate-50`}>{r.short}</td>
            {GROUPS.map((g) => (
              <td key={g.id} className="text-center">
                <FitDot fit={groupFit(g.tools, r.id)} />
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function Compat() {
  const [mode, setMode] = useState<'lock' | 'tool'>('lock');
  const [lock, setLock] = useState<Exclude<Mechanism, 'other'>>('pin-tumbler');
  const [tool, setTool] = useState<ToolProfile>('short-hook');
  const guide = (p: ToolProfile) => TOOL_GUIDE.find((t) => t.profile === p);
  const forLock = (f: Fit) => TOOL_GUIDE.filter((t) => fitOf(t.profile, lock) === f);
  const lt = LOCK_TYPES.find((t) => t.id === lock);
  return (
    <div>
      <Segmented
        value={mode}
        onChange={setMode}
        options={[
          { id: 'lock', label: 'Mám zámek' },
          { id: 'tool', label: 'Mám nástroj' },
        ]}
      />

      {mode === 'lock' ? (
        <>
          <div className="scrollbar-none -mx-4 mt-3 flex gap-2 overflow-x-auto px-4">
            {LOCK_KINDS.map((k) => (
              <Chip key={k.id} active={lock === k.id} onClick={() => setLock(k.id)}>
                {k.short}
              </Chip>
            ))}
          </div>
          <Figure caption={lt?.approach}>
            <LockTypeDiagram mech={lock} className="mx-auto w-full max-w-sm" />
          </Figure>
          {([2, 1] as Fit[]).map((f) => {
            const list = forLock(f);
            if (!list.length) return null;
            return (
              <div key={f}>
                <GroupLabel>{f === 2 ? 'Ideální volba' : 'Použitelné'}</GroupLabel>
                <ListGroup>
                  {list.map((t, i) => (
                    <div key={t.profile} className="relative flex items-center gap-3 px-4 py-2.5">
                      <span className="flex h-10 w-16 shrink-0 items-center justify-center rounded-lg bg-well px-1">
                        <ToolArt profile={t.profile} className="h-full w-full" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-[16px] text-slate-50">{t.name}</span>
                        <span className="block text-[13px] leading-snug text-slate-400">{COMPAT[t.profile]?.note ?? t.tagline}</span>
                      </span>
                      <FitDot fit={f} />
                      {i < list.length - 1 && <span className="absolute bottom-0 left-[92px] right-0 h-px bg-sep" />}
                    </div>
                  ))}
                </ListGroup>
              </div>
            );
          })}
          {EXTRA_TOOLS[lock] && (
            <div className="card mt-4 flex gap-3 p-3.5">
              <IconTile icon="info" color={IOS.blue} />
              <p className="text-[15px] text-slate-300">
                <b className="text-slate-50">Speciální nástroj: </b>
                {EXTRA_TOOLS[lock]}
              </p>
            </div>
          )}
        </>
      ) : (
        <>
          <ListGroup className="mt-3">
            <SelectRow
              icon="wrench"
              color={IOS.green}
              title="Nástroj"
              value={tool}
              onChange={(v) => v && setTool(v as ToolProfile)}
              options={TOOL_GUIDE.map((t) => ({ value: t.profile, label: t.name }))}
              last
            />
          </ListGroup>
          <Figure caption={COMPAT[tool]?.note ?? guide(tool)?.tagline}>
            <div className="mx-auto h-16 max-w-xs">
              <ToolArt profile={tool} className="h-full w-full" />
            </div>
          </Figure>
          <ListGroup>
            {LOCK_KINDS.map((k, i) => {
              const f = fitOf(tool, k.id);
              return (
                <ListRow
                  key={k.id}
                  title={k.short}
                  sub={f === 2 ? 'Ideální volba' : f === 1 ? 'Použitelné' : 'Nehodí se'}
                  value={<FitDot fit={f} size={14} />}
                  last={i === LOCK_KINDS.length - 1}
                />
              );
            })}
          </ListGroup>
        </>
      )}

      <SectionTitle>Celá tabulka</SectionTitle>
      <Card className="px-4 py-2">
        <CompatTable />
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 border-t border-sep pt-2 text-[12px] text-slate-400">
          <span className="flex items-center gap-1.5">
            <FitDot fit={2} size={10} /> ideální
          </span>
          <span className="flex items-center gap-1.5">
            <FitDot fit={1} size={10} /> použitelné
          </span>
          <span className="flex items-center gap-1.5">
            <FitDot fit={0} size={10} /> nevhodné
          </span>
        </div>
      </Card>
    </div>
  );
}

/* ───────────────────────── Physics ───────────────────────── */

function Physics() {
  const { navigate } = useStore();
  return (
    <div>
      <Figure caption="Řez stavítkovým zámkem: tělo, bubínek, stavítka s pružinami a oranžová střižná rovina.">
        <LockTypeDiagram mech="pin-tumbler" />
      </Figure>
      <Prose>
        <p>
          Stavítkový zámek tvoří <b className="text-slate-50">tělo (shell)</b> a v něm otočný <b className="text-slate-50">bubínek (plug)</b>. Hranice mezi nimi se
          jmenuje <b className="text-slate-50">střižná rovina (shear line)</b>. V každé komoře leží spodní stavítko (key pin), horní stavítko (driver) a pružina.
        </p>
        <p>
          Bez klíče horní stavítka přesahují přes střižnou rovinu do bubínku a ten se nemůže otočit. Správný klíč zvedne každý pár přesně tak, aby jejich rozhraní
          leželo na střižné rovině. Zkus to:
        </p>
      </Prose>
      <Card className="my-4 p-3">
        <ShearLineDemo />
      </Card>
      <SectionTitle>Proč stavítka tuhnou jedno po druhém</SectionTitle>
      <Prose>
        <p>
          Žádný výrobní proces není dokonalý. Otvory v bubínku jsou vyvrtané s drobnými odchylkami (setiny milimetru). Když na bubínek působíš napínákem, narazí
          hrana bubínku nejdřív jen na <b className="text-red-300">jedno stavítko</b> – to je <b className="text-slate-50">binding pin</b>. Ostatní zatím volně pruží.
        </p>
      </Prose>
      <Card className="my-4 p-3">
        <BindingOrderDemo />
      </Card>
      <Prose>
        <p>
          Když binding pin zvedneš na střižnou rovinu, horní stavítko se zachytí na hraně bubínku, bubínek se nepatrně pootočí a <b className="text-slate-50">začne tuhnout další stavítko</b>.
          Tomu se říká <b className="text-slate-50">binding order</b>. Celé SPP je o opakování: najdi binding pin → zvedni → klik → další.
        </p>
        <p>
          <b className="text-slate-50">Napětí je klíčové:</b> příliš slabé = stavítko se nezachytí; příliš silné = stavítko se pohybuje trhavě a snadno ho{' '}
          <b className="text-red-300">přemačkáš</b> (spodní stavítko se zasekne nad střižnou rovinou).
        </p>
      </Prose>
      <ListGroup className="mt-4">
        <ListRow
          icon="play"
          color={IOS.blue}
          title="Vyzkoušej si to v simulátoru"
          sub="4 stavítka, průhledný zámek"
          onClick={() => navigate('arcade', { arcade: 'simulator', sim: { pins: 4 } })}
          last
        />
      </ListGroup>
    </div>
  );
}

/* ───────────────────────── Lock types ───────────────────────── */

function Dots({ n }: { n: number }) {
  return (
    <span className="inline-flex gap-0.5" aria-label={`obtížnost ${n} z 5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i} className={`h-1.5 w-3.5 rounded-full ${i <= n ? 'bg-brass-500' : 'bg-fill-strong'}`} />
      ))}
    </span>
  );
}

function LockTypes() {
  const [open, setOpen] = useState<Mechanism | null>(null);
  return (
    <div className="space-y-4">
      {LOCK_TYPES.map((t) => {
        const isOpen = open === t.id;
        return (
          <Card key={t.id} className="overflow-hidden">
            <div className="bg-well px-3 pt-3">
              <LockTypeDiagram mech={t.id} className="mx-auto w-full max-w-sm" />
            </div>
            <button className="flex w-full items-start gap-3 p-4 text-left" onClick={() => setOpen(isOpen ? null : t.id)} aria-expanded={isOpen}>
              <div className="min-w-0 flex-1">
                <div className="text-[17px] font-semibold text-slate-50">{t.name}</div>
                <div className="mt-0.5 text-[15px] leading-snug text-slate-400">{t.summary}</div>
                <div className="mt-2 flex items-center gap-2 text-[13px] text-slate-400">
                  Obtížnost <Dots n={t.difficulty} />
                </div>
              </div>
              <span className="mt-1 text-[15px] text-brass-500">{isOpen ? 'Méně' : 'Více'}</span>
            </button>
            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
                  <div className="space-y-3 border-t border-sep px-4 pb-4 pt-3 text-[15px] leading-relaxed text-slate-300">
                    <InfoBlock icon="layers" color={IOS.blue} title="Jak funguje">
                      {t.howItWorks}
                    </InfoBlock>
                    <InfoBlock icon="home" color={IOS.green} title="Kde ho najdeš">
                      {t.whereFound}
                    </InfoBlock>
                    <InfoBlock icon="target" color={IOS.orange} title="Postup">
                      {t.approach}
                    </InfoBlock>
                    <InfoBlock icon="wrench" color={IOS.teal} title="Nástroje">
                      {t.tools.join(' · ')}
                    </InfoBlock>
                    <InfoBlock icon="info" color={IOS.red} title="Slabiny">
                      {t.weaknesses.join(' · ')}
                    </InfoBlock>
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

function InfoBlock({ icon, color, title, children }: { icon: IconName; color: string; title: string; children: ReactNode }) {
  return (
    <div className="flex gap-3">
      <IconTile icon={icon} color={color} size={26} />
      <div className="min-w-0">
        <div className="text-[13px] font-semibold text-slate-50">{title}</div>
        <div>{children}</div>
      </div>
    </div>
  );
}

/* ───────────────────────── Security pins ───────────────────────── */

const PIN_DEMO: Partial<Record<PinType, { lift: number; shift: number; caption: string }>> = {
  standard: { lift: 12, shift: 1, caption: 'Zvednuté na střižnou rovinu – čisté „klik“.' },
  spool: { lift: 3, shift: 5, caption: 'Pas cívky na rovině → falešné otevření (false set).' },
  serrated: { lift: 6, shift: 2, caption: 'Zuby se zachytávají – mnoho drobných kliknutí.' },
  mushroom: { lift: 4, shift: 4, caption: 'Krček na rovině – mělčí false set, jemný zpětný tlak.' },
  't-pin': { lift: 2, shift: 6, caption: 'Jedno osazení – hluboký false set, silný zpětný tlak.' },
};

function SecurityPins() {
  const { navigate } = useStore();
  return (
    <div>
      <Card className="flex items-end justify-around bg-well px-2 pb-3 pt-4">
        {SECURITY_PINS.map((p) => (
          <div key={p.id} className="flex flex-col items-center">
            <PinProfile kind={p.id} className="h-24 w-10" />
            <span className="mt-1 text-[12px] font-medium text-slate-400">{p.name.split(' ')[0]}</span>
          </div>
        ))}
      </Card>
      <div className="mt-4 space-y-4">
        {SECURITY_PINS.map((p) => {
          const demo = PIN_DEMO[p.id];
          return (
            <Card key={p.id} className="overflow-hidden">
              <div className="flex items-center gap-3 bg-well p-3">
                <PinProfile kind={p.id} className="h-24 w-9 shrink-0" />
                {demo && (
                  <Cutaway
                    title={p.name}
                    className="w-full min-w-0 flex-1"
                    plugShift={demo.shift}
                    pins={[
                      { keyLen: 22, lift: 34 - 22 },
                      { keyLen: 26, lift: demo.lift, driver: p.id, hl: p.id === 'standard' ? P.green : P.shear },
                      { keyLen: 20 },
                    ]}
                  />
                )}
              </div>
              <div className="p-4">
                <div className="text-[17px] font-semibold text-slate-50">{p.name}</div>
                <div className="text-[13px] text-slate-400">{demo?.caption ?? p.shape}</div>
                <div className="mt-3 space-y-2.5 text-[15px] leading-relaxed text-slate-300">
                  <InfoBlock icon="hand" color={IOS.blue} title="Co ucítíš">
                    {p.feedback}
                  </InfoBlock>
                  <InfoBlock icon="check" color={IOS.green} title="Jak na něj">
                    {p.defeat}
                  </InfoBlock>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
      <ListGroup className="mt-4">
        <ListRow
          icon="play"
          color={IOS.red}
          title="Trénuj false set a zpětný tlak"
          sub="Simulátor: 5 pinů · 2× spool · 1× serrated"
          onClick={() => navigate('arcade', { arcade: 'simulator', sim: { pins: 5, spools: 2, serrated: 1 } })}
          last
        />
      </ListGroup>
    </div>
  );
}

/* ───────────────────────── Tools ───────────────────────── */

function ToolsCatalog() {
  const [group, setGroup] = useState<ToolGuide['group'] | 'all'>('all');
  const [sel, setSel] = useState<ToolGuide | null>(null);
  const list = TOOL_GUIDE.filter((t) => group === 'all' || t.group === group);
  return (
    <div>
      <div className="scrollbar-none -mx-4 mb-3 flex gap-2 overflow-x-auto px-4">
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
        {list.map((t) => {
          const open = sel?.profile === t.profile;
          const good = LOCK_KINDS.filter((k) => fitOf(t.profile, k.id) > 0);
          return (
            <Card key={t.profile} className="overflow-hidden">
              <button className="block w-full p-4 text-left" onClick={() => setSel(open ? null : t)} aria-expanded={open}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-[17px] font-semibold text-slate-50">{t.name}</div>
                    <div className="text-[15px] leading-snug text-slate-400">{t.tagline}</div>
                  </div>
                  <span className="shrink-0 text-[15px] text-brass-500">{open ? 'Méně' : 'Více'}</span>
                </div>
                <div className="mt-3 rounded-xl bg-well px-3 py-2">
                  <ToolArt profile={t.profile} className="h-12 w-full" />
                </div>
                {good.length > 0 && (
                  <div className="mt-2.5 flex flex-wrap gap-1.5">
                    {good.map((k) => (
                      <span key={k.id} className="inline-flex items-center gap-1.5 rounded-full bg-fill px-2.5 py-1 text-[12px] text-slate-200">
                        <FitDot fit={fitOf(t.profile, k.id)} size={8} /> {k.short}
                      </span>
                    ))}
                  </div>
                )}
              </button>
              <AnimatePresence initial={false}>
                {open && (
                  <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
                    <div className="border-t border-sep px-4 pb-4 pt-3">
                      <div className="mb-3 h-40 overflow-hidden rounded-xl bg-well">
                        <ToolMotionDemo guide={t} />
                      </div>
                      <div className="space-y-2.5 text-[15px] leading-relaxed text-slate-300">
                        <InfoBlock icon="target" color={IOS.orange} title="Kdy ho použít">
                          {t.when}
                        </InfoBlock>
                        <InfoBlock icon="hand" color={IOS.blue} title="Jak s ním pracovat">
                          {t.how}
                        </InfoBlock>
                      </div>
                      <div className="mt-3 grid grid-cols-2 gap-2 text-[13px]">
                        <ul className="space-y-1 rounded-xl bg-ok/10 p-2.5 text-slate-200">
                          {t.pros.map((p) => (
                            <li key={p} className="flex gap-1.5">
                              <Icon name="check" size={14} strokeWidth={2.6} className="mt-0.5 shrink-0 text-emerald-300" />
                              {p}
                            </li>
                          ))}
                        </ul>
                        <ul className="space-y-1 rounded-xl bg-bad/10 p-2.5 text-slate-200">
                          {t.cons.map((p) => (
                            <li key={p} className="flex gap-1.5">
                              <Icon name="x" size={14} strokeWidth={2.6} className="mt-0.5 shrink-0 text-red-300" />
                              {p}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

/* ───────────────────────── Belts ───────────────────────── */

function Belts() {
  return (
    <div>
      <Figure>
        <GlossaryArt id="belts" />
      </Figure>
      <Prose>
        <p>
          Pásy obtížnosti jsou komunitní systém (inspirovaný bojovými sporty), který řadí zámky podle obtížnosti. Pomáhá vybrat další zámek, na kterém se zlepšíš.
          Zařazení konkrétních modelů se mezi komunitami může mírně lišit.
        </p>
      </Prose>
      <ListGroup className="mt-4">
        {BELTS.map((b, i) => (
          <div key={b.id} className="relative flex items-center gap-3 px-4 py-2.5">
            <span className="w-5 text-center font-mono text-[13px] text-slate-500">{i + 1}</span>
            <BeltBadge belt={b.id} />
            <span className="min-w-0 flex-1 text-[15px] text-slate-300">{b.desc}</span>
            {i < BELTS.length - 1 && <span className="absolute bottom-0 left-4 right-0 h-px bg-sep" />}
          </div>
        ))}
      </ListGroup>
    </div>
  );
}

/* ───────────────────────── Ethics & law ───────────────────────── */

function FlagChip({ flag }: { flag: string }) {
  if (isIconName(flag)) return <IconTile icon={flag} color={IOS.cyan} size={28} />;
  return <span className="flex h-7 min-w-9 items-center justify-center rounded-md bg-fill px-1.5 text-[12px] font-bold tracking-wide text-slate-200">{flag}</span>;
}

function LawCard({ s }: { s: LawSection }) {
  const tone = s.status === 'ok' ? 'bg-ok/15 text-emerald-300' : s.status === 'caution' ? 'bg-orange-500/15 text-orange-300' : 'bg-bad/15 text-red-300';
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 text-[17px] font-semibold text-slate-50">
          <FlagChip flag={s.flag} />
          {s.title}
        </div>
        <span className={`shrink-0 whitespace-nowrap rounded-full px-2.5 py-0.5 text-[12px] font-semibold ${tone}`}>{s.statusLabel}</span>
      </div>
      <ul className="mt-3 space-y-2 text-[15px] leading-relaxed text-slate-300">
        {s.points.map((p) => (
          <li key={p} className="flex gap-2">
            <span className="mt-2.5 h-1 w-1 shrink-0 rounded-full bg-slate-500" />
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
      <Segmented
        value={tab}
        onChange={setTab}
        options={[
          { id: 'code', label: 'Etický kodex' },
          { id: 'law', label: 'Zákony' },
        ]}
      />

      {tab === 'code' ? (
        <div className="mt-4">
          <Prose>
            <p>
              Locksport stojí na důvěře. Vychází z kodexů organizací jako <b className="text-slate-50">TOOOL</b> nebo <b className="text-slate-50">Locksport International</b>.
              Tato pravidla nejsou zákon – jsou to závazky, které si komunita dobrovolně dává, aby koníček zůstal legální, bezpečný a respektovaný.
            </p>
          </Prose>
          <SectionTitle>Dvě zlatá pravidla</SectionTitle>
          <div className="space-y-3">
            {ETHICS.filter((e) => e.golden).map((e) => (
              <Card key={e.title} className="flex gap-3.5 p-4">
                <IconTile icon={e.icon} color={e.color} size={40} />
                <div>
                  <div className="text-[17px] font-semibold text-slate-50">{e.title}</div>
                  <p className="mt-1 text-[15px] leading-relaxed text-slate-300">{e.text}</p>
                </div>
              </Card>
            ))}
          </div>
          <SectionTitle>Další zásady</SectionTitle>
          <ListGroup>
            {ETHICS.filter((e) => !e.golden).map((e, i, arr) => (
              <div key={e.title} className="relative flex gap-3 px-4 py-3">
                <IconTile icon={e.icon} color={e.color} />
                <div className="min-w-0">
                  <div className="text-[16px] font-semibold text-slate-50">{e.title}</div>
                  <p className="mt-0.5 text-[15px] leading-relaxed text-slate-400">{e.text}</p>
                </div>
                {i < arr.length - 1 && <span className="absolute bottom-0 left-[58px] right-0 h-px bg-sep" />}
              </div>
            ))}
          </ListGroup>
          <SectionTitle>Rychlý test: smím…?</SectionTitle>
          <ListGroup>
            {(
              [
                ['Otevřít svůj visací zámek z šuplíku', true],
                ['Otevřít svou vložku vyndanou ze dveří', true],
                ['Otevřít zámek kamaráda s jeho svolením (mimo provoz)', true],
                ['Otevřít zámek na vlastním kole, které je zamčené na ulici', false],
                ['Otevřít sousedovi zabouchnuté dveře „z ochoty“', false],
                ['Otevřít firemní skříňku bez souhlasu správce', false],
                ['Zkoušet zámky v obchodě „jen na zkoušku“', false],
              ] as const
            ).map(([q, ok], i, arr) => (
              <div key={q} className="relative flex items-center gap-3 px-4 py-2.5">
                <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-white ${ok ? 'bg-ok' : 'bg-bad'}`}>
                  <Icon name={ok ? 'check' : 'x'} size={14} strokeWidth={3} />
                </span>
                <span className="text-[15px] text-slate-100">{q}</span>
                {i < arr.length - 1 && <span className="absolute bottom-0 left-[52px] right-0 h-px bg-sep" />}
              </div>
            ))}
          </ListGroup>
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          <div className="card flex gap-3 p-3.5">
            <IconTile icon="info" color={IOS.orange} />
            <p className="text-[13px] leading-relaxed text-slate-300">
              Informace jsou orientační (stav: {LAW_UPDATED}) a <b className="text-slate-50">nejsou právní radou</b>. Zákony se mění – v konkrétní situaci si ověř aktuální
              znění nebo se obrať na právníka.
            </p>
          </div>
          <LawCard s={LAW_CZ} />
          <SectionTitle>V zahraničí</SectionTitle>
          {LAW_WORLD.map((s) => (
            <LawCard key={s.title} s={s} />
          ))}
          <GroupLabel>Zdroje</GroupLabel>
          <Card className="p-4">
            <ul className="space-y-1 text-[13px] text-slate-400">
              {LAW_SOURCES.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
          </Card>
        </div>
      )}
    </div>
  );
}

/* ───────────────────────── Glossary ───────────────────────── */

function Glossary() {
  const [q, setQ] = useState('');
  const list = useMemo(() => GLOSSARY.filter((g) => (g.term + g.def).toLowerCase().includes(q.toLowerCase())), [q]);
  return (
    <div>
      <label className="relative mb-3 block">
        <span className="sr-only">Hledat pojem</span>
        <Icon name="search" size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
        <input className="field pl-9" placeholder="Hledat pojem" value={q} onChange={(e) => setQ(e.target.value)} />
      </label>
      <div className="grid gap-3 sm:grid-cols-2">
        {list.map((g) => (
          <Card key={g.term} className="overflow-hidden">
            <div className="bg-well px-2 pt-2">
              <GlossaryArt id={g.art} />
            </div>
            <div className="px-4 py-3">
              <div className="text-[17px] font-semibold text-slate-50">{g.term}</div>
              <div className="mt-0.5 text-[15px] leading-snug text-slate-300">{g.def}</div>
            </div>
          </Card>
        ))}
      </div>
      {!list.length && <Card className="px-4 py-8 text-center text-[15px] text-slate-400">Nic nenalezeno.</Card>}
    </div>
  );
}
