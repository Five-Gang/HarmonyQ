import { useState } from 'react';
import { clsx } from 'clsx';
import { Search, X } from 'lucide-react';

export const SearchBar = ({ value, onChange, placeholder = 'Search...', className }) => (
  <div className={clsx('relative', className)}>
    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="input pl-9 pr-9"
    />
    {value && (
      <button
        onClick={() => onChange('')}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    )}
  </div>
);

export const Select = ({ value, onChange, options, placeholder, className }) => (
  <select
    value={value}
    onChange={(e) => onChange(e.target.value)}
    className={clsx('input appearance-none cursor-pointer', className)}
  >
    {placeholder && <option value="">{placeholder}</option>}
    {options.map((opt) => (
      <option key={opt.value} value={opt.value}>{opt.label}</option>
    ))}
  </select>
);

export const Modal = ({ isOpen, onClose, title, children, size = 'md' }) => {
  if (!isOpen) return null;
  const sizes = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className={clsx('relative w-full card p-6 animate-slide-up', sizes[size])}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">{title}</h2>
          <button onClick={onClose} className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-surface-3 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
};

export const Badge = ({ children, variant = 'default', className }) => {
  const variants = {
    default: 'bg-surface-3 text-slate-300 border border-white/10',
    brand: 'badge-genre',
    success: 'badge-public',
    muted: 'badge-private',
    accent: 'bg-accent-600/20 text-accent-400 border border-accent-600/30',
  };
  return (
    <span className={clsx('badge', variants[variant], className)}>{children}</span>
  );
};

export const Pagination = ({ page, totalPages, onPageChange }) => {
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-center gap-2 mt-8">
      <button
        onClick={() => onPageChange(page - 1)}
        disabled={page === 1}
        className="btn-ghost disabled:opacity-30"
      >
        ← Previous
      </button>
      <div className="flex items-center gap-1">
        {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
          const pageNum = i + 1;
          return (
            <button
              key={pageNum}
              onClick={() => onPageChange(pageNum)}
              className={clsx(
                'w-9 h-9 rounded-lg text-sm font-medium transition-all',
                page === pageNum
                  ? 'bg-brand-500 text-white'
                  : 'text-slate-400 hover:bg-surface-2 hover:text-white'
              )}
            >
              {pageNum}
            </button>
          );
        })}
      </div>
      <button
        onClick={() => onPageChange(page + 1)}
        disabled={page === totalPages}
        className="btn-ghost disabled:opacity-30"
      >
        Next →
      </button>
    </div>
  );
};

export const TextArea = ({ label, id, ...props }) => (
  <div className="space-y-1">
    {label && <label htmlFor={id} className="block text-sm font-medium text-slate-300">{label}</label>}
    <textarea
      id={id}
      className="input resize-none"
      rows={3}
      {...props}
    />
  </div>
);

export const FormField = ({ label, id, error, children }) => (
  <div className="space-y-1">
    {label && <label htmlFor={id} className="block text-sm font-medium text-slate-300">{label}</label>}
    {children}
    {error && <p className="text-red-400 text-xs">{error}</p>}
  </div>
);
