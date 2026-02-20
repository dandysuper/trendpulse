import React, { useState, useEffect } from 'react';
import { TrendCluster } from '../types';
import { BarChart3, TrendingUp, Eye, Users, Video, Activity, ArrowUp, ArrowDown } from 'lucide-react';

interface AnalyticsPageProps {
  trends: TrendCluster[];
}

export const AnalyticsPage: React.FC<AnalyticsPageProps> = ({ trends }) => {
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
    
    // Find top category
    const categoryCount: Record<string, number> = {};
    trends.forEach(t => {
      categoryCount[t.category] = (categoryCount[t.category] || 0) + 1;
    });
    const topCategory = Object.entries(categoryCount).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';
    
    // Count trending up/down
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
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
            <BarChart3 className="w-8 h-8 text-blue-500" />
            Analytics Dashboard
          </h1>
          <p className="text-zinc-400">
            Overview of trending content performance
          </p>
        </div>

        {trends.length === 0 ? (
          <div className="text-center py-20">
            <Activity className="w-16 h-16 text-zinc-700 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-zinc-400 mb-2">No data available</h3>
            <p className="text-zinc-500">
              Load trend data from the dashboard to see analytics
            </p>
          </div>
        ) : (
          <>
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {/* Total Videos */}
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                <div className="flex items-center justify-between mb-2">
                  <Video className="w-5 h-5 text-blue-500" />
                  <span className="text-xs text-zinc-500 font-medium">TOTAL</span>
                </div>
                <div className="text-3xl font-bold mb-1">{stats.totalVideos}</div>
                <div className="text-sm text-zinc-400">Videos Tracked</div>
              </div>

              {/* Total Views */}
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                <div className="flex items-center justify-between mb-2">
                  <Eye className="w-5 h-5 text-purple-500" />
                  <span className="text-xs text-zinc-500 font-medium">VIEWS</span>
                </div>
                <div className="text-3xl font-bold mb-1">{formatNumber(stats.totalViews)}</div>
                <div className="text-sm text-zinc-400">Total Views</div>
              </div>

              {/* Avg Growth Rate */}
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                <div className="flex items-center justify-between mb-2">
                  <TrendingUp className="w-5 h-5 text-green-500" />
                  <span className="text-xs text-zinc-500 font-medium">GROWTH</span>
                </div>
                <div className="text-3xl font-bold mb-1">{stats.avgGrowthRate.toFixed(0)}%</div>
                <div className="text-sm text-zinc-400">Avg Growth Rate</div>
              </div>

              {/* Avg Engagement */}
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                <div className="flex items-center justify-between mb-2">
                  <Users className="w-5 h-5 text-amber-500" />
                  <span className="text-xs text-zinc-500 font-medium">ENGAGEMENT</span>
                </div>
                <div className="text-3xl font-bold mb-1">{stats.avgEngagement.toFixed(0)}</div>
                <div className="text-sm text-zinc-400">Avg Score</div>
              </div>
            </div>

            {/* Top Trends */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* Top Growing Trends */}
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <ArrowUp className="w-5 h-5 text-green-500" />
                  Top Growing Trends
                </h3>
                <div className="space-y-3">
                  {trends
                    .sort((a, b) => b.growthRate - a.growthRate)
                    .slice(0, 5)
                    .map((trend, index) => (
                      <div key={trend.id} className="flex items-center justify-between p-3 bg-zinc-950/50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-green-500/10 rounded-lg flex items-center justify-center text-green-400 font-bold text-sm">
                            #{index + 1}
                          </div>
                          <div>
                            <div className="font-medium text-sm">{trend.name}</div>
                            <div className="text-xs text-zinc-500">{trend.category}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-green-400 font-bold">+{trend.growthRate}%</div>
                          <div className="text-xs text-zinc-500">{formatNumber(trend.totalViews)} views</div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>

              {/* Most Engaging Trends */}
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <Users className="w-5 h-5 text-amber-500" />
                  Most Engaging Trends
                </h3>
                <div className="space-y-3">
                  {trends
                    .sort((a, b) => b.engagementScore - a.engagementScore)
                    .slice(0, 5)
                    .map((trend, index) => (
                      <div key={trend.id} className="flex items-center justify-between p-3 bg-zinc-950/50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-amber-500/10 rounded-lg flex items-center justify-center text-amber-400 font-bold text-sm">
                            #{index + 1}
                          </div>
                          <div>
                            <div className="font-medium text-sm">{trend.name}</div>
                            <div className="text-xs text-zinc-500">{trend.category}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-amber-400 font-bold">{trend.engagementScore}</div>
                          <div className="text-xs text-zinc-500">engagement</div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>

            {/* Category Breakdown */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 mb-8">
              <h3 className="text-lg font-bold mb-4">Category Breakdown</h3>
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
                          <span className="text-sm font-medium">{category}</span>
                          <span className="text-sm text-zinc-400">{count} trends ({percentage.toFixed(0)}%)</span>
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-2">
                  <ArrowUp className="w-5 h-5 text-green-500" />
                  <span className="text-sm font-medium text-zinc-400">TRENDING UP</span>
                </div>
                <div className="text-3xl font-bold text-green-400">{stats.trendingUp}</div>
                <div className="text-xs text-zinc-500 mt-1">Growth &gt; 50%</div>
              </div>

              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-2">
                  <Activity className="w-5 h-5 text-blue-500" />
                  <span className="text-sm font-medium text-zinc-400">STABLE</span>
                </div>
                <div className="text-3xl font-bold text-blue-400">
                  {Math.max(0, trends.length - stats.trendingUp - stats.trendingDown)}
                </div>
                <div className="text-xs text-zinc-500 mt-1">20-50% growth</div>
              </div>

              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-2">
                  <ArrowDown className="w-5 h-5 text-red-500" />
                  <span className="text-sm font-medium text-zinc-400">SLOWING</span>
                </div>
                <div className="text-3xl font-bold text-red-400">{stats.trendingDown}</div>
                <div className="text-xs text-zinc-500 mt-1">Growth &lt; 20%</div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
