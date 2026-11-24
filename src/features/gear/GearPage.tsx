import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';
import { useStore } from '../../store/AppStore';
import type { Belt, LockFormFactor, LockItem, Mechanism, ToolCategory, ToolItem, ToolProfile, ToolThickness, WrenchPosition } from '../../types';
import { BELTS, FORM_FACTORS, MECHANISMS, PIN_TYPES, THICKNESSES, TOOL_CATEGORIES, TOOL_PROFILES, beltRank, thicknessLabel } from '../../data/labels';
import { BeltBadge, Button, Card, Chip, Empty, Field, PageHeader, Segmented, Sheet } from '../../components/ui';
import { Icon } from '../../components/Icon';
import { BindingTracker } from './BindingTracker';
import { ToolArt } from '../../components/svg/ToolArt';
import { effectiveTime, summarize } from '../../lib/stats';
import { formatTime } from '../../lib/format';
import { specFromLock } from '../sim/SimulatorPanel';

const MANUFACTURERS = ['Sparrows', 'Multipick', 'Peterson', 'SouthOrd', 'Covert Instruments', 'Law Lock Tools', 'Goso', 'Dangerfield', 'Vlastní výroba'];

export function GearPage() {
  const { intent, consumeIntent } = useStore();
  const [tab, setTab] = useState<'locks' | 'tools'>('locks');
  useEffect(() => {
    if (intent?.tab === 'gear' && intent.gear) {
      setTab(intent.gear);
      consumeIntent();
    }
  }, [intent, consumeIntent]);
  return (
    <div>
      <PageHeader title="Moje výbava" subtitle="Sbírka zámků a arzenál nástrojů" />
      <Segmented
        value={tab}
        onChange={setTab}
        options={[
          { id: 'locks', label: '🔒 Sbírka zámků' },
          { id: 'tools', label: '🧰 Arzenál' },
        ]}
      />
      <div className="mt-4">{tab === 'locks' ? <LockVault /> : <Arsenal />}</div>
    </div>
  );
}

/* ─────────────────────────── Locks ─────────────────────────── */

function emptyLock(): Omit<LockItem, 'id' | 'createdAt'> {
  return { name: '', brand: '', mechanism: 'pin-tumbler', formFactor: 'padlock', pins: 5, belt: 'yellow', keyway: '', pinConfig: [], bindingOrder: [], notes: '' };
}

