import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { useStore, type ArcadeView } from '../../store/AppStore';
import { PageHeader } from '../../components/ui';
import { Icon, type IconName } from '../../components/Icon';
import { SimulatorPanel } from './SimulatorPanel';
import { QuizGame } from './QuizGame';
import { Gauntlet } from './Gauntlet';
import { Drills } from './Drills';
import { Badges } from './Badges';

const VIEWS: { id: ArcadeView; label: string; icon: IconName }[] = [
  { id: 'simulator', label: 'Simulátor', icon: 'lock' },
  { id: 'quiz', label: 'Poznávačka', icon: 'search' },
  { id: 'gauntlet', label: 'Gauntlet', icon: 'flag' },
  { id: 'drills', label: 'Drily', icon: 'target' },
  { id: 'badges', label: 'Odznaky', icon: 'medal' },
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
      <PageHeader title="Trénink" subtitle="Simulátor, hry a denní cvičení" />
      <div className="-mx-4 mb-4 flex gap-2 overflow-x-auto px-4 pb-1 scrollbar-none">
        {VIEWS.map((v) => (
          <button
            key={v.id}
            onClick={() => setView(v.id)}
            className={`relative flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-2 text-[14px] transition ${view === v.id ? 'font-semibold text-white' : 'bg-fill font-medium text-slate-100'}`}
          >
            {view === v.id && <motion.span layoutId="arcade-pill" className="absolute inset-0 -z-0 rounded-full bg-brass-500" transition={{ type: 'spring', stiffness: 500, damping: 38 }} />}
            <Icon name={v.icon} size={16} strokeWidth={2.3} className="relative z-10" />
            <span className="relative z-10">{v.label}</span>
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
