import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import { useStore } from '../store/AppStore';
import { Icon, isIconName, type IconName } from './Icon';
import type { TabId } from '../types';
import { Button, GroupLabel, IconTile, ListGroup, ListRow, Segmented, Sheet, Switch } from './ui';
import { IOS } from '../lib/colors';
import { exportFile, importFile, solvesToCsv } from '../lib/storage';
import { sound } from '../lib/audio';
import { ETHICS } from '../data/library';

const NAV: { id: TabId; label: string; icon: IconName }[] = [
  { id: 'library', label: 'Návody', icon: 'book' },
  { id: 'arcade', label: 'Trénink', icon: 'gamepad' },
  { id: 'timer', label: 'Stopky', icon: 'timer' },
  { id: 'stats', label: 'Statistiky', icon: 'chart' },
  { id: 'gear', label: 'Výbava', icon: 'toolbox' },
];

/** Tab bar: Stopky sits in the middle as a raised button, the rest are iOS tabs tinted with their section colour. */
export function BottomNav() {
  const { tab, navigate } = useStore();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-sep bg-bar pb-[var(--safe-bottom)] backdrop-blur-xl backdrop-saturate-150">
      <div className="mx-auto flex max-w-2xl">
        {NAV.map((n) => {
          const active = tab === n.id;
          const go = () => {
            sound.unlock();
            if (active) {
              navigate(n.id, { root: true });
              window.scrollTo({ top: 0, behavior: 'smooth' });
            } else navigate(n.id);
          };
          if (n.id === 'timer') {
            return (
              <button key={n.id} onClick={go} className="flex flex-1 flex-col items-center pb-1.5 text-[10px] font-semibold" aria-current={active ? 'page' : undefined} aria-label={n.label}>
                <motion.span
                  className="-mt-5 flex h-14 w-14 items-center justify-center rounded-full text-white shadow-[0_6px_16px_rgba(0,122,255,0.35)] ring-4 ring-[var(--color-ink-950)]"
                  style={{ background: 'linear-gradient(160deg, #3d9bff, #0062e6)' }}
                  animate={{ scale: active ? 1.05 : 1 }}
                  whileTap={{ scale: 0.92 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 28 }}
                >
                  <Icon name={n.icon} size={28} strokeWidth={2.2} />
                </motion.span>
                <span className={`mt-0.5 ${active ? 'text-brass-500' : 'text-slate-500'}`}>{n.label}</span>
              </button>
            );
          }
          return (
            <button
              key={n.id}
              onClick={go}
              className={`flex flex-1 flex-col items-center gap-0.5 pb-1.5 pt-2 text-[10px] font-medium transition-colors ${active ? 'text-brass-500' : 'text-slate-500'}`}
              aria-current={active ? 'page' : undefined}
            >
              <motion.span animate={{ scale: active ? 1.08 : 1 }} transition={{ type: 'spring', stiffness: 500, damping: 30 }}>
                <Icon name={n.icon} size={25} strokeWidth={active ? 2.2 : 1.8} duotone={active} />
              </motion.span>
              {n.label}
            </button>
          );
        })}
      </div>
    </nav>
  );
}

