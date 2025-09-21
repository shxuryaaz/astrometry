import React, { useState } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { useAuth } from '../context/AuthContext';

interface LoginPageProps {
  onComplete: () => void;
}

export function LoginPage({ onComplete }: LoginPageProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { signInWithGoogle } = useAuth();

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    
    try {
      await signInWithGoogle();
      onComplete();
    } catch (error) {
      console.error('Login failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-900)] flex items-center justify-center px-4">
      <div className="w-full max-w-md animate-fade-in">
        <Card className="text-center">
          <div className="mb-8">
            <div className="w-16 h-16 mx-auto bg-[var(--accent-500)] rounded-full flex items-center justify-center mb-4">
              <span className="text-2xl">✨</span>
            </div>
            <h1 className="h1 text-[var(--text-primary)] mb-2">Sign In to Continue</h1>
            <p className="text-[var(--text-secondary)]">
              Personalized astrology insights, powered by AI
            </p>
          </div>

          <div className="space-y-4">
            <Button
              onClick={handleGoogleLogin}
              loading={isLoading}
              fullWidth
              size="lg"
              className="bg-white text-gray-900 hover:bg-gray-100 font-medium"
            >
              <img 
                src="https://developers.google.com/identity/images/g-logo.png" 
                alt="Google" 
                className="w-5 h-5" 
              />
              Continue with Google
            </Button>

            <button className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
              Use different email
            </button>
          </div>

          <div className="mt-8 pt-6 border-t border-[rgba(255,255,255,0.1)]">
            <p className="text-xs text-[var(--text-secondary)]">
              By continuing, you agree to our{' '}
              <a href="#" className="text-[var(--accent-400)] hover:underline">Terms</a>
              {' & '}
              <a href="#" className="text-[var(--accent-400)] hover:underline">Privacy Policy</a>
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}