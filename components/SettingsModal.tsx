import React, { useState, useEffect } from 'react';
import { Key, Check, X, Loader2, AlertCircle, ExternalLink, Play } from 'lucide-react';
import { API_BASE_URL } from '../services/api';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApiKeySet: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, onApiKeySet }) => {
  const [apiKey, setApiKey] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [isRunningPipeline, setIsRunningPipeline] = useState(false);
  const [validationStatus, setValidationStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [hasExistingKey, setHasExistingKey] = useState(false);

  useEffect(() => {
    if (isOpen) {
      checkExistingKey();
    }
  }, [isOpen]);

  const checkExistingKey = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/check-api-key`);
      const data = await response.json();
      setHasExistingKey(data.has_api_key);
    } catch (error) {
      console.error('Failed to check API key:', error);
    }
  };

  const handleSaveApiKey = async () => {
    if (!apiKey.trim()) {
      setValidationStatus('error');
      setMessage('Please enter an API key');
      return;
    }

    setIsValidating(true);
    setValidationStatus('idle');
    setMessage('');

    try {
      const response = await fetch(`${API_BASE_URL}/api/set-api-key`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ api_key: apiKey }),
      });

      const data = await response.json();

      if (data.status === 'success') {
        setValidationStatus('success');
        setMessage(data.message);
        setHasExistingKey(true);
        onApiKeySet();
        
        // Auto-close after 2 seconds
        setTimeout(() => {
          onClose();
        }, 2000);
      } else {
        setValidationStatus('error');
        setMessage(data.message);
      }
    } catch (error) {
      setValidationStatus('error');
      setMessage('Failed to connect to backend. Make sure the server is running.');
    } finally {
      setIsValidating(false);
    }
  };

  const handleRunPipeline = async () => {
    setIsRunningPipeline(true);
    setMessage('Running pipeline... This may take 2-3 minutes.');

    try {
      const response = await fetch(`${API_BASE_URL}/api/run-pipeline`, {
        method: 'POST',
      });

      const data = await response.json();

      if (data.status === 'success') {
        setMessage(`✅ ${data.message}`);
        onApiKeySet(); // Trigger refresh
      } else {
        setMessage(`❌ ${data.message}`);
      }
    } catch (error) {
      setMessage('❌ Failed to run pipeline. Check backend logs.');
    } finally {
      setIsRunningPipeline(false);
    }
  };

  if (!isOpen) return null;

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
              <h2 className="text-xl font-bold text-white">API Settings</h2>
              <p className="text-sm text-zinc-400">Configure your RapidAPI YouTube V2 key</p>
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
          {/* Status Banner */}
          {hasExistingKey && (
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-4 flex items-start gap-3">
              <Check className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-emerald-300">API Key Configured</p>
                <p className="text-xs text-emerald-400/70 mt-1">
                  Your RapidAPI key is set and ready to use. You can update it below if needed.
                </p>
              </div>
            </div>
          )}

          {/* Instructions */}
          <div className="bg-zinc-800/50 border border-zinc-700 rounded-lg p-4 space-y-3">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-blue-400" />
              How to Get Your API Key
            </h3>
            <ol className="text-sm text-zinc-300 space-y-2 ml-6 list-decimal">
              <li>
                Visit{' '}
                <a
                  href="https://rapidapi.com/ytdlfree/api/youtube-v2"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:text-blue-300 inline-flex items-center gap-1"
                >
                  RapidAPI YouTube V2
                  <ExternalLink className="w-3 h-3" />
                </a>
              </li>
              <li>Sign up or log in to RapidAPI (free account)</li>
              <li>Subscribe to the YouTube V2 API (free tier available)</li>
              <li>Copy your <code className="px-1.5 py-0.5 bg-zinc-700 rounded text-xs">X-RapidAPI-Key</code></li>
              <li>Paste it below and click "Save & Validate"</li>
            </ol>
          </div>

          {/* API Key Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-300">
              RapidAPI Key
            </label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Enter your RapidAPI key..."
              className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isValidating}
            />
          </div>

          {/* Validation Message */}
          {message && (
            <div
              className={`rounded-lg p-4 flex items-start gap-3 ${
                validationStatus === 'success'
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
                className={`text-sm ${
                  validationStatus === 'success'
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

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={handleSaveApiKey}
              disabled={isValidating || !apiKey.trim()}
              className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-700 disabled:text-zinc-500 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {isValidating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Validating...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  Save & Validate
                </>
              )}
            </button>

            {hasExistingKey && (
              <button
                onClick={handleRunPipeline}
                disabled={isRunningPipeline}
                className="px-4 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-zinc-700 disabled:text-zinc-500 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                {isRunningPipeline ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Running...
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4" />
                    Run Pipeline
                  </>
                )}
              </button>
            )}
          </div>

          {/* Info Note */}
          <div className="text-xs text-zinc-500 space-y-1">
            <p>🔒 Your API key is stored securely in the backend runtime memory.</p>
            <p>💡 The key is not saved to disk and will need to be re-entered after server restart.</p>
            <p>⚡ Free tier: 500 requests/month (sufficient for testing)</p>
          </div>
        </div>
      </div>
    </div>
  );
};
