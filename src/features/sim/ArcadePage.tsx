import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { useStore, type ArcadeView } from '../../store/AppStore';
import { PageHeader } from '../../components/ui';
import { SimulatorPanel } from './SimulatorPanel';
import { QuizGame } from './QuizGame';
import { Gauntlet } from './Gauntlet';
import { Drills } from './Drills';
import { Badges } from './Badges';

const VIEWS: { id: ArcadeView; label: string; icon: string }[] = [
  { id: 'simulator', label: 'Simulátor', icon: '🔐' },
  { id: 'quiz', label: 'Poznávačka', icon: '🔍' },
  { id: 'gauntlet', label: 'Gauntlet', icon: '⏱️' },
  { id: 'drills', label: 'Drily', icon: '🎯' },
  { id: 'badges', label: 'Odznaky', icon: '🏅' },
];

export function ArcadePage() {
  const { intent } = useStore();
  const [view, setView] = useState<ArcadeView>(() => (localStorage.getItem('locked.arcade') as ArcadeView) || 'simulator');

  useEffect(() => {
    if (intent?.tab === 'arcade' && intent.arcade) setView(intent.arcade);
  }, [intent]);

  useEffect(() => {
    localStorage.setItem('locked.arcade', view);
  }, [view]);

  return (
    <div>
      <PageHeader title="Simulátor & Hry" subtitle="Trénuj cit, oko i rychlost" />
      <div className="-mx-4 mb-4 flex gap-2 overflow-x-auto px-4 pb-1 scrollbar-none">
        {VIEWS.map((v) => (
          <button
            key={v.id}
            onClick={() => setView(v.id)}
            className={`relative shrink-0 rounded-full px-4 py-2 text-sm font-medium transition ${view === v.id ? 'text-ink-950' : 'border border-edge text-steel-400'}`}
          >
            {view === v.id && <motion.span layoutId="arcade-pill" className="absolute inset-0 -z-0 rounded-full bg-gradient-to-b from-brass-400 to-brass-600" />}
            <span className="relative z-10">
              {v.icon} {v.label}
            </span>
          </button>
        ))}
      </div>
      {/* keyed enter-only transition: exit animations could stall while a game re-renders every frame */}
      <motion.div key={view} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.18 }}>
          {view === 'simulator' && <SimulatorPanel />}
          {view === 'quiz' && <QuizGame />}
          {view === 'gauntlet' && <Gauntlet />}
          {view === 'drills' && <Drills />}
          {view === 'badges' && <Badges />}
      </motion.div>
    </div>
  );
}
