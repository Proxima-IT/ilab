import { useState } from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import { leaderboardData } from '@/lib/mockData';
import { ArrowUp, ArrowDown, Flame, Medal } from 'lucide-react';

const container = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } };
const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

const podiumColors = ['#0D9488', '#F76A21', '#064E3B'];

export default function LeaderboardPage() {
  const { t } = useLanguage();
  const [filter, setFilter] = useState('all');
  const top3 = leaderboardData.slice(0, 3);
  const podiumOrder = [1, 0, 2];

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="font-display text-xl text-foreground">{t('leaderboardTitle')}</h1>
        <div className="flex gap-1">
          {['week', 'month', 'all'].map(f => (
            <button key={f} onClick={() => setFilter(f)} className={`px-3 py-1 rounded-full text-[10px] font-ui transition-colors ${filter === f ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
              {f === 'week' ? t('thisWeek') : f === 'month' ? t('thisMonth') : t('allTime')}
            </button>
          ))}
        </div>
      </div>

      <motion.div variants={item} className="flex items-end justify-center gap-3 py-6">
        {podiumOrder.map((idx) => {
          const person = top3[idx];
          const heights = [160, 200, 130];
          return (
            <motion.div key={idx} className="flex flex-col items-center" initial={{ scaleY: 0 }} animate={{ scaleY: 1 }} transition={{ delay: idx * 0.2, type: 'spring' }} style={{ transformOrigin: 'bottom' }}>
              <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center text-lg font-display mb-2" style={{ borderColor: podiumColors[idx], borderWidth: 2 }}>
                {person.name.charAt(0)}
              </div>
              <p className="text-[11px] font-ui text-foreground text-center mb-1">{person.name}</p>
              <p className="text-[10px] font-mono text-primary mb-2">{person.xp.toLocaleString()} XP</p>
              <div className="rounded-t-lg flex items-end justify-center pb-2" style={{ width: 80, height: heights[idx === 1 ? 1 : idx === 0 ? 0 : 2], background: `linear-gradient(to top, ${podiumColors[idx]}22, ${podiumColors[idx]}08)`, border: `1px solid ${podiumColors[idx]}33` }}>
                <Medal className="w-6 h-6" style={{ color: podiumColors[idx] }} />
              </div>
            </motion.div>
          );
        })}
      </motion.div>

      <motion.div variants={item} className="glass-card p-4 overflow-x-auto">
        <table className="w-full text-xs font-ui">
          <thead>
            <tr className="text-muted-foreground border-b border-border/30">
              <th className="text-left py-2 w-10">{t('rank')}</th>
              <th className="text-left py-2">{t('name')}</th>
              <th className="text-left py-2">{t('xp')}</th>
              <th className="text-left py-2">{t('courses')}</th>
              <th className="text-left py-2">{t('streak')}</th>
              <th className="text-left py-2 w-10"></th>
            </tr>
          </thead>
          <tbody>
            {leaderboardData.map((entry) => (
              <motion.tr key={entry.rank} whileHover={{ x: 2 }} className={`border-b border-border/10 transition-colors ${entry.isStudent ? 'bg-primary/5 glass-card-active' : 'hover:bg-secondary/20'}`}>
                <td className="py-3 font-mono text-muted-foreground">{entry.rank}</td>
                <td className="py-3 flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center text-[9px] font-display">{entry.name.charAt(0)}</div>
                  <span className={`${entry.isStudent ? 'text-primary font-medium' : 'text-foreground'}`}>
                    {entry.name} {entry.isStudent && <span className="text-[9px] text-primary font-mono ml-1">← YOU</span>}
                  </span>
                </td>
                <td className="py-3 font-mono text-primary">{entry.xp.toLocaleString()}</td>
                <td className="py-3 text-muted-foreground">{entry.courses}</td>
                <td className="py-3 text-accent font-mono flex items-center gap-1"><Flame className="w-3 h-3" /> {entry.streak}</td>
                <td className="py-3">
                  {entry.change > 0 && <span className="flex items-center text-primary text-[9px] font-mono"><ArrowUp className="w-3 h-3" />{entry.change}</span>}
                  {entry.change < 0 && <span className="flex items-center text-destructive text-[9px] font-mono"><ArrowDown className="w-3 h-3" />{Math.abs(entry.change)}</span>}
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </motion.div>
    </motion.div>
  );
}
