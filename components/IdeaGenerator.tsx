import React, { useState } from 'react';
import { ContentIdea } from '../types';
import { Lightbulb, FileText, PlayCircle, Bookmark, Check } from 'lucide-react';
import { saveIdea } from './SavedIdeasPage';
import { useLanguage } from '../LanguageContext';

interface IdeaGeneratorProps {
  ideas: ContentIdea[];
  trendName: string;
}

export const IdeaGenerator: React.FC<IdeaGeneratorProps> = ({ ideas, trendName }) => {
  const { t } = useLanguage();
  const [savedIds, setSavedIds] = useState<Set<number>>(new Set());

  if (ideas.length === 0) return null;

  const handleSave = (idea: ContentIdea, index: number) => {
    saveIdea(idea, trendName);
    setSavedIds(prev => new Set(prev).add(index));

    setTimeout(() => {
      setSavedIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(index);
        return newSet;
      });
    }, 2000);
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
    <div className="mt-6 sm:mt-8 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 stagger-children">
      {ideas.map((idea, index) => {
        const accent = formatAccent(idea.format);
        const isSaved = savedIds.has(index);

        return (
          <div
            key={index}
            className="glass glass-hover rounded-2xl p-4 sm:p-5 flex flex-col animate-slide-up"
          >
            {/* Header: format badge + lightbulb */}
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
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center"
                style={{ background: 'rgba(255, 159, 10, 0.12)' }}
              >
                <Lightbulb className="w-4 h-4" style={{ color: 'var(--color-accent-orange)' }} />
              </div>
            </div>

            {/* Title */}
            <h4 className="font-bold text-base sm:text-lg mb-3 leading-snug" style={{ color: 'var(--color-text-primary)' }}>
              {idea.title}
            </h4>

            {/* Hook + Outline */}
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
                <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text-tertiary)' }}>
                  {idea.outline}
                </p>
              </div>
            </div>

            {/* Save button */}
            <button
              onClick={() => handleSave(idea, index)}
              className="mt-4 w-full py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all duration-200"
              style={{
                background: isSaved ? 'rgba(48, 209, 88, 0.15)' : 'var(--color-accent-blue)',
                color: isSaved ? 'var(--color-accent-green)' : '#fff',
              }}
            >
              {isSaved ? (
                <>
                  <Check className="w-4 h-4" />
                  {t.ideas.saved}
                </>
              ) : (
                <>
                  <Bookmark className="w-4 h-4" />
                  {t.ideas.saveIdea}
                </>
              )}
            </button>
          </div>
        );
      })}
    </div>
  );
};
