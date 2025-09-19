import React from 'react';
import { DivideIcon as LucideIcon } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  icon?: LucideIcon;
  iconPosition?: 'left' | 'right';
  loading?: boolean;
  fullWidth?: boolean;
}

export function Button({ 
  variant = 'primary', 
  size = 'md', 
  icon: Icon, 
  iconPosition = 'left',
  loading = false,
  fullWidth = false,
  children, 
  className = '', 
  disabled,
  ...props 
}: ButtonProps) {
  const baseStyles = `
    inline-flex items-center justify-center gap-2 font-medium rounded-xl
    transition-smooth focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400
    disabled:opacity-50 disabled:cursor-not-allowed
    ${fullWidth ? 'w-full' : ''}
  `;

  const variants = {
    primary: `
      bg-[var(--accent-500)] text-white shadow-lg
      hover:bg-[#5A0B8A] hover:shadow-xl hover:-translate-y-0.5
      active:transform-none active:shadow-md
    `,
    secondary: `
      glass-bg text-[var(--text-primary)]
      hover:bg-[rgba(255,255,255,0.08)] hover:-translate-y-0.5
    `,
    ghost: `
      bg-transparent text-[var(--text-primary)]
      hover:bg-[var(--glass)] hover:-translate-y-0.5
    `,
    danger: `
      bg-[var(--danger)] text-white shadow-lg
      hover:bg-red-600 hover:shadow-xl hover:-translate-y-0.5
      active:transform-none active:shadow-md
    `
  };

  const sizes = {
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-3 text-base',
    lg: 'px-6 py-4 text-lg'
  };

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
      ) : (
        <>
          {Icon && iconPosition === 'left' && <Icon className="w-4 h-4" />}
          {children}
          {Icon && iconPosition === 'right' && <Icon className="w-4 h-4" />}
        </>
      )}
    </button>
  );
}