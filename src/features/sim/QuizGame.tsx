import { AnimatePresence, motion } from 'framer-motion';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { KEYWAY_QUESTIONS, XRAY_QUESTIONS } from '../../data/quiz';
import { KeywayArt, SilhouetteArt, XrayArt } from '../../components/svg/Art';
import { shuffle } from '../../lib/random';
import { Button, Card, Segmented, SectionTitle } from '../../components/ui';
import { useStore } from '../../store/AppStore';
import { sound } from '../../lib/audio';
import { vibrate } from '../../lib/haptics';
import { formatDate } from '../../lib/format';

type Mode = 'keyway' | 'xray';
const ROUND = 10;
const LIMIT = 10;

interface Q {
  id: string;
  visual: React.ReactNode;
  prompt: string;
  options: string[];
  answer: string;
  explain: string;
}

function buildRound(mode: Mode): Q[] {
  if (mode === 'keyway') {
    const all = [...new Set(KEYWAY_QUESTIONS.map((q) => `${q.type} · ${q.tool}`))];
    return shuffle(KEYWAY_QUESTIONS)
      .slice(0, ROUND)
      .map((q) => {
        const answer = `${q.type} · ${q.tool}`;
        // tricky distractor: same type, wrong tool
        const otherTools = shuffle([...new Set(KEYWAY_QUESTIONS.map((o) => o.tool))].filter((t) => t !== q.tool));
        const tricky = `${q.type} · ${otherTools[0]}`;
        const rest = shuffle(all.filter((a) => a !== answer && !a.startsWith(q.type))).slice(0, 2);
        return {
          id: q.id,
          visual:
            q.visual.kind === 'keyway' ? <KeywayArt shape={q.visual.shape} className="h-full" /> : <SilhouetteArt shape={q.visual.shape} className="h-full" />,
          prompt: q.prompt,
          options: shuffle([answer, tricky, ...rest]),
          answer,
          explain: q.explain,
        };
      });
  }
  const pairs = XRAY_QUESTIONS.map((q) => `${q.mechanism} — ${q.weakness}`);
  const round = shuffle(XRAY_QUESTIONS);
  while (round.length < ROUND) round.push(...shuffle(XRAY_QUESTIONS).slice(0, ROUND - round.length));
  return round.slice(0, ROUND).map((q, i) => {
    const answer = `${q.mechanism} — ${q.weakness}`;
    const wrongWeak = shuffle(XRAY_QUESTIONS.filter((o) => o.id !== q.id))[0].weakness;
    const wrongMech = shuffle(XRAY_QUESTIONS.filter((o) => o.id !== q.id))[0].mechanism;
    const opts = new Set([answer, `${q.mechanism} — ${wrongWeak}`, `${wrongMech} — ${q.weakness}`]);
    for (const p of shuffle(pairs)) {
      if (opts.size >= 4) break;
      opts.add(p);
    }
    return {
      id: `${q.id}-${i}`,
      visual: <XrayArt shape={q.shape} className="h-full w-full" />,
      prompt: 'Jaký mechanismus vidíš a jaká je jeho hlavní slabina?',
      options: shuffle([...opts]),
      answer,
      explain: q.explain,
    };
  });
}