export function LogoMark({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="96 64 320 384" aria-hidden="true">
      <defs>
        <linearGradient id="lm-g" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffd27a" />
          <stop offset="1" stopColor="#f0962c" />
        </linearGradient>
      </defs>
      <path d="M180 236V172a76 76 0 0 1 152 0v64" fill="none" stroke="#a1a1a6" strokeWidth="34" />
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

const TITLES: Record<TabId, string> = { timer: 'Stopky', arcade: 'Trénink', library: 'Návody', gear: 'Výbava', stats: 'Statistiky' };

/** iOS navigation bar: transparent over the large title, blurred with a compact title once scrolled. */
export function TopBar() {
  const { tab } = useStore();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  return (
    <>
      <header
        className={`sticky top-0 z-30 pt-[var(--safe-top)] transition-colors duration-200 ${scrolled ? 'border-b border-sep bg-bar backdrop-blur-xl backdrop-saturate-150' : 'border-b border-transparent'}`}
      >
        <div className="relative mx-auto flex h-11 max-w-2xl items-center justify-end px-2">
          <motion.span
            className="pointer-events-none absolute inset-x-16 text-center text-[17px] font-semibold text-slate-50"
            animate={{ opacity: scrolled ? 1 : 0, y: scrolled ? 0 : 4 }}
            transition={{ duration: 0.15 }}
          >
            {TITLES[tab]}
          </motion.span>
          <button onClick={() => setOpen(true)} className="flex h-11 w-11 items-center justify-center rounded-full text-brass-500 active:opacity-50" aria-label="Nastavení">
            <Icon name="settings" size={23} />
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
      <GroupLabel>Vzhled</GroupLabel>
      <ListGroup className="p-3">
        <Segmented
          value={s.theme}
          onChange={(v) => updateSettings({ theme: v })}
          options={[
            { id: 'light', label: 'Světlý' },
            { id: 'dark', label: 'Tmavý' },
            { id: 'system', label: 'Podle systému' },
          ]}
        />
      </ListGroup>

      <GroupLabel>Zvuk a odezva</GroupLabel>
      <ListGroup>
        <ListRow icon="volume" color={IOS.pink} title="Zvukové efekty" sub="Klikání stavítek, stopky">
          <Switch checked={s.sound} onChange={(v) => updateSettings({ sound: v })} label="Zvukové efekty" />
        </ListRow>
        {s.sound && (
          <div className="relative flex items-center gap-3 px-4 py-3">
            <Icon name="mute" size={16} className="text-slate-500" />
            <input type="range" aria-label="Hlasitost" className="slider flex-1" min={0} max={1} step={0.05} value={s.volume} onChange={(e) => updateSettings({ volume: +e.target.value })} />
            <Icon name="volume" size={18} className="text-slate-500" />
            <button className="text-[15px] text-brass-500" onClick={() => sound.pinSet()}>
              Test
            </button>
            <span className="absolute bottom-0 left-4 right-0 h-px bg-sep" />
          </div>
        )}
        <ListRow icon="zap" color={IOS.orange} title="Vibrace" sub="Hmatová odezva" last>
          <Switch checked={s.haptics} onChange={(v) => updateSettings({ haptics: v })} label="Vibrace" />
        </ListRow>
      </ListGroup>

      <GroupLabel>Stopky</GroupLabel>
      <ListGroup>
        <div className="relative px-4 py-3">
          <div className="mb-2 flex justify-between text-[16px] text-slate-50">
            <span>Podržení pro start</span>
            <span className="font-mono text-slate-400">{(s.holdToStartMs / 1000).toFixed(2)} s</span>
          </div>
          <input type="range" aria-label="Doba podržení" className="slider w-full" min={0} max={1500} step={50} value={s.holdToStartMs} onChange={(e) => updateSettings({ holdToStartMs: +e.target.value })} />
          <span className="absolute bottom-0 left-4 right-0 h-px bg-sep" />
        </div>
        <ListRow title="Vyžadovat 2 prsty" sub="Start až po položení dvou prstů">
          <Switch checked={s.requireTwoFingers} onChange={(v) => updateSettings({ requireTwoFingers: v })} label="Vyžadovat 2 prsty" />
        </ListRow>
        <div className="relative px-4 py-3">
          <div className="mb-2 text-[16px] text-slate-50">Prohlídka zámku před startem</div>
          <Segmented
            value={String(s.inspectionSec)}
            onChange={(v) => updateSettings({ inspectionSec: +v })}
            options={[
              { id: '0', label: 'Vyp' },
              { id: '5', label: '5 s' },
              { id: '10', label: '10 s' },
              { id: '15', label: '15 s' },
            ]}
          />
          <span className="absolute bottom-0 left-4 right-0 h-px bg-sep" />
        </div>
        <ListRow title="Skrýt čas během měření" sub="Menší stres, lepší soustředění" last>
          <Switch checked={s.hideTimeWhileRunning} onChange={(v) => updateSettings({ hideTimeWhileRunning: v })} label="Skrýt čas" />
        </ListRow>
      </ListGroup>

      <GroupLabel>Simulátor</GroupLabel>
      <ListGroup>
        <div className="relative px-4 py-3">
          <div className="mb-2 text-[16px] text-slate-50">Obtížnost fyziky</div>
          <Segmented
            value={s.simDifficulty}
            onChange={(v) => updateSettings({ simDifficulty: v })}
            options={[
              { id: 'easy', label: 'Lehká' },
              { id: 'normal', label: 'Normální' },
              { id: 'hard', label: 'Těžká' },
            ]}
          />
          <span className="absolute bottom-0 left-4 right-0 h-px bg-sep" />
        </div>
        <ListRow title="Zvýraznit binding pin" sub="V průhledném režimu" last>
          <Switch checked={s.showBindingHint} onChange={(v) => updateSettings({ showBindingHint: v })} label="Zvýraznit binding pin" />
        </ListRow>
      </ListGroup>

      <GroupLabel>Data a záloha</GroupLabel>
      <ListGroup>
        <ListRow icon="download" color={IOS.blue} title="Exportovat zálohu" sub=".json – přenos na jiné zařízení" onClick={() => exportFile(data)} />
        <ListRow icon="upload" color={IOS.green} title="Nahrát zálohu" onClick={() => fileRef.current?.click()} />
        <ListRow icon="list" color={IOS.gray} title="Exportovat časy do CSV" onClick={downloadCsv} last />
      </ListGroup>
      <p className="mt-1.5 px-4 text-[13px] text-slate-400">Vše je uloženo jen v tomto zařízení a funguje offline.</p>
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
            toast({ icon: 'check', title: 'Záloha nahrána', body: `${d.locks.length} zámků, ${d.tools.length} nástrojů, ${d.solves.length} časů`, tone: 'ok' });
          } catch (err) {
            toast({ icon: 'info', title: 'Import selhal', body: (err as Error).message, tone: 'bad' });
          }
        }}
      />

      <ListGroup className="mt-6">
        <ListRow title={<span className="text-brass-500">Vyzkoušet ukázková data</span>} onClick={() => setConfirmReset('samples')} chevron={false} />
        <ListRow title={<span className="text-red-300">Smazat všechna data</span>} onClick={() => setConfirmReset('empty')} chevron={false} last />
      </ListGroup>
      {confirmReset && (
        <div className="mt-3 rounded-xl bg-bad/10 p-3 text-[15px]">
          <p className="mb-2 text-slate-100">
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
                toast({ icon: 'refresh', title: 'Data obnovena' });
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

      <GroupLabel>O aplikaci</GroupLabel>
      <ListGroup>
        <ListRow icon="shield" color={IOS.indigo} title="Zlatá pravidla locksportu" onClick={() => setShowEthics((v) => !v)} chevron={false} last />
      </ListGroup>
      {showEthics && (
        <ul className="mt-2 space-y-2 text-[15px] text-slate-300">
          {ETHICS.filter((e) => e.golden).map((e) => (
            <li key={e.title} className="card p-3">
              <b className="text-slate-50">{e.title}.</b> {e.text}
            </li>
          ))}
        </ul>
      )}
      <p className="mt-5 pb-2 text-center text-[13px] text-slate-500">Locked 1.1 · funguje offline</p>
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
        <motion.div
          className="fixed inset-0 z-[100] overflow-y-auto bg-ink-950 px-6 pb-[calc(1.5rem+var(--safe-bottom))] pt-[calc(3rem+var(--safe-top))]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, y: 40 }}
        >
          <div className="mx-auto flex min-h-full max-w-md flex-col">
            <div className="flex flex-col items-center text-center">
              <img src="./icons/icon-192.png" alt="" width={84} height={84} className="rounded-[20px] shadow-[0_10px_30px_-12px_rgba(0,0,0,0.5)]" />
              <h1 className="mt-5 font-display text-[30px] font-bold leading-tight text-slate-50">Vítej v Locked</h1>
              <p className="mt-2 text-[16px] text-slate-400">Locksport je sport a vzdělávání. Než začneš, potvrď prosím dvě zlatá pravidla.</p>
            </div>
            <ul className="mt-8 space-y-6">
              {golden.map((r) => (
                <li key={r.title} className="flex gap-4">
                  <IconTile icon={r.icon} color={r.color} size={44} />
                  <div>
                    <div className="text-[17px] font-semibold text-slate-50">{r.title}</div>
                    <p className="mt-0.5 text-[15px] leading-snug text-slate-400">{r.text}</p>
                  </div>
                </li>
              ))}
            </ul>
            <div className="flex-1" />
            <p className="mt-6 text-center text-[13px] text-slate-500">Celý etický kodex a přehled zákonů najdeš v Encyklopedii.</p>
            <button type="button" onClick={() => setChecked((v) => !v)} className="card mt-3 flex w-full items-center gap-3 p-3.5 text-left text-[15px] text-slate-100">
              <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition ${checked ? 'border-brass-500 bg-brass-500 text-white' : 'border-slate-600'}`}>
                {checked && <Icon name="check" size={14} strokeWidth={3.2} />}
              </span>
              Budu otevírat pouze zámky, které vlastním a které nejsou v provozu.
            </button>
            <Button
              variant="brass"
              size="lg"
              className="mt-3 w-full"
              disabled={!checked}
              onClick={() => {
                sound.unlock();
                sound.open();
                acceptEthics();
              }}
            >
              Rozumím a souhlasím
            </Button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/** iOS notification-style banners. */
export function Toasts() {
  const { toasts, dismissToast } = useStore();
  return (
    <div className="pointer-events-none fixed inset-x-0 top-[calc(0.5rem+var(--safe-top))] z-[90] flex flex-col items-center gap-2 px-3">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.button
            key={t.id}
            layout
            initial={{ y: -40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -30, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 420, damping: 32 }}
            onClick={() => dismissToast(t.id)}
            className="pointer-events-auto flex w-full max-w-sm items-center gap-3 rounded-[22px] bg-bar px-4 py-3 text-left shadow-[0_10px_40px_-10px_rgba(0,0,0,0.35)] backdrop-blur-xl backdrop-saturate-150"
          >
            {isIconName(t.icon) ? (
              <IconTile icon={t.icon} color={t.tone === 'bad' ? IOS.red : t.tone === 'ok' ? IOS.green : t.tone === 'brass' ? IOS.orange : IOS.blue} size={36} />
            ) : (
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-fill text-xl">{t.icon}</span>
            )}
            <span className="min-w-0">
              <span className="block text-[15px] font-semibold text-slate-50">{t.title}</span>
              {t.body && <span className="block text-[13px] text-slate-400">{t.body}</span>}
            </span>
          </motion.button>
        ))}
      </AnimatePresence>
    </div>
  );
}
