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

    // Reset saved state after 2 seconds
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

  return (
    <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {ideas.map((idea, index) => (
        <div key={index} className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 flex flex-col hover:border-zinc-700 transition-colors">
          <div className="flex items-center justify-between mb-4">
            <span className={`text-xs px-2 py-1 rounded-md font-medium
              ${idea.format === 'Short' ? 'bg-pink-500/10 text-pink-400' :
                idea.format === 'Long-form' ? 'bg-blue-500/10 text-blue-400' : 'bg-amber-500/10 text-amber-400'
              }
            `}>
              {formatLabel(idea.format)}
            </span>
            <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center">
              <Lightbulb className="w-4 h-4 text-yellow-500" />
            </div>
          </div>

          <h4 className="font-bold text-lg mb-3 leading-snug text-zinc-100">
            {idea.title}
          </h4>

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
              <p className="text-sm text-zinc-400 leading-relaxed">{idea.outline}</p>
            </div>
          </div>

          <button
            onClick={() => handleSave(idea, index)}
            className="mt-4 w-full py-2 bg-zinc-100 text-zinc-950 rounded-lg text-sm font-bold hover:bg-white transition-colors flex items-center justify-center gap-2"
          >
            {savedIds.has(index) ? (
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
      ))}
    </div>
  );
};