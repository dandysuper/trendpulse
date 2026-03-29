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
        // Failed to load saved ideas
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

  const formatAccent = (format: string) => {
    if (format === 'Short') return {
      bg: 'rgba(255, 55, 95, 0.12)',
      border: 'rgba(255, 55, 95, 0.2)',
      text: 'var(--color-accent-pink)',
    };
    if (format === 'Long-form') return {
      bg: 'rgba(10, 132, 255, 0.12)',
      border: 'rgba(10, 132, 255, 0.2)',
      text: 'var(--color-accent-blue)',
    };
    return {
      bg: 'rgba(255, 159, 10, 0.12)',
      border: 'rgba(255, 159, 10, 0.2)',
      text: 'var(--color-accent-orange)',
    };
  };

  return (
    <div className="p-4 sm:p-6 overflow-y-auto" style={{ color: 'var(--color-text-primary)' }}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 sm:mb-8 animate-fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-serif mb-1 sm:mb-2 flex items-center gap-3">
                <Bookmark className="w-6 h-6 sm:w-8 sm:h-8" style={{ color: 'var(--color-accent-blue)' }} />
                {t.savedIdeas.title}
              </h1>
              <p className="text-sm" style={{ color: 'var(--color-text-tertiary)' }}>
                {t.savedIdeas.ideaCount(savedIdeas.length)}
              </p>
            </div>

            {savedIdeas.length > 0 && (
              <div className="flex gap-2">
                <button
                  onClick={exportIdeas}
                  className="glass glass-hover px-3 sm:px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2"
                  style={{ color: 'var(--color-text-secondary)' }}
                >
                  <Download className="w-4 h-4" />
                  {t.savedIdeas.export}
                </button>
                <button
                  onClick={clearAll}
                  className="glass glass-hover px-3 sm:px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2"
                  style={{ color: 'var(--color-accent-red)' }}
                >
                  <Trash2 className="w-4 h-4" />
                  {t.savedIdeas.clearAll}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Ideas Grid or Empty State */}
        {savedIdeas.length === 0 ? (
          <div className="flex items-center justify-center py-16 sm:py-20 animate-fade-in">
            <div className="glass-prominent rounded-3xl p-10 sm:p-14 text-center max-w-sm">
              <Bookmark
                className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4"
                style={{ color: 'var(--color-text-tertiary)', opacity: 0.4 }}
              />
              <h3 className="text-lg sm:text-xl font-semibold mb-2" style={{ color: 'var(--color-text-secondary)' }}>
                {t.savedIdeas.noSavedIdeas}
              </h3>
              <p className="text-sm" style={{ color: 'var(--color-text-tertiary)' }}>
                {t.savedIdeas.noSavedIdeasDescription}
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 stagger-children">
            {savedIdeas.map((idea) => {
              const accent = formatAccent(idea.format);

              return (
                <div
                  key={idea.id}
                  className="glass glass-hover rounded-2xl p-4 sm:p-5 flex flex-col animate-slide-up"
                >
                  {/* Header: badge + delete */}
                  <div className="flex items-center justify-between mb-3 sm:mb-4">
                    <span
                      className="text-xs px-2.5 py-1 rounded-full font-medium"
                      style={{
                        background: accent.bg,
                        border: `1px solid ${accent.border}`,
                        color: accent.text,
                      }}
                    >
                      {formatLabel(idea.format)}
                    </span>
                    <button
                      onClick={() => deleteIdea(idea.id)}
                      className="p-1.5 rounded-lg transition-colors duration-200"
                      style={{ color: 'var(--color-text-tertiary)' }}
                      title={t.savedIdeas.deleteIdea}
                      onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--color-accent-red)')}
                      onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--color-text-tertiary)')}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Trend Badge */}
                  <div className="mb-3">
                    <span
                      className="text-xs px-2 py-0.5 rounded-full font-medium"
                      style={{
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        color: 'var(--color-text-tertiary)',
                      }}
                    >
                      {t.savedIdeas.fromTrend} {idea.trendName}
                    </span>
                  </div>

                  {/* Title */}
                  <h4 className="font-bold text-base sm:text-lg mb-3 leading-snug" style={{ color: 'var(--color-text-primary)' }}>
                    {idea.title}
                  </h4>

                  {/* Content */}
                  <div className="space-y-3 flex-1">
                    <div
                      className="p-3 rounded-xl"
                      style={{
                        background: 'rgba(255, 255, 255, 0.03)',
                        border: '1px solid rgba(255, 255, 255, 0.06)',
                      }}
                    >
                      <div className="flex items-center gap-2 text-xs font-semibold mb-1" style={{ color: 'var(--color-text-tertiary)' }}>
                        <PlayCircle className="w-3 h-3" />
                        {t.ideas.theHook}
                      </div>
                      <p className="text-sm italic" style={{ color: 'var(--color-text-secondary)' }}>
                        &ldquo;{idea.hook}&rdquo;
                      </p>
                    </div>

                    <div
                      className="p-3 rounded-xl"
                      style={{
                        background: 'rgba(255, 255, 255, 0.03)',
                        border: '1px solid rgba(255, 255, 255, 0.06)',
                      }}
                    >
                      <div className="flex items-center gap-2 text-xs font-semibold mb-1" style={{ color: 'var(--color-text-tertiary)' }}>
                        <FileText className="w-3 h-3" />
                        {t.ideas.outline}
                      </div>
                      <p className="text-sm leading-relaxed whitespace-pre-line" style={{ color: 'var(--color-text-tertiary)' }}>
                        {idea.outline}
                      </p>
                    </div>
                  </div>

                  {/* Footer: Copy button */}
                  <div className="mt-4">
                    <button
                      onClick={() => copyToClipboard(idea)}
                      className="glass glass-hover w-full py-2 rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-all duration-200"
                      style={{
                        color: copiedId === idea.id ? 'var(--color-accent-green)' : 'var(--color-text-secondary)',
                      }}
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
                  <div className="mt-3 text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
                    {t.savedIdeas.savedOn} {new Date(idea.savedAt).toLocaleDateString()}
                  </div>
                </div>
              );
            })}
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
