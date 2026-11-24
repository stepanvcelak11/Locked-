import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { AppData, ChallengeResult, LockItem, Settings, SimLockSpec, SolveRecord, TabId, TimerConfig, ToolItem } from '../types';
import { loadData, saveData } from '../lib/storage';
import { uid } from '../lib/id';
import { BADGES, earnedBadges } from '../lib/badges';
import { sound } from '../lib/audio';
import { setHapticsEnabled } from '../lib/haptics';
import { createDefaultData } from '../data/defaults';
import { todayKey } from '../lib/random';

export interface Toast {
  id: string;
  icon: string;
  title: string;
  body?: string;
  tone?: 'brass' | 'steel' | 'ok' | 'bad';
}

export type ArcadeView = 'simulator' | 'quiz' | 'gauntlet' | 'drills' | 'badges';

export interface NavIntent {
  tab: TabId;
  arcade?: ArcadeView;
  sim?: { spec?: SimLockSpec; pins?: number; spools?: number; serrated?: number; blind?: boolean; drillId?: string; tool?: string; label?: string };
  library?: string;
  gear?: 'locks' | 'tools';
  stamp: number;
}

interface Store {
  data: AppData;
  tab: TabId;
  intent: NavIntent | null;
  toasts: Toast[];
  navigate: (tab: TabId, extra?: Omit<NavIntent, 'tab' | 'stamp'>) => void;
  consumeIntent: () => void;
  toast: (t: Omit<Toast, 'id'>) => void;
  dismissToast: (id: string) => void;
  acceptEthics: () => void;
  updateSettings: (p: Partial<Settings>) => void;
  setTimerConfig: (p: Partial<TimerConfig>) => void;
  addSolve: (s: Omit<SolveRecord, 'id'>) => SolveRecord;
  updateSolve: (id: string, p: Partial<SolveRecord>) => void;
  deleteSolve: (id: string) => void;
  clearSolves: (lockId?: string | null) => void;
  upsertLock: (l: Omit<LockItem, 'id' | 'createdAt'> & { id?: string; createdAt?: number }) => LockItem;
  deleteLock: (id: string) => void;
  upsertTool: (t: Omit<ToolItem, 'id' | 'createdAt'> & { id?: string; createdAt?: number }) => ToolItem;
  deleteTool: (id: string) => void;
  addChallenge: (c: Omit<ChallengeResult, 'id' | 'date'> & { date?: number }) => ChallengeResult;
  completeDrill: (drillId: string, done?: boolean) => void;
  replaceData: (d: AppData) => void;
  resetData: (withSamples: boolean) => void;
}

const Ctx = createContext<Store | null>(null);

const TAB_KEY = 'locked.tab';
const TABS: TabId[] = ['timer', 'arcade', 'library', 'gear', 'stats'];

