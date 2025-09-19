import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  hover?: boolean;
  glass?: boolean;
}

export function Card({ children, hover = false, glass = false, className = '', ...props }: CardProps) {
  const baseStyles = `
    bg-[var(--bg-700)] border border-[rgba(255,255,255,0.03)]
    rounded-[var(--radius-md)] p-[var(--sp-3)]
    ${hover ? 'transition-smooth hover:border-[rgba(255,255,255,0.1)] hover:-translate-y-1 hover:shadow-xl' : ''}
    ${glass ? 'glass-bg' : ''}
  `;

  return (
    <div className={`${baseStyles} ${className}`} {...props}>
      {children}
    </div>
  );
}