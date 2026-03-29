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
    <div className="flex flex-col gap-2 p-2 stagger-children">
      {trends.map(trend => {
        const isSelected = trend.id === selectedId;
        return (
          <button
            key={trend.id}
            onClick={() => onSelect(trend)}
            className={`
              animate-fade-in w-full text-left p-3 rounded-2xl transition-all duration-200
              ${isSelected
                ? 'bg-[var(--color-accent-blue)]/10 border border-[var(--color-accent-blue)]/30 shadow-[0_0_20px_rgba(10,132,255,0.12)]'
                : 'glass glass-hover'
              }
            `}
          >
            <div className="flex justify-between items-start mb-1.5">
              <span className={`
                text-[11px] font-medium px-2 py-0.5 rounded-full
                ${isSelected
                  ? 'bg-[var(--color-accent-blue)]/15 text-[var(--color-accent-blue)]'
                  : 'glass text-[var(--color-text-secondary)]'
                }
              `}>
                {trend.category}
              </span>
              <div className="flex items-center gap-1 text-emerald-400 text-xs font-semibold">
                <TrendingUp className="w-3 h-3" />
                {trend.growthRate}%
              </div>
            </div>

            <h3 className={`
              font-semibold text-sm mb-1.5
              ${isSelected ? 'text-[var(--color-text-primary)]' : 'text-[var(--color-text-primary)]'}
            `}>
              {trend.name}
            </h3>

            <div className="flex items-center gap-4 text-xs text-[var(--color-text-tertiary)]">
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
