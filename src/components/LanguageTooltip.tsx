import React from 'react';
import { LANGUAGE_COLORS } from '../types';

interface LanguageTooltipProps {
  languages: Record<string, number>;
  position: { x: number; y: number };
  visible: boolean;
}

export default function LanguageTooltip({ languages, position, visible }: LanguageTooltipProps) {
  if (!visible) return null;

  const sortedLangs = Object.entries(languages).sort((a, b) => b[1] - a[1]);

  // Generate SVG Pie slices
  let accumulatedPercent = 0;
  const slices = sortedLangs.map(([lang, percent], index) => {
    const color = LANGUAGE_COLORS[lang] || '#8b5cf6';
    const startPercent = accumulatedPercent;
    accumulatedPercent += percent;
    const endPercent = accumulatedPercent;

    // Convert percentage to coordinates on a circle of radius 40
    // Center at (50, 50)
    const getCoordinatesForPercent = (percentValue: number) => {
      const x = 50 + 40 * Math.cos(2 * Math.PI * (percentValue - 0.25));
      const y = 50 + 40 * Math.sin(2 * Math.PI * (percentValue - 0.25));
      return [x, y];
    };

    const [startX, startY] = getCoordinatesForPercent(startPercent / 100);
    const [endX, endY] = getCoordinatesForPercent(endPercent / 100);

    const largeArcFlag = percent > 50 ? 1 : 0;

    // Path for pie slice
    const pathData = percent === 100 
      ? `M 50 10 A 40 40 0 1 1 49.99 10 Z` 
      : `M 50 50 L ${startX} ${startY} A 40 40 0 ${largeArcFlag} 1 ${endX} ${endY} Z`;

    return {
      lang,
      percent,
      color,
      pathData
    };
  });

  return (
    <div
      style={{
        left: `${position.x + 20}px`,
        top: `${position.y - 60}px`,
      }}
      className="fixed z-50 p-4 bg-slate-950/95 border border-primary/30 rounded-xl shadow-[0_12px_40px_-8px_rgba(0,0,0,0.8)] backdrop-blur-md flex items-center gap-4 pointer-events-none transition-all duration-150 animate-in fade-in scale-in-95"
    >
      {/* SVG Doughnut/Pie Chart */}
      <div className="relative w-20 h-20 flex-shrink-0">
        <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
          {slices.map((slice, idx) => (
            <path
              key={idx}
              d={slice.pathData}
              fill={slice.color}
              stroke="#0b0f19"
              strokeWidth="2"
            />
          ))}
          {/* Inner circle for doughnut look */}
          <circle cx="50" cy="50" r="18" fill="#020617" />
        </svg>
      </div>

      {/* Legend list */}
      <div className="flex flex-col gap-1.5 font-mono text-[11px]">
        <div className="text-slate-400 font-bold mb-0.5 border-b border-slate-800 pb-0.5 uppercase tracking-wider text-[10px]">
          Language Share
        </div>
        {sortedLangs.slice(0, 4).map(([lang, percent]) => {
          const color = LANGUAGE_COLORS[lang] || '#8b5cf6';
          return (
            <div key={lang} className="flex items-center gap-2 text-slate-300">
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
              <span className="font-medium text-slate-200">{lang}</span>
              <span className="text-slate-500">{percent}%</span>
            </div>
          );
        })}
        {sortedLangs.length > 4 && (
          <div className="text-[10px] text-slate-500 italic pl-4">
            + {sortedLangs.length - 4} other{sortedLangs.length - 4 > 1 ? 's' : ''}
          </div>
        )}
      </div>
    </div>
  );
}
