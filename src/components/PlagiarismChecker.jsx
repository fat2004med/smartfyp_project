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
  RefreshCw
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
    <div className="space-y-8 w-full max-w-[1700px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Page Header */}
      <div className="bg-gradient-to-r from-indigo-700 via-indigo-900 to-slate-900 rounded-[2.5rem] p-8 md:p-12 text-white shadow-2xl relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.1),transparent_50%)]" />
        <div className="absolute -right-16 -bottom-16 w-64 h-64 bg-white/5 rounded-full blur-3xl" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3 max-w-3xl">
            <h1 className="text-3xl md:text-5xl font-black tracking-tight leading-none">
              Plagiarism Checker
            </h1>
            <p className="text-sm md:text-base text-indigo-100 font-medium leading-relaxed">
              Upload final documentation files (PDF, DOCX, TXT) to calculate similarity against indexed final documentation files in the repository.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Upload & Threshold Controls */}
        <div className="lg:col-span-5 space-y-6">
          {/* Upload Console */}
          <div className="bg-white rounded-[2rem] border border-gray-100 shadow-xl p-6 sm:p-8 space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-gray-50">
              <div>
                <h3 className="text-xl font-bold text-gray-900">Upload Final Documentation</h3>
                <p className="text-xs text-gray-400 font-medium mt-0.5">Evaluates document against indexed FYP repository</p>
              </div>
              {file && (
                <button
                  type="button"
                  onClick={clearScanner}
                  className="px-3 py-1.5 text-xs text-gray-400 hover:text-gray-600 font-bold hover:bg-gray-50 rounded-xl transition-all"
                >
                  Clear
                </button>
              )}
            </div>

            <form onSubmit={handleScan} className="space-y-6">
              {/* Drag & Drop Area */}
              <div className="space-y-2">
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
                  className={`relative border-2 border-dashed rounded-[2rem] p-8 text-center flex flex-col items-center justify-center transition-all min-h-[220px] cursor-pointer ${
                    dragActive 
                      ? 'border-indigo-500 bg-indigo-50/10' 
                      : file 
                        ? 'border-green-400 bg-green-50/5' 
                        : 'border-gray-200 bg-gray-50 hover:bg-gray-100/50'
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
                  
                  <div className={`p-4 rounded-2xl mb-3 ${file ? 'bg-green-100 text-green-600' : 'bg-indigo-50 text-indigo-600'}`}>
                    {file ? <CheckCircle size={28} /> : <FileText size={28} />}
                  </div>

                  {file ? (
                    <div className="space-y-1">
                      <p className="text-sm font-extrabold text-gray-800 truncate max-w-xs">{file.name}</p>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                        {(file.size / (1024 * 1024)).toFixed(2)} MB • Ready to analyze
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-1 px-4">
                      <p className="text-sm font-bold text-gray-700">Drop documentation PDF, DOCX, or TXT</p>
                      <p className="text-xs text-gray-400 font-medium">Click to browse your device</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Threshold Configurator */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-150 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                    <Sliders size={14} className="text-indigo-600" />
                    Plagiarism Threshold:
                  </span>
                  <span className="text-xs font-black text-indigo-600 bg-white px-2.5 py-0.5 rounded-lg border border-indigo-100 shadow-sm">
                    {(threshold * 100).toFixed(0)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0.10"
                  max="0.90"
                  step="0.05"
                  value={threshold ?? 0.4}
                  onChange={(e) => setThreshold(parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
                <div className="flex justify-between text-[10px] text-gray-400 font-semibold">
                  <span>10% (Strict)</span>
                  <span>40% (Default)</span>
                  <span>90% (Lenient)</span>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isScanning || !file}
                className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-extrabold rounded-2xl shadow-xl shadow-indigo-100 hover:shadow-indigo-200/50 transition-all active:scale-95 flex items-center justify-center gap-2.5 cursor-pointer"
              >
                {isScanning ? (
                  <>
                    <Clock className="animate-spin" size={20} />
                    Checking Plagiarism...
                  </>
                ) : (
                  <>
                    <Search size={20} />
                    Run Plagiarism Check
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Database Sources Summary */}
          <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Database size={16} className="text-indigo-600" />
                <h4 className="text-sm font-bold text-gray-800">Indexed Source Documents</h4>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded-lg">
                  {sources.length} Total
                </span>
                <button
                  type="button"
                  onClick={handleSyncRepository}
                  disabled={isSyncingSources}
                  title="Auto-sync FYP projects into repository"
                  className="text-[11px] font-bold text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-2 py-0.5 rounded-lg transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw size={11} className={isSyncingSources ? 'animate-spin' : ''} />
                  Auto-Sync
                </button>
                {sources.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setShowClearConfirm(true)}
                    disabled={isClearingSources}
                    title="Clear all indexed baseline sources"
                    className="text-[11px] font-bold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 px-2 py-0.5 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 size={12} />
                    Clear All
                  </button>
                )}
              </div>
            </div>
            <div className="max-h-56 overflow-y-auto space-y-2 pr-1 divide-y divide-gray-50">
              {sources.map((s, idx) => (
                <div key={s.id || idx} className="pt-2 text-xs flex items-center justify-between text-gray-600 group">
                  <div className="flex flex-col flex-1 min-w-0 pr-2">
                    <span className="truncate font-semibold text-gray-700" title={s.title}>• {s.title}</span>
                    <span className="text-[10px] text-gray-400 truncate" title={s.author}>{s.author || 'Final Documentation'}</span>
                  </div>
                  {s.id && (
                    <button
                      type="button"
                      onClick={() => setDeleteConfirmSource({ id: s.id, title: s.title })}
                      className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-rose-600 p-1 transition-opacity cursor-pointer flex-shrink-0"
                      title="Remove source"
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              ))}
              {sources.length === 0 && (
                <div className="py-5 text-center space-y-2">
                  <p className="text-xs text-gray-400 font-medium">No project final documentation indexed yet.</p>
                  <button
                    type="button"
                    onClick={handleSyncRepository}
                    disabled={isSyncingSources}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition-colors cursor-pointer disabled:opacity-50"
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
        <div className="lg:col-span-7 space-y-6">
          {isScanning && (
            <div className="bg-white rounded-[2rem] border-2 border-dashed border-indigo-100 p-12 text-center flex flex-col items-center justify-center min-h-[420px]">
              <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-3xl flex items-center justify-center animate-bounce mb-4 shadow-md">
                <Cpu size={32} className="animate-pulse" />
              </div>
              <h4 className="text-lg font-bold text-gray-900">Checking Plagiarism</h4>
              <p className="text-xs text-gray-400 max-w-md mt-2 font-medium leading-relaxed">
                Analyzing document and checking similarity against indexed final documentation files...
              </p>
              <div className="w-56 bg-gray-100 h-1.5 rounded-full overflow-hidden mt-6">
                <div className="bg-indigo-600 h-full animate-progress-bar rounded-full" />
              </div>
            </div>
          )}

          {!isScanning && !scanResult && (
            <div className="bg-gradient-to-br from-gray-50 to-white rounded-[2rem] border border-gray-100 p-12 text-center flex flex-col items-center justify-center min-h-[420px]">
              <HelpCircle size={48} className="text-gray-300 mb-3" />
              <h4 className="text-lg font-bold text-gray-600 font-sans">No Plagiarism Report Generated</h4>
              <p className="text-xs text-gray-400 max-w-sm mt-1 font-medium leading-relaxed">
                Upload a documentation file on the left and click &quot;Run Plagiarism Check&quot; to calculate the overall score and per-source contribution breakdown.
              </p>
            </div>
          )}

          <AnimatePresence>
            {scanResult && (
              <motion.div
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="bg-white rounded-[2rem] border border-gray-100 shadow-xl overflow-hidden"
              >
                {/* Result Header & Primary Gauge */}
                <div className={`p-6 sm:p-8 border-b ${
                  scanResult.is_plagiarized 
                    ? 'bg-gradient-to-r from-red-50/70 via-rose-50/40 to-white border-red-100' 
                    : 'bg-gradient-to-r from-green-50/70 via-emerald-50/40 to-white border-green-100'
                }`}>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        {scanResult.is_plagiarized ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-100 text-red-700 text-xs font-black uppercase tracking-wider rounded-xl border border-red-200">
                            <AlertTriangle size={14} />
                            Plagiarized (Exceeds {(scanResult.threshold * 100).toFixed(0)}% Threshold)
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-100 text-green-700 text-xs font-black uppercase tracking-wider rounded-xl border border-green-200">
                            <CheckCircle size={14} />
                            Original / Acceptable
                          </span>
                        )}
                      </div>
                      <h3 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight pt-1">
                        Plagiarism Assessment Report
                      </h3>
                      <p className="text-xs text-gray-500 font-medium">
                        File: <span className="font-bold text-gray-700">{scanResult.filename || 'Uploaded Document'}</span>
                      </p>
                    </div>

                    {/* Overall Score Badge */}
                    <div className="flex items-center gap-4 bg-white p-4 rounded-2xl border border-gray-150 shadow-sm shrink-0">
                      <div className="text-center">
                        <div className={`text-3xl font-black ${
                          scanResult.is_plagiarized ? 'text-red-600' : 'text-green-600'
                        }`}>
                          {(scanResult.overall_score * 100).toFixed(1)}%
                        </div>
                        <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mt-0.5">
                          Overall Plagiarism
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Visual Progress Bar */}
                  <div className="mt-6 space-y-2">
                    <div className="flex justify-between text-xs font-bold text-gray-600">
                      <span>Overall Similarity</span>
                      <span>Threshold: {(scanResult.threshold * 100).toFixed(0)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 h-3 rounded-full overflow-hidden relative">
                      <div 
                        className={`h-full rounded-full transition-all duration-700 ${
                          scanResult.is_plagiarized ? 'bg-red-500' : 'bg-green-500'
                        }`}
                        style={{ width: `${Math.min(100, Math.max(2, scanResult.overall_score * 100))}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="p-6 sm:p-8 space-y-6">
                  {/* Summary Notes */}
                  {scanResult.summary && (
                    <div className="space-y-2">
                      <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Executive Summary</h4>
                      <p className="text-xs sm:text-sm text-gray-600 font-medium leading-relaxed bg-gray-50 p-4 rounded-2xl border border-gray-150">
                        {scanResult.summary}
                      </p>
                    </div>
                  )}

                  {/* Breakdown Per Source Document */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                        <Layers size={14} className="text-indigo-600" />
                        Breakdown Per Source Document
                      </h4>
                      <span className="text-xs text-gray-400 font-semibold">
                        {scanResult.breakdown?.length || 0} matching sources detected
                      </span>
                    </div>

                    {scanResult.breakdown && scanResult.breakdown.length > 0 ? (
                      <div className="space-y-3">
                        {scanResult.breakdown.map((item, idx) => (
                          <div 
                            key={idx} 
                            className="p-4 rounded-2xl border border-gray-100 bg-white space-y-3 hover:border-indigo-100 hover:shadow-sm transition-all"
                          >
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                              <h5 className="text-sm font-bold text-gray-900 leading-snug">
                                {item.title}
                              </h5>
                              <div className="flex items-center gap-2 self-start sm:self-auto">
                                <span className="text-xs font-black px-3 py-1 rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-100">
                                  {(item.contribution * 100).toFixed(1)}% Contribution
                                </span>
                              </div>
                            </div>

                            {/* Small similarity progress meter per source */}
                            <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                              <div 
                                className="bg-indigo-600 h-full rounded-full"
                                style={{ width: `${Math.min(100, item.similarity * 100)}%` }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-6 text-center bg-green-50 rounded-2xl border border-green-100 flex flex-col items-center justify-center">
                        <CheckCircle className="text-green-500 mb-1" size={24} />
                        <span className="text-xs font-bold text-green-800">100% Unique / Zero Matching Sources</span>
                        <span className="text-[11px] text-green-600">No content overlapped significantly with the database archives.</span>
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
