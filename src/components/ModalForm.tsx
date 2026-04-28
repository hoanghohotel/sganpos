import React from 'react';
import { X } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';

/* Modal Wrapper */
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
  footer?: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  size = 'md',
  footer
}) => {
  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg'
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/20 backdrop-blur-sm"
      />

      {/* Modal Content */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className={cn('card-base relative z-10 w-full', sizeClasses[size])}
      >
        {/* Header */}
        {title && (
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-slate-900">{title}</h2>
              {description && <p className="text-sm text-slate-500 mt-1">{description}</p>}
            </div>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        )}

        {/* Body */}
        <div className="mb-6">{children}</div>

        {/* Footer */}
        {footer && (
          <div className="flex items-center justify-end gap-3 pt-6 border-t border-slate-200">
            {footer}
          </div>
        )}
      </motion.div>
    </div>
  );
};

/* Form Group */
interface FormGroupProps {
  label?: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
}

export const FormGroup: React.FC<FormGroupProps> = ({ label, error, required, children }) => (
  <div className="space-y-2">
    {label && (
      <label className="text-sm font-semibold text-slate-700 block">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
    )}
    {children}
    {error && <p className="text-xs text-red-500 font-medium">{error}</p>}
  </div>
);

/* Text Input */
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
}

export const Input: React.FC<InputProps> = ({ error, ...props }) => (
  <input {...props} className={cn('input-base input-focus', error && 'border-red-500')} />
);

/* Text Area */
interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: string;
}

export const TextArea: React.FC<TextAreaProps> = ({ error, ...props }) => (
  <textarea
    {...props}
    className={cn(
      'w-full px-4 py-3 rounded-lg border border-slate-200 bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition-colors resize-none',
      error && 'border-red-500'
    )}
  />
);

/* Select */
interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  error?: string;
  options: Array<{ value: string; label: string }>;
}

export const Select: React.FC<SelectProps> = ({ error, options, ...props }) => (
  <select {...props} className={cn('input-base input-focus', error && 'border-red-500')}>
    {options.map((opt) => (
      <option key={opt.value} value={opt.value}>
        {opt.label}
      </option>
    ))}
  </select>
);

/* Checkbox */
interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export const Checkbox: React.FC<CheckboxProps> = ({ label, ...props }) => (
  <label className="flex items-center gap-3 cursor-pointer">
    <input
      type="checkbox"
      {...props}
      className="w-5 h-5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 focus:ring-2 cursor-pointer"
    />
    {label && <span className="text-sm font-medium text-slate-700">{label}</span>}
  </label>
);

/* Button Group */
interface ButtonGroupProps {
  children: React.ReactNode;
  alignment?: 'start' | 'center' | 'end' | 'between';
}

export const ButtonGroup: React.FC<ButtonGroupProps> = ({ children, alignment = 'end' }) => {
  const alignmentClasses = {
    start: 'justify-start',
    center: 'justify-center',
    end: 'justify-end',
    between: 'justify-between'
  };

  return <div className={cn('flex items-center gap-3', alignmentClasses[alignment])}>{children}</div>;
};

/* Confirmation Dialog */
interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDangerous?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  message,
  confirmText = 'Xác nhận',
  cancelText = 'Hủy',
  isDangerous = false,
  onConfirm,
  onCancel
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onCancel}
        className="absolute inset-0 bg-slate-900/20 backdrop-blur-sm"
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="card-base relative z-10 max-w-sm"
      >
        <h2 className="text-lg font-bold text-slate-900 mb-2">{title}</h2>
        <p className="text-slate-600 mb-6">{message}</p>

        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="button-secondary"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={isDangerous ? 'button-danger' : 'button-primary'}
          >
            {confirmText}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

/* Alert Message */
interface AlertProps {
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  onClose?: () => void;
}

export const Alert: React.FC<AlertProps> = ({ type, message, onClose }) => {
  const typeClasses = {
    success: 'badge-success',
    error: 'badge-danger',
    warning: 'badge-warning',
    info: 'badge-info'
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={cn('flex items-center justify-between gap-4 p-4 rounded-lg', typeClasses[type])}
    >
      <span className="text-sm font-medium">{message}</span>
      {onClose && (
        <button onClick={onClose} className="text-sm font-semibold hover:opacity-70">
          <X size={16} />
        </button>
      )}
    </motion.div>
  );
};
