import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trash2, AlertTriangle, AlertCircle, CheckCircle, X, Loader2 } from 'lucide-react';

/**
 * Universal confirmation dialogue pop-up modal for Deletion, Deactivation, and critical actions.
 */
const ConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm Action',
  message = 'Are you sure you want to proceed with this action?',
  confirmText,
  cancelText = 'Cancel',
  variant = 'danger', // 'danger' | 'warning' | 'info' | 'success'
  isLoading = false,
  itemName = null,
  confirmId = 'confirm-dialog-btn',
  cancelId = 'cancel-dialog-btn'
}) => {
  // Listen for Escape key to close modal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen && !isLoading) {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isLoading, onClose]);

  if (!isOpen) return null;

  // Variant styling configurations
  const variantConfigs = {
    danger: {
      icon: <Trash2 size={28} className="text-red-600" />,
      iconBg: 'bg-red-50 border-red-100',
      defaultConfirmText: 'Delete',
      confirmBtnClass: 'bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-200 focus:ring-red-500'
    },
    warning: {
      icon: <AlertCircle size={28} className="text-amber-600" />,
      iconBg: 'bg-amber-50 border-amber-100',
      defaultConfirmText: 'Deactivate',
      confirmBtnClass: 'bg-amber-600 hover:bg-amber-700 text-white shadow-lg shadow-amber-200 focus:ring-amber-500'
    },
    info: {
      icon: <AlertTriangle size={28} className="text-blue-600" />,
      iconBg: 'bg-blue-50 border-blue-100',
      defaultConfirmText: 'Confirm',
      confirmBtnClass: 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-200 focus:ring-blue-500'
    },
    success: {
      icon: <CheckCircle size={28} className="text-emerald-600" />,
      iconBg: 'bg-emerald-50 border-emerald-100',
      defaultConfirmText: 'Activate',
      confirmBtnClass: 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-200 focus:ring-emerald-500'
    }
  };

  const currentConfig = variantConfigs[variant] || variantConfigs.danger;
  const resolvedConfirmText = confirmText || currentConfig.defaultConfirmText;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[350] flex items-center justify-center p-4 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => {
            if (!isLoading) onClose();
          }}
          className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm"
        />

        {/* Modal Dialog Content */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ type: 'spring', duration: 0.35, bounce: 0.2 }}
          className="relative bg-white w-full max-w-md rounded-2xl shadow-2xl border border-gray-100 p-6 sm:p-7 text-center space-y-4 my-auto overflow-hidden"
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-modal-title"
        >
          {/* Top-right close button */}
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="absolute top-4 right-4 p-1.5 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors disabled:opacity-50"
            aria-label="Close dialogue"
          >
            <X size={18} />
          </button>

          {/* Icon */}
          <div className={`w-16 h-16 rounded-2xl border flex items-center justify-center mx-auto shadow-sm ${currentConfig.iconBg}`}>
            {currentConfig.icon}
          </div>

          {/* Title and Message */}
          <div className="space-y-2">
            <h3 id="confirm-modal-title" className="text-xl font-bold text-gray-900 tracking-tight">
              {title}
            </h3>
            <p className="text-sm text-gray-600 leading-relaxed max-w-sm mx-auto">
              {message}
            </p>
          </div>

          {/* Optional item preview chip */}
          {itemName && (
            <div className="py-2 px-3 bg-gray-50 rounded-xl text-xs font-semibold text-gray-700 border border-gray-200/70 truncate max-w-xs mx-auto">
              {itemName}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col-reverse sm:flex-row gap-3 pt-2">
            <button
              id={cancelId}
              type="button"
              disabled={isLoading}
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-300 transition-all text-sm disabled:opacity-50"
            >
              {cancelText}
            </button>
            <button
              id={confirmId}
              type="button"
              disabled={isLoading}
              onClick={onConfirm}
              className={`flex-1 px-4 py-2.5 font-bold rounded-xl focus:outline-none focus:ring-2 transition-all text-sm flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer ${currentConfig.confirmBtnClass}`}
            >
              {isLoading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                resolvedConfirmText
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default ConfirmModal;
