import React, { useState, useEffect } from 'react';
import {
  X,
  Server,
  Zap,
  Globe,
  CheckCircle2,
  Clock,
  RefreshCw,
  Sliders,
  Copy,
  Check
} from 'lucide-react';
import {
  getApiMode,
  setApiMode,
  getApiBaseUrl,
  setApiBaseUrl,
  resetApiConfig,
  type ApiMode
} from '../../services/apiConfig';
import { runApiDiagnostics, type DiagnosticsSummary } from '../../services/apiDiagnostics';
import { Button } from './Button';
import { Badge } from './Badge';

interface ApiConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ApiConfigModal: React.FC<ApiConfigModalProps> = ({ isOpen, onClose }) => {
  const [mode, setLocalMode] = useState<ApiMode>(getApiMode());
  const [baseUrl, setLocalBaseUrl] = useState<string>(getApiBaseUrl());
  const [runningDiagnostics, setRunningDiagnostics] = useState(false);
  const [diagnosticsResult, setDiagnosticsResult] = useState<DiagnosticsSummary | null>(null);
  const [copiedUrl, setCopiedUrl] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setLocalMode(getApiMode());
      setLocalBaseUrl(getApiBaseUrl());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    setApiMode(mode);
    setApiBaseUrl(baseUrl);
    onClose();
  };

  const handleReset = () => {
    resetApiConfig();
    setLocalMode(getApiMode());
    setLocalBaseUrl(getApiBaseUrl());
    setDiagnosticsResult(null);
  };

  const handleRunTests = async () => {
    setRunningDiagnostics(true);
    try {
      const summary = await runApiDiagnostics(baseUrl);
      setDiagnosticsResult(summary);
    } catch (err) {
      console.error('Diagnostic error', err);
    } finally {
      setRunningDiagnostics(false);
    }
  };

  const copyEndpointUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl max-h-[90vh] bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/90 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                API Configuration & Integration Diagnostics
              </h2>
              <p className="text-xs text-slate-400">
                Switch between mock demo mode and your teammates' live backend endpoints
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1 text-xs sm:text-sm">
          {/* Mode Switch Card */}
          <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-white flex items-center gap-1.5">
                  <Sliders className="w-4 h-4 text-indigo-400" />
                  Service Layer Operating Mode
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Choose whether the UI consumes offline mock state or issues real HTTP network requests.
                </p>
              </div>
              <Badge variant={mode === 'real' ? 'primary' : 'success'} size="md">
                {mode === 'real' ? 'Real API Mode' : 'Mock Mode (Active)'}
              </Badge>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => setLocalMode('mock')}
                className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                  mode === 'mock'
                    ? 'bg-indigo-600/15 border-indigo-500/50 ring-1 ring-indigo-500/40'
                    : 'bg-slate-900 border-slate-800 hover:border-slate-700 text-slate-400'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-white flex items-center gap-1.5">
                    <CheckCircle2 className={`w-4 h-4 ${mode === 'mock' ? 'text-indigo-400' : 'text-slate-500'}`} />
                    Mock Data Mode
                  </span>
                  <span className="text-[10px] uppercase font-bold text-emerald-400 px-1.5 py-0.5 rounded bg-emerald-500/10">
                    Offline
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1.5">
                  Uses instant simulated latency with full Rahul Sharma historical memory, brief, and commitments.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setLocalMode('real')}
                className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                  mode === 'real'
                    ? 'bg-indigo-600/15 border-indigo-500/50 ring-1 ring-indigo-500/40'
                    : 'bg-slate-900 border-slate-800 hover:border-slate-700 text-slate-400'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-white flex items-center gap-1.5">
                    <Zap className={`w-4 h-4 ${mode === 'real' ? 'text-amber-400' : 'text-slate-500'}`} />
                    Real API Mode
                  </span>
                  <span className="text-[10px] uppercase font-bold text-amber-400 px-1.5 py-0.5 rounded bg-amber-500/10">
                    Live
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1.5">
                  Directs all 6 endpoints to the configured base URL. Strictly surfaces network and response errors.
                </p>
              </button>
            </div>
          </div>

          {/* Configurable Base URL */}
          <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3">
            <div>
              <label className="block font-semibold text-white mb-1">
                API Base URL
              </label>
              <p className="text-xs text-slate-400 mb-2">
                The root origin where your teammates' backend server is running.
              </p>
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Globe className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="url"
                    value={baseUrl}
                    onChange={(e) => setLocalBaseUrl(e.target.value)}
                    placeholder="http://localhost:8000"
                    className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs sm:text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => copyEndpointUrl(baseUrl)}
                  className="px-2.5 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-300 hover:text-white hover:border-slate-600 transition-colors"
                  title="Copy Base URL"
                >
                  {copiedUrl ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Quick Presets */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="text-xs text-slate-500">Presets:</span>
              {['http://localhost:8000', 'http://localhost:5000', 'http://localhost:3000', 'http://127.0.0.1:8000'].map(
                (preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setLocalBaseUrl(preset)}
                    className="px-2 py-0.5 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 text-[11px] font-mono text-slate-300 hover:text-indigo-300 transition-colors"
                  >
                    {preset}
                  </button>
                )
              )}
            </div>
          </div>

          {/* Live Endpoint Diagnostics */}
          <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-semibold text-white flex items-center gap-2">
                  Live Endpoint Connectivity Health Check
                </h3>
                <p className="text-xs text-slate-400">
                  Runs test requests across all 6 contract endpoints against <span className="font-mono text-slate-300">{baseUrl}</span>
                </p>
              </div>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                isLoading={runningDiagnostics}
                leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
                onClick={handleRunTests}
              >
                Test All Endpoints Now
              </Button>
            </div>

            {/* Results Table */}
            {diagnosticsResult && (
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between text-xs px-1">
                  <span className="text-slate-400">
                    Tested {diagnosticsResult.totalTested} endpoints at{' '}
                    {new Date(diagnosticsResult.timestamp).toLocaleTimeString()}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-emerald-400 font-medium">
                      {diagnosticsResult.passedCount} Passed
                    </span>
                    <span>•</span>
                    <span className="text-rose-400 font-medium">
                      {diagnosticsResult.blockedCount} Blocked / Offline
                    </span>
                    {diagnosticsResult.mismatchCount > 0 && (
                      <>
                        <span>•</span>
                        <span className="text-amber-400 font-medium">
                          {diagnosticsResult.mismatchCount} Mismatch
                        </span>
                      </>
                    )}
                  </div>
                </div>

                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                  {diagnosticsResult.results.map((res, i) => (
                    <div
                      key={i}
                      className={`p-3 rounded-lg border text-xs flex flex-col gap-1.5 ${
                        res.status === 'passed'
                          ? 'bg-emerald-950/20 border-emerald-500/30'
                          : res.status === 'blocked'
                          ? 'bg-rose-950/20 border-rose-500/30'
                          : res.status === 'mismatch'
                          ? 'bg-amber-950/20 border-amber-500/30'
                          : 'bg-slate-900 border-slate-800'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 font-mono">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                              res.method === 'GET'
                                ? 'bg-sky-500/20 text-sky-300'
                                : 'bg-emerald-500/20 text-emerald-300'
                            }`}
                          >
                            {res.method}
                          </span>
                          <span className="text-white font-semibold">{res.endpoint}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-slate-500 text-[10px] flex items-center gap-1 font-mono">
                            <Clock className="w-3 h-3" />
                            {res.latencyMs}ms
                          </span>
                          <Badge
                            variant={
                              res.status === 'passed'
                                ? 'success'
                                : res.status === 'blocked'
                                ? 'danger'
                                : res.status === 'mismatch'
                                ? 'warning'
                                : 'default'
                            }
                            size="sm"
                          >
                            {res.status === 'passed'
                              ? 'Connected'
                              : res.status === 'blocked'
                              ? 'Blocked'
                              : res.status === 'mismatch'
                              ? 'Mismatch'
                              : 'Error'}
                          </Badge>
                        </div>
                      </div>

                      <div className="text-[11px] text-slate-300">
                        <span className="font-semibold text-slate-400">{res.name}: </span>
                        <span>{res.message}</span>
                      </div>

                      {res.responseSnippet && (
                        <div className="mt-1 p-2 rounded bg-slate-950 border border-slate-800/80 font-mono text-[10px] text-slate-400 overflow-x-auto">
                          {res.responseSnippet}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {!diagnosticsResult && (
              <div className="p-4 rounded-lg bg-slate-900 border border-dashed border-slate-800 text-center text-xs text-slate-400">
                Click <span className="text-indigo-400 font-medium">"Test All Endpoints Now"</span> to verify connectivity to your teammates' server.
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/90 flex items-center justify-between shrink-0">
          <Button type="button" variant="ghost" size="sm" onClick={handleReset}>
            Reset to Defaults
          </Button>

          <div className="flex items-center gap-2">
            <Button type="button" variant="outline" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button type="button" variant="gradient" size="sm" onClick={handleSave}>
              Save & Apply
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
