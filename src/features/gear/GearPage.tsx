import { useEffect, useMemo, useState } from 'react';
import { useStore } from '../../store/AppStore';
import type { Belt, LockFormFactor, LockItem, Mechanism, ToolCategory, ToolItem, ToolProfile, ToolThickness, WrenchPosition } from '../../types';
import { BELTS, FORM_FACTORS, MECHANISMS, PIN_TYPES, THICKNESSES, TOOL_CATEGORIES, TOOL_PROFILES, thicknessLabel } from '../../data/labels';
import { BeltBadge, Button, Card, Chip, Empty, Field, GroupLabel, ListGroup, PageHeader, Segmented, Sheet } from '../../components/ui';
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
      <PageHeader title="Výbava" subtitle="Tvoje zámky a nástroje" />
      <Segmented
        value={tab}
        onChange={setTab}
        options={[
          { id: 'locks', label: 'Zámky' },
          { id: 'tools', label: 'Nástroje' },
        ]}
      />
      <div className="mt-2">{tab === 'locks' ? <LockVault /> : <Arsenal />}</div>
    </div>
  );
}

/* ─────────────────────────── Locks ─────────────────────────── */

function emptyLock(): Omit<LockItem, 'id' | 'createdAt'> {
  return { name: '', brand: '', mechanism: 'pin-tumbler', formFactor: 'padlock', pins: 5, belt: 'yellow', keyway: '', pinConfig: [], bindingOrder: [], notes: '' };
}

function LockVault() {
  const { data } = useStore();
  const [edit, setEdit] = useState<(Omit<LockItem, 'id' | 'createdAt'> & { id?: string; createdAt?: number }) | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);

  const stats = useMemo(() => {
    const m = new Map<string, ReturnType<typeof summarize>>();
    data.locks.forEach((l) => m.set(l.id, summarize(data.solves.filter((s) => s.lockId === l.id))));
    return m;
  }, [data.locks, data.solves]);

  // grouped by belt, easiest first – reads like a ladder you climb
  const groups = useMemo(
    () =>
      BELTS.map((b) => ({ belt: b, locks: data.locks.filter((l) => l.belt === b.id).sort((a, c) => `${a.brand}${a.name}`.localeCompare(`${c.brand}${c.name}`)) })).filter(
        (g) => g.locks.length,
      ),
    [data.locks],
  );

  return (
    <div>
      {data.locks.length === 0 ? (
        <Empty icon="lock" title="Sbírka je prázdná">
          Přidej svůj první zámek – můžeš u něj sledovat časy i pořadí stavítek.
        </Empty>
      ) : (
        groups.map((g) => (
          <div key={g.belt.id}>
            <GroupLabel>
              <span className="inline-flex items-center gap-1.5">
                <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: g.belt.color, boxShadow: 'inset 0 0 0 1px rgba(120,120,128,0.35)' }} />
                {g.belt.label} pás
              </span>
            </GroupLabel>
            <ListGroup>
              {g.locks.map((l, i) => {
                const st = stats.get(l.id)!;
                const security = l.pinConfig.filter((p) => p.type !== 'standard' && p.type !== 'unknown').length;
                return (
                  <button
                    key={l.id}
                    type="button"
                    onClick={() => setOpenId(l.id)}
                    className="relative flex w-full items-center gap-3 px-4 py-2.5 text-left transition active:bg-fill"
                  >
                    <LockTile belt={l.belt} />
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-1.5 text-[16px] text-slate-50">
                        <span className="truncate">
                          {l.brand} {l.name}
                        </span>
                        {l.favorite && <Icon name="star" size={13} className="shrink-0 fill-brass-400 text-brass-400" />}
                      </span>
                      <span className="block text-[13px] text-slate-400">
                        {l.pins} {l.mechanism === 'disc-detainer' ? 'disků' : 'pinů'}
                        {security ? ` · ${security} bezpečnostní` : ''}
                      </span>
                    </span>
                    <span className="shrink-0 text-right">
                      <span className="block font-mono text-[15px] font-semibold text-slate-50">{formatTime(st.best, { dnfLabel: '—' })}</span>
                      <span className="block text-[11px] text-slate-500">rekord</span>
                    </span>
                    <Icon name="chevronRight" size={16} strokeWidth={2.6} className="shrink-0 text-slate-600" />
                    {i < g.locks.length - 1 && <span className="absolute bottom-0 left-[64px] right-0 h-px bg-sep" />}
                  </button>
                );
              })}
            </ListGroup>
          </div>
        ))
      )}
      <Button variant="brass" size="lg" icon="plus" className="mt-5 w-full" onClick={() => setEdit(emptyLock())}>
        Přidat zámek
      </Button>
      <LockDetail
        lock={data.locks.find((l) => l.id === openId) ?? null}
        onClose={() => setOpenId(null)}
        onEdit={(l) => {
          setOpenId(null);
          setEdit(l);
        }}
      />
      <LockForm value={edit} onClose={() => setEdit(null)} />
    </div>
  );
}

function LockTile({ belt }: { belt: Belt }) {
  const b = BELTS.find((x) => x.id === belt) ?? BELTS[0];
  return (
    <span
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px]"
      style={{ background: b.color, color: b.text, boxShadow: belt === 'white' || belt === 'black' ? 'inset 0 0 0 1px rgba(120,120,128,0.35)' : undefined }}
    >
      <Icon name="lock" size={20} strokeWidth={2.2} />
    </span>
  );
}

