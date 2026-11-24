import { motion } from 'framer-motion';
import { lazy, Suspense } from 'react';
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

function Screens() {
  const { tab } = useStore();
  return (
    <main className="mx-auto max-w-2xl px-4 pb-[calc(6rem+var(--safe-bottom))] pt-4">
      <motion.div key={tab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.16 }}>
          <Suspense fallback={<Loading />}>
            {tab === 'timer' && <TimerPage />}
            {tab === 'arcade' && <ArcadePage />}
            {tab === 'library' && <EncyclopediaPage />}
            {tab === 'gear' && <GearPage />}
            {tab === 'stats' && <StatsPage />}
          </Suspense>
      </motion.div>
    </main>
  );
}

export default function App() {
  return (
    <AppStoreProvider>
      <TopBar />
      <Screens />
      <BottomNav />
      <Toasts />
      <EthicsGate />
    </AppStoreProvider>
  );
}
