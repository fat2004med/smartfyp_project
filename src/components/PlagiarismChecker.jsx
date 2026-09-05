import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShieldCheck, 
  FileText, 
  Search, 
  CheckCircle, 
  AlertTriangle,
  Clock, 
  Cpu, 
  HelpCircle,
  Database,
  Sliders,
  Layers,
  Trash2,
  RefreshCw,
  UploadCloud,
  FileCheck2,
  X,
  ChevronRight,
  Info
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import ConfirmModal from './ConfirmModal';

const PlagiarismChecker = () => {
  const [file, setFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [threshold, setThreshold] = useState(0.40); // 40% default threshold
  const [sources, setSources] = useState([]);
  const [isSyncingSources, setIsSyncingSources] = useState(false);
  const [isClearingSources, setIsClearingSources] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [deleteConfirmSource, setDeleteConfirmSource] = useState(null);

  // Fetch indexed source documents
  const fetchSources = async () => {
    try {
      const res = await axios.get('/api/plagiarism/sources');
      if (res.data?.sources) {
        setSources(res.data.sources);
      }
    } catch (err) {
      console.warn('Could not fetch sources list:', err);
    }
  };

  useEffect(() => {
    fetchSources();
  }, []);

  const handleSyncRepository = async () => {
    setIsSyncingSources(true);
    const toastId = toast.loading('Syncing final documentation from project records...');
    try {
      const res = await axios.post('/api/plagiarism/sync-repository');
      toast.success(res.data?.message || 'Project final documentation indexed successfully!', { id: toastId });
      if (res.data?.sources) {
        setSources(res.data.sources);
      } else {
        fetchSources();
      }
    } catch {
      toast.error('Failed to sync project final documentation sources.', { id: toastId });
    } finally {
      setIsSyncingSources(false);
    }
  };

  const handleClearAllSources = async () => {
    setIsClearingSources(true);
    const toastId = toast.loading('Clearing plagiarism sources repository...');
    try {
      await axios.post('/api/plagiarism/clear-all');
      toast.success('Plagiarism repository cleared successfully!', { id: toastId });
      setScanResult(null);
      setShowClearConfirm(false);
      fetchSources();
    } catch {
      toast.error('Failed to clear sources repository.', { id: toastId });
    } finally {
      setIsClearingSources(false);
    }
  };

  const handleDeleteSource = async (sourceToDelete) => {
    if (!sourceToDelete) return;
    try {
      await axios.delete(`/api/plagiarism/source/${sourceToDelete.id}`);
      toast.success(`Removed "${sourceToDelete.title}"`);
      setDeleteConfirmSource(null);
      fetchSources();
    } catch {
      toast.error('Failed to remove source.');
    }
  };

  const handleScan = async (e) => {
    e.preventDefault();
    if (!file) {
      toast.error('Please upload a PDF, DOCX, or TXT documentation file to analyze.');
      return;
    }

    setIsScanning(true);
    setScanResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('threshold', String(threshold));

      const response = await axios.post('/api/plagiarism/upload-scan', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.data?.success && response.data?.data) {
        setScanResult(response.data.data);
      } else {
        throw new Error(response.data?.error || 'Analysis request failed.');
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.error || err.response?.data?.message || 'Error occurred while scanning document.');
    } finally {
      setIsScanning(false);
    }
  };

  const clearScanner = () => {
    setFile(null);
    setScanResult(null);
  };

  return (
    <div className="w-full space-y-6 sm:space-y-8 pb-10">
      {/* Page Header Banner */}
      <div className="bg-gradient-to-br from-indigo-700 via-indigo-900 to-slate-950 rounded-2xl sm:rounded-3xl md:rounded-[2.5rem] p-5 sm:p-8 md:p-10 lg:p-12 text-white shadow-xl relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.12),transparent_55%)] pointer-events-none" />
        <div className="absolute -right-16 -bottom-16 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-4 sm:gap-6">
          <div className="space-y-2 sm:space-y-3 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-[11px] sm:text-xs font-semibold tracking-wide text-indigo-200">
              <ShieldCheck size={14} className="text-indigo-300" />
              <span>Institutional Academic Integrity Engine</span>
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black tracking-tight leading-tight">
              Plagiarism Checker
            </h1>
            <p className="text-xs sm:text-sm md:text-base text-indigo-100/90 font-medium leading-relaxed">
              Upload final documentation files (PDF, DOCX, TXT) to calculate semantic similarity and cross-batch duplication against indexed FYP repository archives.
            </p>
          </div>

          {/* Quick Header Stats / Status Pill */}
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5 sm:gap-3 lg:self-center shrink-0">
            <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl px-4 py-2.5 flex items-center gap-3">
              <div className="p-2 rounded-xl bg-indigo-400/20 text-indigo-200">
                <Database size={18} />
              </div>
              <div>
                <p className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-indigo-200/80">Database Index</p>
                <p className="text-sm sm:text-base font-black text-white">{sources.length} Documents</p>
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl px-4 py-2.5 flex items-center gap-3">
              <div className="p-2 rounded-xl bg-indigo-400/20 text-indigo-200">
                <Sliders size={18} />
              </div>
              <div>
                <p className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-indigo-200/80">Active Threshold</p>
                <p className="text-sm sm:text-base font-black text-white">{(threshold * 100).toFixed(0)}%</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid Section:
          - Desktop (xl): 2 Columns (5 cols left, 7 cols right)
          - Tablet (md to lg): Upload console & Indexed sources side-by-side (2 cols), Results span full width below
          - Mobile (< md): Single column stacked layout
      */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 lg:gap-8 items-start">
        
        {/* Left Column Controls */}
        <div className="xl:col-span-5 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-1 gap-6">
          
          {/* Upload Console Card */}
          <div className="bg-white rounded-2xl sm:rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow p-4 sm:p-6 lg:p-7 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 gap-2">
              <div className="min-w-0">
                <h3 className="text-base sm:text-lg font-bold text-gray-900 truncate">Upload Documentation</h3>
                <p className="text-xs text-gray-500 font-medium truncate">Evaluates against indexed FYP repository</p>
              </div>
              {file && (
                <button
                  type="button"
                  onClick={clearScanner}
                  className="px-2.5 py-1 text-xs text-rose-600 hover:text-rose-750 font-bold hover:bg-rose-50 rounded-xl transition-all shrink-0 cursor-pointer"
                >
                  Clear
                </button>
              )}
            </div>

            <form onSubmit={handleScan} className="space-y-5">
              {/* Drag & Drop Area */}
              <div className="space-y-1.5">
                <div
                  onDragEnter={(e) => { e.preventDefault(); e.stopPropagation(); setDragActive(true); }}
                  onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setDragActive(true); }}
                  onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); setDragActive(false); }}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setDragActive(false);
                    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                      const droppedFile = e.dataTransfer.files[0];
                      const ext = droppedFile.name.split('.').pop().toLowerCase();
                      if (['pdf', 'docx', 'doc', 'txt'].includes(ext)) {
                        setFile(droppedFile);
                      } else {
                        toast.error('Supported file types: PDF, DOCX, TXT.');
                      }
                    }
                  }}
                  className={`relative border-2 border-dashed rounded-2xl p-4 sm:p-6 text-center flex flex-col items-center justify-center transition-all min-h-[160px] sm:min-h-[190px] cursor-pointer touch-manipulation ${
                    dragActive 
                      ? 'border-indigo-500 bg-indigo-50/20' 
                      : file 
                        ? 'border-emerald-400 bg-emerald-50/15' 
                        : 'border-gray-250 bg-gray-50/70 hover:bg-gray-100/60 hover:border-indigo-300'
                  }`}
                  onClick={() => document.getElementById('file-upload-input').click()}
                >
                  <input 
                    id="file-upload-input"
                    type="file"
                    className="hidden"
                    accept=".pdf,.docx,.doc,.txt"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setFile(e.target.files[0]);
                      }
                    }}
                  />
                  
                  <div className={`p-3 sm:p-3.5 rounded-2xl mb-2.5 transition-transform ${file ? 'bg-emerald-100 text-emerald-600' : 'bg-indigo-100 text-indigo-600'}`}>
                    {file ? <CheckCircle size={26} /> : <UploadCloud size={26} />}
                  </div>

                  {file ? (
                    <div className="space-y-1 w-full max-w-full px-2">
                      <p className="text-xs sm:text-sm font-extrabold text-gray-850 truncate max-w-full" title={file.name}>
                        {file.name}
                      </p>
                      <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100/70 text-[10px] sm:text-[11px] font-bold text-emerald-800">
                        <FileCheck2 size={12} />
                        {(file.size / (1024 * 1024)).toFixed(2)} MB • Ready to analyze
                      </div>
                      <p className="text-[10px] text-gray-400 pt-0.5">Click or tap to replace document</p>
                    </div>
                  ) : (
                    <div className="space-y-1 px-2">
                      <p className="text-xs sm:text-sm font-bold text-gray-800">
                        Drop documentation file here
                      </p>
                      <p className="text-[11px] sm:text-xs text-gray-500 font-medium">
                        or <span className="text-indigo-600 font-bold underline underline-offset-2">tap to browse</span> (PDF, DOCX, TXT)
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Threshold Configurator */}
              <div className="bg-slate-50/90 p-3.5 sm:p-4 rounded-2xl border border-slate-200/70 space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-gray-750 flex items-center gap-1.5">
                    <Sliders size={14} className="text-indigo-600 shrink-0" />
                    Plagiarism Threshold:
                  </span>
                  <span className="text-xs font-black text-indigo-700 bg-white px-2.5 py-0.5 rounded-lg border border-indigo-150 shadow-sm shrink-0">
                    {(threshold * 100).toFixed(0)}%
                  </span>
                </div>
                <div className="py-1">
                  <input
                    type="range"
                    min="0.10"
                    max="0.90"
                    step="0.05"
                    value={threshold ?? 0.4}
                    onChange={(e) => setThreshold(parseFloat(e.target.value))}
                    className="w-full h-2 bg-gray-250 rounded-lg appearance-none cursor-pointer accent-indigo-600 touch-manipulation"
                    aria-label="Plagiarism threshold percentage"
                  />
                </div>
                <div className="flex justify-between text-[10px] sm:text-[11px] text-gray-500 font-semibold px-0.5">
                  <span>10% (Strict)</span>
                  <span>40% (Default)</span>
                  <span>90% (Lenient)</span>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isScanning || !file}
                className="w-full min-h-[46px] py-3 sm:py-3.5 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-extrabold rounded-2xl shadow-lg shadow-indigo-100 hover:shadow-indigo-200/60 transition-all active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer text-xs sm:text-sm"
              >
                {isScanning ? (
                  <>
                    <Clock className="animate-spin shrink-0" size={18} />
                    <span>Analyzing Document...</span>
                  </>
                ) : (
                  <>
                    <Search className="shrink-0" size={18} />
                    <span>Run Plagiarism Check</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Database Sources Summary Card */}
          <div className="bg-white rounded-2xl sm:rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow p-4 sm:p-6 lg:p-7 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2 min-w-0">
                <Database size={16} className="text-indigo-600 shrink-0" />
                <h4 className="text-sm sm:text-base font-bold text-gray-850 truncate">Indexed Sources</h4>
                <span className="text-[11px] font-black px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded-lg shrink-0">
                  {sources.length} Total
                </span>
              </div>
              
              <div className="flex items-center gap-1.5 self-start sm:self-auto shrink-0">
                <button
                  type="button"
                  onClick={handleSyncRepository}
                  disabled={isSyncingSources}
                  title="Auto-sync FYP projects into repository"
                  className="text-[11px] font-bold text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-50 touch-manipulation"
                >
                  <RefreshCw size={12} className={isSyncingSources ? 'animate-spin' : ''} />
                  <span>Auto-Sync</span>
                </button>
                {sources.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setShowClearConfirm(true)}
                    disabled={isClearingSources}
                    title="Clear all indexed baseline sources"
                    className="text-[11px] font-bold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1 cursor-pointer touch-manipulation"
                  >
                    <Trash2 size={12} />
                    <span>Clear All</span>
                  </button>
                )}
              </div>
            </div>

            <div className="max-h-56 sm:max-h-64 overflow-y-auto space-y-2 pr-1 divide-y divide-gray-100">
              {sources.map((s, idx) => (
                <div key={s.id || idx} className="pt-2 text-xs flex items-center justify-between text-gray-600 group gap-2 min-w-0">
                  <div className="flex flex-col flex-1 min-w-0 pr-1">
                    <span className="truncate font-semibold text-gray-800 text-xs sm:text-sm" title={s.title}>
                      • {s.title}
                    </span>
                    <span className="text-[10px] sm:text-[11px] text-gray-400 truncate" title={s.author}>
                      {s.author || 'Final Documentation'}
                    </span>
                  </div>
                  {s.id && (
                    <button
                      type="button"
                      onClick={() => setDeleteConfirmSource({ id: s.id, title: s.title })}
                      className="opacity-100 sm:opacity-0 sm:group-hover:opacity-100 text-gray-400 hover:text-rose-600 p-2 sm:p-1.5 transition-opacity cursor-pointer shrink-0 rounded-lg hover:bg-rose-50 touch-manipulation"
                      title="Remove source"
                      aria-label={`Remove source ${s.title}`}
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              ))}
              
              {sources.length === 0 && (
                <div className="py-6 text-center space-y-2 px-2">
                  <p className="text-xs text-gray-400 font-medium">No project final documentation indexed yet.</p>
                  <button
                    type="button"
                    onClick={handleSyncRepository}
                    disabled={isSyncingSources}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition-colors cursor-pointer disabled:opacity-50 touch-manipulation"
                  >
                    <RefreshCw size={12} className={isSyncingSources ? 'animate-spin' : ''} />
                    Sync Project Final Documentation
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Scan Results & Source Breakdown */}
        <div className="xl:col-span-7 space-y-6 w-full">
          {/* Scanning State Loader */}
          {isScanning && (
            <div className="bg-white rounded-2xl sm:rounded-3xl border-2 border-dashed border-indigo-200 p-6 sm:p-10 md:p-12 text-center flex flex-col items-center justify-center min-h-[280px] sm:min-h-[380px] md:min-h-[440px]">
              <div className="w-14 h-14 sm:w-16 sm:h-16 bg-indigo-50 text-indigo-600 rounded-2xl sm:rounded-3xl flex items-center justify-center animate-bounce mb-4 shadow-md">
                <Cpu size={28} className="animate-pulse" />
              </div>
              <h4 className="text-base sm:text-lg md:text-xl font-black text-gray-900">
                Checking Document Plagiarism
              </h4>
              <p className="text-xs sm:text-sm text-gray-500 max-w-md mt-2 font-medium leading-relaxed px-2">
                Extracting textual vectors and calculating cross-comparison similarities against indexed final documentation...
              </p>
              <div className="w-full max-w-xs sm:max-w-sm bg-gray-150 h-2 rounded-full overflow-hidden mt-6">
                <div className="bg-indigo-600 h-full animate-progress-bar rounded-full" />
              </div>
            </div>
          )}

          {/* Empty / Idle State */}
          {!isScanning && !scanResult && (
            <div className="bg-gradient-to-br from-gray-50 to-white rounded-2xl sm:rounded-3xl border border-gray-150 p-6 sm:p-10 md:p-12 text-center flex flex-col items-center justify-center min-h-[260px] sm:min-h-[340px] md:min-h-[420px]">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-indigo-50 text-indigo-500 flex items-center justify-center mb-3">
                <HelpCircle size={32} className="text-indigo-400" />
              </div>
              <h4 className="text-base sm:text-lg font-black text-gray-800">
                No Plagiarism Report Generated
              </h4>
              <p className="text-xs sm:text-sm text-gray-500 max-w-md mt-1.5 font-medium leading-relaxed px-2">
                Upload a documentation file (PDF, DOCX, TXT) on the left and click &quot;Run Plagiarism Check&quot; to inspect semantic similarity and source breakdown.
              </p>
              <div className="mt-5 flex flex-wrap justify-center gap-2">
                <span className="text-[11px] font-semibold text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                  • Vector Embeddings
                </span>
                <span className="text-[11px] font-semibold text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                  • Cross-Batch Deduplication
                </span>
                <span className="text-[11px] font-semibold text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                  • Source Attribution
                </span>
              </div>
            </div>
          )}

          {/* Scan Results View */}
          <AnimatePresence>
            {scanResult && (
              <motion.div
                initial={{ opacity: 0, scale: 0.98, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="bg-white rounded-2xl sm:rounded-3xl border border-gray-150 shadow-lg overflow-hidden w-full"
              >
                {/* Result Header & Gauge */}
                <div className={`p-4 sm:p-6 md:p-8 border-b ${
                  scanResult.is_plagiarized 
                    ? 'bg-gradient-to-br from-red-50/90 via-rose-50/50 to-white border-red-100' 
                    : 'bg-gradient-to-br from-emerald-50/90 via-green-50/50 to-white border-emerald-100'
                }`}>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-6">
                    <div className="space-y-1.5 min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        {scanResult.is_plagiarized ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-100 text-red-700 text-xs font-black uppercase tracking-wider rounded-xl border border-red-200">
                            <AlertTriangle size={14} className="shrink-0" />
                            <span>Plagiarized (Exceeds {(scanResult.threshold * 100).toFixed(0)}% Threshold)</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-100 text-emerald-700 text-xs font-black uppercase tracking-wider rounded-xl border border-emerald-200">
                            <CheckCircle size={14} className="shrink-0" />
                            <span>Original / Acceptable</span>
                          </span>
                        )}
                      </div>
                      
                      <h3 className="text-lg sm:text-xl md:text-2xl font-black text-gray-900 tracking-tight pt-1">
                        Plagiarism Assessment Report
                      </h3>
                      <p className="text-xs sm:text-sm text-gray-600 font-medium break-all sm:break-words">
                        Analyzed File: <span className="font-bold text-gray-800">{scanResult.filename || 'Uploaded Document'}</span>
                      </p>
                    </div>

                    {/* Overall Score Badge */}
                    <div className="flex items-center justify-between sm:justify-center gap-4 bg-white/95 backdrop-blur-sm p-3.5 sm:p-4 rounded-2xl border border-gray-150 shadow-sm shrink-0">
                      <div className="text-left sm:text-center">
                        <div className={`text-2xl sm:text-3xl md:text-4xl font-black ${
                          scanResult.is_plagiarized ? 'text-red-600' : 'text-emerald-600'
                        }`}>
                          {(scanResult.overall_score * 100).toFixed(1)}%
                        </div>
                        <div className="text-[10px] sm:text-[11px] font-bold text-gray-400 uppercase tracking-wider mt-0.5">
                          Overall Similarity
                        </div>
                      </div>
                      <div className={`p-2.5 rounded-xl sm:hidden ${
                        scanResult.is_plagiarized ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'
                      }`}>
                        {scanResult.is_plagiarized ? <AlertTriangle size={22} /> : <CheckCircle size={22} />}
                      </div>
                    </div>
                  </div>

                  {/* Visual Progress Bar with Threshold Marker */}
                  <div className="mt-5 sm:mt-6 space-y-2">
                    <div className="flex justify-between items-center text-xs font-bold text-gray-600">
                      <span>Similarity Index</span>
                      <span className="text-indigo-700 bg-white px-2 py-0.5 rounded-md border border-indigo-100 text-[11px]">
                        Threshold Target: {(scanResult.threshold * 100).toFixed(0)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-250/70 h-3 sm:h-3.5 rounded-full overflow-hidden relative shadow-inner">
                      <div 
                        className={`h-full rounded-full transition-all duration-700 ${
                          scanResult.is_plagiarized ? 'bg-red-500' : 'bg-emerald-500'
                        }`}
                        style={{ width: `${Math.min(100, Math.max(2, scanResult.overall_score * 100))}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="p-4 sm:p-6 md:p-8 space-y-5 sm:space-y-6">
                  {/* Executive Summary */}
                  {scanResult.summary && (
                    <div className="space-y-2">
                      <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                        <Info size={14} className="text-indigo-600" />
                        Executive Assessment Summary
                      </h4>
                      <p className="text-xs sm:text-sm text-gray-700 font-medium leading-relaxed bg-gray-50 p-3.5 sm:p-4 rounded-xl sm:rounded-2xl border border-gray-150 break-words">
                        {scanResult.summary}
                      </p>
                    </div>
                  )}

                  {/* Breakdown Per Source Document */}
                  <div className="space-y-3.5 sm:space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-2">
                      <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                        <Layers size={14} className="text-indigo-600" />
                        Breakdown Per Source Document
                      </h4>
                      <span className="text-xs text-gray-500 font-semibold">
                        {scanResult.breakdown?.length || 0} matching sources detected
                      </span>
                    </div>

                    {scanResult.breakdown && scanResult.breakdown.length > 0 ? (
                      <div className="space-y-3">
                        {scanResult.breakdown.map((item, idx) => (
                          <div 
                            key={idx} 
                            className="p-3.5 sm:p-4 md:p-5 rounded-xl sm:rounded-2xl border border-gray-150 bg-white space-y-2.5 sm:space-y-3 hover:border-indigo-150 hover:shadow-sm transition-all"
                          >
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                              <h5 className="text-xs sm:text-sm font-bold text-gray-900 leading-snug break-words min-w-0 flex-1">
                                {item.title}
                              </h5>
                              <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto shrink-0">
                                <span className="text-[11px] sm:text-xs font-black px-2.5 py-1 rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-100">
                                  {(item.contribution * 100).toFixed(1)}% Contribution
                                </span>
                                <span className="text-[11px] sm:text-xs font-bold px-2.5 py-1 rounded-xl bg-gray-100 text-gray-700">
                                  {(item.similarity * 100).toFixed(1)}% Match
                                </span>
                              </div>
                            </div>

                            {/* Similarity progress meter per source */}
                            <div className="w-full bg-gray-100 h-1.5 sm:h-2 rounded-full overflow-hidden">
                              <div 
                                className="bg-indigo-600 h-full rounded-full"
                                style={{ width: `${Math.min(100, item.similarity * 100)}%` }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-5 sm:p-6 text-center bg-emerald-50 rounded-2xl border border-emerald-150 flex flex-col items-center justify-center space-y-1">
                        <CheckCircle className="text-emerald-500 mb-1" size={26} />
                        <span className="text-xs sm:text-sm font-bold text-emerald-900">100% Unique / Zero Matching Sources</span>
                        <span className="text-[11px] sm:text-xs text-emerald-600 max-w-sm">No overlapping passages or semantic vectors detected against the institutional database archives.</span>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Clear All Sources Confirmation Modal */}
      <ConfirmModal
        isOpen={showClearConfirm}
        onClose={() => setShowClearConfirm(false)}
        onConfirm={handleClearAllSources}
        isLoading={isClearingSources}
        title="Clear All Indexed Sources"
        message="Are you sure you want to clear all indexed source documents? You can auto-sync the FYP projects repository at any time."
        confirmText="Yes, Clear All"
        cancelText="Cancel"
        variant="danger"
      />

      {/* Delete Single Source Confirmation Modal */}
      <ConfirmModal
        isOpen={!!deleteConfirmSource}
        onClose={() => setDeleteConfirmSource(null)}
        onConfirm={() => handleDeleteSource(deleteConfirmSource)}
        title="Remove Source Document"
        message="Are you sure you want to remove this document from the plagiarism detection index?"
        confirmText="Yes, Remove"
        cancelText="Cancel"
        variant="danger"
        itemName={deleteConfirmSource ? deleteConfirmSource.title : null}
      />
    </div>
  );
};

export default PlagiarismChecker;
