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
      // silently handle
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
    /* ── Overlay ── */
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-md animate-overlay"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      {/* ── Modal Panel ── */}
      <div
        className={[
          'glass-prominent w-full overflow-y-auto',
          /* Mobile: bottom-sheet */
          'fixed bottom-0 left-0 right-0 max-h-[90vh] rounded-t-3xl animate-sheet',
          /* sm+: centered card */
          'sm:relative sm:max-w-xl sm:mx-auto sm:my-8 sm:rounded-3xl sm:bottom-auto sm:max-h-[85vh] sm:animate-fade-in-scale',
        ].join(' ')}
      >
        {/* ── Drag Handle (mobile) ── */}
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div className="w-10 h-1 rounded-full bg-white/20" />
        </div>

        {/* ── Header ── */}
        <div className="px-5 pt-4 pb-3 sm:px-6 sm:pt-6 sm:pb-4 flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            {/* Glass icon circle */}
            <div className="w-11 h-11 rounded-2xl glass flex items-center justify-center shrink-0">
              <Key className="w-5 h-5" style={{ color: 'var(--color-accent-blue)' }} />
            </div>
            <div>
              <h2
                className="text-lg font-bold tracking-tight"
                style={{ color: 'var(--color-text-primary)' }}
              >
                {t.settings.title}
              </h2>
              <p
                className="text-[13px] leading-snug mt-0.5"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                {t.settings.subtitle}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full glass flex items-center justify-center transition-all duration-200 hover:bg-[var(--color-bg-glass-hover)] active:scale-90"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ── Content ── */}
        <div className="px-5 pb-6 sm:px-6 space-y-3.5 stagger-children">

          {/* ── Language Switcher ── */}
          <div className="glass rounded-2xl p-4 animate-fade-in">
            <div className="flex items-center gap-2 mb-3">
              <Globe className="w-4 h-4" style={{ color: 'var(--color-accent-blue)' }} />
              <span
                className="text-[13px] font-semibold"
                style={{ color: 'var(--color-text-primary)' }}
              >
                {t.settings.language}
              </span>
            </div>
            <div className="flex gap-2">
              {(['ru', 'en'] as const).map((code) => {
                const active = lang === code;
                const label = code === 'ru' ? t.settings.languageRussian : t.settings.languageEnglish;
                const flag = code === 'ru' ? '🇷🇺' : '🇬🇧';
                return (
                  <button
                    key={code}
                    onClick={() => setLang(code)}
                    className={[
                      'flex-1 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-300',
                      active
                        ? 'text-white shadow-lg'
                        : 'glass text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-glass-hover)] hover:text-[var(--color-text-primary)]',
                    ].join(' ')}
                    style={active ? {
                      backgroundColor: 'var(--color-accent-blue)',
                      boxShadow: 'var(--shadow-glow-blue)',
                    } : undefined}
                  >
                    {flag} {label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── API Status Banner ── */}
          <div
            className="glass rounded-2xl p-4 animate-fade-in"
            style={{
              borderColor: 'rgba(48, 209, 88, 0.2)',
              background: 'rgba(48, 209, 88, 0.06)',
            }}
          >
            <div className="flex items-start gap-3">
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
                style={{ background: 'rgba(48, 209, 88, 0.15)' }}
              >
                <Check className="w-4 h-4" style={{ color: 'var(--color-accent-green)' }} />
              </div>
              <div className="flex-1 min-w-0">
                <p
                  className="text-sm font-semibold"
                  style={{ color: 'var(--color-accent-green)' }}
                >
                  {t.settings.apiKeysActive}
                </p>

                {/* Status rows */}
                <div className="mt-2.5 space-y-2">
                  {/* YouTube row */}
                  <div className="flex items-center justify-between">
                    <span className="text-xs" style={{ color: 'rgba(48, 209, 88, 0.7)' }}>
                      {t.settings.youtubeDataAPI}
                    </span>
                    <span
                      className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold tracking-wide uppercase"
                      style={youtubeIsDefault
                        ? { background: 'rgba(10, 132, 255, 0.15)', color: 'var(--color-accent-blue)' }
                        : { background: 'rgba(48, 209, 88, 0.15)', color: 'var(--color-accent-green)' }
                      }
                    >
                      {youtubeIsDefault ? t.settings.builtIn : t.settings.custom}
                    </span>
                  </div>
                  {/* TikTok row */}
                  <div className="flex items-center justify-between">
                    <span className="text-xs" style={{ color: 'rgba(48, 209, 88, 0.7)' }}>
                      {t.settings.tiktokScraptik}
                    </span>
                    <span
                      className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold tracking-wide uppercase"
                      style={rapidapiIsDefault
                        ? { background: 'rgba(10, 132, 255, 0.15)', color: 'var(--color-accent-blue)' }
                        : { background: 'rgba(48, 209, 88, 0.15)', color: 'var(--color-accent-green)' }
                      }
                    >
                      {rapidapiIsDefault ? t.settings.builtIn : t.settings.custom}
                    </span>
                  </div>
                </div>

                <p className="text-[11px] mt-2.5" style={{ color: 'rgba(48, 209, 88, 0.4)' }}>
                  {t.settings.builtInKeysNote}
                </p>
              </div>
            </div>
          </div>

          {/* ── Run Pipeline Button ── */}
          <button
            onClick={handleRunPipeline}
            disabled={isRunningPipeline}
            className="w-full px-4 py-3.5 rounded-xl text-sm font-semibold text-white transition-all duration-300 flex items-center justify-center gap-2.5 active:scale-[0.97] disabled:opacity-40 disabled:pointer-events-none"
            style={{
              backgroundColor: 'var(--color-accent-green)',
              boxShadow: isRunningPipeline ? 'none' : 'var(--shadow-glow-green)',
            }}
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

          {/* ── Validation Message ── */}
          {message && (
            <div
              className="glass rounded-2xl p-4 flex items-start gap-3 animate-fade-in"
              style={{
                borderColor: validationStatus === 'success'
                  ? 'rgba(48, 209, 88, 0.25)'
                  : validationStatus === 'error'
                    ? 'rgba(255, 69, 58, 0.25)'
                    : 'rgba(10, 132, 255, 0.25)',
                background: validationStatus === 'success'
                  ? 'rgba(48, 209, 88, 0.06)'
                  : validationStatus === 'error'
                    ? 'rgba(255, 69, 58, 0.06)'
                    : 'rgba(10, 132, 255, 0.06)',
              }}
            >
              {validationStatus === 'success' && (
                <Check className="w-5 h-5 shrink-0" style={{ color: 'var(--color-accent-green)' }} />
              )}
              {validationStatus === 'error' && (
                <X className="w-5 h-5 shrink-0" style={{ color: 'var(--color-accent-red)' }} />
              )}
              {validationStatus === 'idle' && (
                <Loader2
                  className="w-5 h-5 shrink-0 animate-spin"
                  style={{ color: 'var(--color-accent-blue)' }}
                />
              )}
              <p
                className="text-sm leading-relaxed"
                style={{
                  color: validationStatus === 'success'
                    ? 'var(--color-accent-green)'
                    : validationStatus === 'error'
                      ? 'var(--color-accent-red)'
                      : 'var(--color-accent-blue)',
                }}
              >
                {message}
              </p>
            </div>
          )}

          {/* ── Override Section (Collapsible) ── */}
          <div className="glass rounded-2xl overflow-hidden">
            <button
              onClick={() => setShowOverride(!showOverride)}
              className="w-full px-4 py-3.5 text-sm flex items-center justify-between transition-all duration-200 hover:bg-[var(--color-bg-glass-hover)]"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              <span className="flex items-center gap-2.5">
                <Key className="w-3.5 h-3.5" />
                <span className="font-medium">{t.settings.useYourOwnKeys}</span>
              </span>
              <span
                className="text-xs transition-transform duration-300"
                style={{ transform: showOverride ? 'rotate(180deg)' : 'rotate(0deg)' }}
              >
                ▼
              </span>
            </button>

            {showOverride && (
              <div
                className="px-4 pb-4 space-y-4 animate-fade-in"
                style={{ borderTop: '1px solid var(--color-border-glass)' }}
              >
                <p className="text-xs pt-3" style={{ color: 'var(--color-text-tertiary)' }}>
                  {t.settings.overrideNote}
                </p>

                {/* YouTube override */}
                <div className="space-y-2">
                  <label
                    className="text-xs font-medium flex items-center gap-1.5"
                    style={{ color: 'var(--color-text-secondary)' }}
                  >
                    {t.settings.youtubeAPILabel}{' '}
                    <a
                      href="https://console.cloud.google.com/apis/credentials"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-0.5 transition-opacity duration-200 hover:opacity-80"
                      style={{ color: 'var(--color-accent-blue)' }}
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
                      disabled={isValidating}
                      className="flex-1 px-3.5 py-2.5 rounded-xl text-sm outline-none transition-all duration-200 placeholder:opacity-40"
                      style={{
                        background: 'var(--color-bg-glass)',
                        border: '1px solid var(--color-border-glass)',
                        color: 'var(--color-text-primary)',
                      }}
                      onFocus={(e) => {
                        e.currentTarget.style.borderColor = 'rgba(255, 69, 58, 0.5)';
                        e.currentTarget.style.boxShadow = '0 0 0 3px rgba(255, 69, 58, 0.1)';
                      }}
                      onBlur={(e) => {
                        e.currentTarget.style.borderColor = 'var(--color-border-glass)';
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                    />
                    <button
                      onClick={() => handleSaveKey('youtube')}
                      disabled={isValidating || !youtubeKey.trim()}
                      className="px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all duration-200 flex items-center gap-1.5 active:scale-95 disabled:opacity-30 disabled:pointer-events-none"
                      style={{ backgroundColor: 'var(--color-accent-red)' }}
                    >
                      {validatingKey === 'youtube'
                        ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        : <Check className="w-3.5 h-3.5" />
                      }
                      {t.settings.save}
                    </button>
                  </div>
                </div>

                {/* RapidAPI override */}
                <div className="space-y-2">
                  <label
                    className="text-xs font-medium flex items-center gap-1.5"
                    style={{ color: 'var(--color-text-secondary)' }}
                  >
                    {t.settings.rapidAPILabel}{' '}
                    <a
                      href="https://rapidapi.com/scraptik-api-scraptik-api-default/api/scraptik"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-0.5 transition-opacity duration-200 hover:opacity-80"
                      style={{ color: 'var(--color-accent-blue)' }}
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
                      disabled={isValidating}
                      className="flex-1 px-3.5 py-2.5 rounded-xl text-sm outline-none transition-all duration-200 placeholder:opacity-40"
                      style={{
                        background: 'var(--color-bg-glass)',
                        border: '1px solid var(--color-border-glass)',
                        color: 'var(--color-text-primary)',
                      }}
                      onFocus={(e) => {
                        e.currentTarget.style.borderColor = 'rgba(100, 210, 255, 0.5)';
                        e.currentTarget.style.boxShadow = '0 0 0 3px rgba(100, 210, 255, 0.1)';
                      }}
                      onBlur={(e) => {
                        e.currentTarget.style.borderColor = 'var(--color-border-glass)';
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                    />
                    <button
                      onClick={() => handleSaveKey('rapidapi')}
                      disabled={isValidating || !rapidapiKey.trim()}
                      className="px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all duration-200 flex items-center gap-1.5 active:scale-95 disabled:opacity-30 disabled:pointer-events-none"
                      style={{ backgroundColor: 'var(--color-accent-teal)' }}
                    >
                      {validatingKey === 'rapidapi'
                        ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        : <Check className="w-3.5 h-3.5" />
                      }
                      {t.settings.save}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ── Info Notes ── */}
          <div className="space-y-1 px-1 pb-1">
            <p className="text-[11px] leading-relaxed" style={{ color: 'var(--color-text-tertiary)' }}>
              {t.settings.securityNote}
            </p>
            <p className="text-[11px] leading-relaxed" style={{ color: 'var(--color-text-tertiary)' }}>
              {t.settings.quotaNote}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
