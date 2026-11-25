import { IOS } from '../../lib/colors';
import { useEffect, useMemo, useState } from 'react';
import { LockSimulator, type SimOpenResult } from './LockSimulator';
import { randomSpec, type ToolKind } from './engine';
import { useStore } from '../../store/AppStore';
import { Button, Chip, Segmented, IconTile } from '../../components/ui';
import { Icon } from '../../components/Icon';
import type { LockItem, SimLockSpec } from '../../types';
import { DRILLS } from '../../data/drills';
import { mulberry32 } from '../../lib/random';

/** Build a simulator spec that mirrors a real lock from the user's vault. */
export function specFromLock(l: LockItem): SimLockSpec {
  const pins = Math.max(3, Math.min(6, l.pins || 5));
  const seed = Array.from(l.id).reduce((a, c) => a + c.charCodeAt(0) * 31, 7);
  const rnd = mulberry32(seed);
  const pinTypes: SimLockSpec['pinTypes'] = Array.from({ length: pins }, (_, i) => {
    const t = l.pinConfig.find((p) => p.index === i + 1)?.type;
    if (t === 'spool' || t === 'mushroom' || t === 't-pin') return 'spool';
    if (t === 'serrated') return 'serrated';
    return 'standard';
  });
  const known = l.bindingOrder.filter((n) => n >= 1 && n <= pins).map((n) => n - 1);
  const rest = Array.from({ length: pins }, (_, i) => i).filter((i) => !known.includes(i));
  const bindingOrder = [...known, ...rest.sort(() => rnd() - 0.5)];
  const keyPinLengths = Array.from({ length: pins }, () => 0.2 + Math.floor(rnd() * 9) * 0.065);
  return { pins, pinTypes, bindingOrder, keyPinLengths, seed, label: `${l.brand} ${l.name}` };
}

