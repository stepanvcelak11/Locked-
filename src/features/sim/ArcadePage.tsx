import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { useStore, type ArcadeView } from '../../store/AppStore';
import { GroupLabel, IconTile, ListGroup, ListRow, PageHeader } from '../../components/ui';
import { Icon, type IconName } from '../../components/Icon';
import { IOS } from '../../lib/colors';
import { BADGES } from '../../lib/badges';
import { dailyDrills } from './Drills';
import { todayKey } from '../../lib/random';
import { SimulatorPanel } from './SimulatorPanel';
import { QuizGame } from './QuizGame';
import { Gauntlet } from './Gauntlet';
import { Drills } from './Drills';
import { Badges } from './Badges';

const MODES: { id: ArcadeView; title: string; desc: string; icon: IconName; color: string }[] = [
  { id: 'simulator', title: 'Simulátor', desc: 'Virtuální zámek, který otevřeš prstem', icon: 'gamepad', color: '#9f45d6' },
  { id: 'drills', title: 'Denní cvičení', desc: 'Tři krátké úkoly na každý den', icon: 'calendar', color: IOS.orange },
  { id: 'quiz', title: 'Poznávačka', desc: 'Kvíz: nástroje, stavítka a pojmy', icon: 'search', color: IOS.blue },
  { id: 'gauntlet', title: 'Výzva na čas', desc: 'Tři zámky po sobě, každá vteřina se počítá', icon: 'flag', color: IOS.red },
  { id: 'badges', title: 'Odznaky', desc: 'Co už máš za sebou', icon: 'medal', color: '#d4a017' },
];

export function ArcadePage() {
  const { intent, data } = useStore();
  const [view, setView] = useState<ArcadeView | null>(null);

  useEffect(() => {
    if (intent?.tab === 'arcade' && intent.root) setView(null);
    else if (intent?.tab === 'arcade' && intent.arcade) setView(intent.arcade);
  }, [intent]);

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [view]);

  const cur = MODES.find((m) => m.id === view);

  if (!cur) {
    const today = dailyDrills();
    const doneToday = today.filter((d) => (data.drills[todayKey()] ?? []).includes(d.id)).length;
    const earned = BADGES.filter((b) => data.badges[b.id]).length;
    const sim = MODES[0];
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <PageHeader title="Trénink" subtitle="Cvič i bez zámku v ruce" />

        {/* The one thing a newcomer should try first */}
        <button
          type="button"
          onClick={() => setView('simulator')}
          className="relative block w-full overflow-hidden rounded-[1.375rem] p-5 text-left text-white shadow-[0_10px_30px_-12px_rgba(120,40,200,0.6)] transition active:scale-[0.98]"
          style={{ background: 'linear-gradient(140deg, #b35cf0 0%, #7b3fe4 55%, #5a3bd6 100%)' }}
        >
          <SimArt />
          <span className="inline-flex items-center gap-1 rounded-full bg-white/20 px-2.5 py-0.5 text-[12px] font-semibold">
            <Icon name="star" size={12} /> Začni tady
          </span>
          <span className="mt-3 block text-[26px] font-bold leading-tight">{sim.title}</span>
          <span className="mt-1 block max-w-[60%] text-[15px] text-white/85">{sim.desc}. Uvidíš dovnitř, jak stavítka fungují.</span>
          <span className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-2 text-[15px] font-semibold text-[#7b3fe4]">
            <Icon name="play" size={15} /> Spustit
          </span>
        </button>

        <GroupLabel>Další hry</GroupLabel>
        <ListGroup>
          {MODES.slice(1).map((m, i, arr) => (
            <ListRow
              key={m.id}
              icon={m.icon}
              color={m.color}
              title={m.title}
              sub={m.desc}
              value={m.id === 'drills' ? `${doneToday}/${today.length}` : m.id === 'badges' ? `${earned}/${BADGES.length}` : undefined}
              onClick={() => setView(m.id)}
              last={i === arr.length - 1}
            />
          ))}
        </ListGroup>
      </motion.div>
    );
  }

  return (
    <motion.div key={cur.id} initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} transition={{ type: 'spring', stiffness: 400, damping: 38 }}>
      <button onClick={() => setView(null)} className="-ml-1 mb-1 inline-flex items-center text-[17px] text-brass-500 active:opacity-50">
        <Icon name="chevronLeft" size={22} strokeWidth={2.4} /> Trénink
      </button>
      <div className="mb-4 flex items-center gap-3 px-1">
        <IconTile icon={cur.icon} color={cur.color} size={40} />
        <h1 className="font-display text-[30px] font-bold leading-tight text-slate-50">{cur.title}</h1>
      </div>
      {cur.id === 'simulator' && <SimulatorPanel />}
      {cur.id === 'quiz' && <QuizGame />}
      {cur.id === 'gauntlet' && <Gauntlet />}
      {cur.id === 'drills' && <Drills />}
      {cur.id === 'badges' && <Badges />}
    </motion.div>
  );
}

/** Pins-in-a-cylinder motif for the hero card. */
function SimArt() {
  return (
    <svg viewBox="0 0 120 120" className="pointer-events-none absolute -right-3 top-1/2 h-36 w-36 -translate-y-1/2 opacity-95" aria-hidden="true">
      <rect x="14" y="18" width="92" height="84" rx="16" fill="rgba(255,255,255,0.16)" />
      <rect x="14" y="64" width="92" height="38" rx="0" fill="rgba(255,255,255,0.12)" />
      <line x1="14" x2="106" y1="62" y2="62" stroke="#ffd66b" strokeWidth="2.5" strokeDasharray="5 4" />
      {[30, 50, 70, 90].map((x, i) => {
        const lift = [6, 0, 10, 3][i];
        return (
          <g key={x}>
            <path d={`M${x - 5} 24 l10 4 -10 4 10 4 -10 4`} fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="2" strokeLinecap="round" />
            <rect x={x - 6} y={44 - lift} width="12" height="18" rx="3" fill="#e9e9f2" />
            <path d={`M${x - 6} ${63 - lift}h12v14l-6 6-6-6z`} fill="#ffcf5a" />
          </g>
        );
      })}
    </svg>
  );
}
