import React, { useMemo } from 'react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  ResponsiveContainer,
  Legend
} from 'recharts';
import { Repository, LANGUAGE_COLORS } from '../types';

interface ActivityChartProps {
  repos: Repository[];
}

export const ActivityChart: React.FC<ActivityChartProps> = ({ repos }) => {
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

    // Find the top 5 languages overall to display cleanly without too much noise
    const topLangs = Object.entries(globalLangCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(entry => entry[0]);

    // Convert to sorted array and ensure all top languages have a value
    const finalData = Object.keys(timeSeriesData)
      .sort((a, b) => a.localeCompare(b))
      .map(key => {
        const item = timeSeriesData[key];
        topLangs.forEach(lang => {
          if (!item[lang]) item[lang] = 0;
        });
        return item;
      });

    return { chartData: finalData, topLanguages: topLangs };
  }, [repos]);

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
    <div className="w-full h-80 bg-bg-card rounded-xl border border-border p-4 relative overflow-hidden group">
      {/* Decorative corners */}
      <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-primary/50" />
      <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-primary/50" />
      <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-primary/50" />
      <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-primary/50" />

      <div className="flex items-center justify-between mb-2">
        <h3 className="font-mono text-xs text-text-muted uppercase tracking-wider">
          <span className="text-primary mr-2">■</span>
          Language Usage Distribution Over Time
        </h3>
      </div>

      <div className="w-full h-[calc(100%-2.5rem)]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              {topLanguages.map((lang, idx) => (
                <linearGradient key={`color-${idx}`} id={`color-${idx}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={LANGUAGE_COLORS[lang] || '#ff9900'} stopOpacity={0.8} />
                  <stop offset="95%" stopColor={LANGUAGE_COLORS[lang] || '#ff9900'} stopOpacity={0} />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
            <XAxis 
              dataKey="name" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: 'var(--color-text-muted)', fontSize: 10, fontFamily: 'var(--font-mono)' }} 
              dy={10}
              minTickGap={20}
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: 'var(--color-text-muted)', fontSize: 10, fontFamily: 'var(--font-mono)' }} 
            />
            <RechartsTooltip 
              contentStyle={{ 
                backgroundColor: 'var(--color-bg-main)', 
                border: '1px solid var(--color-border)',
                borderRadius: '0.5rem',
                color: 'var(--color-text-main)',
                fontFamily: 'var(--font-mono)',
                fontSize: '11px',
                backdropFilter: 'blur(12px)'
              }}
              itemStyle={{ color: 'var(--color-text-main)' }}
              cursor={{ stroke: 'var(--color-primary-alpha-strong)', strokeWidth: 2, strokeDasharray: '3 3' }}
            />
            <Legend 
              wrapperStyle={{ fontSize: '10px', fontFamily: 'var(--font-mono)', paddingTop: '10px' }}
              iconType="circle"
            />
            {topLanguages.map((lang, idx) => (
              <Area 
                key={lang}
                type="monotone" 
                dataKey={lang} 
                stackId="1" 
                stroke={LANGUAGE_COLORS[lang] || '#ff9900'} 
                fill={`url(#color-${idx})`} 
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
