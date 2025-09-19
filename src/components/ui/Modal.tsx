import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { Button } from './Button';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl';
  children: React.ReactNode;
}

export function Modal({ isOpen, onClose, title, maxWidth = 'md', children }: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      modalRef.current?.focus();
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const maxWidths = {
    sm: 'max-w-sm',
    md: 'max-w-2xl',
    lg: 'max-w-4xl',
    xl: 'max-w-6xl'
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div 
        className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        ref={modalRef}
        tabIndex={-1}
        className={`
          relative bg-[var(--bg-700)] border border-[rgba(255,255,255,0.1)]
          rounded-[var(--radius-md)] p-[var(--sp-4)] m-4
          ${maxWidths[maxWidth]} w-full max-h-[90vh] overflow-y-auto
          animate-scale-in
        `}
      >
        {title && (
          <div className="flex items-center justify-between mb-[var(--sp-4)]">
            <h2 className="h2">{title}</h2>
            <Button
              variant="ghost"
              size="sm"
              icon={X}
              onClick={onClose}
              aria-label="Close modal"
            />
          </div>
        )}
        {!title && (
          <Button
            variant="ghost"
            size="sm"
            icon={X}
            onClick={onClose}
            className="absolute top-4 right-4"
            aria-label="Close modal"
          />
        )}
        {children}
      </div>
    </div>
  );
}