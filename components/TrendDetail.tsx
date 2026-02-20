import React, { useState, useEffect } from 'react';
import { TrendCluster, TrendInsight, ContentIdea } from '../types';
import { TrendChart } from './TrendChart';
import { analyzeTrend, generateContentIdeas } from '../services/aiService';
import { IdeaGenerator } from './IdeaGenerator';
import { Sparkles, Play, BarChart2, Video, Target, ArrowRight, Loader2, Youtube, Instagram, Music } from 'lucide-react';

// TikTok icon component
const TikTokIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
  </svg>
);

interface TrendDetailProps {
  trend: TrendCluster;
}

export const TrendDetail: React.FC<TrendDetailProps> = ({ trend }) => {
  const [insight, setInsight] = useState<TrendInsight | null>(null);
  const [ideas, setIdeas] = useState<ContentIdea[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isGeneratingIdeas, setIsGeneratingIdeas] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset state when trend changes
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
      setError("Failed to analyze trend. Please try again.");
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
      setError("Failed to generate ideas.");
    } finally {
      setIsGeneratingIdeas(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className="px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 text-sm font-medium">
              {trend.category}
            </span>
            <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-sm font-medium flex items-center gap-1">
              <BarChart2 className="w-3 h-3" />
              {trend.growthRate}% Growth
            </span>
          </div>
          <h1 className="text-4xl font-bold text-white mb-2 tracking-tight">{trend.name}</h1>
          <p className="text-zinc-400">Total volume across platforms: {(trend.totalViews / 1000000).toFixed(1)}M+</p>
        </div>

        <div className="flex gap-3">
            {!insight ? (
                <button 
                  onClick={handleAnalyze} 
                  disabled={isAnalyzing}
                  className="bg-white text-zinc-950 hover:bg-zinc-200 disabled:opacity-70 disabled:cursor-not-allowed px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-white/10 transition-all"
                >
                  {isAnalyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4 text-blue-600" />}
                  Analyze with AI
                </button>
            ) : (
                <button 
                   onClick={handleGenerateIdeas}
                   disabled={isGeneratingIdeas}
                   className="bg-blue-600 hover:bg-blue-500 text-white disabled:opacity-70 disabled:cursor-not-allowed px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-blue-500/20 transition-all"
                >
                   {isGeneratingIdeas ? <Loader2 className="w-4 h-4 animate-spin" /> : <Video className="w-4 h-4" />}
                   Generate Content Ideas
                </button>
            )}
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Col: Chart & Videos */}
        <div className="lg:col-span-2 space-y-6">
          {/* Chart Card */}
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 backdrop-blur-sm">
             <div className="flex justify-between items-center mb-6">
                <h3 className="font-semibold text-lg">Velocity Track (7d)</h3>
             </div>
             <TrendChart data={trend.historicalGrowth} />
          </div>

          {/* Top Videos List */}
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 backdrop-blur-sm">
             <h3 className="font-semibold text-lg mb-4">Top Performing Videos</h3>
             <div className="space-y-3">
                {trend.videos.map((video) => (
                    <a 
                      key={video.id} 
                      href={video.url || '#'} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-4 p-3 hover:bg-zinc-800/50 rounded-xl transition-colors group cursor-pointer"
                    >
                        <div className="w-12 h-12 bg-zinc-800 rounded-lg flex items-center justify-center shrink-0">
                            <Play className="w-5 h-5 text-zinc-500 group-hover:text-white fill-current" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-zinc-200 truncate group-hover:text-white">{video.title}</h4>
                            <div className="flex items-center gap-3 text-xs text-zinc-500 mt-1">
                                <span className="flex items-center gap-1">
                                    {video.platform === 'youtube' ? (
                                      <Youtube className="w-3 h-3" />
                                    ) : video.platform === 'tiktok' ? (
                                      <TikTokIcon className="w-3 h-3" />
                                    ) : (
                                      <Instagram className="w-3 h-3" />
                                    )}
                                    {video.channelName || (video.platform === 'youtube' ? 'YouTube' : 
                                     video.platform === 'tiktok' ? 'TikTok' :
                                     video.platform.charAt(0).toUpperCase() + video.platform.slice(1))}
                                </span>
                                <span>•</span>
                                <span>{(video.views / 1000).toFixed(0)}k views</span>
                                <span>•</span>
                                <span>{video.publishedAt}</span>
                            </div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-zinc-600 group-hover:text-zinc-300 opacity-0 group-hover:opacity-100 transition-all" />
                    </a>
                ))}
             </div>
          </div>
        </div>

        {/* Right Col: AI Insights */}
        <div className="lg:col-span-1">
            {isAnalyzing && (
                 <div className="h-full min-h-[400px] flex flex-col items-center justify-center bg-zinc-900/30 border border-zinc-800 border-dashed rounded-2xl text-zinc-500 gap-4">
                     <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                     <p className="text-sm font-medium animate-pulse">Analyzing cluster semantics...</p>
                 </div>
            )}
            
            {!insight && !isAnalyzing && (
                <div className="h-full min-h-[400px] flex flex-col items-center justify-center bg-zinc-900/30 border border-zinc-800 border-dashed rounded-2xl text-zinc-500 p-8 text-center">
                    <Sparkles className="w-12 h-12 mb-4 opacity-20" />
                    <h4 className="text-lg font-semibold text-zinc-400 mb-2">Unlock AI Insights</h4>
                    <p className="text-sm max-w-[250px]">Free AI will analyze titles, velocity, and engagement to explain why this is trending.</p>
                </div>
            )}

            {insight && (
                <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-500">
                    <div className="bg-gradient-to-br from-blue-900/20 to-zinc-900 border border-blue-500/20 rounded-2xl p-6">
                        <div className="flex items-center gap-2 mb-3 text-blue-400 font-bold text-sm uppercase tracking-wide">
                            <Target className="w-4 h-4" />
                            Why It's Trending
                        </div>
                        <p className="text-zinc-200 leading-relaxed text-sm">
                            {insight.whyTrending}
                        </p>
                    </div>

                    <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6">
                         <div className="flex items-center gap-2 mb-4 text-zinc-400 font-bold text-xs uppercase tracking-wide">
                            <span className="w-2 h-2 rounded-full bg-pink-500"></span>
                            Winning Hooks
                        </div>
                        <ul className="space-y-3">
                            {insight.hooks.map((hook, i) => (
                                <li key={i} className="flex gap-3 text-sm text-zinc-300">
                                    <span className="text-zinc-600 font-mono select-none">0{i+1}</span>
                                    {hook}
                                </li>
                            ))}
                        </ul>
                    </div>

                     <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6">
                         <div className="flex items-center gap-2 mb-4 text-zinc-400 font-bold text-xs uppercase tracking-wide">
                            <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                            Audience
                        </div>
                        <p className="text-sm text-zinc-300">{insight.audience}</p>
                    </div>
                </div>
            )}
        </div>
      </div>

      {/* Generated Ideas Section */}
      {ideas.length > 0 && (
          <div className="pt-8 border-t border-zinc-800">
              <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-blue-600/20 rounded-full flex items-center justify-center">
                     <Video className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                     <h2 className="text-2xl font-bold">Tailored Content Ideas</h2>
                     <p className="text-zinc-400 text-sm">Generated by AI based on active trend data</p>
                  </div>
              </div>
              <IdeaGenerator ideas={ideas} trendName={trend.name} />
          </div>
      )}
    </div>
  );
};