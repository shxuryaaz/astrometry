import React, { useEffect, useState } from 'react';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';

interface ToastProps {
  type?: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message?: string;
  duration?: number;
  onClose: () => void;
}

export function Toast({ type = 'info', title, message, duration = 4000, onClose }: ToastProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 300); // Wait for fade out animation
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const icons = {
    success: CheckCircle,
    error: AlertCircle,
    warning: AlertTriangle,
    info: Info
  };

  const colors = {
    success: 'border-[var(--success)] bg-[var(--success)]',
    error: 'border-[var(--danger)] bg-[var(--danger)]',
    warning: 'border-yellow-500 bg-yellow-500',
    info: 'border-[var(--accent-400)] bg-[var(--accent-400)]'
  };

  const Icon = icons[type];

  return (
    <div className={`
      fixed top-4 right-4 z-50 max-w-sm w-full
      bg-[var(--bg-700)] border-l-4 ${colors[type]}
      rounded-[var(--radius-md)] p-4 shadow-2xl
      transform transition-all duration-300 ease-out
      ${isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
    `}>
      <div className="flex items-start gap-3">
        <div className={`flex-shrink-0 w-5 h-5 ${colors[type].split(' ')[1]} rounded-full p-0.5`}>
          <Icon className="w-4 h-4 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-[var(--text-primary)]">{title}</p>
          {message && (
            <p className="text-sm text-[var(--text-secondary)] mt-1">{message}</p>
          )}
        </div>
        <button
          onClick={() => {
            setIsVisible(false);
            setTimeout(onClose, 300);
          }}
          className="flex-shrink-0 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// Toast container component
export function ToastContainer() {
  // This would be connected to a toast context/store in a real app
  return (
    <div id="toast-container" className="fixed top-4 right-4 z-50 space-y-2" />
  );
}