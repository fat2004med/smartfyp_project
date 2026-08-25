import React, { useState, useEffect } from 'react';
import { 
  X, 
  Download, 
  ExternalLink, 
  FileText, 
  FileCheck, 
  Copy, 
  Check, 
  Eye,
  FileCode,
  FileSpreadsheet,
  RefreshCw,
  Maximize2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  getCleanFileName, 
  getFileExtension, 
  isPdf, 
  isImage, 
  isOfficeDoc, 
  getFileViewUrl, 
  getFileDownloadUrl,
  triggerDirectDownload 
} from '../utils/fileHelpers';
import { toast } from 'react-hot-toast';
import axios from 'axios';

export const DocumentViewerModal = ({ isOpen, onClose, fileUrl, title = 'Document Viewer' }) => {
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [parsedContent, setParsedContent] = useState(null);
  const [loadingContent, setLoadingContent] = useState(false);

  const fileName = getCleanFileName(fileUrl);
  const ext = getFileExtension(fileUrl);
  const isPdfFile = isPdf(fileUrl);
  const isImageFile = isImage(fileUrl);
  const isOffice = isOfficeDoc(fileUrl);

  useEffect(() => {
    if (!isOpen || !fileUrl) {
      setParsedContent(null);
      setLoadError(false);
      return;
    }

    setLoadError(false);

    // Fetch rich preview content for office docs and text files
    if (isOffice || ['.txt', '.csv', '.json', '.md'].includes(ext)) {
      setLoadingContent(true);
      axios.get(`/api/files/preview-content?file=${encodeURIComponent(fileUrl)}`)
        .then(res => {
          setParsedContent(res.data);
        })
        .catch(err => {
          console.warn('Failed to load preview content:', err);
          setParsedContent(null);
        })
        .finally(() => {
          setLoadingContent(false);
        });
    } else {
      setParsedContent(null);
      setLoadingContent(false);
    }
  }, [isOpen, fileUrl, ext, isOffice]);

  if (!isOpen || !fileUrl) return null;

  const viewUrl = getFileViewUrl(fileUrl);
  const downloadUrl = getFileDownloadUrl(fileUrl);

  const handleCopyLink = () => {
    const fullUrl = `${window.location.origin}${downloadUrl}`;
    navigator.clipboard.writeText(fullUrl);
    setCopied(true);
    toast.success('Direct document link copied!');
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownload = async (e) => {
    if (e) e.preventDefault();
    setDownloading(true);
    toast.success(`Downloading ${fileName}...`);
    try {
      await triggerDirectDownload(fileUrl, fileName);
    } catch (err) {
      console.error('Download error:', err);
      toast.error('Download failed. Trying fallback...');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-5 md:p-8">
        {/* Backdrop */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-gray-950/75 backdrop-blur-sm transition-opacity"
        />

        {/* Modal Window */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.97, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.97, y: 12 }}
          className="relative w-full max-w-5xl bg-white rounded-3xl shadow-2xl border border-gray-100 flex flex-col max-h-[92vh] overflow-hidden z-10"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-gray-100 bg-gray-50/90 flex-shrink-0">
            <div className="flex items-center gap-3 min-w-0">
              <div className="p-2.5 bg-blue-50 text-blue-600 rounded-2xl flex-shrink-0 shadow-xs">
                {isPdfFile ? <FileText size={20} /> : isOffice ? <FileSpreadsheet size={20} /> : <FileCheck size={20} />}
              </div>
              <div className="min-w-0">
                <h3 className="text-base font-black text-gray-900 truncate">{title || 'Document Preview'}</h3>
                <div className="text-xs font-semibold text-gray-500 truncate flex items-center gap-2 mt-0.5">
                  <span className="truncate max-w-[200px] sm:max-w-[350px]">{fileName}</span>
                  {ext && (
                    <span className="uppercase text-[10px] bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded-md font-black">
                      {ext.replace('.', '')}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopyLink}
                title="Copy direct file link"
                className="hidden sm:flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-gray-700 hover:text-gray-900 bg-white hover:bg-gray-100 rounded-xl border border-gray-200 shadow-xs transition-all cursor-pointer"
              >
                {copied ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                <span>{copied ? 'Copied' : 'Copy Link'}</span>
              </button>

              <a
                href={viewUrl}
                target="_blank"
                rel="noreferrer"
                title="Open in new window / full tab"
                className="hidden sm:flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-gray-700 hover:text-blue-600 bg-white hover:bg-gray-100 rounded-xl border border-gray-200 shadow-xs transition-all cursor-pointer"
              >
                <ExternalLink size={14} />
                <span>Open Tab</span>
              </a>

              <button
                type="button"
                onClick={handleDownload}
                disabled={downloading}
                title="Download this document directly"
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-black text-white bg-blue-600 hover:bg-blue-700 active:scale-95 rounded-xl shadow-md shadow-blue-500/20 transition-all cursor-pointer disabled:opacity-50"
              >
                {downloading ? <RefreshCw size={14} className="animate-spin" /> : <Download size={14} />}
                <span>{downloading ? 'Downloading...' : 'Download'}</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-all ml-1 cursor-pointer"
                aria-label="Close viewer"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Body Viewer */}
          <div className="flex-1 overflow-auto bg-slate-900/5 min-h-[440px] flex items-center justify-center p-3 sm:p-5">
            {loadingContent ? (
              <div className="flex flex-col items-center justify-center p-12 gap-3">
                <RefreshCw size={32} className="animate-spin text-blue-600" />
                <p className="text-sm font-bold text-gray-600">Loading document preview...</p>
              </div>
            ) : parsedContent?.type === 'html' ? (
              /* Rich HTML Word / DOCX Preview */
              <div className="w-full bg-white rounded-2xl shadow-sm border border-gray-200 p-6 sm:p-10 max-h-[70vh] overflow-y-auto font-sans leading-relaxed text-gray-800 prose max-w-none">
                <div className="flex items-center justify-between pb-4 mb-6 border-b border-gray-100">
                  <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg">
                    Formatted Document Preview
                  </span>
                  <button
                    onClick={handleDownload}
                    className="text-xs font-bold text-gray-600 hover:text-blue-600 flex items-center gap-1 cursor-pointer"
                  >
                    <Download size={13} /> Download Original (.docx)
                  </button>
                </div>
                <div dangerouslySetInnerHTML={{ __html: parsedContent.html }} />
              </div>
            ) : parsedContent?.type === 'text' ? (
              /* Text / CSV / Code Preview */
              <div className="w-full bg-slate-900 text-slate-100 rounded-2xl p-5 max-h-[70vh] overflow-auto font-mono text-xs leading-relaxed shadow-lg">
                <pre className="whitespace-pre-wrap break-words">{parsedContent.content}</pre>
              </div>
            ) : isPdfFile ? (
              /* PDF Embedded Viewer with Fallback */
              !loadError ? (
                <div className="w-full h-full min-h-[550px] bg-white rounded-2xl overflow-hidden shadow-inner border border-gray-200 flex flex-col relative">
                  <iframe
                    src={viewUrl}
                    title={fileName}
                    className="w-full h-full min-h-[550px] border-0 flex-1"
                    onError={() => setLoadError(true)}
                  />
                </div>
              ) : (
                <div className="text-center p-8 bg-white rounded-3xl shadow-sm border border-gray-100 max-w-md">
                  <FileText size={48} className="mx-auto text-blue-500 mb-4" />
                  <h4 className="text-base font-bold text-gray-900 mb-2">PDF Document Ready</h4>
                  <p className="text-xs text-gray-500 mb-6">Preview embedding is restricted by your browser. Open in a new tab or download directly below.</p>
                  <div className="flex justify-center gap-3">
                    <a
                      href={viewUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl text-xs font-bold transition-all flex items-center gap-2"
                    >
                      <ExternalLink size={14} /> Open in Tab
                    </a>
                    <button
                      onClick={handleDownload}
                      className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black transition-all flex items-center gap-2 shadow-lg shadow-blue-500/20 cursor-pointer"
                    >
                      <Download size={14} /> Download PDF
                    </button>
                  </div>
                </div>
              )
            ) : isImageFile ? (
              <div className="flex flex-col items-center justify-center p-4 max-h-full">
                <img 
                  src={viewUrl} 
                  alt={fileName} 
                  className="max-h-[65vh] max-w-full rounded-2xl object-contain shadow-lg border border-gray-200 bg-white" 
                />
              </div>
            ) : (
              /* Office / Binary Document Card */
              <div className="text-center p-8 sm:p-12 bg-white rounded-3xl shadow-sm border border-gray-100 max-w-lg w-full">
                <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-3xl mx-auto flex items-center justify-center mb-6 shadow-sm">
                  {ext === '.docx' || ext === '.doc' ? (
                    <FileText size={36} />
                  ) : ext === '.xlsx' || ext === '.xls' || ext === '.csv' ? (
                    <FileSpreadsheet size={36} />
                  ) : (
                    <FileCode size={36} />
                  )}
                </div>
                <h4 className="text-lg font-black text-gray-900 mb-1">{fileName}</h4>
                <p className="text-xs text-gray-500 mb-6 font-medium">
                  {ext ? `${ext.toUpperCase().replace('.', '')} Document` : 'Project Artifact'} • Ready for secure download and verification
                </p>

                <div className="flex flex-col sm:flex-row justify-center gap-3">
                  <a
                    href={viewUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="px-5 py-3 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-2xl text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <ExternalLink size={16} /> Open Document
                  </a>
                  <button
                    onClick={handleDownload}
                    className="px-5 py-3 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white rounded-2xl text-xs font-black transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 cursor-pointer"
                  >
                    <Download size={16} /> Download File
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-3.5 bg-gray-50 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500 font-medium flex-shrink-0">
            <span className="flex items-center gap-1.5 text-[11px] text-gray-500">
              <Eye size={13} className="text-blue-500" /> SmartFYP Verified Document Repository
            </span>
            <button
              onClick={onClose}
              className="px-4 py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-xl font-bold text-xs transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default DocumentViewerModal;
