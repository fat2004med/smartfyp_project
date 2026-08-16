import React, { useState } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShieldCheck, 
  FileText, 
  Search, 
  CheckCircle, 
  Clock, 
  Cpu, 
  HelpCircle,
  FileDown
} from 'lucide-react';
import { toast } from 'react-hot-toast';

const PlagiarismChecker = () => {
  const [file, setFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);

  const handleScan = async (e) => {
    e.preventDefault();
    if (!file) {
      toast.error('Please upload a PDF or DOCX document file to analyze.');
      return;
    }

    setIsScanning(true);
    setScanResult(null);

    const toastId = toast.loading('Extracting document & checking plagiarism against student archives...');

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('mode', 'Text');
      formData.append('target', 'Past Semesters FYP Database');

      const response = await axios.post('/api/plagiarism/upload-scan', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.data?.success) {
        setScanResult(response.data.data);
        toast.success('Document plagiarism scan completed successfully!', { id: toastId });
      } else {
        throw new Error('Analysis request failed.');
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Error occurred while scanning document.', { id: toastId });
    } finally {
      setIsScanning(false);
    }
  };

  const clearScanner = () => {
    setFile(null);
    setScanResult(null);
  };

  const getScoreColor = (score) => {
    if (score < 15) return 'text-green-600 border-green-200 bg-green-50';
    if (score <= 40) return 'text-amber-600 border-amber-200 bg-amber-50';
    return 'text-red-600 border-red-200 bg-red-50';
  };

  const getScoreBadge = (score) => {
    if (score < 15) return 'Safe / Fully Compliant';
    if (score <= 40) return 'Requires Minor Revision';
    return 'Critical overlap detected (Unacceptable)';
  };

  return (
    <div className="space-y-8 w-full max-w-[1700px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Page Header */}
      <div className="bg-gradient-to-r from-indigo-700 via-indigo-850 to-slate-900 rounded-[2.5rem] p-8 md:p-12 text-white shadow-2xl relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.1),transparent_50%)]" />
        <div className="absolute -right-16 -bottom-16 w-64 h-64 bg-white/5 rounded-full blur-3xl" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full text-xs font-black uppercase tracking-widest border border-white/20">
              <ShieldCheck size={14} className="text-indigo-300" />
              FYP Document Repository Auditor
            </div>
            <h1 className="text-3xl md:text-5xl font-black tracking-tight leading-none">
              FYP Plagiarism Checker
            </h1>
            <p className="text-sm md:text-base text-indigo-100 font-medium leading-relaxed">
              Scan student thesis drafts, system requirements specifications (SRS), and final year documentation PDFs/DOCXs. Compares in real-time against all peer documentation files uploaded in the application database.
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto w-full flex flex-col gap-8">
        {/* Upload Console */}
        <div className="w-full bg-white rounded-[2rem] border border-gray-100 shadow-xl p-6 sm:p-8 space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-gray-50">
            <div>
              <h3 className="text-xl font-bold text-gray-900">Document Scan Console</h3>
              <p className="text-xs text-gray-400 font-medium mt-0.5">Upload a docx or pdf file to analyze overlap against peer submissions</p>
            </div>
            {file && (
              <button
                type="button"
                onClick={clearScanner}
                className="px-3 py-1.5 text-xs text-gray-400 hover:text-gray-600 font-bold hover:bg-gray-50 rounded-xl transition-all"
              >
                Clear File
              </button>
            )}
          </div>

          <form onSubmit={handleScan} className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-widest pl-1">
                Select FYP Documentation Draft
              </label>
              
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
                    if (['pdf', 'docx', 'doc'].includes(ext)) {
                      setFile(droppedFile);
                    } else {
                      toast.error('Unsupported file format. Please upload PDF or Word documents.');
                    }
                  }
                }}
                className={`relative border-2 border-dashed rounded-[2rem] p-10 text-center flex flex-col items-center justify-center transition-all min-h-[280px] cursor-pointer ${
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
                  accept=".pdf,.docx,.doc"
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
                    <p className="text-sm font-extrabold text-gray-800 truncate max-w-sm">{file.name}</p>
                    <p className="text-[10px] text-gray-450 font-bold uppercase tracking-wider">
                      {(file.size / (1024 * 1024)).toFixed(2)} MB • Click or drag to replace
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2 px-4">
                    <p className="text-sm font-bold text-gray-700">Drag &amp; drop student document draft here</p>
                    <p className="text-xs text-gray-400 font-medium">Supports PDF (.pdf) and Word documents (.docx, .doc)</p>
                  </div>
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={isScanning || !file}
              className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-extrabold rounded-2xl shadow-xl shadow-indigo-100 hover:shadow-indigo-200/50 transition-all active:scale-95 flex items-center justify-center gap-2.5 cursor-pointer"
            >
              {isScanning ? (
                <>
                  <Clock className="animate-spin" size={20} />
                  Scanning and Comparing Student Submissions...
                </>
              ) : (
                <>
                  <Search size={20} />
                  Scan Against Database Archives
                </>
              )}
            </button>
          </form>
        </div>

        {/* Results Console */}
        <div className="w-full space-y-6">
          {isScanning && (
            <div className="bg-white rounded-[2rem] border-2 border-dashed border-indigo-100 p-12 text-center flex flex-col items-center justify-center min-h-[350px]">
              <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-3xl flex items-center justify-center animate-bounce mb-4 shadow-md">
                <Cpu size={32} className="animate-pulse" />
              </div>
              <h4 className="text-lg font-bold text-gray-900">Analyzing Document Structure</h4>
              <p className="text-xs text-gray-400 max-w-sm mt-2 font-medium leading-relaxed">
                Extracting textual metadata, mapping 4-gram sentence matrices, and cross-checking against student submission files in the MongoDB database...
              </p>
              <div className="w-48 bg-gray-100 h-1 rounded-full overflow-hidden mt-6">
                <div className="bg-indigo-600 h-full animate-progress-bar rounded-full" />
              </div>
            </div>
          )}

          {!isScanning && !scanResult && (
            <div className="bg-gradient-to-br from-gray-50 to-white rounded-[2rem] border border-gray-100 p-10 text-center flex flex-col items-center justify-center min-h-[350px]">
              <HelpCircle size={44} className="text-gray-300 mb-3" />
              <h4 className="text-lg font-bold text-gray-600 font-sans">No Report Generated</h4>
              <p className="text-xs text-gray-400 max-w-xs mt-1 font-medium leading-relaxed">
                {"Upload a student's draft document above and click Scan to run a comprehensive pairwise similarity check."}
              </p>
            </div>
          )}

          <AnimatePresence>
            {scanResult && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="bg-white rounded-[2rem] border border-gray-100 shadow-xl overflow-hidden"
              >
                {/* Score Header */}
                <div className="p-6 sm:p-8 border-b border-gray-50 bg-gradient-to-r from-indigo-50/45 via-slate-50/25 to-white">
                  <h3 className="text-lg sm:text-xl font-black text-gray-900 tracking-tight mb-4">Plagiarism Analysis Result</h3>
                  
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mt-4">
                    <div className="flex items-center gap-3">
                      <div className={`p-3 sm:p-4 rounded-3xl border text-xl sm:text-2xl font-black leading-none flex items-center justify-center shrink-0 ${getScoreColor(scanResult.plagiarismScore)}`}>
                        {scanResult.plagiarismScore}%
                      </div>
                      <div>
                        <h4 className="text-xs sm:text-sm font-bold text-gray-800">Match Index</h4>
                        <p className="text-[10px] sm:text-[11px] font-black text-gray-400 uppercase mt-0.5 tracking-wider">
                          {getScoreBadge(scanResult.plagiarismScore)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-6 sm:p-8 space-y-6">
                  {/* Detailed Summary */}
                  <div className="space-y-2">
                    <h4 className="text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-widest">Executive Findings</h4>
                    <div className="text-xs sm:text-sm text-gray-500 font-medium leading-relaxed bg-gray-50 p-4 sm:p-6 rounded-2xl border border-gray-150 italic break-words">
                      &quot;{scanResult.summary}&quot;
                    </div>
                  </div>

                  {/* Matched Sources */}
                  <div className="space-y-4">
                    <h4 className="text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-widest">Matched Document Nodes</h4>
                    {scanResult.matchedSources && scanResult.matchedSources.length > 0 ? (
                      <div className="space-y-3">
                        {scanResult.matchedSources.map((src, index) => (
                          <div key={index} className="p-4 sm:p-5 rounded-2xl border border-gray-100 bg-white space-y-3 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 pb-2 border-b border-gray-50">
                              <div>
                                <h5 className="text-xs sm:text-sm font-bold text-gray-900 break-words leading-tight">{src.sourceTitle}</h5>
                                <span className="text-[9px] sm:text-[10px] text-indigo-500 font-extrabold uppercase tracking-wider">{src.sourceType}</span>
                              </div>
                              <span className="text-xs font-black text-amber-600 bg-amber-50 px-2.5 py-1 rounded-xl shrink-0 self-start sm:self-auto">
                                {src.similarity}% Overlap
                              </span>
                            </div>
                            
                            {src.matchedSnippet && (
                              <div className="p-3 bg-gray-50 rounded-xl text-[10px] sm:text-xs font-mono text-gray-500 break-all whitespace-pre-wrap leading-relaxed">
                                <strong className="text-gray-750 block mb-1">Detected context:</strong>
                                {src.matchedSnippet}
                              </div>
                            )}

                            {src.originalSnippet && (
                              <div className="p-3 bg-indigo-50/20 rounded-xl text-[10px] sm:text-xs font-mono text-gray-500 break-all whitespace-pre-wrap leading-relaxed border border-indigo-100/30">
                                <strong className="text-indigo-750 block mb-1">Original reference:</strong>
                                {src.originalSnippet}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-6 text-center bg-green-50 rounded-2xl border border-green-100 flex flex-col items-center justify-center">
                        <CheckCircle className="text-green-500 mb-1.5" size={20} />
                        <span className="text-xs font-bold text-green-700">Perfect Originality Score</span>
                        <span className="text-[10px] text-green-600">No overlapping student documentation found in the database.</span>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default PlagiarismChecker;