function LockDetail({ lock: l, onClose, onEdit }: { lock: LockItem | null; onClose: () => void; onEdit: (l: LockItem) => void }) {
  const { data, navigate, setTimerConfig } = useStore();
  const st = useMemo(() => (l ? summarize(data.solves.filter((s) => s.lockId === l.id)) : null), [l, data.solves]);
  return (
    <Sheet open={!!l} onClose={onClose} title={l ? `${l.brand} ${l.name}` : ''}>
      {l && st && (
        <div>
          <div className="flex items-center gap-3">
            <LockTile belt={l.belt} />
            <div className="min-w-0 flex-1 text-[13px] text-slate-400">
              {MECHANISMS[l.mechanism]} · {FORM_FACTORS[l.formFactor]}
              {l.keyway ? ` · ${l.keyway}` : ''}
            </div>
            <BeltBadge belt={l.belt} size="sm" />
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2 text-center">
            {[
              ['Rekord', formatTime(st.best, { dnfLabel: '—' })],
              ['Průměr z 5', formatTime(st.averages[0].current, { dnfLabel: '—' })],
              ['Otevřeno', `${st.solved}/${st.count}`],
            ].map(([k, v]) => (
              <div key={k} className="rounded-2xl bg-well px-2 py-2.5">
                <div className="text-[12px] text-slate-400">{k}</div>
                <div className="font-mono text-[17px] font-semibold text-slate-50">{v}</div>
              </div>
            ))}
          </div>

          <GroupLabel>Stavítka a pořadí</GroupLabel>
          <div className="flex items-center gap-1">
            {Array.from({ length: l.pins }, (_, k) => k + 1).map((i) => {
              const t = l.pinConfig.find((p) => p.index === i)?.type ?? 'unknown';
              const pos = l.bindingOrder.indexOf(i);
              return (
                <div key={i} className="flex flex-1 flex-col items-center rounded-xl bg-well py-2" title={PIN_TYPES[t].label}>
                  <span className="text-[11px] font-bold" style={{ color: PIN_TYPES[t].color }}>
                    {PIN_TYPES[t].short}
                  </span>
                  <span className="font-mono text-[12px] text-slate-500">{pos >= 0 ? `#${pos + 1}` : '·'}</span>
                </div>
              );
            })}
          </div>
          <p className="mt-1.5 px-1 text-[12px] text-slate-500">Nahoře typ stavítka, dole pořadí, v jakém tuhnou.</p>

          {l.notes && (
            <>
              <GroupLabel>Poznámky</GroupLabel>
              <p className="rounded-2xl bg-well px-3.5 py-3 text-[15px] text-slate-300">{l.notes}</p>
            </>
          )}

          <div className="mt-5 grid gap-2">
            <Button
              variant="brass"
              size="lg"
              icon="timer"
              onClick={() => {
                setTimerConfig({ lockId: l.id });
                onClose();
                navigate('timer');
              }}
            >
              Měřit na stopkách
            </Button>
            <div className="grid grid-cols-2 gap-2">
              {l.mechanism === 'pin-tumbler' && (
                <Button
                  icon="gamepad"
                  onClick={() => {
                    onClose();
                    navigate('arcade', { arcade: 'simulator', sim: { spec: specFromLock(l) } });
                  }}
                >
                  Simulovat
                </Button>
              )}
              <Button icon="edit" className={l.mechanism === 'pin-tumbler' ? '' : 'col-span-2'} onClick={() => onEdit(l)}>
                Upravit
              </Button>
            </div>
          </div>
        </div>
      )}
    </Sheet>
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
                toast({ icon: 'trash', title: 'Zámek odstraněn' });
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
              toast({ icon: 'lock', title: f.id ? 'Zámek uložen' : 'Zámek přidán do sbírky', tone: 'ok' });
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
            <button type="button" className="h-10 w-10 rounded-xl border border-sep text-lg" onClick={() => set('pins', Math.max(1, f.pins - 1))}>
              −
            </button>
            <span className="flex-1 text-center font-mono text-lg">{f.pins}</span>
            <button type="button" className="h-10 w-10 rounded-xl border border-sep text-lg" onClick={() => set('pins', Math.min(12, f.pins + 1))}>
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
              className={`rounded-xl border px-2 py-2 text-xs font-semibold transition ${f.belt === b.id ? 'scale-[1.03] border-transparent' : 'border-sep opacity-60'}`}
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
            <h3 className="mb-2 text-xs font-semibold text-steel-400">{TOOL_CATEGORIES[g.c]}</h3>
            <div className="grid gap-2 sm:grid-cols-2">
              {g.items.map((t) => {
                const u = usage.get(t.id);
                return (
                  <Card key={t.id} onClick={() => setEdit(t)} className="p-3">
                    <div className="rounded-lg bg-well px-2 py-1">
                      <ToolArt profile={t.profile} className="h-14 w-full" />
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
                      <span className="rounded-md bg-well px-2 py-0.5 font-mono text-steel-300">{thicknessLabel(t.thickness)}</span>
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
              toast({ icon: 'toolbox', title: f.id ? 'Nástroj uložen' : 'Nástroj přidán', tone: 'ok' });
              onClose();
            }}
          >
            Uložit
          </Button>
        </div>
      }
    >
      <div className="mb-3 rounded-xl bg-well px-3 py-2">
        <ToolArt profile={f.profile} className="h-20 w-full" />
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