export function AppStoreProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AppData>(() => loadData());
  const [tab, setTab] = useState<TabId>(() => {
    const h = location.hash.replace('#', '') as TabId;
    if (TABS.includes(h)) return h;
    const s = localStorage.getItem(TAB_KEY) as TabId | null;
    return s && TABS.includes(s) ? s : 'timer';
  });
  const [intent, setIntent] = useState<NavIntent | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const saveTimer = useRef<number | undefined>(undefined);
  const firstBadgeCheck = useRef(true);

  // persistence (debounced)
  useEffect(() => {
    window.clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(() => saveData(data), 250);
    return () => window.clearTimeout(saveTimer.current);
  }, [data]);

  useEffect(() => {
    const flush = () => saveData(data);
    window.addEventListener('pagehide', flush);
    return () => window.removeEventListener('pagehide', flush);
  }, [data]);

  // audio + haptics settings
  useEffect(() => {
    sound.setEnabled(data.settings.sound);
    sound.setVolume(data.settings.volume);
    setHapticsEnabled(data.settings.haptics);
  }, [data.settings.sound, data.settings.volume, data.settings.haptics]);

  useEffect(() => {
    localStorage.setItem(TAB_KEY, tab);
    if (location.hash !== `#${tab}`) history.replaceState(null, '', `#${tab}`);
  }, [tab]);

  useEffect(() => {
    const onHash = () => {
      const h = location.hash.replace('#', '') as TabId;
      if (TABS.includes(h)) setTab(h);
    };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  const toast = useCallback((t: Omit<Toast, 'id'>) => {
    const id = uid('t');
    setToasts((ts) => [...ts.slice(-2), { ...t, id }]);
    window.setTimeout(() => setToasts((ts) => ts.filter((x) => x.id !== id)), 4200);
  }, []);

  // badge evaluation
  useEffect(() => {
    const earned = earnedBadges(data);
    const fresh = earned.filter((id) => !data.badges[id]);
    if (!fresh.length) {
      firstBadgeCheck.current = false;
      return;
    }
    const now = Date.now();
    setData((d) => ({ ...d, badges: { ...d.badges, ...Object.fromEntries(fresh.map((id) => [id, now])) } }));
    if (!firstBadgeCheck.current) {
      fresh.forEach((id) => {
        const b = BADGES.find((x) => x.id === id);
        if (b) toast({ icon: b.icon, title: `Odznak: ${b.title}`, body: b.desc, tone: 'brass' });
      });
      sound.achievement();
    }
    firstBadgeCheck.current = false;
  }, [data, toast]);

  const navigate = useCallback((t: TabId, extra?: Omit<NavIntent, 'tab' | 'stamp'>) => {
    setTab(t);
    if (extra) setIntent({ tab: t, ...extra, stamp: Date.now() });
    window.scrollTo({ top: 0 });
  }, []);

  const store = useMemo<Store>(
    () => ({
      data,
      tab,
      intent,
      toasts,
      navigate,
      consumeIntent: () => setIntent(null),
      toast,
      dismissToast: (id) => setToasts((ts) => ts.filter((x) => x.id !== id)),
      acceptEthics: () => setData((d) => ({ ...d, ethicsAccepted: true })),
      updateSettings: (p) => setData((d) => ({ ...d, settings: { ...d.settings, ...p } })),
      setTimerConfig: (p) => setData((d) => ({ ...d, timerConfig: { ...d.timerConfig, ...p } })),
      addSolve: (s) => {
        const rec: SolveRecord = { ...s, id: uid('s') };
        setData((d) => ({ ...d, solves: [...d.solves, rec] }));
        return rec;
      },
      updateSolve: (id, p) => setData((d) => ({ ...d, solves: d.solves.map((s) => (s.id === id ? { ...s, ...p } : s)) })),
      deleteSolve: (id) => setData((d) => ({ ...d, solves: d.solves.filter((s) => s.id !== id) })),
      clearSolves: (lockId) =>
        setData((d) => ({ ...d, solves: lockId === undefined ? [] : d.solves.filter((s) => s.lockId !== lockId) })),
      upsertLock: (l) => {
        const item: LockItem = { ...l, id: l.id ?? uid('lock-'), createdAt: l.createdAt ?? Date.now() } as LockItem;
        setData((d) => {
          const exists = d.locks.some((x) => x.id === item.id);
          return { ...d, locks: exists ? d.locks.map((x) => (x.id === item.id ? item : x)) : [...d.locks, item] };
        });
        return item;
      },
      deleteLock: (id) =>
        setData((d) => ({
          ...d,
          locks: d.locks.filter((l) => l.id !== id),
          timerConfig: d.timerConfig.lockId === id ? { ...d.timerConfig, lockId: null } : d.timerConfig,
        })),
      upsertTool: (t) => {
        const item: ToolItem = { ...t, id: t.id ?? uid('tool-'), createdAt: t.createdAt ?? Date.now() } as ToolItem;
        setData((d) => {
          const exists = d.tools.some((x) => x.id === item.id);
          return { ...d, tools: exists ? d.tools.map((x) => (x.id === item.id ? item : x)) : [...d.tools, item] };
        });
        return item;
      },
      deleteTool: (id) =>
        setData((d) => ({
          ...d,
          tools: d.tools.filter((t) => t.id !== id),
          timerConfig: {
            ...d.timerConfig,
            pickId: d.timerConfig.pickId === id ? null : d.timerConfig.pickId,
            tensionId: d.timerConfig.tensionId === id ? null : d.timerConfig.tensionId,
          },
        })),
      addChallenge: (c) => {
        const rec: ChallengeResult = { ...c, id: uid('c'), date: c.date ?? Date.now() };
        setData((d) => ({ ...d, challenges: [...d.challenges, rec] }));
        return rec;
      },
      completeDrill: (drillId, done = true) =>
        setData((d) => {
          const key = todayKey();
          const list = d.drills[key] ?? [];
          const next = done ? Array.from(new Set([...list, drillId])) : list.filter((x) => x !== drillId);
          return { ...d, drills: { ...d.drills, [key]: next } };
        }),
      replaceData: (d) => {
        firstBadgeCheck.current = true;
        setData(d);
      },
      resetData: (withSamples) => {
        firstBadgeCheck.current = true;
        // keep the user's preferences (appearance, sound…) – only the records are reset
        setData((d) => ({ ...createDefaultData(withSamples, withSamples), settings: d.settings, ethicsAccepted: true }));
      },
    }),
    [data, tab, intent, toasts, navigate, toast],
  );

  return <Ctx.Provider value={store}>{children}</Ctx.Provider>;
}

export function useStore(): Store {
  const s = useContext(Ctx);
  if (!s) throw new Error('useStore outside provider');
  return s;
}

export function useLock(id: string | null | undefined) {
  const { data } = useStore();
  return id ? (data.locks.find((l) => l.id === id) ?? null) : null;
}
