import React, { useEffect } from 'react';
import { 
  Download, 
  X
} from 'lucide-react';
import { 
  getCleanFileName, 
  triggerDirectDownload 
} from '../utils/fileHelpers';
import { toast } from 'react-hot-toast';

export const DocumentViewerModal = ({ isOpen, onClose, fileUrl, title = 'Document' }) => {
  const fileName = getCleanFileName(fileUrl);

  useEffect(() => {
    if (isOpen && fileUrl) {
      toast.success(`Downloading ${fileName || 'document'}...`);
      triggerDirectDownload(fileUrl, fileName || title);
      const timer = setTimeout(() => {
        if (onClose) onClose();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isOpen, fileUrl, fileName, title, onClose]);

  if (!isOpen || !fileUrl) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-gray-950/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 max-w-md w-full text-center flex flex-col items-center gap-4 animate-in fade-in zoom-in-95 duration-150">
        <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center">
          <Download size={24} className="animate-bounce" />
        </div>
        <div>
          <h3 className="text-base font-bold text-gray-900">Downloading Original File</h3>
          <p className="text-xs text-gray-500 mt-1 truncate max-w-xs">{fileName}</p>
        </div>
        <div className="flex gap-2 w-full mt-2">
          <button
            type="button"
            onClick={() => {
              triggerDirectDownload(fileUrl, fileName || title);
              if (onClose) onClose();
            }}
            className="flex-1 py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-xs"
          >
            <Download size={14} /> Download Again
          </button>
          <button
            type="button"
            onClick={onClose}
            className="py-2 px-3 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold rounded-xl"
          >
            <X size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default DocumentViewerModal;
