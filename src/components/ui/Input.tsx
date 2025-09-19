import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

export function Input({ label, error, icon, className = '', ...props }: InputProps) {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[var(--muted)]">
            {icon}
          </div>
        )}
        <input
          className={`
            w-full px-4 py-3 bg-[var(--bg-800)] border border-[rgba(255,255,255,0.1)]
            rounded-[var(--radius-input)] text-[var(--text-primary)] placeholder-[var(--muted)]
            focus:outline-none focus:ring-2 focus:ring-[var(--accent-500)] focus:border-transparent
            transition-smooth disabled:opacity-50 disabled:cursor-not-allowed
            ${icon ? 'pl-10' : ''}
            ${error ? 'border-[var(--danger)]' : ''}
            ${className}
          `}
          {...props}
        />
      </div>
      {error && (
        <p className="mt-1 text-sm text-[var(--danger)]">{error}</p>
      )}
    </div>
  );
}