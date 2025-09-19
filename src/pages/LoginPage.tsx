import React, { useState } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';

interface LoginPageProps {
  onLogin: (user: { id: string; name: string; email: string; avatar?: string }) => void;
}

export function LoginPage({ onLogin }: LoginPageProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    
    // Simulate Google OAuth flow
    try {
      // In a real app, this would integrate with Google OAuth
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mock user data
      const mockUser = {
        id: '1',
        name: 'John Doe',
        email: 'john.doe@gmail.com',
        avatar: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=64&h=64&dpr=1'
      };
      
      onLogin(mockUser);
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