import React, { useState, useEffect } from 'react';
import { Key, Check, X, Loader2, AlertCircle, ExternalLink, Play, Globe } from 'lucide-react';
import { API_BASE_URL } from '../services/api';
import { useLanguage, Language } from '../LanguageContext';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApiKeySet: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, onApiKeySet }) => {
  const { t, lang, setLang } = useLanguage();
  const [youtubeKey, setYoutubeKey] = useState('');
  const [rapidapiKey, setRapidapiKey] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [validatingKey, setValidatingKey] = useState<'youtube' | 'rapidapi' | null>(null);
  const [isRunningPipeline, setIsRunningPipeline] = useState(false);
  const [validationStatus, setValidationStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [hasYoutubeKey, setHasYoutubeKey] = useState(false);
  const [hasRapidapiKey, setHasRapidapiKey] = useState(false);
  const [youtubeIsDefault, setYoutubeIsDefault] = useState(true);
  const [rapidapiIsDefault, setRapidapiIsDefault] = useState(true);
  const [showOverride, setShowOverride] = useState(false);

  useEffect(() => {
    if (isOpen) {
      checkExistingKeys();
    }
  }, [isOpen]);

  const checkExistingKeys = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/check-api-key`);
      const data = await response.json();
      setHasYoutubeKey(data.has_youtube_key || false);
      setHasRapidapiKey(data.has_rapidapi_key || false);
      setYoutubeIsDefault(data.youtube_is_default ?? true);
      setRapidapiIsDefault(data.rapidapi_is_default ?? true);
    } catch (error) {
      console.error('Failed to check API keys:', error);
    }
  };

  const handleSaveKey = async (keyType: 'youtube' | 'rapidapi') => {
    const keyValue = keyType === 'youtube' ? youtubeKey : rapidapiKey;
    if (!keyValue.trim()) {
      setValidationStatus('error');
      setMessage(keyType === 'youtube' ? t.settings.enterYoutubeKey : t.settings.enterRapidAPIKey);
      return;
    }

    setIsValidating(true);
    setValidatingKey(keyType);
    setValidationStatus('idle');
    setMessage('');

    try {
      const response = await fetch(`${API_BASE_URL}/api/set-api-key`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ api_key: keyValue, key_type: keyType }),
      });

      const data = await response.json();

      if (data.status === 'success') {
        setValidationStatus('success');
        setMessage(data.message);
        if (keyType === 'youtube') setHasYoutubeKey(true);
        else setHasRapidapiKey(true);
        onApiKeySet();
      } else {
        setValidationStatus('error');
        setMessage(data.message);
      }
    } catch (error) {
      setValidationStatus('error');
      setMessage(t.settings.failedToConnect);
    } finally {
      setIsValidating(false);
      setValidatingKey(null);
    }
  };

  const handleRunPipeline = async () => {
    setIsRunningPipeline(true);
    setMessage(t.settings.pipelineInfo);
    setValidationStatus('idle');

    try {
      const response = await fetch(`${API_BASE_URL}/api/run-pipeline`, {
        method: 'POST',
      });

      const data = await response.json();

      if (data.status === 'success') {
        setValidationStatus('success');
        setMessage(data.message);
        onApiKeySet();
      } else {
        setValidationStatus('error');
        setMessage(data.message);
      }
    } catch (error) {
      setValidationStatus('error');
      setMessage(t.settings.failedToPipeline);
    } finally {
      setIsRunningPipeline(false);
    }
  };

  if (!isOpen) return null;

  const hasAnyKey = hasYoutubeKey || hasRapidapiKey;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <Key className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">{t.settings.title}</h2>
              <p className="text-sm text-zinc-400">{t.settings.subtitle}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-zinc-800 rounded-lg transition-colors text-zinc-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Language Switcher */}
          <div className="bg-zinc-800/50 border border-zinc-700 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <Globe className="w-4 h-4 text-blue-400" />
              <span className="text-sm font-semibold text-zinc-200">{t.settings.language}</span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setLang('ru')}
                className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${lang === 'ru'
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                    : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white'
                  }`}
              >
                🇷🇺 {t.settings.languageRussian}
              </button>
              <button
                onClick={() => setLang('en')}
                className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${lang === 'en'
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                    : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white'
                  }`}
              >
                🇬🇧 {t.settings.languageEnglish}
              </button>
            </div>
          </div>

          {/* Status Banner - Default keys active */}
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-4 flex items-start gap-3">
            <Check className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-emerald-300">{t.settings.apiKeysActive}</p>
              <div className="text-xs mt-2 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-emerald-400/80">{t.settings.youtubeDataAPI}</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${youtubeIsDefault
                      ? 'bg-blue-500/20 text-blue-300'
                      : 'bg-emerald-500/20 text-emerald-300'
                    }`}>
                    {youtubeIsDefault ? t.settings.builtIn : t.settings.custom}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-emerald-400/80">{t.settings.tiktokScraptik}</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${rapidapiIsDefault
                      ? 'bg-blue-500/20 text-blue-300'
                      : 'bg-emerald-500/20 text-emerald-300'
                    }`}>
                    {rapidapiIsDefault ? t.settings.builtIn : t.settings.custom}
                  </span>
                </div>
              </div>
              <p className="text-[11px] text-emerald-400/50 mt-2">
                {t.settings.builtInKeysNote}
              </p>
            </div>
          </div>

          {/* Run Pipeline Button */}
          <button
            onClick={handleRunPipeline}
            disabled={isRunningPipeline}
            className="w-full px-4 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-zinc-700 disabled:text-zinc-500 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            {isRunningPipeline ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                {t.settings.runningPipeline}
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                {t.settings.runFullPipeline}
              </>
            )}
          </button>

          {/* Validation Message */}
          {message && (
            <div
              className={`rounded-lg p-4 flex items-start gap-3 ${validationStatus === 'success'
                  ? 'bg-emerald-500/10 border border-emerald-500/20'
                  : validationStatus === 'error'
                    ? 'bg-red-500/10 border border-red-500/20'
                    : 'bg-blue-500/10 border border-blue-500/20'
                }`}
            >
              {validationStatus === 'success' && <Check className="w-5 h-5 text-emerald-400 flex-shrink-0" />}
              {validationStatus === 'error' && <X className="w-5 h-5 text-red-400 flex-shrink-0" />}
              {validationStatus === 'idle' && <Loader2 className="w-5 h-5 text-blue-400 flex-shrink-0 animate-spin" />}
              <p
                className={`text-sm ${validationStatus === 'success'
                    ? 'text-emerald-300'
                    : validationStatus === 'error'
                      ? 'text-red-300'
                      : 'text-blue-300'
                  }`}
              >
                {message}
              </p>
            </div>
          )}

          {/* Override Section - Collapsible */}
          <div className="border border-zinc-700 rounded-lg overflow-hidden">
            <button
              onClick={() => setShowOverride(!showOverride)}
              className="w-full px-4 py-3 bg-zinc-800/50 hover:bg-zinc-800 text-sm text-zinc-400 flex items-center justify-between transition-colors"
            >
              <span className="flex items-center gap-2">
                <Key className="w-3.5 h-3.5" />
                {t.settings.useYourOwnKeys}
              </span>
              <span className="text-xs">{showOverride ? '▲' : '▼'}</span>
            </button>

            {showOverride && (
              <div className="p-4 space-y-4 border-t border-zinc-700">
                <p className="text-xs text-zinc-500">
                  {t.settings.overrideNote}
                </p>

                {/* YouTube override */}
                <div className="space-y-2">
                  <label className="text-xs font-medium text-zinc-400 flex items-center gap-1.5">
                    {t.settings.youtubeAPILabel}{' '}
                    <a
                      href="https://console.cloud.google.com/apis/credentials"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:text-blue-300 inline-flex items-center gap-0.5"
                    >
                      {t.settings.getFreeKey} <ExternalLink className="w-3 h-3" />
                    </a>
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="password"
                      value={youtubeKey}
                      onChange={(e) => setYoutubeKey(e.target.value)}
                      placeholder={t.settings.yourYoutubeKey}
                      className="flex-1 px-3 py-2 bg-zinc-800 border border-zinc-600 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm"
                      disabled={isValidating}
                    />
                    <button
                      onClick={() => handleSaveKey('youtube')}
                      disabled={isValidating || !youtubeKey.trim()}
                      className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-zinc-700 disabled:text-zinc-500 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-1.5"
                    >
                      {validatingKey === 'youtube' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                      {t.settings.save}
                    </button>
                  </div>
                </div>

                {/* RapidAPI override */}
                <div className="space-y-2">
                  <label className="text-xs font-medium text-zinc-400 flex items-center gap-1.5">
                    {t.settings.rapidAPILabel}{' '}
                    <a
                      href="https://rapidapi.com/scraptik-api-scraptik-api-default/api/scraptik"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:text-blue-300 inline-flex items-center gap-0.5"
                    >
                      {t.settings.getFreeKey} <ExternalLink className="w-3 h-3" />
                    </a>
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="password"
                      value={rapidapiKey}
                      onChange={(e) => setRapidapiKey(e.target.value)}
                      placeholder={t.settings.yourRapidAPIKey}
                      className="flex-1 px-3 py-2 bg-zinc-800 border border-zinc-600 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-sm"
                      disabled={isValidating}
                    />
                    <button
                      onClick={() => handleSaveKey('rapidapi')}
                      disabled={isValidating || !rapidapiKey.trim()}
                      className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 disabled:bg-zinc-700 disabled:text-zinc-500 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-1.5"
                    >
                      {validatingKey === 'rapidapi' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                      {t.settings.save}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Info Note */}
          <div className="text-xs text-zinc-500 space-y-1">
            <p>{t.settings.securityNote}</p>
            <p>{t.settings.quotaNote}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
