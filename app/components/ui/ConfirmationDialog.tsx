// app/components/ui/ConfirmationDialog.tsx
'use client';

import React, { useEffect, useRef } from 'react';

interface ConfirmationDialogProps {
  open: boolean;
  title: string;
  description: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  loadingLabel?: string;
  isDestructive?: boolean;
  icon?: React.ReactNode;
  onCancel: () => void;
  onConfirm: () => void;
  loading?: boolean;
}

export default function ConfirmationDialog({
  open,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  loadingLabel = 'Processing...',
  isDestructive = true,
  icon,
  onCancel,
  onConfirm,
  loading = false,
}: ConfirmationDialogProps) {
  const confirmButtonRef = useRef<HTMLButtonElement>(null);

  // Automatically focus primary action on open
  useEffect(() => {
    if (open) {
      confirmButtonRef.current?.focus();
    }
  }, [open]);

  // Handle escape key press to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open && !loading) {
        onCancel();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, loading, onCancel]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/35 backdrop-blur-sm transition-opacity"
        onClick={() => {
          if (loading) return;
          onCancel();
        }}
      />

      {/* Card Dialog Shell */}
      <div className="relative w-full max-w-md rounded-2xl border border-[#EDE7DC] bg-white p-6 shadow-xl transition-all z-10">
        {icon && (
          <div className="mb-4 flex justify-center">
            {icon}
          </div>
        )}

        <div>
          <h3 className="text-lg font-semibold text-[#29231D]">
            {title}
          </h3>
          <div className="mt-2 text-sm text-[#7C7265] leading-relaxed">
            {description}
          </div>
        </div>

        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            type="button"
            disabled={loading}
            onClick={onCancel}
            className="rounded-xl px-4 py-2 text-sm font-medium text-[#7C7265] hover:bg-[#FBF7EF] transition-colors disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          
          <button
            ref={confirmButtonRef}
            type="button"
            disabled={loading}
            onClick={onConfirm}
            className={`inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-medium text-white transition-colors disabled:opacity-50 ${
              isDestructive
                ? 'bg-red-600 hover:bg-red-700 focus:ring-red-600'
                : 'bg-[#0D0C0A] hover:bg-[#29231D] focus:ring-[#0D0C0A]'
            }`}
          >
            {loading ? (
              <span className="inline-flex items-center gap-2">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                {loadingLabel}
              </span>
            ) : (
              confirmLabel
            )}
          </button>
        </div>
      </div>
    </div>
  );
}