export function SimulatorPanel() {
  const { data, intent, consumeIntent, addChallenge, completeDrill, toast } = useStore();
  const [pins, setPins] = useState(5);
  const [spools, setSpools] = useState(0);
  const [serrated, setSerrated] = useState(0);
  const [blind, setBlind] = useState(false);
  const [seed, setSeed] = useState(() => Math.floor(Math.random() * 1e9));
  const [custom, setCustom] = useState<SimLockSpec | null>(null);
  const [drillId, setDrillId] = useState<string | undefined>();
  const [tool, setTool] = useState<ToolKind>('short-hook');
  const [showVault, setShowVault] = useState(false);

  useEffect(() => {
    if (intent?.tab === 'arcade' && intent.sim) {
      const s = intent.sim;
      if (s.spec) setCustom(s.spec);
      else {
        setCustom(null);
        setPins(s.pins ?? 5);
        setSpools(s.spools ?? 0);
        setSerrated(s.serrated ?? 0);
      }
      setBlind(!!s.blind);
      setDrillId(s.drillId);
      if (s.tool) setTool(s.tool as ToolKind);
      setSeed(Math.floor(Math.random() * 1e9));
      consumeIntent();
    }
  }, [intent, consumeIntent]);

  const spec = useMemo(
    () => custom ?? randomSpec(pins, { spools: Math.min(spools, pins), serrated: Math.min(serrated, pins - Math.min(spools, pins)), seed }),
    [custom, pins, spools, serrated, seed],
  );

  const drill = drillId ? DRILLS.find((d) => d.id === drillId) : undefined;

  const onOpen = (r: SimOpenResult) => {
    addChallenge({
      kind: 'sim',
      time: r.time,
      pins: spec.pins,
      blind,
      maxTension: r.maxTension,
      drillId: drill && (drill.check.kind !== 'sim' || !drill.check.tool || drill.check.tool === r.tool) && (drill.id !== 'deep-hook' || r.oversets === 0) ? drill.id : undefined,
      dnf: false,
    });
    if (drill && drill.check.kind === 'sim' && drill.check.count === 1) {
      const c = drill.check;
      const ok =
        (c.timeLimit === undefined || r.time <= c.timeLimit) &&
        (c.maxTension === undefined || r.maxTension <= c.maxTension) &&
        (!c.tool || c.tool === r.tool) &&
        (drill.id !== 'deep-hook' || r.oversets === 0);
      if (ok) {
        completeDrill(drill.id);
        toast({ icon: drill.icon, title: `Dril splněn: ${drill.title}`, body: `+${drill.xp} XP`, tone: 'ok' });
      } else {
        toast({ icon: 'timer', title: 'Podmínka drilu nesplněna', body: 'Zkus to znovu – nový zámek je připraven.', tone: 'steel' });
      }
    }
  };

  const [showConfig, setShowConfig] = useState(false);
  const newLock = () => {
    setCustom(null);
    setSeed(Math.floor(Math.random() * 1e9));
  };

  return (
    <div>
      {drill && (
        <div className="card mb-3 flex items-center gap-3 p-3">
          <IconTile icon={drill.icon} color={IOS.blue} size={36} />
          <div className="flex-1">
            <div className="text-[15px] font-semibold text-slate-50">Dril: {drill.title}</div>
            <div className="text-xs text-slate-400">{drill.description}</div>
          </div>
          <button className="text-steel-400" onClick={() => setDrillId(undefined)} aria-label="Zrušit dril">
            <Icon name="x" size={18} />
          </button>
        </div>
      )}

      <div className="mb-3 flex items-center gap-2">
        <Segmented
          className="flex-1"
          value={blind ? 'blind' : 'cutaway'}
          onChange={(v) => setBlind(v === 'blind')}
          options={[
            { id: 'cutaway', label: <span className="inline-flex items-center gap-1.5"><Icon name="eye" size={15} /> Průhledný</span> },
            { id: 'blind', label: <span className="inline-flex items-center gap-1.5"><Icon name="eyeOff" size={15} /> Naslepo</span> },
          ]}
        />
        <Button variant="brass" icon="refresh" onClick={newLock} aria-label="Nový zámek">
          Nový
        </Button>
      </div>

      <LockSimulator key={`${spec.seed}-${spec.pins}-${blind}-${spec.label ?? ''}`} spec={spec} blind={blind} initialTool={tool} onOpen={onOpen} />

      <div className="card mt-3 p-3.5">
        <button className="flex w-full items-center justify-between text-left" onClick={() => setShowConfig((v) => !v)}>
          <span>
            <span className="block text-[16px] font-semibold text-slate-50">Upravit zámek</span>
            <span className="block text-[13px] text-slate-400">
              {custom ? (custom.label ?? 'Vlastní zámek') : `${pins} stavítek · ${spools}× spool · ${serrated}× serrated`}
            </span>
          </span>
          <Icon name="chevronDown" size={18} className={`text-slate-500 transition ${showConfig ? 'rotate-180' : ''}`} />
        </button>
        {showConfig && (
        <div className="mt-3">
        <div className="mb-2 flex items-center justify-end">
          {custom && (
            <button className="text-xs text-brass-400" onClick={newLock}>
              Zpět na náhodný zámek
            </button>
          )}
        </div>
        {custom ? (
          <div className="rounded-xl bg-well p-3 text-sm">
            <div className="font-semibold text-slate-100">{custom.label ?? 'Vlastní zámek'}</div>
            <div className="mt-1 text-xs text-slate-400">
              {custom.pins} stavítek · {custom.pinTypes.filter((t) => t === 'spool').length}× spool · {custom.pinTypes.filter((t) => t === 'serrated').length}× serrated
            </div>
          </div>
        ) : (
          <>
            <div className="mb-3">
              <div className="mb-1.5 text-xs text-slate-400">Počet komor</div>
              <Segmented value={String(pins)} onChange={(v) => setPins(+v)} options={[3, 4, 5, 6].map((n) => ({ id: String(n), label: `${n} pin` }))} size="sm" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Counter label="Spool piny" value={spools} max={pins} onChange={(v) => { setSpools(v); setSerrated((s) => Math.min(s, pins - v)); }} color="#f59e0b" />
              <Counter label="Serrated piny" value={serrated} max={pins - spools} onChange={setSerrated} color="#38bdf8" />
            </div>
          </>
        )}
        <div className="mt-3">
          <button className="flex w-full items-center justify-between rounded-xl border border-sep px-3 py-2 text-sm text-slate-300" onClick={() => setShowVault((v) => !v)}>
            <span className="inline-flex items-center gap-2">
              <Icon name="lock" size={16} /> Simulovat zámek z mé sbírky
            </span>
            <Icon name="chevronDown" size={16} className={showVault ? 'rotate-180' : ''} />
          </button>
          {showVault && (
            <div className="mt-2 flex flex-wrap gap-2">
              {data.locks.filter((l) => l.mechanism === 'pin-tumbler').map((l) => (
                <Chip
                  key={l.id}
                  active={custom?.label === `${l.brand} ${l.name}`}
                  onClick={() => {
                    setCustom(specFromLock(l));
                    setShowVault(false);
                  }}
                >
                  {l.brand} {l.name}
                </Chip>
              ))}
              {!data.locks.some((l) => l.mechanism === 'pin-tumbler') && <span className="text-xs text-slate-500">Ve sbírce nemáš stavítkový zámek.</span>}
            </div>
          )}
        </div>
      </div>
        )}
      </div>
      <Legend />
    </div>
  );
}

