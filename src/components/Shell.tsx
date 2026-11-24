import { AnimatePresence, motion } from 'framer-motion';
import { useRef, useState } from 'react';
import { useStore } from '../store/AppStore';
import { Icon, type IconName } from './Icon';
import type { TabId } from '../types';
import { Button, Segmented, Sheet, Toggle } from './ui';
import { exportFile, importFile, solvesToCsv } from '../lib/storage';
import { sound } from '../lib/audio';
import { ETHICS } from '../data/library';

const NAV: { id: TabId; label: string; icon: IconName; color: string }[] = [
  { id: 'timer', label: 'Stopky', icon: 'timer', color: '#ffb547' },
  { id: 'arcade', label: 'Simulátor', icon: 'gamepad', color: '#b69cff' },
  { id: 'library', label: 'Encyklopedie', icon: 'book', color: '#4fd8c4' },
  { id: 'gear', label: 'Výbava', icon: 'toolbox', color: '#ff8a6b' },
  { id: 'stats', label: 'Statistiky', icon: 'chart', color: '#7cc4ff' },
];

export function BottomNav() {
  const { tab, navigate } = useStore();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-white/[0.06] bg-ink-900/85 pb-[var(--safe-bottom)] backdrop-blur-xl">
      <div className="mx-auto flex max-w-2xl px-1">
        {NAV.map((n) => {
          const active = tab === n.id;
          return (
            <button
              key={n.id}
              onClick={() => {
                sound.unlock();
                navigate(n.id);
              }}
              className={`relative flex flex-1 flex-col items-center gap-1 pb-2 pt-2 text-[11px] font-bold transition ${active ? '' : 'text-slate-500 hover:text-slate-300'}`}
              style={active ? { color: n.color } : undefined}
              aria-current={active ? 'page' : undefined}
            >
              <span className="relative flex h-8 w-14 items-center justify-center">
                {active && (
                  <motion.span
                    layoutId="nav-pill"
                    className="absolute inset-0 rounded-full"
                    style={{ background: `${n.color}26` }}
                    transition={{ type: 'spring', stiffness: 500, damping: 38 }}
                  />
                )}
                <Icon name={n.icon} size={21} strokeWidth={active ? 2.3 : 2} className="relative" />
              </span>
              {n.label}
            </button>
          );
        })}
      </div>
    </nav>
  );
}

/** Brand mark: padlock with a pin-tumbler cut-away (matches the app icon). */
export function LogoMark({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="96 64 320 384" aria-hidden="true">
      <defs>
        <linearGradient id="lm-g" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffd27a" />
          <stop offset="1" stopColor="#f0962c" />
        </linearGradient>
      </defs>
      <path d="M180 236V172a76 76 0 0 1 152 0v64" fill="none" stroke="#e4ddee" strokeWidth="34" />
      <rect x="118" y="226" width="276" height="202" rx="40" fill="url(#lm-g)" />
      <g fill="#1b1528">
        {[
          [158, 256, 384],
          [214, 270, 364],
          [270, 250, 396],
          [326, 264, 372],
        ].map(([x, top, tip]) => (
          <g key={x}>
            <rect x={x} y={top} width={34} height={313 - top} rx={6} />
            <path d={`M${x + 6} 323h22a6 6 0 0 1 6 6V${tip - 13}L${x + 17} ${tip}L${x} ${tip - 13}V329a6 6 0 0 1 6-6z`} />
          </g>
        ))}
      </g>
    </svg>
  );
}

export function TopBar() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <header className="sticky top-0 z-30 bg-ink-950/70 pt-[var(--safe-top)] backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-2xl items-center justify-between px-4">
          <div className="flex items-center gap-2.5">
            <LogoMark size={24} />
            <span className="font-display text-[1.3rem] font-semibold text-slate-50">Locked</span>
          </div>
          <button onClick={() => setOpen(true)} className="rounded-full bg-white/[0.05] p-2 text-slate-400 hover:bg-white/10 hover:text-white" aria-label="Nastavení">
            <Icon name="settings" />
          </button>
        </div>
      </header>
      <SettingsSheet open={open} onClose={() => setOpen(false)} />
    </>
  );
}

function SettingsSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { data, updateSettings, replaceData, resetData, toast } = useStore();
  const s = data.settings;
  const fileRef = useRef<HTMLInputElement>(null);
  const [confirmReset, setConfirmReset] = useState<null | 'empty' | 'samples'>(null);
  const [showEthics, setShowEthics] = useState(false);

  const downloadCsv = () => {
    const blob = new Blob([solvesToCsv(data)], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `locked-casy-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  };

  return (
    <Sheet open={open} onClose={onClose} title="Nastavení">
      <h3 className="mb-1 text-xs font-semibold text-steel-400">Zvuk a odezva</h3>
      <Toggle checked={s.sound} onChange={(v) => updateSettings({ sound: v })} label="Zvukové efekty" desc="Syntetizované klikání stavítek, stopky" />
      {s.sound && (
        <div className="flex items-center gap-3 py-2">
          <Icon name="volume" size={18} className="text-steel-400" />
          <input type="range" className="slider flex-1" min={0} max={1} step={0.05} value={s.volume} onChange={(e) => updateSettings({ volume: +e.target.value })} />
          <button className="text-xs text-brass-400" onClick={() => sound.pinSet()}>
            test
          </button>
        </div>
      )}
      <Toggle checked={s.haptics} onChange={(v) => updateSettings({ haptics: v })} label="Vibrace" desc="Hmatová odezva na podporovaných zařízeních" />

      <h3 className="mb-1 mt-5 text-xs font-semibold text-steel-400">Stopky</h3>
      <div className="py-2">
        <div className="mb-1 flex justify-between text-sm">
          <span>Doba podržení pro start</span>
          <span className="font-mono text-brass-300">{(s.holdToStartMs / 1000).toFixed(2)} s</span>
        </div>
        <input type="range" className="slider w-full" min={0} max={1500} step={50} value={s.holdToStartMs} onChange={(e) => updateSettings({ holdToStartMs: +e.target.value })} />
      </div>
      <Toggle checked={s.requireTwoFingers} onChange={(v) => updateSettings({ requireTwoFingers: v })} label="Vyžadovat 2 prsty" desc="Stackmat styl – start až po položení dvou prstů" />
      <div className="py-2">
        <div className="mb-1.5 text-sm">Prohlídka zámku (inspection)</div>
        <Segmented
          value={String(s.inspectionSec)}
          onChange={(v) => updateSettings({ inspectionSec: +v })}
          options={[
            { id: '0', label: 'Vyp' },
            { id: '5', label: '5 s' },
            { id: '10', label: '10 s' },
            { id: '15', label: '15 s' },
          ]}
          size="sm"
        />
      </div>
      <Toggle checked={s.hideTimeWhileRunning} onChange={(v) => updateSettings({ hideTimeWhileRunning: v })} label="Skrýt čas během měření" desc="Menší stres, lepší soustředění" />

      <h3 className="mb-1 mt-5 text-xs font-semibold text-steel-400">Simulátor</h3>
      <div className="py-2">
        <div className="mb-1.5 text-sm">Obtížnost fyziky</div>
        <Segmented
          value={s.simDifficulty}
          onChange={(v) => updateSettings({ simDifficulty: v })}
          options={[
            { id: 'easy', label: 'Lehká' },
            { id: 'normal', label: 'Normální' },
            { id: 'hard', label: 'Těžká' },
          ]}
          size="sm"
        />
      </div>
      <Toggle checked={s.showBindingHint} onChange={(v) => updateSettings({ showBindingHint: v })} label="Zvýraznit binding pin" desc="V průhledném módu žhne komora, která právě tuhne" />

      <h3 className="mb-2 mt-5 text-xs font-semibold text-steel-400">Data a záloha</h3>
      <p className="mb-3 text-xs text-slate-400">
        Vše je uloženo pouze v tomto zařízení (offline). Zálohu si stáhni jako .json a nahraj ji na jiném zařízení.
      </p>
      <div className="grid grid-cols-2 gap-2">
        <Button icon="download" onClick={() => exportFile(data)}>
          Export .json
        </Button>
        <Button icon="upload" onClick={() => fileRef.current?.click()}>
          Import .json
        </Button>
        <Button icon="list" variant="outline" onClick={downloadCsv} className="col-span-2">
          Export časů do CSV
        </Button>
      </div>
      <input
        ref={fileRef}
        type="file"
        accept="application/json,.json"
        className="hidden"
        onChange={async (e) => {
          const f = e.target.files?.[0];
          e.target.value = '';
          if (!f) return;
          try {
            const d = await importFile(f);
            replaceData({ ...d, ethicsAccepted: true });
            toast({ icon: '✅', title: 'Záloha nahrána', body: `${d.locks.length} zámků, ${d.tools.length} nástrojů, ${d.solves.length} časů`, tone: 'ok' });
          } catch (err) {
            toast({ icon: '⚠️', title: 'Import selhal', body: (err as Error).message, tone: 'bad' });
          }
        }}
      />
      <div className="mt-4 grid grid-cols-2 gap-2">
        <Button variant="danger" size="sm" onClick={() => setConfirmReset('empty')}>
          Smazat vše
        </Button>
        <Button variant="outline" size="sm" onClick={() => setConfirmReset('samples')}>
          Vyzkoušet ukázková data
        </Button>
      </div>
      {confirmReset && (
        <div className="mt-3 rounded-xl border border-bad/40 bg-bad/10 p-3 text-sm">
          <p className="mb-2 text-red-200">
            {confirmReset === 'empty' ? 'Opravdu smazat všechna data? ' : 'Nahradit tvoje data vymyšlenou ukázkovou historií (časy, hry)? '}
            Tuto akci nelze vrátit – doporučujeme nejdřív export.
          </p>
          <div className="flex gap-2">
            <Button
              variant="danger"
              size="sm"
              onClick={() => {
                resetData(confirmReset === 'samples');
                setConfirmReset(null);
                toast({ icon: '🧹', title: 'Data obnovena' });
              }}
            >
              Ano, potvrdit
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setConfirmReset(null)}>
              Zrušit
            </Button>
          </div>
        </div>
      )}

      <h3 className="mb-2 mt-5 text-xs font-semibold text-steel-400">O aplikaci</h3>
      <Button variant="outline" icon="shield" className="w-full" onClick={() => setShowEthics((v) => !v)}>
        Zlatá pravidla locksportu
      </Button>
      {showEthics && (
        <ul className="mt-3 space-y-2 text-sm text-slate-300">
          {ETHICS.filter((e) => e.golden).map((e) => (
            <li key={e.title} className="rounded-xl bg-black/25 p-3">
              <b className="text-brass-300">{e.title}.</b> {e.text}
            </li>
          ))}
        </ul>
      )}
      <p className="mt-4 pb-2 text-center text-xs text-slate-500">Locked v1.0 · PWA · funguje offline</p>
    </Sheet>
  );
}

export function EthicsGate() {
  const { data, acceptEthics } = useStore();
  const [checked, setChecked] = useState(false);
  const golden = ETHICS.filter((e) => e.golden);
  return (
    <AnimatePresence>
      {!data.ethicsAccepted && (
        <motion.div className="fixed inset-0 z-[100] flex items-center justify-center bg-ink-950/95 p-4 backdrop-blur" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <motion.div
            className="card w-full max-w-md p-6"
            initial={{ y: 30, scale: 0.96 }}
            animate={{ y: 0, scale: 1 }}
            exit={{ y: -20, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 260, damping: 26 }}
          >
            <div className="mb-4 flex flex-col items-center text-center">
              <LogoMark size={56} />
              <h1 className="mt-3 font-display text-2xl font-semibold">Zlatá pravidla Locksportu</h1>
              <p className="mt-1 text-sm text-slate-400">Locksport je sport a vzdělávání. Než začneš, potvrď prosím tato pravidla.</p>
            </div>
            <ol className="space-y-3">
              {golden.map((r, i) => (
                <li key={r.title} className="flex gap-3 rounded-2xl border border-brass-500/30 bg-brass-500/5 p-3.5">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brass-500 text-sm font-bold text-ink-950">{i + 1}</span>
                  <div>
                    <div className="font-semibold text-brass-300">{r.title}</div>
                    <p className="mt-0.5 text-sm leading-relaxed text-slate-300">{r.text}</p>
                  </div>
                </li>
              ))}
            </ol>
            <p className="mt-3 text-xs text-slate-500">Celý etický kodex a přehled zákonů najdeš v Encyklopedii → Zákony & Etika.</p>
            <button type="button" onClick={() => setChecked((v) => !v)} className="mt-4 flex w-full items-center gap-3 rounded-xl bg-black/25 p-3 text-left text-sm">
              <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border ${checked ? 'border-brass-500 bg-brass-500 text-ink-950' : 'border-white/10'}`}>
                {checked && <Icon name="check" size={14} strokeWidth={3} />}
              </span>
              Budu otevírat pouze zámky, které vlastním a které nejsou v provozu.
            </button>
            <Button
              variant="brass"
              size="lg"
              className="mt-4 w-full"
              disabled={!checked}
              onClick={() => {
                sound.unlock();
                sound.open();
                acceptEthics();
              }}
            >
              Rozumím a souhlasím
            </Button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function Toasts() {
  const { toasts, dismissToast } = useStore();
  return (
    <div className="pointer-events-none fixed inset-x-0 top-[calc(3.5rem+var(--safe-top))] z-[90] flex flex-col items-center gap-2 px-4">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.button
            key={t.id}
            layout
            initial={{ y: -20, opacity: 0, scale: 0.9 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: -10, opacity: 0, scale: 0.95 }}
            onClick={() => dismissToast(t.id)}
            className={`pointer-events-auto flex w-full max-w-sm items-center gap-3 rounded-2xl border px-4 py-3 text-left shadow-2xl backdrop-blur-xl ${
              t.tone === 'bad'
                ? 'border-bad/50 bg-red-950/80'
                : t.tone === 'ok'
                  ? 'border-ok/50 bg-emerald-950/80'
                  : t.tone === 'steel'
                    ? 'border-azure-400/40 bg-slate-900/90'
                    : 'border-brass-500/50 bg-ink-900/90'
            }`}
          >
            <motion.span className="text-2xl" initial={{ rotate: -30, scale: 0.4 }} animate={{ rotate: 0, scale: 1 }} transition={{ type: 'spring', stiffness: 400, damping: 12 }}>
              {t.icon}
            </motion.span>
            <span>
              <span className="block text-sm font-semibold text-slate-50">{t.title}</span>
              {t.body && <span className="block text-xs text-slate-300">{t.body}</span>}
            </span>
          </motion.button>
        ))}
      </AnimatePresence>
    </div>
  );
}
