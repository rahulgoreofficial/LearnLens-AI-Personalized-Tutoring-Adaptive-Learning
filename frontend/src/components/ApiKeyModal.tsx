import React, { useState } from 'react';
import { X, Key, Shield, CheckCircle2, AlertCircle, ExternalLink } from 'lucide-react';
import { configureApiKey } from '../api/client';

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  isConfigured: boolean;
}

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  isConfigured,
}) => {
  const [keyInput, setKeyInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyInput.trim()) {
      setError('Please enter a valid Gemini API key');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      await configureApiKey(keyInput.trim());
      setSuccessMsg('Gemini API Key configured successfully!');
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1000);
    } catch (err: any) {
      setError(err.message || 'Failed to configure API key');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Key className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">Configure Gemini API Key</h3>
              <p className="text-xs text-slate-400">Official google-genai integration</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3 text-xs text-slate-400 space-y-1.5">
            <div className="flex items-center gap-1.5 text-slate-300 font-medium">
              <Shield className="h-4 w-4 text-emerald-400" />
              <span>Server-Side Security</span>
            </div>
            <p>
              Your API key is sent directly to your local FastAPI backend and never committed to Git or exposed in client bundles.
            </p>
            <p className="text-slate-500">
              You can also define <code className="text-indigo-300">GEMINI_API_KEY</code> in <code className="text-indigo-300">backend/.env</code>.
            </p>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Gemini API Key
            </label>
            <input
              type="password"
              placeholder={isConfigured ? '••••••••••••••••••••••••' : 'AIzaSy...'}
              value={keyInput}
              onChange={(e) => setKeyInput(e.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Need an API key?</span>
            <a
              href="https://aistudio.google.com/app/apikey"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1 text-indigo-400 hover:text-indigo-300 transition"
            >
              Get from Google AI Studio
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>

          {error && (
            <div className="flex items-center gap-2 rounded-lg bg-rose-500/10 border border-rose-500/20 p-2.5 text-xs text-rose-300">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="flex items-center gap-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-2.5 text-xs text-emerald-300">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
              <span>{successMsg}</span>
            </div>
          )}

          <div className="flex justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl px-4 py-2 text-xs font-medium text-slate-300 hover:bg-slate-800 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-medium text-white shadow-md shadow-indigo-600/30 hover:bg-indigo-500 transition disabled:opacity-50"
            >
              {loading ? 'Validating...' : 'Save & Connect'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
