import { motion } from 'framer-motion';
import { useMemo } from 'react';
import { DRILLS, simDrillProgress, type DrillDef } from '../../data/drills';
import { useStore } from '../../store/AppStore';
import { hashString, mulberry32, shuffle, todayKey } from '../../lib/random';
import { Button, Card, ProgressBar, SectionTitle } from '../../components/ui';
import { drillStreak } from '../../lib/badges';
import { Icon } from '../../components/Icon';
import { effectiveTime } from '../../lib/stats';

export function dailyDrills(day = todayKey()): DrillDef[] {
  const rnd = mulberry32(hashString(day));
  const sim = shuffle(DRILLS.filter((d) => d.check.kind === 'sim'), rnd);
  const other = shuffle(DRILLS.filter((d) => d.check.kind !== 'sim'), rnd);
  return [sim[0], other[0], shuffle([sim[1], other[1]], rnd)[0]];
}

export function Drills() {
  const { data, navigate, completeDrill } = useStore();
  const key = todayKey();
  const drills = useMemo(() => dailyDrills(key), [key]);
  const done = data.drills[key] ?? [];
  const dayStart = new Date(new Date().toDateString()).getTime();
  const streak = drillStreak(data);
  const totalXp = Object.values(data.drills)
    .flat()
    .reduce((a, id) => a + (DRILLS.find((d) => d.id === id)?.xp ?? 0), 0);

  const progress = (d: DrillDef): [number, number] => {
    const c = d.check;
    if (done.includes(d.id)) return [1, 1];
    if (c.kind === 'sim') return [Math.min(c.count, simDrillProgress(data, d, dayStart)), c.count];
    if (c.kind === 'timer') {
      const n = data.solves.filter(
        (s) => s.date >= dayStart && s.penalty !== 'DNF' && (!c.technique || s.technique === c.technique) && (!c.maxTime || effectiveTime(s) <= c.maxTime),
      ).length;
      return [Math.min(c.count, n), c.count];
    }
    if (c.kind === 'quiz') {
      const ok = data.challenges.some((r) => (r.kind === 'quiz-keyway' || r.kind === 'quiz-xray') && r.date >= dayStart && (r.correct ?? 0) >= c.minCorrect);
      return [ok ? 1 : 0, 1];
    }
    return [0, 1];
  };

  const launch = (d: DrillDef) => {
    const c = d.check;
    if (c.kind === 'sim') navigate('arcade', { arcade: 'simulator', sim: { pins: c.pins, spools: c.spools, serrated: c.serrated, blind: c.blind, drillId: d.id, tool: c.tool } });
    else if (c.kind === 'timer') navigate('timer');
    else if (c.kind === 'quiz') navigate('arcade', { arcade: 'quiz' });
    else if (d.id === 'map-binding') navigate('gear', { gear: 'locks' });
  };

  return (
    <div>
      <div className="grid grid-cols-3 gap-2">
        <div className="card p-3 text-center">
          <div className="text-2xl">🔥</div>
          <div className="font-mono text-lg font-bold">{streak}</div>
          <div className="text-xs text-slate-500">dní v řadě</div>
        </div>
        <div className="card p-3 text-center">
          <div className="text-2xl">✅</div>
          <div className="font-mono text-lg font-bold">{drills.filter((d) => progress(d)[0] >= progress(d)[1]).length}/3</div>
          <div className="text-xs text-slate-500">dnes</div>
        </div>
        <div className="card p-3 text-center">
          <div className="text-2xl">⭐</div>
          <div className="font-mono text-lg font-bold">{totalXp}</div>
          <div className="text-xs text-slate-500">XP celkem</div>
        </div>
      </div>

      <SectionTitle sub="Každý den nová trojice cvičení zaměřených na techniku">Dnešní drily</SectionTitle>
      <div className="space-y-3">
        {drills.map((d, i) => {
          const [a, t] = progress(d);
          const complete = a >= t;
          const auto = d.check.kind !== 'manual';
          if (complete && auto && !done.includes(d.id)) queueMicrotask(() => completeDrill(d.id));
          return (
            <motion.div key={d.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
              <Card className={`p-4 ${complete ? 'border-ok/50' : ''}`}>
                <div className="flex gap-3">
                  <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-2xl ${complete ? 'bg-ok/15' : 'bg-black/25'}`}>{complete ? '✅' : d.icon}</div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="font-semibold text-slate-100">{d.title}</div>
                        <div className="text-xs text-azure-400">{d.focus}</div>
                      </div>
                      <span className="rounded-full bg-brass-500/15 px-2 py-0.5 text-xs font-semibold text-brass-300">+{d.xp} XP</span>
                    </div>
                    <p className="mt-1.5 text-sm text-slate-300">{d.description}</p>
                    {t > 1 && (
                      <div className="mt-2 flex items-center gap-2">
                        <ProgressBar value={a} max={t} color={complete ? 'bg-ok' : 'bg-brass-500'} />
                        <span className="font-mono text-xs text-slate-400">
                          {a}/{t}
                        </span>
                      </div>
                    )}
                    <div className="mt-3 flex gap-2">
                      {!complete && d.check.kind !== 'manual' && (
                        <Button size="sm" variant="brass" icon="play" onClick={() => launch(d)}>
                          {d.check.kind === 'sim' ? 'Spustit v simulátoru' : d.check.kind === 'quiz' ? 'Do poznávačky' : 'Do stopek'}
                        </Button>
                      )}
                      {d.check.kind === 'manual' && (
                        <>
                          <Button size="sm" variant={complete ? 'ghost' : 'ok'} icon={complete ? 'x' : 'check'} onClick={() => completeDrill(d.id, !complete)}>
                            {complete ? 'Vrátit' : 'Splněno'}
                          </Button>
                          {d.id === 'map-binding' && !complete && (
                            <Button size="sm" variant="outline" onClick={() => launch(d)}>
                              Otevřít sbírku
                            </Button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          );
        })}
      </div>

      <SectionTitle>Všechna cvičení</SectionTitle>
      <Card className="divide-y divide-white/[0.06]">
        {DRILLS.map((d) => (
          <button key={d.id} className="flex w-full items-center gap-3 px-4 py-3 text-left" onClick={() => launch(d)}>
            <span className="text-xl">{d.icon}</span>
            <span className="flex-1">
              <span className="block text-sm text-slate-100">{d.title}</span>
              <span className="block text-xs text-slate-500">{d.focus}</span>
            </span>
            {d.check.kind !== 'manual' && <Icon name="chevronRight" size={16} className="text-slate-500" />}
          </button>
        ))}
      </Card>
    </div>
  );
}
