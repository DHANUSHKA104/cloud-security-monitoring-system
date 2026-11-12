
import React, { useEffect, ReactNode, useRef } from 'react';

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl';
  theme?: 'dark' | 'light';
}

export const Modal: React.FC<ModalProps> = ({
  open,
  onClose,
  title,
  children,
  footer,
  maxWidth = 'md',
  theme = 'dark',
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const isDark = theme === 'dark';

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, onClose]);

  if (!open) return null;

  const maxWidthStyles = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
  };

  const modalStyles = isDark
    ? 'bg-slate-900 border-slate-700 text-slate-100'
    : 'bg-white border-slate-200 text-slate-900';

  const headerStyles = isDark
    ? 'border-slate-700'
    : 'border-slate-200';

  const closeButtonStyles = isDark
    ? 'text-slate-400 hover:text-white hover:bg-slate-800 focus-visible:ring-violet-400'
    : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100 focus-visible:ring-violet-500';

  const footerStyles = isDark
    ? 'border-slate-700 bg-slate-950/40'
    : 'border-slate-200 bg-slate-50';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/65 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className={`w-full ${maxWidthStyles[maxWidth]} ${modalStyles} border rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`px-6 py-4 border-b flex items-center justify-between ${headerStyles}`}>
          <h3
            id="modal-title"
            className="text-base font-semibold tracking-tight"
          >
            {title}
          </h3>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className={`rounded-lg p-2 transition-colors focus:outline-none focus-visible:ring-2 ${closeButtonStyles}`}
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[75vh] overflow-y-auto">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className={`px-6 py-4 border-t flex items-center justify-end gap-3 ${footerStyles}`}>
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

export default Modal;
