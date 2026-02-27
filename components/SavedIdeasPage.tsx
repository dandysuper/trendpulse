import React, { useState, useEffect } from 'react';
import { ContentIdea } from '../types';
import { Trash2, FileText, PlayCircle, Bookmark, Download, Copy, Check } from 'lucide-react';
import { useLanguage } from '../LanguageContext';

interface SavedIdea extends ContentIdea {
  id: string;
  savedAt: string;
  trendName: string;
}

export const SavedIdeasPage: React.FC = () => {
  const { t } = useLanguage();
  const [savedIdeas, setSavedIdeas] = useState<SavedIdea[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem('trendpulse_saved_ideas');
    if (stored) {
      try {
        setSavedIdeas(JSON.parse(stored));
      } catch (error) {
        console.error('Failed to load saved ideas:', error);
      }
    }
  }, []);

  const deleteIdea = (id: string) => {
    const updated = savedIdeas.filter(idea => idea.id !== id);
    setSavedIdeas(updated);
    localStorage.setItem('trendpulse_saved_ideas', JSON.stringify(updated));
  };

  const copyToClipboard = (idea: SavedIdea) => {
    const text = `Title: ${idea.title}\n\nHook: ${idea.hook}\n\nOutline:\n${idea.outline}\n\nFormat: ${idea.format}`;
    navigator.clipboard.writeText(text);
    setCopiedId(idea.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const exportIdeas = () => {
    const dataStr = JSON.stringify(savedIdeas, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `trendpulse-ideas-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const clearAll = () => {
    if (confirm(t.savedIdeas.confirmClear)) {
      setSavedIdeas([]);
      localStorage.removeItem('trendpulse_saved_ideas');
    }
  };

  const formatLabel = (format: string) => {
    if (format === 'Short') return t.formats.short;
    if (format === 'Long-form') return t.formats.longForm;
    if (format === 'Carousel') return t.formats.carousel;
    return format;
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-4 sm:p-6 overflow-y-auto">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold mb-1 sm:mb-2 flex items-center gap-3">
                <Bookmark className="w-6 h-6 sm:w-8 sm:h-8 text-blue-500" />
                {t.savedIdeas.title}
              </h1>
              <p className="text-sm text-zinc-400">
                {t.savedIdeas.ideaCount(savedIdeas.length)}
              </p>
            </div>

            {savedIdeas.length > 0 && (
              <div className="flex gap-2">
                <button
                  onClick={exportIdeas}
                  className="px-3 sm:px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  {t.savedIdeas.export}
                </button>
                <button
                  onClick={clearAll}
                  className="px-3 sm:px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  {t.savedIdeas.clearAll}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Ideas Grid */}
        {savedIdeas.length === 0 ? (
          <div className="text-center py-16 sm:py-20">
            <Bookmark className="w-12 h-12 sm:w-16 sm:h-16 text-zinc-700 mx-auto mb-4" />
            <h3 className="text-lg sm:text-xl font-semibold text-zinc-400 mb-2">{t.savedIdeas.noSavedIdeas}</h3>
            <p className="text-sm text-zinc-500 max-w-sm mx-auto">
              {t.savedIdeas.noSavedIdeasDescription}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {savedIdeas.map((idea) => (
              <div
                key={idea.id}
                className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 sm:p-5 flex flex-col hover:border-zinc-700 transition-colors"
              >
                {/* Header */}
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                  <span className={`text-xs px-2 py-1 rounded-md font-medium
                    ${idea.format === 'Short' ? 'bg-pink-500/10 text-pink-400' :
                      idea.format === 'Long-form' ? 'bg-blue-500/10 text-blue-400' :
                        'bg-amber-500/10 text-amber-400'
                    }
                  `}>
                    {formatLabel(idea.format)}
                  </span>
                  <button
                    onClick={() => deleteIdea(idea.id)}
                    className="p-1.5 hover:bg-zinc-800 rounded-lg text-zinc-500 hover:text-red-400 transition-colors"
                    title={t.savedIdeas.deleteIdea}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Trend Badge */}
                <div className="mb-3">
                  <span className="text-xs text-zinc-500 font-medium">
                    {t.savedIdeas.fromTrend} {idea.trendName}
                  </span>
                </div>

                {/* Title */}
                <h4 className="font-bold text-base sm:text-lg mb-3 leading-snug text-zinc-100">
                  {idea.title}
                </h4>

                {/* Content */}
                <div className="space-y-3 flex-1">
                  <div className="bg-zinc-950/50 p-3 rounded-lg border border-zinc-800/50">
                    <div className="flex items-center gap-2 text-xs font-semibold text-zinc-400 mb-1">
                      <PlayCircle className="w-3 h-3" />
                      {t.ideas.theHook}
                    </div>
                    <p className="text-sm text-zinc-300 italic">"{idea.hook}"</p>
                  </div>

                  <div className="bg-zinc-950/50 p-3 rounded-lg border border-zinc-800/50">
                    <div className="flex items-center gap-2 text-xs font-semibold text-zinc-400 mb-1">
                      <FileText className="w-3 h-3" />
                      {t.ideas.outline}
                    </div>
                    <p className="text-sm text-zinc-400 leading-relaxed whitespace-pre-line">
                      {idea.outline}
                    </p>
                  </div>
                </div>

                {/* Footer */}
                <div className="mt-4 flex gap-2">
                  <button
                    onClick={() => copyToClipboard(idea)}
                    className="flex-1 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors"
                  >
                    {copiedId === idea.id ? (
                      <>
                        <Check className="w-4 h-4" />
                        {t.savedIdeas.copied}
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        {t.savedIdeas.copy}
                      </>
                    )}
                  </button>
                </div>

                {/* Saved Date */}
                <div className="mt-3 text-xs text-zinc-600">
                  {t.savedIdeas.savedOn} {new Date(idea.savedAt).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// Helper function to save an idea (export for use in other components)
export const saveIdea = (idea: ContentIdea, trendName: string) => {
  const savedIdea: SavedIdea = {
    ...idea,
    id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    savedAt: new Date().toISOString(),
    trendName
  };

  const stored = localStorage.getItem('trendpulse_saved_ideas');
  const existing: SavedIdea[] = stored ? JSON.parse(stored) : [];
  const updated = [savedIdea, ...existing];

  localStorage.setItem('trendpulse_saved_ideas', JSON.stringify(updated));

  return savedIdea;
};
