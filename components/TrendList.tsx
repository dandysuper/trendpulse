import React from 'react';
import { TrendCluster } from '../types';
import { TrendingUp, Activity } from 'lucide-react';
import { useLanguage } from '../LanguageContext';

interface TrendListProps {
  trends: TrendCluster[];
  selectedId: string;
  onSelect: (trend: TrendCluster) => void;
}

export const TrendList: React.FC<TrendListProps> = ({ trends, selectedId, onSelect }) => {
  const { t } = useLanguage();

  return (
    <div className="flex flex-col gap-2 p-2">
      {trends.map(trend => {
        const isSelected = trend.id === selectedId;
        return (
          <button
            key={trend.id}
            onClick={() => onSelect(trend)}
            className={`
              w-full text-left p-3 rounded-xl transition-all duration-200 border
              ${isSelected
                ? 'bg-zinc-800/80 border-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.1)]'
                : 'bg-zinc-900/40 border-transparent hover:bg-zinc-800 hover:border-zinc-700'
              }
            `}
          >
            <div className="flex justify-between items-start mb-1">
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${isSelected ? 'bg-blue-500/20 text-blue-300' : 'bg-zinc-800 text-zinc-400'
                }`}>
                {trend.category}
              </span>
              <div className="flex items-center gap-1 text-emerald-400 text-xs font-bold">
                <TrendingUp className="w-3 h-3" />
                {trend.growthRate}%
              </div>
            </div>

            <h3 className={`font-semibold text-sm mb-1 ${isSelected ? 'text-white' : 'text-zinc-300'}`}>
              {trend.name}
            </h3>

            <div className="flex items-center gap-4 text-xs text-zinc-500">
              <span className="flex items-center gap-1">
                <Activity className="w-3 h-3" />
                {trend.engagementScore}/100
              </span>
              <span>{(trend.totalViews / 1000000).toFixed(1)}{t.dashboard.mViews}</span>
            </div>
          </button>
        );
      })}
    </div>
  );
};