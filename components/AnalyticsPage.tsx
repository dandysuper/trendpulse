import React, { useState, useEffect } from 'react';
import { TrendCluster } from '../types';
import { BarChart3, TrendingUp, Eye, Users, Video, Activity, ArrowUp, ArrowDown } from 'lucide-react';
import { useLanguage } from '../LanguageContext';

interface AnalyticsPageProps {
  trends: TrendCluster[];
}

export const AnalyticsPage: React.FC<AnalyticsPageProps> = ({ trends }) => {
  const { t } = useLanguage();
  const [stats, setStats] = useState({
    totalVideos: 0,
    totalViews: 0,
    avgGrowthRate: 0,
    avgEngagement: 0,
    topCategory: '',
    trendingUp: 0,
    trendingDown: 0
  });

  useEffect(() => {
    if (trends.length === 0) return;

    const totalVideos = trends.reduce((sum, t) => sum + t.videos.length, 0);
    const totalViews = trends.reduce((sum, t) => sum + t.totalViews, 0);
    const avgGrowthRate = trends.reduce((sum, t) => sum + t.growthRate, 0) / trends.length;
    const avgEngagement = trends.reduce((sum, t) => sum + t.engagementScore, 0) / trends.length;

    const categoryCount: Record<string, number> = {};
    trends.forEach(t => {
      categoryCount[t.category] = (categoryCount[t.category] || 0) + 1;
    });
    const topCategory = Object.entries(categoryCount).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';

    const trendingUp = trends.filter(t => t.growthRate > 50).length;
    const trendingDown = trends.filter(t => t.growthRate < 20).length;

    setStats({
      totalVideos,
      totalViews,
      avgGrowthRate,
      avgEngagement,
      topCategory,
      trendingUp,
      trendingDown
    });
  }, [trends]);

  const formatNumber = (num: number) => {
    if (num >= 1000000000) return `${(num / 1000000000).toFixed(1)}B`;
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const statCards = [
    {
      icon: <Video className="w-5 h-5" />,
      iconColor: 'var(--color-accent-blue)',
      iconBg: 'rgba(10, 132, 255, 0.12)',
      label: t.analyticsPage.total,
      value: stats.totalVideos.toString(),
      sub: t.analyticsPage.videosTracked,
    },
    {
      icon: <Eye className="w-5 h-5" />,
      iconColor: 'var(--color-accent-purple)',
      iconBg: 'rgba(191, 90, 242, 0.12)',
      label: t.analyticsPage.viewsLabel,
      value: formatNumber(stats.totalViews),
      sub: t.analyticsPage.totalViews,
    },
    {
      icon: <TrendingUp className="w-5 h-5" />,
      iconColor: 'var(--color-accent-green)',
      iconBg: 'rgba(48, 209, 88, 0.12)',
      label: t.analyticsPage.growthLabel,
      value: `${stats.avgGrowthRate.toFixed(0)}%`,
      sub: t.analyticsPage.avgGrowthRate,
    },
    {
      icon: <Users className="w-5 h-5" />,
      iconColor: 'var(--color-accent-orange)',
      iconBg: 'rgba(255, 159, 10, 0.12)',
      label: t.analyticsPage.engagementLabel,
      value: stats.avgEngagement.toFixed(0),
      sub: t.analyticsPage.avgScore,
    },
  ];

  return (
    <div className="p-4 sm:p-6 overflow-y-auto" style={{ color: 'var(--color-text-primary)' }}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 sm:mb-8 animate-fade-in">
          <h1 className="text-2xl sm:text-3xl font-serif mb-2 flex items-center gap-3">
            <BarChart3 className="w-6 h-6 sm:w-8 sm:h-8" style={{ color: 'var(--color-accent-blue)' }} />
            {t.analyticsPage.title}
          </h1>
          <p className="text-sm sm:text-base" style={{ color: 'var(--color-text-tertiary)' }}>
            {t.analyticsPage.overview}
          </p>
        </div>

        {trends.length === 0 ? (
          <div className="flex items-center justify-center py-16 sm:py-20 animate-fade-in">
            <div className="glass-prominent rounded-3xl p-10 sm:p-14 text-center max-w-sm">
              <Activity
                className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4"
                style={{ color: 'var(--color-text-tertiary)', opacity: 0.4 }}
              />
              <h3 className="text-lg sm:text-xl font-semibold mb-2" style={{ color: 'var(--color-text-secondary)' }}>
                {t.analyticsPage.noData}
              </h3>
              <p className="text-sm" style={{ color: 'var(--color-text-tertiary)' }}>
                {t.analyticsPage.noDataDescription}
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6 sm:mb-8 stagger-children">
              {statCards.map((card, i) => (
                <div key={i} className="glass-prominent rounded-2xl p-4 sm:p-5 animate-fade-in">
                  <div className="flex items-center justify-between mb-3">
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center"
                      style={{ background: card.iconBg, color: card.iconColor }}
                    >
                      {card.icon}
                    </div>
                    <span className="text-[10px] sm:text-xs font-medium" style={{ color: 'var(--color-text-tertiary)' }}>
                      {card.label}
                    </span>
                  </div>
                  <div className="text-2xl sm:text-3xl font-bold mb-0.5">{card.value}</div>
                  <div className="text-xs sm:text-sm" style={{ color: 'var(--color-text-tertiary)' }}>
                    {card.sub}
                  </div>
                </div>
              ))}
            </div>

            {/* Top Trends: Two columns */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8 stagger-children">
              {/* Top Growing Trends */}
              <div className="glass-prominent rounded-2xl p-4 sm:p-6 animate-fade-in">
                <h3 className="text-base sm:text-lg font-bold mb-3 sm:mb-4 flex items-center gap-2">
                  <ArrowUp className="w-5 h-5" style={{ color: 'var(--color-accent-green)' }} />
                  {t.analyticsPage.topGrowingTrends}
                </h3>
                <div className="space-y-2 sm:space-y-3">
                  {trends
                    .sort((a, b) => b.growthRate - a.growthRate)
                    .slice(0, 5)
                    .map((trend, index) => (
                      <div
                        key={trend.id}
                        className="glass rounded-xl flex items-center justify-between p-2.5 sm:p-3"
                      >
                        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                          <div
                            className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center font-bold text-xs sm:text-sm shrink-0"
                            style={{
                              background: 'rgba(48, 209, 88, 0.1)',
                              color: 'var(--color-accent-green)',
                            }}
                          >
                            #{index + 1}
                          </div>
                          <div className="min-w-0">
                            <div className="font-medium text-xs sm:text-sm truncate">{trend.name}</div>
                            <div className="text-[10px] sm:text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
                              {trend.category}
                            </div>
                          </div>
                        </div>
                        <div className="text-right shrink-0 ml-2">
                          <div className="font-bold text-sm" style={{ color: 'var(--color-accent-green)' }}>
                            +{trend.growthRate}%
                          </div>
                          <div className="text-[10px] sm:text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
                            {formatNumber(trend.totalViews)} {t.analyticsPage.views}
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>

              {/* Most Engaging Trends */}
              <div className="glass-prominent rounded-2xl p-4 sm:p-6 animate-fade-in">
                <h3 className="text-base sm:text-lg font-bold mb-3 sm:mb-4 flex items-center gap-2">
                  <Users className="w-5 h-5" style={{ color: 'var(--color-accent-orange)' }} />
                  {t.analyticsPage.mostEngagingTrends}
                </h3>
                <div className="space-y-2 sm:space-y-3">
                  {trends
                    .sort((a, b) => b.engagementScore - a.engagementScore)
                    .slice(0, 5)
                    .map((trend, index) => (
                      <div
                        key={trend.id}
                        className="glass rounded-xl flex items-center justify-between p-2.5 sm:p-3"
                      >
                        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                          <div
                            className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center font-bold text-xs sm:text-sm shrink-0"
                            style={{
                              background: 'rgba(255, 159, 10, 0.1)',
                              color: 'var(--color-accent-orange)',
                            }}
                          >
                            #{index + 1}
                          </div>
                          <div className="min-w-0">
                            <div className="font-medium text-xs sm:text-sm truncate">{trend.name}</div>
                            <div className="text-[10px] sm:text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
                              {trend.category}
                            </div>
                          </div>
                        </div>
                        <div className="text-right shrink-0 ml-2">
                          <div className="font-bold text-sm" style={{ color: 'var(--color-accent-orange)' }}>
                            {trend.engagementScore}
                          </div>
                          <div className="text-[10px] sm:text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
                            {t.analyticsPage.engagement}
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>

            {/* Category Breakdown */}
            <div className="glass-prominent rounded-2xl p-4 sm:p-6 mb-6 sm:mb-8 animate-fade-in">
              <h3 className="text-base sm:text-lg font-bold mb-3 sm:mb-4">{t.analyticsPage.categoryBreakdown}</h3>
              <div className="space-y-4">
                {Object.entries(
                  trends.reduce((acc, trend) => {
                    acc[trend.category] = (acc[trend.category] || 0) + 1;
                    return acc;
                  }, {} as Record<string, number>)
                )
                  .sort((a, b) => (b[1] as number) - (a[1] as number))
                  .map(([category, count]) => {
                    const percentage = ((count as number) / trends.length) * 100;
                    return (
                      <div key={category}>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-xs sm:text-sm font-medium">{category}</span>
                          <span className="text-xs sm:text-sm" style={{ color: 'var(--color-text-tertiary)' }}>
                            {t.analyticsPage.trends(count as number)} ({percentage.toFixed(0)}%)
                          </span>
                        </div>
                        <div
                          className="w-full h-2 rounded-full overflow-hidden"
                          style={{ background: 'rgba(255, 255, 255, 0.06)' }}
                        >
                          <div
                            className="h-2 rounded-full transition-all duration-700"
                            style={{
                              width: `${percentage}%`,
                              background: 'linear-gradient(90deg, var(--color-accent-blue), rgba(10, 132, 255, 0.6))',
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* Trend Status */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 stagger-children">
              {/* Trending Up */}
              <div className="glass-prominent rounded-2xl p-4 sm:p-6 animate-fade-in">
                <div className="flex items-center gap-3 mb-3">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center"
                    style={{ background: 'rgba(48, 209, 88, 0.12)', color: 'var(--color-accent-green)' }}
                  >
                    <ArrowUp className="w-5 h-5" />
                  </div>
                  <span className="text-xs sm:text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>
                    {t.analyticsPage.trendingUp}
                  </span>
                </div>
                <div className="text-3xl sm:text-4xl font-bold" style={{ color: 'var(--color-accent-green)' }}>
                  {stats.trendingUp}
                </div>
                <div className="text-[10px] sm:text-xs mt-1" style={{ color: 'var(--color-text-tertiary)' }}>
                  {t.analyticsPage.growthAbove50}
                </div>
              </div>

              {/* Stable */}
              <div className="glass-prominent rounded-2xl p-4 sm:p-6 animate-fade-in">
                <div className="flex items-center gap-3 mb-3">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center"
                    style={{ background: 'rgba(10, 132, 255, 0.12)', color: 'var(--color-accent-blue)' }}
                  >
                    <Activity className="w-5 h-5" />
                  </div>
                  <span className="text-xs sm:text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>
                    {t.analyticsPage.stable}
                  </span>
                </div>
                <div className="text-3xl sm:text-4xl font-bold" style={{ color: 'var(--color-accent-blue)' }}>
                  {Math.max(0, trends.length - stats.trendingUp - stats.trendingDown)}
                </div>
                <div className="text-[10px] sm:text-xs mt-1" style={{ color: 'var(--color-text-tertiary)' }}>
                  {t.analyticsPage.growth2050}
                </div>
              </div>

              {/* Slowing */}
              <div className="glass-prominent rounded-2xl p-4 sm:p-6 animate-fade-in">
                <div className="flex items-center gap-3 mb-3">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center"
                    style={{ background: 'rgba(255, 69, 58, 0.12)', color: 'var(--color-accent-red)' }}
                  >
                    <ArrowDown className="w-5 h-5" />
                  </div>
                  <span className="text-xs sm:text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>
                    {t.analyticsPage.slowing}
                  </span>
                </div>
                <div className="text-3xl sm:text-4xl font-bold" style={{ color: 'var(--color-accent-red)' }}>
                  {stats.trendingDown}
                </div>
                <div className="text-[10px] sm:text-xs mt-1" style={{ color: 'var(--color-text-tertiary)' }}>
                  {t.analyticsPage.growthBelow20}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
