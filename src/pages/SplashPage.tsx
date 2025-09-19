import React, { useEffect } from 'react';
import { Sparkles } from 'lucide-react';

interface SplashPageProps {
  onComplete: () => void;
}

export function SplashPage({ onComplete }: SplashPageProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onComplete();
    }, 2500);

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className="h-screen bg-[var(--bg-900)] flex items-center justify-center relative overflow-hidden">
      {/* Constellation Background */}
      <div 
        className="absolute inset-0 opacity-6"
        style={{
          backgroundImage: `
            radial-gradient(circle at 20% 30%, rgba(255,255,255,0.1) 1px, transparent 1px),
            radial-gradient(circle at 80% 20%, rgba(255,255,255,0.08) 1px, transparent 1px),
            radial-gradient(circle at 40% 70%, rgba(255,255,255,0.06) 1px, transparent 1px),
            radial-gradient(circle at 90% 80%, rgba(255,255,255,0.1) 1px, transparent 1px),
            radial-gradient(circle at 10% 90%, rgba(255,255,255,0.08) 1px, transparent 1px)
          `,
          animation: 'constellation-twinkle 3s ease-in-out infinite'
        }}
      />

      {/* Main Content */}
      <div className="text-center animate-fade-in">
        <div className="relative mb-8">
          <div 
            className="w-32 h-32 mx-auto bg-[var(--accent-500)] rounded-full flex items-center justify-center"
            style={{ animation: 'pulse-glow 1.8s ease-in-out infinite' }}
          >
            <Sparkles className="w-16 h-16 text-white" />
          </div>
          <div className="absolute inset-0 w-32 h-32 mx-auto bg-[var(--accent-500)] rounded-full opacity-20 animate-ping" />
        </div>
        
        <h1 className="h1 text-[var(--text-primary)] mb-4">AstroAI</h1>
        <p className="caption text-[var(--text-secondary)] max-w-sm mx-auto">
          AI-Powered Astrology, Reimagined
        </p>
      </div>
    </div>
  );
}