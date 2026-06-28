import { useState } from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import { resourcesData } from '@/lib/mockData';
import { Search, Download, ExternalLink, FileText, Code2, Map, Video } from 'lucide-react';

const container = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } };
const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

const typeIcons: Record<string, { icon: typeof FileText; color: string }> = {
  pdf: { icon: FileText, color: '#EF4444' },
  code: { icon: Code2, color: '#0D9488' },
  cheatsheet: { icon: FileText, color: '#3B82F6' },
  roadmap: { icon: Map, color: '#A855F7' },
  link: { icon: ExternalLink, color: '#F76A21' },
  video: { icon: Video, color: '#0D9488' },
};

const filterTypes = ['all', 'pdf', 'code', 'cheatsheet', 'roadmap', 'video'];

export default function ResourcesPage() {
  const { t } = useLanguage();
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');

  const filterLabels: Record<string, string> = {
    all: t('all'), pdf: t('pdf'), code: t('codeFiles'),
    cheatsheet: t('cheatsheet'), roadmap: t('roadmap'), video: t('videoLinks'),
  };

  const filtered = resourcesData.filter(r => {
    const matchesType = activeFilter === 'all' || r.type === activeFilter;
    const matchesSearch = r.title.toLowerCase().includes(search.toLowerCase()) || r.course.toLowerCase().includes(search.toLowerCase());
    return matchesType && matchesSearch;
  });

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      <h1 className="font-display text-xl text-foreground">{t('myResources')}</h1>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder={t('searchResources')} className="glass-input w-full pl-9 pr-4 py-2.5 text-xs font-ui" />
      </div>

      <div className="flex gap-1.5 flex-wrap">
        {filterTypes.map(f => (
          <button key={f} onClick={() => setActiveFilter(f)} className={`px-3 py-1.5 rounded-full text-[10px] font-ui transition-colors ${activeFilter === f ? 'bg-primary text-primary-foreground' : 'glass-card text-muted-foreground hover:text-foreground'}`}>
            {filterLabels[f]}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {filtered.map((res) => {
          const typeInfo = typeIcons[res.type] || typeIcons.pdf;
          const Icon = typeInfo.icon;
          return (
            <motion.div key={res.id} variants={item} whileHover={{ y: -4 }} className="glass-card p-4 cursor-pointer group">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${typeInfo.color}15` }}>
                  <Icon className="w-5 h-5" style={{ color: typeInfo.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-xs font-ui font-medium text-foreground truncate">{res.title}</h4>
                  <p className="text-[10px] text-muted-foreground font-ui mt-0.5">{res.course}</p>
                  {res.size && <p className="text-[9px] text-muted-foreground font-mono mt-1">{res.size}</p>}
                </div>
              </div>
              <motion.button whileHover={{ scale: 1.05 }} className="glass-button w-full mt-3 py-1.5 text-[10px] flex items-center justify-center gap-1 opacity-70 group-hover:opacity-100 transition-opacity">
                {res.type === 'link' || res.type === 'video' ? <><ExternalLink className="w-3 h-3" /> {t('open')}</> : <><Download className="w-3 h-3" /> {t('download')}</>}
              </motion.button>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
