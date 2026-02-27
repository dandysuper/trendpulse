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

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-4 sm:p-6 overflow-y-auto">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold mb-2 flex items-center gap-3">
            <BarChart3 className="w-6 h-6 sm:w-8 sm:h-8 text-blue-500" />
            {t.analyticsPage.title}
          </h1>
          <p className="text-sm sm:text-base text-zinc-400">
            {t.analyticsPage.overview}
          </p>
        </div>

        {trends.length === 0 ? (
          <div className="text-center py-16 sm:py-20">
            <Activity className="w-12 h-12 sm:w-16 sm:h-16 text-zinc-700 mx-auto mb-4" />
            <h3 className="text-lg sm:text-xl font-semibold text-zinc-400 mb-2">{t.analyticsPage.noData}</h3>
            <p className="text-sm text-zinc-500">
              {t.analyticsPage.noDataDescription}
            </p>
          </div>
        ) : (
          <>
            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
              {/* Total Videos */}
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 sm:p-6">
                <div className="flex items-center justify-between mb-2">
                  <Video className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500" />
                  <span className="text-[10px] sm:text-xs text-zinc-500 font-medium">{t.analyticsPage.total}</span>
                </div>
                <div className="text-2xl sm:text-3xl font-bold mb-1">{stats.totalVideos}</div>
                <div className="text-xs sm:text-sm text-zinc-400">{t.analyticsPage.videosTracked}</div>
              </div>

              {/* Total Views */}
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 sm:p-6">
                <div className="flex items-center justify-between mb-2">
                  <Eye className="w-4 h-4 sm:w-5 sm:h-5 text-purple-500" />
                  <span className="text-[10px] sm:text-xs text-zinc-500 font-medium">{t.analyticsPage.viewsLabel}</span>
                </div>
                <div className="text-2xl sm:text-3xl font-bold mb-1">{formatNumber(stats.totalViews)}</div>
                <div className="text-xs sm:text-sm text-zinc-400">{t.analyticsPage.totalViews}</div>
              </div>

              {/* Avg Growth Rate */}
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 sm:p-6">
                <div className="flex items-center justify-between mb-2">
                  <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-green-500" />
                  <span className="text-[10px] sm:text-xs text-zinc-500 font-medium">{t.analyticsPage.growthLabel}</span>
                </div>
                <div className="text-2xl sm:text-3xl font-bold mb-1">{stats.avgGrowthRate.toFixed(0)}%</div>
                <div className="text-xs sm:text-sm text-zinc-400">{t.analyticsPage.avgGrowthRate}</div>
              </div>

              {/* Avg Engagement */}
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 sm:p-6">
                <div className="flex items-center justify-between mb-2">
                  <Users className="w-4 h-4 sm:w-5 sm:h-5 text-amber-500" />
                  <span className="text-[10px] sm:text-xs text-zinc-500 font-medium">{t.analyticsPage.engagementLabel}</span>
                </div>
                <div className="text-2xl sm:text-3xl font-bold mb-1">{stats.avgEngagement.toFixed(0)}</div>
                <div className="text-xs sm:text-sm text-zinc-400">{t.analyticsPage.avgScore}</div>
              </div>
            </div>

            {/* Top Trends */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
              {/* Top Growing Trends */}
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 sm:p-6">
                <h3 className="text-base sm:text-lg font-bold mb-3 sm:mb-4 flex items-center gap-2">
                  <ArrowUp className="w-4 h-4 sm:w-5 sm:h-5 text-green-500" />
                  {t.analyticsPage.topGrowingTrends}
                </h3>
                <div className="space-y-2 sm:space-y-3">
                  {trends
                    .sort((a, b) => b.growthRate - a.growthRate)
                    .slice(0, 5)
                    .map((trend, index) => (
                      <div key={trend.id} className="flex items-center justify-between p-2.5 sm:p-3 bg-zinc-950/50 rounded-lg">
                        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                          <div className="w-7 h-7 sm:w-8 sm:h-8 bg-green-500/10 rounded-lg flex items-center justify-center text-green-400 font-bold text-xs sm:text-sm flex-shrink-0">
                            #{index + 1}
                          </div>
                          <div className="min-w-0">
                            <div className="font-medium text-xs sm:text-sm truncate">{trend.name}</div>
                            <div className="text-[10px] sm:text-xs text-zinc-500">{trend.category}</div>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0 ml-2">
                          <div className="text-green-400 font-bold text-sm">+{trend.growthRate}%</div>
                          <div className="text-[10px] sm:text-xs text-zinc-500">{formatNumber(trend.totalViews)} {t.analyticsPage.views}</div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>

              {/* Most Engaging Trends */}
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 sm:p-6">
                <h3 className="text-base sm:text-lg font-bold mb-3 sm:mb-4 flex items-center gap-2">
                  <Users className="w-4 h-4 sm:w-5 sm:h-5 text-amber-500" />
                  {t.analyticsPage.mostEngagingTrends}
                </h3>
                <div className="space-y-2 sm:space-y-3">
                  {trends
                    .sort((a, b) => b.engagementScore - a.engagementScore)
                    .slice(0, 5)
                    .map((trend, index) => (
                      <div key={trend.id} className="flex items-center justify-between p-2.5 sm:p-3 bg-zinc-950/50 rounded-lg">
                        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                          <div className="w-7 h-7 sm:w-8 sm:h-8 bg-amber-500/10 rounded-lg flex items-center justify-center text-amber-400 font-bold text-xs sm:text-sm flex-shrink-0">
                            #{index + 1}
                          </div>
                          <div className="min-w-0">
                            <div className="font-medium text-xs sm:text-sm truncate">{trend.name}</div>
                            <div className="text-[10px] sm:text-xs text-zinc-500">{trend.category}</div>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0 ml-2">
                          <div className="text-amber-400 font-bold text-sm">{trend.engagementScore}</div>
                          <div className="text-[10px] sm:text-xs text-zinc-500">{t.analyticsPage.engagement}</div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>

            {/* Category Breakdown */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 sm:p-6 mb-6 sm:mb-8">
              <h3 className="text-base sm:text-lg font-bold mb-3 sm:mb-4">{t.analyticsPage.categoryBreakdown}</h3>
              <div className="space-y-3">
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
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs sm:text-sm font-medium">{category}</span>
                          <span className="text-xs sm:text-sm text-zinc-400">{t.analyticsPage.trends(count as number)} ({percentage.toFixed(0)}%)</span>
                        </div>
                        <div className="w-full bg-zinc-800 rounded-full h-2">
                          <div
                            className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* Trend Status */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 sm:p-6">
                <div className="flex items-center gap-3 mb-2">
                  <ArrowUp className="w-4 h-4 sm:w-5 sm:h-5 text-green-500" />
                  <span className="text-xs sm:text-sm font-medium text-zinc-400">{t.analyticsPage.trendingUp}</span>
                </div>
                <div className="text-2xl sm:text-3xl font-bold text-green-400">{stats.trendingUp}</div>
                <div className="text-[10px] sm:text-xs text-zinc-500 mt-1">{t.analyticsPage.growthAbove50}</div>
              </div>

              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 sm:p-6">
                <div className="flex items-center gap-3 mb-2">
                  <Activity className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500" />
                  <span className="text-xs sm:text-sm font-medium text-zinc-400">{t.analyticsPage.stable}</span>
                </div>
                <div className="text-2xl sm:text-3xl font-bold text-blue-400">
                  {Math.max(0, trends.length - stats.trendingUp - stats.trendingDown)}
                </div>
                <div className="text-[10px] sm:text-xs text-zinc-500 mt-1">{t.analyticsPage.growth2050}</div>
              </div>

              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 sm:p-6">
                <div className="flex items-center gap-3 mb-2">
                  <ArrowDown className="w-4 h-4 sm:w-5 sm:h-5 text-red-500" />
                  <span className="text-xs sm:text-sm font-medium text-zinc-400">{t.analyticsPage.slowing}</span>
                </div>
                <div className="text-2xl sm:text-3xl font-bold text-red-400">{stats.trendingDown}</div>
                <div className="text-[10px] sm:text-xs text-zinc-500 mt-1">{t.analyticsPage.growthBelow20}</div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
