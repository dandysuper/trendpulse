import React, { useState, useEffect } from 'react';
import { TrendCluster, TrendInsight, ContentIdea } from '../types';
import { TrendChart } from './TrendChart';
import { analyzeTrend, generateContentIdeas } from '../services/aiService';
import { IdeaGenerator } from './IdeaGenerator';
import { Sparkles, Play, BarChart2, Video, Target, ArrowRight, Loader2, Youtube, Instagram, Music } from 'lucide-react';
import { useLanguage } from '../LanguageContext';

// TikTok icon component
const TikTokIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
  </svg>
);

interface TrendDetailProps {
  trend: TrendCluster;
}

export const TrendDetail: React.FC<TrendDetailProps> = ({ trend }) => {
  const { t } = useLanguage();
  const [insight, setInsight] = useState<TrendInsight | null>(null);
  const [ideas, setIdeas] = useState<ContentIdea[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isGeneratingIdeas, setIsGeneratingIdeas] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setInsight(null);
    setIdeas([]);
    setError(null);
  }, [trend.id]);

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    setError(null);
    try {
      const result = await analyzeTrend(trend);
      setInsight(result);
    } catch (err) {
      setError(t.trendDetail.failedToAnalyze);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleGenerateIdeas = async () => {
    if (!insight) return;
    setIsGeneratingIdeas(true);
    try {
      const newIdeas = await generateContentIdeas(trend, insight);
      setIdeas(newIdeas);
    } catch (err) {
      setError(t.trendDetail.failedToGenerate);
    } finally {
      setIsGeneratingIdeas(false);
    }
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'youtube': return <Youtube className="w-3 h-3" />;
      case 'tiktok': return <TikTokIcon className="w-3 h-3" />;
      default: return <Instagram className="w-3 h-3" />;
    }
  };

  const getPlatformLabel = (platform: string, channelName?: string) => {
    if (channelName) return channelName;
    switch (platform) {
      case 'youtube': return 'YouTube';
      case 'tiktok': return 'TikTok';
      default: return platform.charAt(0).toUpperCase() + platform.slice(1);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 sm:space-y-8 animate-fade-in">

      {/* ── Header ── */}
      <header className="flex flex-col gap-5">
        {/* Pills */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="glass inline-flex items-center px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-medium text-[var(--color-accent-teal)]">
            {trend.category}
          </span>
          <span className="glass inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-medium text-[var(--color-accent-green)]">
            <BarChart2 className="w-3 h-3" />
            {trend.growthRate}% {t.dashboard.growth}
          </span>
        </div>

        {/* Title */}
        <div>
          <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-[var(--color-text-primary)] tracking-tight leading-tight break-words">
            {trend.name}
          </h1>
          <p className="mt-2 text-sm sm:text-base text-[var(--color-text-secondary)]">
            {t.trendDetail.totalVolume} {(trend.totalViews / 1000000).toFixed(1)}M+
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3">
          {!insight ? (
            <button
              onClick={handleAnalyze}
              disabled={isAnalyzing}
              className="bg-[var(--color-accent-blue)] hover:brightness-110 disabled:opacity-60 disabled:cursor-not-allowed text-white px-5 sm:px-7 py-2.5 sm:py-3 rounded-2xl font-semibold flex items-center gap-2.5 transition-all text-sm sm:text-base shadow-[var(--shadow-glow-blue)]"
            >
              {isAnalyzing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4" />
              )}
              {t.trendDetail.analyzeWithAI}
            </button>
          ) : (
            <button
              onClick={handleGenerateIdeas}
              disabled={isGeneratingIdeas}
              className="bg-[var(--color-accent-blue)] hover:brightness-110 disabled:opacity-60 disabled:cursor-not-allowed text-white px-5 sm:px-7 py-2.5 sm:py-3 rounded-2xl font-semibold flex items-center gap-2.5 transition-all text-sm sm:text-base shadow-[var(--shadow-glow-blue)]"
            >
              {isGeneratingIdeas ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Video className="w-4 h-4" />
              )}
              {t.trendDetail.generateIdeas}
            </button>
          )}
        </div>

        {/* Error Banner */}
        {error && (
          <div className="glass rounded-2xl px-4 py-3 text-sm text-[var(--color-accent-red)] border-[var(--color-accent-red)]/20 animate-fade-in">
            {error}
          </div>
        )}
      </header>

      {/* ── Main Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">

        {/* ── Left Column: Chart + Videos ── */}
        <div className="lg:col-span-2 space-y-4 sm:space-y-6">

          {/* Chart Card */}
          <div className="glass-prominent rounded-3xl p-4 sm:p-6 animate-slide-up">
            <div className="flex justify-between items-center mb-4 sm:mb-6">
              <h3 className="font-semibold text-base sm:text-lg text-[var(--color-text-primary)]">
                {t.trendDetail.velocityTrack}
              </h3>
            </div>
            <TrendChart data={trend.historicalGrowth} />
          </div>

          {/* Videos List Card */}
          <div className="glass-prominent rounded-3xl p-4 sm:p-6 animate-slide-up" style={{ animationDelay: '80ms' }}>
            <h3 className="font-semibold text-base sm:text-lg text-[var(--color-text-primary)] mb-3 sm:mb-4">
              {t.trendDetail.topPerformingVideos}
            </h3>
            <div className="space-y-1.5 sm:space-y-2">
              {trend.videos.map((video) => (
                <a
                  key={video.id}
                  href={video.url || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="glass-hover flex items-center gap-3 sm:gap-4 p-2.5 sm:p-3.5 rounded-2xl transition-all group cursor-pointer border border-transparent"
                >
                  {/* Play Icon */}
                  <div className="glass w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center shrink-0 group-hover:border-[var(--color-border-glass-prominent)]">
                    <Play className="w-4 h-4 sm:w-5 sm:h-5 text-[var(--color-text-tertiary)] group-hover:text-[var(--color-text-primary)] fill-current transition-colors" />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-[var(--color-text-primary)] opacity-85 group-hover:opacity-100 truncate text-sm transition-opacity">
                      {video.title}
                    </h4>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-[var(--color-text-tertiary)] mt-1">
                      <span className="flex items-center gap-1">
                        {getPlatformIcon(video.platform)}
                        {getPlatformLabel(video.platform, video.channelName)}
                      </span>
                      <span className="hidden xs:inline opacity-40">•</span>
                      <span>{(video.views / 1000).toFixed(0)}{t.dashboard.kViews}</span>
                      <span className="hidden sm:inline opacity-40">•</span>
                      <span className="hidden sm:inline">{video.publishedAt}</span>
                    </div>
                  </div>

                  {/* Arrow */}
                  <ArrowRight className="w-4 h-4 text-[var(--color-text-tertiary)] opacity-0 group-hover:opacity-100 transition-all hidden sm:block" />
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* ── Right Column: AI Insights ── */}
        <div className="lg:col-span-1 animate-slide-in-right">

          {/* Loading State */}
          {isAnalyzing && (
            <div className="glass min-h-[250px] lg:min-h-[400px] flex flex-col items-center justify-center rounded-3xl border-dashed border-[var(--color-border-glass-prominent)] gap-4 animate-fade-in">
              <Loader2 className="w-8 h-8 text-[var(--color-accent-blue)] animate-spin animate-pulse-glow rounded-full" />
              <p className="text-sm font-medium text-[var(--color-text-secondary)] animate-pulse">
                {t.trendDetail.analyzingSemantics}
              </p>
            </div>
          )}

          {/* Empty State */}
          {!insight && !isAnalyzing && (
            <div className="glass min-h-[200px] lg:min-h-[400px] flex flex-col items-center justify-center rounded-3xl border-dashed border-[var(--color-border-glass-prominent)] p-6 sm:p-8 text-center animate-fade-in">
              <div className="mb-5 p-4 rounded-full bg-[var(--color-bg-glass)]">
                <Sparkles className="w-8 h-8 sm:w-10 sm:h-10 text-[var(--color-text-tertiary)] opacity-30" />
              </div>
              <h4 className="text-base sm:text-lg font-semibold text-[var(--color-text-secondary)] mb-2">
                {t.trendDetail.unlockAIInsights}
              </h4>
              <p className="text-sm text-[var(--color-text-tertiary)] max-w-[260px] leading-relaxed">
                {t.trendDetail.unlockDescription}
              </p>
            </div>
          )}

          {/* Insights Cards */}
          {insight && (
            <div className="space-y-4 stagger-children">

              {/* Why Trending */}
              <div
                className="glass-prominent rounded-3xl p-4 sm:p-6 animate-slide-up relative overflow-hidden"
              >
                {/* Gradient top border accent */}
                <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[var(--color-accent-blue)] via-[var(--color-accent-teal)] to-transparent" />
                <div className="flex items-center gap-2 mb-3 text-[var(--color-accent-blue)] font-bold text-xs uppercase tracking-widest">
                  <Target className="w-4 h-4" />
                  {t.trendDetail.whyTrending}
                </div>
                <p className="text-[var(--color-text-primary)] opacity-90 leading-relaxed text-sm">
                  {insight.whyTrending}
                </p>
              </div>

              {/* Winning Hooks */}
              <div className="glass-prominent rounded-3xl p-4 sm:p-6 animate-slide-up">
                <div className="flex items-center gap-2 mb-3 sm:mb-4 text-[var(--color-text-secondary)] font-bold text-xs uppercase tracking-widest">
                  <span className="w-2 h-2 rounded-full bg-[var(--color-accent-pink)]" />
                  {t.trendDetail.winningHooks}
                </div>
                <ul className="space-y-2.5 sm:space-y-3">
                  {insight.hooks.map((hook, i) => (
                    <li key={i} className="flex gap-3 text-sm text-[var(--color-text-primary)] opacity-85">
                      <span className="text-[var(--color-text-tertiary)] font-mono select-none shrink-0">
                        0{i + 1}
                      </span>
                      <span className="leading-relaxed">{hook}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Audience */}
              <div className="glass-prominent rounded-3xl p-4 sm:p-6 animate-slide-up">
                <div className="flex items-center gap-2 mb-3 sm:mb-4 text-[var(--color-text-secondary)] font-bold text-xs uppercase tracking-widest">
                  <span className="w-2 h-2 rounded-full bg-[var(--color-accent-orange)]" />
                  {t.trendDetail.audience}
                </div>
                <p className="text-sm text-[var(--color-text-primary)] opacity-85 leading-relaxed">
                  {insight.audience}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Generated Ideas Section ── */}
      {ideas.length > 0 && (
        <div className="animate-slide-up">
          {/* Glass divider */}
          <div className="h-px bg-gradient-to-r from-transparent via-[var(--color-border-glass-prominent)] to-transparent mb-6 sm:mb-8" />

          <div className="flex items-center gap-3 mb-5 sm:mb-7">
            <div className="w-9 h-9 sm:w-11 sm:h-11 glass rounded-full flex items-center justify-center">
              <Video className="w-4 h-4 sm:w-5 sm:h-5 text-[var(--color-accent-blue)]" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-[var(--color-text-primary)]">
                {t.ideas.tailoredContentIdeas}
              </h2>
              <p className="text-[var(--color-text-tertiary)] text-xs sm:text-sm">
                {t.ideas.generatedByAI}
              </p>
            </div>
          </div>
          <IdeaGenerator ideas={ideas} trendName={trend.name} />
        </div>
      )}
    </div>
  );
};