function LockVault() {
  const { data, navigate, setTimerConfig } = useStore();
  const [edit, setEdit] = useState<(Omit<LockItem, 'id' | 'createdAt'> & { id?: string; createdAt?: number }) | null>(null);
  const [sort, setSort] = useState<'belt' | 'name' | 'recent'>('belt');
  const [beltFilter, setBeltFilter] = useState<Belt | null>(null);

  const stats = useMemo(() => {
    const m = new Map<string, ReturnType<typeof summarize>>();
    data.locks.forEach((l) => m.set(l.id, summarize(data.solves.filter((s) => s.lockId === l.id))));
    return m;
  }, [data.locks, data.solves]);

  const locks = useMemo(() => {
    const l = data.locks.filter((x) => !beltFilter || x.belt === beltFilter);
    if (sort === 'belt') return [...l].sort((a, b) => beltRank(a.belt) - beltRank(b.belt) || a.name.localeCompare(b.name));
    if (sort === 'name') return [...l].sort((a, b) => `${a.brand}${a.name}`.localeCompare(`${b.brand}${b.name}`));
    return [...l].sort((a, b) => b.createdAt - a.createdAt);
  }, [data.locks, sort, beltFilter]);

  const beltsPresent = BELTS.filter((b) => data.locks.some((l) => l.belt === b.id));

  return (
    <div>
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex gap-1.5 overflow-x-auto scrollbar-none">
          <Chip active={!beltFilter} onClick={() => setBeltFilter(null)}>
            Vše ({data.locks.length})
          </Chip>
          {beltsPresent.map((b) => (
            <Chip key={b.id} active={beltFilter === b.id} onClick={() => setBeltFilter(beltFilter === b.id ? null : b.id)}>
              <span className="mr-1 inline-block h-2 w-2 rounded-full" style={{ background: b.color }} />
              {b.label}
            </Chip>
          ))}
        </div>
        <select className="field w-auto py-1.5 text-xs" value={sort} onChange={(e) => setSort(e.target.value as typeof sort)}>
          <option value="belt">Dle pásu</option>
          <option value="name">Dle názvu</option>
          <option value="recent">Nejnovější</option>
        </select>
      </div>

      {locks.length === 0 ? (
        <Empty icon="lock" title="Sbírka je prázdná">
          Přidej svůj první zámek – můžeš u něj sledovat časy i binding order.
        </Empty>
      ) : (
        <div className="space-y-3">
          <AnimatePresence>
            {locks.map((l) => {
              const st = stats.get(l.id)!;
              const security = l.pinConfig.filter((p) => p.type !== 'standard' && p.type !== 'unknown');
              return (
                <motion.div key={l.id} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}>
                  <Card className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-100">
                            {l.brand} {l.name}
                          </span>
                          {l.favorite && <Icon name="star" size={14} className="fill-brass-400 text-brass-400" />}
                        </div>
                        <div className="mt-0.5 text-xs text-slate-400">
                          {MECHANISMS[l.mechanism]} · {FORM_FACTORS[l.formFactor]} · {l.pins} {l.mechanism === 'disc-detainer' ? 'disků' : 'pinů'}
                          {l.keyway ? ` · ${l.keyway}` : ''}
                        </div>
                      </div>
                      <BeltBadge belt={l.belt} size="sm" />
                    </div>
                    <div className="mt-3 flex items-center gap-1">
                      {Array.from({ length: l.pins }, (_, k) => k + 1).map((i) => {
                        const t = l.pinConfig.find((p) => p.index === i)?.type ?? 'unknown';
                        const pos = l.bindingOrder.indexOf(i);
                        return (
                          <div key={i} className="flex flex-1 flex-col items-center rounded-lg bg-ink-950 py-1.5" title={PIN_TYPES[t].label}>
                            <span className="text-[9px] font-semibold" style={{ color: PIN_TYPES[t].color }}>
                              {PIN_TYPES[t].short}
                            </span>
                            <span className="font-mono text-[10px] text-slate-500">{pos >= 0 ? `#${pos + 1}` : '·'}</span>
                          </div>
                        );
                      })}
                    </div>
                    <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
                      <div>
                        <div className="text-slate-500">PB</div>
                        <div className="font-mono text-brass-300">{formatTime(st.best)}</div>
                      </div>
                      <div>
                        <div className="text-slate-500">Ao5</div>
                        <div className="font-mono">{formatTime(st.averages[0].current)}</div>
                      </div>
                      <div>
                        <div className="text-slate-500">Otevřeno</div>
                        <div className="font-mono">
                          {st.solved}/{st.count}
                        </div>
                      </div>
                    </div>
                    {l.notes && <p className="mt-2 rounded-lg bg-ink-950/70 px-2.5 py-1.5 text-xs text-slate-400">📝 {l.notes}</p>}
                    {security.length > 0 && (
                      <div className="mt-2 text-[11px] text-slate-500">
                        Bezpečnostní: {security.map((p) => `#${p.index} ${PIN_TYPES[p.type].short}`).join(', ')}
                      </div>
                    )}
                    <div className="mt-3 flex gap-2">
                      <Button
                        size="sm"
                        variant="brass"
                        icon="timer"
                        className="flex-1"
                        onClick={() => {
                          setTimerConfig({ lockId: l.id });
                          navigate('timer');
                        }}
                      >
                        Trénovat
                      </Button>
                      {l.mechanism === 'pin-tumbler' && (
                        <Button size="sm" icon="gamepad" onClick={() => navigate('arcade', { arcade: 'simulator', sim: { spec: specFromLock(l) } })}>
                          Simulovat
                        </Button>
                      )}
                      <Button size="sm" icon="edit" onClick={() => setEdit(l)} aria-label="Upravit" />
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
      <Button variant="brass" size="lg" icon="plus" className="mt-4 w-full" onClick={() => setEdit(emptyLock())}>
        Přidat zámek
      </Button>
      <LockForm value={edit} onClose={() => setEdit(null)} />
      {data.locks.length > 0 && (
        <p className="mt-3 text-center text-xs text-slate-500">
          Nejrychlejší otevření ve sbírce:{' '}
          {formatTime(
            Math.min(
              ...data.solves.filter((s) => data.locks.some((l) => l.id === s.lockId)).map(effectiveTime),
              Infinity,
            ),
            { dnfLabel: '—' },
          )}
        </p>
      )}
    </div>
  );
}

function LockForm({ value, onClose }: { value: (Omit<LockItem, 'id' | 'createdAt'> & { id?: string; createdAt?: number }) | null; onClose: () => void }) {
  const { upsertLock, deleteLock, toast } = useStore();
  const [f, setF] = useState(value);
  const [confirmDel, setConfirmDel] = useState(false);
  useEffect(() => {
    setF(value);
    setConfirmDel(false);
  }, [value]);
  if (!f) return <Sheet open={false} onClose={onClose}>{null}</Sheet>;
  const set = <K extends keyof LockItem>(k: K, v: LockItem[K]) => setF((x) => (x ? { ...x, [k]: v } : x));
  const valid = f.name.trim().length > 0;
  return (
    <Sheet
      open={!!value}
      onClose={onClose}
      title={f.id ? 'Upravit zámek' : 'Nový zámek'}
      tall
      footer={
        <div className="flex gap-2">
          {f.id && (
            <Button
              variant="danger"
              icon="trash"
              onClick={() => {
                if (!confirmDel) return setConfirmDel(true);
                deleteLock(f.id!);
                toast({ icon: '🗑️', title: 'Zámek odstraněn' });
                onClose();
              }}
            >
              {confirmDel ? 'Opravdu?' : ''}
            </Button>
          )}
          <Button
            variant="brass"
            className="flex-1"
            disabled={!valid}
            onClick={() => {
              upsertLock({
                ...f,
                name: f.name.trim(),
                brand: f.brand.trim(),
                pinConfig: f.pinConfig.filter((p) => p.index <= f.pins),
                bindingOrder: f.bindingOrder.filter((p) => p <= f.pins),
              });
              toast({ icon: '🔒', title: f.id ? 'Zámek uložen' : 'Zámek přidán do sbírky', tone: 'ok' });
              onClose();
            }}
          >
            Uložit
          </Button>
        </div>
      }
    >
      <div className="grid grid-cols-2 gap-x-3">
        <Field label="Značka">
          <input className="field" value={f.brand} onChange={(e) => set('brand', e.target.value)} placeholder="Master Lock" list="lock-brands" />
          <datalist id="lock-brands">
            {['Master Lock', 'Abus', 'American Lock', 'Brinks', 'FAB', 'EVVA', 'Mul-T-Lock', 'Kwikset', 'Schlage', 'Medeco', 'Assa', 'Abloy', 'Yale', 'Covert Instruments'].map((b) => (
              <option key={b} value={b} />
            ))}
          </datalist>
        </Field>
        <Field label="Model / název">
          <input className="field" value={f.name} onChange={(e) => set('name', e.target.value)} placeholder="No. 3" />
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-x-3">
        <Field label="Mechanismus">
          <select className="field" value={f.mechanism} onChange={(e) => set('mechanism', e.target.value as Mechanism)}>
            {Object.entries(MECHANISMS).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Typ">
          <select className="field" value={f.formFactor} onChange={(e) => set('formFactor', e.target.value as LockFormFactor)}>
            {Object.entries(FORM_FACTORS).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-x-3">
        <Field label={f.mechanism === 'disc-detainer' ? 'Počet disků' : 'Počet stavítek'}>
          <div className="flex items-center gap-2">
            <button type="button" className="h-10 w-10 rounded-xl border border-edge text-lg" onClick={() => set('pins', Math.max(1, f.pins - 1))}>
              −
            </button>
            <span className="flex-1 text-center font-mono text-lg">{f.pins}</span>
            <button type="button" className="h-10 w-10 rounded-xl border border-edge text-lg" onClick={() => set('pins', Math.min(12, f.pins + 1))}>
              +
            </button>
          </div>
        </Field>
        <Field label="Profil (keyway)">
          <input className="field" value={f.keyway ?? ''} onChange={(e) => set('keyway', e.target.value)} placeholder="KW1, SC1…" />
        </Field>
      </div>
      <Field label="Belt ranking">
        <div className="grid grid-cols-3 gap-1.5">
          {BELTS.map((b) => (
            <button
              key={b.id}
              type="button"
              onClick={() => set('belt', b.id)}
              className={`rounded-xl border px-2 py-2 text-xs font-semibold transition ${f.belt === b.id ? 'scale-[1.03] border-transparent' : 'border-edge opacity-60'}`}
              style={f.belt === b.id ? { background: b.color, color: b.text } : { color: b.color === '#0a0a0a' ? '#e5e7eb' : b.color }}
            >
              {b.label}
            </button>
          ))}
        </div>
      </Field>
      <div className="mb-3">
        <BindingTracker pins={Math.min(f.pins, 12)} config={f.pinConfig} order={f.bindingOrder} onChange={(c, o) => setF((x) => (x ? { ...x, pinConfig: c, bindingOrder: o } : x))} />
      </div>
      <Field label="Poznámky">
        <textarea className="field min-h-[80px]" value={f.notes} onChange={(e) => set('notes', e.target.value)} placeholder="Spool na 3, lehké napětí, otevírat po směru…" />
      </Field>
      <button type="button" className="flex items-center gap-2 text-sm text-slate-300" onClick={() => set('favorite', !f.favorite)}>
        <Icon name="star" size={16} className={f.favorite ? 'fill-brass-400 text-brass-400' : 'text-slate-500'} /> Oblíbený zámek
      </button>
    </Sheet>
  );
}

/* ─────────────────────────── Tools ─────────────────────────── */

function emptyTool(): Omit<ToolItem, 'id' | 'createdAt'> {
  return { name: '', manufacturer: '', category: 'pick', profile: 'short-hook', thickness: '0.025', position: 'n/a', notes: '' };
}

function Arsenal() {
  const { data } = useStore();
  const [edit, setEdit] = useState<(Omit<ToolItem, 'id' | 'createdAt'> & { id?: string; createdAt?: number }) | null>(null);
  const usage = useMemo(() => {
    const m = new Map<string, { count: number; best: number }>();
    data.solves.forEach((s) => {
      [s.pickId, s.tensionId].forEach((id) => {
        if (!id) return;
        const cur = m.get(id) ?? { count: 0, best: Infinity };
        cur.count++;
        cur.best = Math.min(cur.best, effectiveTime(s));
        m.set(id, cur);
      });
    });
    return m;
  }, [data.solves]);
  const groups = (Object.keys(TOOL_CATEGORIES) as ToolCategory[]).map((c) => ({ c, items: data.tools.filter((t) => t.category === c) })).filter((g) => g.items.length);

  return (
    <div>
      {data.tools.length === 0 ? (
        <Empty icon="toolbox" title="Arzenál je prázdný">
          Přidej své planžety a napínáky – pak uvidíš, se kterými jsi nejrychlejší.
        </Empty>
      ) : (
        groups.map((g) => (
          <div key={g.c} className="mb-5">
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-steel-400">{TOOL_CATEGORIES[g.c]}</h3>
            <div className="grid gap-2 sm:grid-cols-2">
              {g.items.map((t) => {
                const u = usage.get(t.id);
                return (
                  <Card key={t.id} onClick={() => setEdit(t)} className="p-3">
                    <div className="rounded-lg bg-ink-950 px-2 py-1">
                      <ToolArt profile={t.profile} className="h-9 w-full" />
                    </div>
                    <div className="mt-2 flex items-start justify-between gap-2">
                      <div>
                        <div className="text-sm font-semibold text-slate-100">{t.name}</div>
                        <div className="text-xs text-slate-400">
                          {t.manufacturer || '—'} · {TOOL_PROFILES[t.profile].label}
                        </div>
                      </div>
                      {t.position !== 'n/a' && <span className="rounded-md bg-azure-400/15 px-1.5 py-0.5 text-[10px] font-bold text-azure-400">{t.position}</span>}
                    </div>
                    <div className="mt-2 flex items-center justify-between text-[11px]">
                      <span className="rounded-md bg-ink-950 px-2 py-0.5 font-mono text-steel-300">{thicknessLabel(t.thickness)}</span>
                      <span className="text-slate-500">
                        {u ? `${u.count}× · PB ${formatTime(u.best, { dnfLabel: '—' })}` : 'nepoužito'}
                      </span>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        ))
      )}
      <Button variant="brass" size="lg" icon="plus" className="w-full" onClick={() => setEdit(emptyTool())}>
        Přidat nástroj
      </Button>
      <ToolForm value={edit} onClose={() => setEdit(null)} />
    </div>
  );
}

function ToolForm({ value, onClose }: { value: (Omit<ToolItem, 'id' | 'createdAt'> & { id?: string; createdAt?: number }) | null; onClose: () => void }) {
  const { upsertTool, deleteTool, toast } = useStore();
  const [f, setF] = useState(value);
  const [confirmDel, setConfirmDel] = useState(false);
  useEffect(() => {
    setF(value);
    setConfirmDel(false);
  }, [value]);
  if (!f) return <Sheet open={false} onClose={onClose}>{null}</Sheet>;
  const set = <K extends keyof ToolItem>(k: K, v: ToolItem[K]) => setF((x) => (x ? { ...x, [k]: v } : x));
  const profiles = (Object.keys(TOOL_PROFILES) as ToolProfile[]).filter((p) => TOOL_PROFILES[p].category === f.category);
  return (
    <Sheet
      open={!!value}
      onClose={onClose}
      title={f.id ? 'Upravit nástroj' : 'Nový nástroj'}
      footer={
        <div className="flex gap-2">
          {f.id && (
            <Button
              variant="danger"
              icon="trash"
              onClick={() => {
                if (!confirmDel) return setConfirmDel(true);
                deleteTool(f.id!);
                onClose();
              }}
            >
              {confirmDel ? 'Opravdu?' : ''}
            </Button>
          )}
          <Button
            variant="brass"
            className="flex-1"
            disabled={!f.name.trim()}
            onClick={() => {
              upsertTool({ ...f, name: f.name.trim() });
              toast({ icon: '🧰', title: f.id ? 'Nástroj uložen' : 'Nástroj přidán', tone: 'ok' });
              onClose();
            }}
          >
            Uložit
          </Button>
        </div>
      }
    >
      <div className="mb-3 rounded-xl bg-ink-950 px-3 py-2">
        <ToolArt profile={f.profile} className="h-12 w-full" />
      </div>
      <Field label="Kategorie">
        <Segmented
          size="sm"
          value={f.category}
          onChange={(c) => {
            const first = (Object.keys(TOOL_PROFILES) as ToolProfile[]).find((p) => TOOL_PROFILES[p].category === c)!;
            setF((x) => (x ? { ...x, category: c, profile: first, position: c === 'tension' ? (first === 'tok-bar' ? 'TOK' : 'BOK') : 'n/a', thickness: c === 'tension' ? '0.050' : x.thickness } : x));
          }}
          options={(Object.keys(TOOL_CATEGORIES) as ToolCategory[]).map((c) => ({ id: c, label: TOOL_CATEGORIES[c].split(' ')[0] }))}
        />
      </Field>
      <Field label="Profil hrotu">
        <div className="flex flex-wrap gap-1.5">
          {profiles.map((p) => (
            <Chip
              key={p}
              active={f.profile === p}
              onClick={() => {
                set('profile', p);
                if (!f.name || Object.values(TOOL_PROFILES).some((x) => x.label === f.name)) set('name', TOOL_PROFILES[p].label);
                if (p === 'tok-bar') set('position', 'TOK');
                if (p === 'bok-wrench' || p === 'twist-wrench') set('position', 'BOK');
              }}
            >
              {TOOL_PROFILES[p].label}
            </Chip>
          ))}
        </div>
      </Field>
      <div className="grid grid-cols-2 gap-x-3">
        <Field label="Název">
          <input className="field" value={f.name} onChange={(e) => set('name', e.target.value)} placeholder="Short Hook" />
        </Field>
        <Field label="Výrobce">
          <input className="field" list="mfr" value={f.manufacturer} onChange={(e) => set('manufacturer', e.target.value)} placeholder="Sparrows" />
          <datalist id="mfr">
            {MANUFACTURERS.map((m) => (
              <option key={m} value={m} />
            ))}
          </datalist>
        </Field>
      </div>
      <Field label="Tloušťka oceli">
        <select className="field" value={f.thickness} onChange={(e) => set('thickness', e.target.value as ToolThickness)}>
          {THICKNESSES.map((t) => (
            <option key={t.id} value={t.id}>
              {t.id}" / {t.mm} mm
            </option>
          ))}
        </select>
      </Field>
      {f.category === 'tension' && (
        <Field label="Pozice v profilu">
          <Segmented<WrenchPosition>
            size="sm"
            value={f.position}
            onChange={(v) => set('position', v)}
            options={[
              { id: 'TOK', label: 'TOK (nahoře)' },
              { id: 'BOK', label: 'BOK (dole)' },
            ]}
          />
        </Field>
      )}
      <Field label="Poznámky">
        <textarea className="field min-h-[70px]" value={f.notes} onChange={(e) => set('notes', e.target.value)} />
      </Field>
    </Sheet>
  );
}
