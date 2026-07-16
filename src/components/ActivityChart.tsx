import React, { useMemo, useState } from 'react';
import { 
   BarChart, 
   Bar, 
   XAxis, 
   YAxis, 
   CartesianGrid, 
   Tooltip as RechartsTooltip, 
   ResponsiveContainer
} from 'recharts';
import { Repository, LANGUAGE_COLORS } from '../types';

interface ActivityChartProps {
  repos: Repository[];
}

const formatMonth = (ym: string) => {
  const parts = ym.split('-');
  if (parts.length < 2) return ym;
  const year = parts[0];
  const month = parts[1];
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const mName = monthNames[parseInt(month, 10) - 1] || '';
  return `${mName} '${year.slice(2)}`;
};

const CustomTooltip = ({ active, payload, label, hiddenLanguages }: any) => {
  if (active && payload && payload.length) {
    // Filter out hidden or zero-value languages for a clean display
    const visiblePayload = payload.filter((entry: any) => !hiddenLanguages?.[entry.name] && entry.value > 0);
    
    if (visiblePayload.length === 0) return null;

    return (
      <div className="bg-slate-950/95 border border-white/10 rounded-xl p-3 shadow-2xl backdrop-blur-md font-mono text-[11px] min-w-[180px]">
        <p className="text-primary font-black mb-2 uppercase tracking-widest border-b border-white/5 pb-1 text-center">
          {label}
        </p>
        <div className="space-y-1.5">
          {visiblePayload.map((entry: any) => (
            <div key={entry.name} className="flex items-center justify-between gap-4">
              <span className="flex items-center gap-1.5 text-slate-400">
                <span className="w-2.5 h-2.5 rounded-full shadow-[0_0_6px_rgba(255,255,255,0.2)]" style={{ backgroundColor: entry.stroke || entry.color }} />
                {entry.name}
              </span>
              <span className="font-bold text-slate-200">
                {entry.value.toFixed(1)}%
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
};

export const ActivityChart: React.FC<ActivityChartProps> = ({ repos }) => {
  const [hiddenLanguages, setHiddenLanguages] = useState<Record<string, boolean>>({});

  // Aggregate language usage distribution over time (by month/year of repository creation)
  const { chartData, topLanguages } = useMemo(() => {
    if (!repos || repos.length === 0) return { chartData: [], topLanguages: [] };

    // Sort repositories by Date ascending
    const sortedRepos = [...repos].sort(
      (a, b) => new Date(a.Date).getTime() - new Date(b.Date).getTime()
    );

    const timeSeriesData: Record<string, any> = {};
    const globalLangCounts: Record<string, number> = {};

    sortedRepos.forEach(repo => {
      const dateObj = new Date(repo.Date);
      const yearMonth = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}`;
      
      if (!timeSeriesData[yearMonth]) {
        timeSeriesData[yearMonth] = { name: yearMonth };
      }

      if (repo.Langs) {
        Object.entries(repo.Langs).forEach(([lang, percentage]) => {
          // Accumulate percentage/score per month
          if (!timeSeriesData[yearMonth][lang]) {
            timeSeriesData[yearMonth][lang] = 0;
          }
          timeSeriesData[yearMonth][lang] += percentage;

          if (!globalLangCounts[lang]) {
            globalLangCounts[lang] = 0;
          }
          globalLangCounts[lang] += percentage;
        });
      }
    });

    // Find the top 10 languages overall to display cleanly without too much noise
    const topLangs = Object.entries(globalLangCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(entry => entry[0]);

    // Convert to sorted array and ensure all top languages have a value
    const finalData = Object.keys(timeSeriesData)
      .sort((a, b) => a.localeCompare(b))
      .map(key => {
        const item = timeSeriesData[key];
        const formatted = formatMonth(key);
        topLangs.forEach(lang => {
          if (!item[lang]) item[lang] = 0;
        });
        return { ...item, formattedName: formatted };
      });

    return { chartData: finalData, topLanguages: topLangs };
  }, [repos]);

  const toggleLanguage = (lang: string) => {
    setHiddenLanguages(prev => ({
      ...prev,
      [lang]: !prev[lang]
    }));
  };

  if (chartData.length === 0) {
    return (
      <div className="w-full h-64 flex items-center justify-center bg-bg-card rounded-xl border border-border">
        <span className="text-text-muted font-mono text-sm flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-primary/50 animate-ping"></span>
          AWAITING TIME SERIES DATA...
        </span>
      </div>
    );
  }

  return (
    <div className="w-full bg-bg-card rounded-xl border border-border p-5 relative overflow-hidden group space-y-4">
      {/* Decorative corners */}
      <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-primary/50" />
      <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-primary/50" />
      <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-primary/50" />
      <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-primary/50" />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/5 pb-3">
        <h3 className="font-mono text-xs text-text-muted uppercase tracking-wider">
          <span className="text-primary mr-2">■</span>
          Language Usage Distribution Over Time
        </h3>
        <span className="text-[9px] font-mono text-slate-500 uppercase">
          Click legend icons to filter timeline_
        </span>
      </div>

      {/* Main Chart Stage */}
      <div className="w-full h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
            <XAxis 
              dataKey="formattedName" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: 'var(--color-text-muted)', fontSize: 9, fontFamily: 'var(--font-mono)' }} 
              dy={10}
              minTickGap={25}
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: 'var(--color-text-muted)', fontSize: 9, fontFamily: 'var(--font-mono)' }} 
            />
            <RechartsTooltip 
              content={<CustomTooltip hiddenLanguages={hiddenLanguages} />}
              cursor={{ fill: 'rgba(255,255,255,0.03)' }}
            />
            {topLanguages.map((lang) => (
              <Bar 
                key={lang}
                dataKey={lang} 
                stackId="a" 
                fill={LANGUAGE_COLORS[lang] || '#ff9900'} 
                hide={!!hiddenLanguages[lang]}
                animationDuration={400}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Cyberpunk Interactive Legend Grid */}
      <div className="flex flex-wrap gap-2 pt-2 border-t border-white/5 justify-center">
        {topLanguages.map((lang) => {
          const isHidden = !!hiddenLanguages[lang];
          return (
            <button
              key={lang}
              onClick={() => toggleLanguage(lang)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md font-mono text-[9px] uppercase tracking-wider border transition-all duration-200 cursor-pointer ${
                isHidden 
                  ? 'bg-transparent border-white/5 text-slate-600 line-through opacity-40' 
                  : 'bg-white/[0.02] border-white/10 hover:border-white/20 text-slate-300'
              }`}
            >
              <span 
                className="w-2 h-2 rounded-full shrink-0 transition-transform duration-200" 
                style={{ 
                  backgroundColor: LANGUAGE_COLORS[lang] || '#ff9900',
                  boxShadow: isHidden ? 'none' : `0 0 6px ${LANGUAGE_COLORS[lang] || '#ff9900'}`
                }} 
              />
              <span>{lang}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
