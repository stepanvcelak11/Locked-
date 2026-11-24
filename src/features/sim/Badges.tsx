import { motion } from 'framer-motion';
import { BADGES } from '../../lib/badges';
import { useStore } from '../../store/AppStore';
import { Card, ProgressBar } from '../../components/ui';
import { formatDate } from '../../lib/format';

const TIER = {
  bronze: 'from-amber-700 to-amber-900 ring-amber-600/60',
  silver: 'from-slate-300 to-slate-500 ring-slate-300/60',
  gold: 'from-brass-300 to-brass-600 ring-brass-400/70',
};

export function Badges() {
  const { data } = useStore();
  const earned = BADGES.filter((b) => data.badges[b.id]).length;
  return (
    <div>
      <Card className="mb-4 p-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm text-slate-400">Odemčené odznaky</div>
            <div className="font-mono text-2xl font-bold">
              {earned}
              <span className="text-slate-500">/{BADGES.length}</span>
            </div>
          </div>
          <div className="text-4xl">🏅</div>
        </div>
        <div className="mt-2">
          <ProgressBar value={earned} max={BADGES.length} />
        </div>
      </Card>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {BADGES.map((b, i) => {
          const at = data.badges[b.id];
          const [a, t] = b.progress(data);
          return (
            <motion.div key={b.id} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.02 }}>
              <Card className={`h-full p-3 text-center ${at ? '' : 'opacity-60'}`}>
                <div className={`mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br text-2xl ring-2 ${at ? TIER[b.tier] : 'from-slate-800 to-slate-900 ring-edge grayscale'}`}>
                  <span className={at ? '' : 'opacity-40'}>{b.icon}</span>
                </div>
                <div className="mt-2 text-sm font-semibold text-slate-100">{b.title}</div>
                <div className="mt-0.5 text-[11px] leading-snug text-slate-400">{b.desc}</div>
                {at ? (
                  <div className="mt-2 text-[10px] text-brass-400">{formatDate(at, false)}</div>
                ) : (
                  t > 1 && (
                    <div className="mt-2">
                      <ProgressBar value={a} max={t} color="bg-steel-400" />
                      <div className="mt-1 font-mono text-[10px] text-slate-500">
                        {a}/{t}
                      </div>
                    </div>
                  )
                )}
              </Card>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
