import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  RefreshCw, 
  Server, 
  Database, 
  Key, 
  Terminal, 
  Copy, 
  Check, 
  ChevronDown, 
  ChevronUp,
  LogIn
} from 'lucide-react';
import api, { testApiConnection, checkHealth, API_BASE_URL } from '../services/api';

export default function ApiDebugger() {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [healthResult, setHealthResult] = useState(null);
  const [authResult, setAuthResult] = useState(null);
  const [copied, setCopied] = useState(false);
  const [testEmail, setTestEmail] = useState('test@test.com');
  const [testPassword, setTestPassword] = useState('password');
  const [loginLoading, setLoginLoading] = useState(false);

  const runAllDiagnostics = async () => {
    setLoading(true);
    setTestResult(null);
    setHealthResult(null);
    setAuthResult(null);

    // 1. Test /api/test
    const tRes = await testApiConnection();
    setTestResult(tRes);

    // 2. Test /api/health
    const hRes = await checkHealth();
    setHealthResult(hRes);

    // 3. Test Auth profile if token exists
    const storedUser = localStorage.getItem('smartfyp_user');
    if (storedUser) {
      try {
        const u = JSON.parse(storedUser);
        if (u.token) {
          const authRes = await api.get('/api/users/profile');
          setAuthResult({ success: true, data: authRes.data });
        }
      } catch (err) {
        setAuthResult({ 
          success: false, 
          error: err.response?.data?.message || err.message,
          status: err.response?.status
        });
      }
    }

    setLoading(false);
  };

  const handleTestLogin = async (e) => {
    e?.preventDefault();
    setLoginLoading(true);
    try {
      const res = await api.post('/api/auth/login', {
        email: testEmail,
        password: testPassword,
      });
      setAuthResult({
        success: true,
        message: 'Login successful! Token generated.',
        data: res.data,
      });
    } catch (err) {
      setAuthResult({
        success: false,
        error: err.response?.data?.message || err.message,
        status: err.response?.status,
        details: err.response?.data,
      });
    } finally {
      setLoginLoading(false);
    }
  };

  const copyDiagnosticReport = () => {
    const report = {
      timestamp: new Date().toISOString(),
      clientEnvironment: {
        viteApiUrl: import.meta.env.VITE_API_URL || '(empty / same origin)',
        currentOrigin: typeof window !== 'undefined' ? window.location.origin : '',
        computedBaseUrl: API_BASE_URL || '(relative /api)',
        isDev: import.meta.env.DEV,
      },
      apiTestEndpoint: testResult,
      healthEndpoint: healthResult,
      authCheck: authResult,
    };

    navigator.clipboard.writeText(JSON.stringify(report, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  useEffect(() => {
    if (isOpen && !testResult && !loading) {
      runAllDiagnostics();
    }
  }, [isOpen]);

  const isConnected = testResult?.success;
  const isDbConnected = healthResult?.data?.database === 'connected' || testResult?.data?.database?.connected;

  return (
    <div id="api-debugger-container" className="fixed bottom-4 right-4 z-50 font-sans text-xs">
      {/* Floating Toggle Button */}
      {!isOpen && (
        <button
          id="open-api-debugger-btn"
          onClick={() => setIsOpen(true)}
          className={`flex items-center gap-2 px-3 py-2 rounded-full shadow-lg border transition-all duration-200 ${
            testResult?.success === false
              ? 'bg-red-900/90 text-red-200 border-red-700 hover:bg-red-800'
              : 'bg-slate-900/95 text-slate-200 border-slate-700 hover:bg-slate-800 hover:text-white'
          }`}
          title="Click to inspect Backend & API Connectivity"
        >
          <Activity className={`w-4 h-4 ${loading ? 'animate-spin text-indigo-400' : 'text-emerald-400'}`} />
          <span className="font-semibold tracking-wide">API Diagnostic</span>
          {testResult && (
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                isConnected && isDbConnected ? 'bg-emerald-400' : 'bg-amber-400 animate-pulse'
              }`}
            />
          )}
        </button>
      )}

      {/* Expanded Debugger Modal */}
      {isOpen && (
        <div 
          id="api-debugger-panel" 
          className="w-[90vw] max-w-md bg-slate-950 text-slate-100 rounded-xl border border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in slide-in-from-bottom-5 duration-200"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-slate-900 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Server className="w-4 h-4 text-indigo-400" />
              <h3 className="font-semibold text-sm text-slate-100">Vercel API & Backend Inspector</h3>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={runAllDiagnostics}
                disabled={loading}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition"
                title="Rerun Diagnostics"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-indigo-400' : ''}`} />
              </button>
              <button
                onClick={copyDiagnosticReport}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition"
                title="Copy Full Report to Clipboard"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition"
                title="Minimize Inspector"
              >
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Body Content */}
          <div className="p-4 space-y-3 overflow-y-auto flex-1 text-slate-300">
            {/* Status Badges */}
            <div className="grid grid-cols-2 gap-2">
              {/* Server Route Status */}
              <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800 flex flex-col gap-1">
                <span className="text-[11px] text-slate-400 flex items-center gap-1.5">
                  <Server className="w-3.5 h-3.5 text-slate-400" /> API Route (/api)
                </span>
                <div className="flex items-center gap-1.5">
                  {loading ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-slate-400" />
                  ) : isConnected ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span className="font-semibold text-emerald-400">Online & Reached</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-3.5 h-3.5 text-red-400 shrink-0" />
                      <span className="font-semibold text-red-400">Disconnected (404/Timeout)</span>
                    </>
                  )}
                </div>
              </div>

              {/* Database Status */}
              <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800 flex flex-col gap-1">
                <span className="text-[11px] text-slate-400 flex items-center gap-1.5">
                  <Database className="w-3.5 h-3.5 text-slate-400" /> MongoDB Atlas
                </span>
                <div className="flex items-center gap-1.5">
                  {loading ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-slate-400" />
                  ) : isDbConnected ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span className="font-semibold text-emerald-400">Connected</span>
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span className="font-semibold text-amber-400">Check URI / IP Access</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Config & Environment Summary */}
            <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1.5">
              <div className="font-semibold text-slate-200 text-[11px] uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5 text-indigo-400" /> Client Environment Info
              </div>
              <div className="flex justify-between items-center text-slate-400">
                <span>VITE_API_URL:</span>
                <code className="text-indigo-300 font-mono">
                  {import.meta.env.VITE_API_URL || '(empty = same-origin /api)'}
                </code>
              </div>
              <div className="flex justify-between items-center text-slate-400">
                <span>Resolved Base URL:</span>
                <code className="text-slate-200 font-mono">{API_BASE_URL || '(relative path)'}</code>
              </div>
              <div className="flex justify-between items-center text-slate-400">
                <span>Browser Host:</span>
                <code className="text-slate-300 font-mono">
                  {typeof window !== 'undefined' ? window.location.host : ''}
                </code>
              </div>
            </div>

            {/* Serverless Environment Detection from /api/test */}
            {testResult?.data?.environment && (
              <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1.5">
                <div className="font-semibold text-slate-200 text-[11px] uppercase tracking-wider mb-1 flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-emerald-400" /> Serverless Variables Status
                </div>
                <div className="flex justify-between items-center text-slate-400">
                  <span>MONGODB_URI / MONGO_URI:</span>
                  {testResult.data.environment.hasMongoUri ? (
                    <span className="text-emerald-400 font-medium flex items-center gap-1">
                      <Check className="w-3 h-3" /> Configured
                    </span>
                  ) : (
                    <span className="text-red-400 font-medium flex items-center gap-1">
                      <XCircle className="w-3 h-3" /> Missing on Vercel
                    </span>
                  )}
                </div>
                <div className="flex justify-between items-center text-slate-400">
                  <span>JWT_SECRET:</span>
                  {testResult.data.environment.hasJwtSecret ? (
                    <span className="text-emerald-400 font-medium flex items-center gap-1">
                      <Check className="w-3 h-3" /> Configured
                    </span>
                  ) : (
                    <span className="text-amber-400 font-medium flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" /> Missing
                    </span>
                  )}
                </div>
                <div className="flex justify-between items-center text-slate-400">
                  <span>Serverless DB Counts:</span>
                  <span className="text-slate-200 font-mono">
                    {healthResult?.data?.counts
                      ? `${healthResult.data.counts.users} users, ${healthResult.data.counts.projects} projects`
                      : 'N/A'}
                  </span>
                </div>
              </div>
            )}

            {/* Quick Test Login Box */}
            <form onSubmit={handleTestLogin} className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-2">
              <div className="font-semibold text-slate-200 text-[11px] uppercase tracking-wider flex items-center gap-1.5">
                <LogIn className="w-3.5 h-3.5 text-indigo-400" /> Quick API Login Test
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="email"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                  placeholder="Email"
                  className="px-2 py-1.5 bg-slate-950 border border-slate-700 rounded text-slate-200 text-[11px] focus:outline-none focus:border-indigo-500 font-mono"
                />
                <input
                  type="password"
                  value={testPassword}
                  onChange={(e) => setTestPassword(e.target.value)}
                  placeholder="Password"
                  className="px-2 py-1.5 bg-slate-950 border border-slate-700 rounded text-slate-200 text-[11px] focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>
              <button
                type="submit"
                disabled={loginLoading}
                className="w-full py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded font-medium transition flex items-center justify-center gap-1.5"
              >
                {loginLoading ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <span>Send Test /api/auth/login Request</span>
                )}
              </button>
            </form>

            {/* Response Output Console */}
            {(authResult || testResult?.error || healthResult?.error) && (
              <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-[11px] font-mono overflow-x-auto max-h-36">
                <div className="text-slate-400 mb-1 font-semibold flex items-center justify-between">
                  <span>Last API Request Result:</span>
                  <span className={authResult?.success ? 'text-emerald-400' : 'text-red-400'}>
                    {authResult?.success ? 'HTTP 200 OK' : `Error ${authResult?.status || ''}`}
                  </span>
                </div>
                <pre className="text-slate-300 whitespace-pre-wrap">
                  {JSON.stringify(authResult || testResult || healthResult, null, 2)}
                </pre>
              </div>
            )}
          </div>

          {/* Footer Action */}
          <div className="p-2.5 bg-slate-900/90 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
            <span>Tip: Open DevTools Console and run <code className="text-indigo-400">testApi()</code></span>
            <button
              onClick={copyDiagnosticReport}
              className="text-indigo-400 hover:text-indigo-300 font-medium underline"
            >
              {copied ? 'Copied!' : 'Copy Debug JSON'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
