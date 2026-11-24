import { motion } from 'framer-motion';
import { BADGES } from '../../lib/badges';
import { useStore } from '../../store/AppStore';
import { Card, IconTile, ProgressBar } from '../../components/ui';
import { Icon } from '../../components/Icon';
import { formatDate } from '../../lib/format';

const TIER = {
  bronze: 'linear-gradient(145deg,#d7a47a,#a0663f)',
  silver: 'linear-gradient(145deg,#e4e4ea,#9a9aa3)',
  gold: 'linear-gradient(145deg,#ffd86b,#f0a100)',
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
          <IconTile icon="medal" color="#FF9500" size={48} />
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
                <div
                  className={`mx-auto flex h-14 w-14 items-center justify-center rounded-full ${at ? 'text-white shadow-[inset_0_-3px_0_rgba(0,0,0,0.12)]' : 'bg-fill text-slate-500'}`}
                  style={at ? { background: TIER[b.tier] } : undefined}
                >
                  <Icon name={b.icon} size={26} strokeWidth={2.2} />
                </div>
                <div className="mt-2 text-sm font-semibold text-slate-100">{b.title}</div>
                <div className="mt-0.5 text-[11px] leading-snug text-slate-400">{b.desc}</div>
                {at ? (
                  <div className="mt-2 text-[11px] text-slate-400">{formatDate(at, false)}</div>
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