function Counter({ label, value, max, onChange, color }: { label: string; value: number; max: number; onChange: (v: number) => void; color: string }) {
  return (
    <div className="rounded-xl bg-well p-2.5">
      <div className="mb-1 text-xs text-slate-400">{label}</div>
      <div className="flex items-center justify-between">
        <button className="h-8 w-8 rounded-lg border border-sep text-lg leading-none text-slate-300 disabled:opacity-30" disabled={value <= 0} onClick={() => onChange(value - 1)}>
          −
        </button>
        <span className="font-mono text-lg font-semibold" style={{ color }}>
          {value}
        </span>
        <button className="h-8 w-8 rounded-lg border border-sep text-lg leading-none text-slate-300 disabled:opacity-30" disabled={value >= max} onClick={() => onChange(value + 1)}>
          +
        </button>
      </div>
    </div>
  );
}

function Legend() {
  const [open, setOpen] = useState(false);
  return (
    <div className="card mt-3 p-3.5">
      <button className="flex w-full items-center justify-between text-sm font-semibold text-slate-200" onClick={() => setOpen((v) => !v)}>
        <span className="inline-flex items-center gap-2">
          <Icon name="info" size={16} className="text-azure-400" /> Jak číst simulátor
        </span>
        <Icon name="chevronDown" size={16} className={open ? 'rotate-180' : ''} />
      </button>
      {open && (
        <ul className="mt-3 space-y-2 text-sm text-slate-300">
          <li>
            <b className="text-brass-300">Mosazná</b> = spodní stavítka (key pins), <b className="text-slate-200">ocelová</b> = horní stavítka, <b className="text-red-300">červená</b> = bezpečnostní drivery.
          </li>
          <li>
            <b className="text-orange-300">Oranžově žhnoucí komora</b> = binding pin – jediné stavítko, které teď klade odpor. Zvedni ho na <b className="text-brass-300">střižnou rovinu</b>.
          </li>
          <li>
            <b>Heavy napětí</b> způsobí trhavý pohyb (stick-slip) a snadno stavítko <b className="text-red-300">přemačkáš</b>. Pak nezbývá než povolit.
          </li>
          <li>
            <b className="text-amber-300">False set</b> (bubínek se výrazně pootočí) = spool. Zvedej ho a zároveň povol napětí pod ~35 % – bubínek se vrátí (counter-rotation) a spool zapadne.
          </li>
          <li>
            <b className="text-azure-400">Serrated</b> piny cvakají vícekrát – nenech se zmást a pokračuj ve zvedání.
          </li>
          <li>Short hook zvedá dříkem přední piny – na vysoká zadní stavítka zkus Deep Hook. Rake + lehké napětí + rychlé tahy = raking.</li>
        </ul>
      )}
    </div>
  );
}