export function QuizGame() {
  const { data, addChallenge } = useStore();
  const [mode, setMode] = useState<Mode>('keyway');
  const [round, setRound] = useState<Q[] | null>(null);
  const [idx, setIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(LIMIT);
  const [gain, setGain] = useState<number | null>(null);
  const [finished, setFinished] = useState(false);
  const qStart = useRef(0);
  const saved = useRef(false);

  const kind = mode === 'keyway' ? 'quiz-keyway' : 'quiz-xray';
  const history = useMemo(() => data.challenges.filter((c) => c.kind === kind).sort((a, b) => (b.score ?? 0) - (a.score ?? 0)), [data.challenges, kind]);

  const start = () => {
    sound.unlock();
    setRound(buildRound(mode));
    setIdx(0);
    setScore(0);
    setStreak(0);
    setBestStreak(0);
    setCorrect(0);
    setPicked(null);
    setFinished(false);
    setGain(null);
    saved.current = false;
    qStart.current = performance.now();
    setTimeLeft(LIMIT);
  };

  const q = round?.[idx];

  const answer = useCallback(
    (opt: string | null) => {
      if (!q || picked !== null) return;
      const elapsed = (performance.now() - qStart.current) / 1000;
      const ok = opt === q.answer;
      setPicked(opt ?? '__timeout__');
      if (ok) {
        const mult = 1 + Math.min(streak, 8) * 0.25;
        const pts = Math.round((100 + Math.max(0, LIMIT - elapsed) * 15) * mult);
        setScore((s) => s + pts);
        setGain(pts);
        setStreak((s) => {
          const n = s + 1;
          setBestStreak((b) => Math.max(b, n));
          return n;
        });
        setCorrect((c) => c + 1);
        sound.correct();
        vibrate(10);
      } else {
        setStreak(0);
        setGain(0);
        sound.wrong();
        vibrate([20, 40, 20]);
      }
    },
    [q, picked, streak],
  );

  // countdown
  useEffect(() => {
    if (!round || finished || picked !== null) return;
    const t = window.setInterval(() => {
      const left = LIMIT - (performance.now() - qStart.current) / 1000;
      setTimeLeft(Math.max(0, left));
      if (left <= 0) answer(null);
    }, 50);
    return () => window.clearInterval(t);
  }, [round, idx, finished, picked, answer]);

  const next = () => {
    if (!round) return;
    if (idx + 1 >= round.length) {
      setFinished(true);
      return;
    }
    setIdx((i) => i + 1);
    setPicked(null);
    setGain(null);
    setTimeLeft(LIMIT);
    qStart.current = performance.now();
  };

  useEffect(() => {
    if (finished && !saved.current && round) {
      saved.current = true;
      addChallenge({ kind, score, correct, total: round.length, bestStreak });
    }
  }, [finished, round, addChallenge, kind, score, correct, bestStreak]);

  if (!round) {
    return (
      <div>
        <Segmented
          value={mode}
          onChange={setMode}
          options={[
            { id: 'keyway', label: 'Klíčová dírka & tvar' },
            { id: 'xray', label: 'Rentgen mechanismu' },
          ]}
        />
        <Card className="mt-4 overflow-hidden">
          <div className="flex h-44 items-center justify-center gap-4 bg-gradient-to-b from-ink-950 to-panel p-4">
            {mode === 'keyway' ? (
              <>
                <KeywayArt shape="kw-paracentric" className="h-32" />
                <KeywayArt shape="kw-disc" className="h-32" />
                <SilhouetteArt shape="sil-padlock" className="h-32" />
              </>
            ) : (
              <XrayArt shape="xr-spool" className="h-36 w-56" />
            )}
          </div>
          <div className="p-4">
            <h3 className="text-lg font-semibold">{mode === 'keyway' ? 'Keyway Match' : 'Mechanism X-Ray'}</h3>
            <p className="mt-1 text-sm text-slate-400">
              {mode === 'keyway'
                ? 'Poznej zámek podle profilu klíčové dírky nebo siluety a vyber správný typ i doporučený nástroj.'
                : 'Sleduj animovaný řez a urči mechanismus i jeho hlavní slabinu.'}
            </p>
            <ul className="mt-3 space-y-1 text-xs text-slate-400">
              <li>⏱️ {LIMIT} s na otázku · {ROUND} otázek</li>
              <li>⚡ Body = 100 + bonus za rychlost</li>
              <li>🔥 Série správných odpovědí = násobič až ×3</li>
            </ul>
            <Button variant="brass" size="lg" className="mt-4 w-full" onClick={start} icon="play">
              Spustit kvíz
            </Button>
          </div>
        </Card>
        {history.length > 0 && (
          <>
            <SectionTitle>Osobní žebříček</SectionTitle>
            <Card className="divide-y divide-edge/60">
              {history.slice(0, 5).map((h, i) => (
                <div key={h.id} className="flex items-center gap-3 px-4 py-2.5 text-sm">
                  <span className={`w-6 font-mono font-bold ${i === 0 ? 'text-brass-400' : 'text-slate-500'}`}>#{i + 1}</span>
                  <span className="flex-1 font-mono text-slate-100">{h.score} b</span>
                  <span className="text-xs text-slate-400">
                    {h.correct}/{h.total} · série {h.bestStreak}
                  </span>
                  <span className="text-xs text-slate-500">{formatDate(h.date, false)}</span>
                </div>
              ))}
            </Card>
          </>
        )}
      </div>
    );
  }

  if (finished) {
    const best = history[0]?.score ?? 0;
    const pct = correct / round.length;
    return (
      <Card className="p-6 text-center">
        <motion.div initial={{ scale: 0.5, rotate: -10 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring', stiffness: 260, damping: 12 }} className="text-6xl">
          {pct === 1 ? '🏆' : pct >= 0.8 ? '🥇' : pct >= 0.5 ? '🥈' : '📚'}
        </motion.div>
        <div className="mt-3 font-mono text-4xl font-bold brass-text">{score}</div>
        <div className="text-sm text-slate-400">bodů</div>
        {score >= best && <div className="mt-2 text-sm font-semibold text-emerald-300">Nový osobní rekord!</div>}
        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-ink-950 p-3">
            <div className="font-mono text-xl">
              {correct}/{round.length}
            </div>
            <div className="text-xs text-slate-500">správně</div>
          </div>
          <div className="rounded-xl bg-ink-950 p-3">
            <div className="font-mono text-xl">{bestStreak}</div>
            <div className="text-xs text-slate-500">nejdelší série</div>
          </div>
        </div>
        <div className="mt-5 flex gap-2">
          <Button className="flex-1" variant="brass" onClick={start} icon="refresh">
            Znovu
          </Button>
          <Button className="flex-1" onClick={() => setRound(null)}>
            Zpět
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <div>
      <div className="mb-3 flex items-center justify-between text-sm">
        <span className="text-slate-400">
          Otázka <b className="text-slate-100">{idx + 1}</b>/{round.length}
        </span>
        <span className="flex items-center gap-3">
          {streak > 1 && (
            <motion.span key={streak} initial={{ scale: 1.5 }} animate={{ scale: 1 }} className="rounded-full bg-orange-500/20 px-2 py-0.5 text-xs font-semibold text-orange-300">
              🔥 ×{(1 + Math.min(streak, 8) * 0.25).toFixed(2)}
            </motion.span>
          )}
          <span className="font-mono font-semibold text-brass-300">{score} b</span>
        </span>
      </div>
      <div className="mb-3 h-1.5 overflow-hidden rounded-full bg-ink-950">
        <div
          className="h-full rounded-full transition-[width] duration-75"
          style={{ width: `${(timeLeft / LIMIT) * 100}%`, background: timeLeft < 3 ? '#ef4444' : timeLeft < 6 ? '#f59e0b' : '#10b981' }}
        />
      </div>
      <AnimatePresence mode="wait">
        <motion.div key={q!.id} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.2 }}>
          <Card className="overflow-hidden">
            <div className="relative flex h-52 items-center justify-center bg-gradient-to-b from-ink-950 to-panel p-4">
              {q!.visual}
              <AnimatePresence>
                {gain !== null && gain > 0 && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: -10 }} exit={{ opacity: 0 }} className="absolute right-4 top-4 font-mono text-lg font-bold text-emerald-300">
                    +{gain}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <div className="p-4">
              <div className="mb-3 text-sm font-medium text-slate-200">{q!.prompt}</div>
              <div className="grid gap-2">
                {q!.options.map((o) => {
                  const isAnswer = o === q!.answer;
                  const isPicked = o === picked;
                  const state = picked === null ? 'idle' : isAnswer ? 'right' : isPicked ? 'wrong' : 'dim';
                  return (
                    <button
                      key={o}
                      disabled={picked !== null}
                      onClick={() => answer(o)}
                      className={`rounded-xl border px-3.5 py-3 text-left text-sm transition ${
                        state === 'right'
                          ? 'border-ok bg-ok/15 text-emerald-200'
                          : state === 'wrong'
                            ? 'border-bad bg-bad/15 text-red-200'
                            : state === 'dim'
                              ? 'border-edge/50 text-slate-500'
                              : 'border-edge bg-ink-950/60 text-slate-200 hover:border-brass-500 active:scale-[0.99]'
                      }`}
                    >
                      {o}
                    </button>
                  );
                })}
              </div>
              {picked !== null && (
                <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="mt-3">
                  <p className="rounded-xl bg-ink-950 p-3 text-xs leading-relaxed text-slate-300">
                    {picked === '__timeout__' && <b className="text-red-300">Čas vypršel. </b>}
                    {q!.explain}
                  </p>
                  <Button variant="brass" className="mt-3 w-full" onClick={next}>
                    {idx + 1 >= round.length ? 'Výsledky' : 'Další otázka'}
                  </Button>
                </motion.div>
              )}
            </div>
          </Card>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
