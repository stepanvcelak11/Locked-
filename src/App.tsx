import { motion } from 'framer-motion';
import { lazy, Suspense, useEffect } from 'react';
import { AppStoreProvider, useStore } from './store/AppStore';
import { BottomNav, EthicsGate, Toasts, TopBar } from './components/Shell';
import { TimerPage } from './features/timer/TimerPage';

const ArcadePage = lazy(() => import('./features/sim/ArcadePage').then((m) => ({ default: m.ArcadePage })));
const EncyclopediaPage = lazy(() => import('./features/encyclopedia/EncyclopediaPage').then((m) => ({ default: m.EncyclopediaPage })));
const GearPage = lazy(() => import('./features/gear/GearPage').then((m) => ({ default: m.GearPage })));
const StatsPage = lazy(() => import('./features/stats/StatsPage').then((m) => ({ default: m.StatsPage })));

function Loading() {
  return (
    <div className="flex h-64 items-center justify-center">
      <motion.div className="h-8 w-8 rounded-full border-2 border-brass-500 border-t-transparent" animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.8, ease: 'linear' }} />
    </div>
  );
}

/** Applies the chosen appearance to <html data-theme> and the browser chrome colour. */
function ThemeSync() {
  const { data } = useStore();
  const theme = data.settings.theme ?? 'light';
  useEffect(() => {
    const root = document.documentElement;
    root.dataset.theme = theme;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const apply = () => {
      const dark = theme === 'dark' || (theme === 'system' && mq.matches);
      document.querySelector('meta[name="theme-color"]')?.setAttribute('content', dark ? '#000000' : '#f2f2f7');
    };
    apply();
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, [theme]);
  return null;
}

function Screens() {
  const { tab } = useStore();
  useEffect(() => {
    document.documentElement.dataset.section = tab;
  }, [tab]);
  return (
    <>
    {/* soft wash of the section colour behind the large title */}
    <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 -z-0 h-72" style={{ background: 'linear-gradient(180deg, color-mix(in srgb, var(--tint) 16%, transparent), transparent)' }} />
    <main className="relative mx-auto max-w-2xl px-4 pb-[calc(6rem+var(--safe-bottom))] pt-0">
      <motion.div key={tab} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.15 }}>
          <Suspense fallback={<Loading />}>
            {tab === 'timer' && <TimerPage />}
            {tab === 'arcade' && <ArcadePage />}
            {tab === 'library' && <EncyclopediaPage />}
            {tab === 'gear' && <GearPage />}
            {tab === 'stats' && <StatsPage />}
          </Suspense>
      </motion.div>
    </main>
    </>
  );
}

export default function App() {
  return (
    <AppStoreProvider>
      <ThemeSync />
      <TopBar />
      <Screens />
      <BottomNav />
      <Toasts />
      <EthicsGate />
    </AppStoreProvider>
  );
}
