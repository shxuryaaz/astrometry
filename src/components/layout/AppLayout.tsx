import React from 'react';
import { Sidebar } from '../ui/Sidebar';
import { TopBar } from './TopBar';

interface AppLayoutProps {
  children: React.ReactNode;
  userRole?: 'user' | 'astrologer' | 'admin';
  currentRoute?: string;
  onNavigate: (route: string) => void;
  user?: {
    uid: string;
    email: string | null;
    displayName: string | null;
    photoURL: string | null;
    role: 'end_user' | 'astrologer' | 'admin';
    credits: number;
    referralCode: string;
  };
}

export function AppLayout({ 
  children, 
  userRole = 'user', 
  currentRoute = '/', 
  onNavigate, 
  user 
}: AppLayoutProps) {
  return (
    <div className="h-screen bg-[var(--bg-900)] flex overflow-hidden">
      {/* Sidebar */}
      <div className="hidden lg:block">
        <Sidebar
          userRole={user?.role || userRole}
          activeRoute={currentRoute}
          onNavigate={onNavigate}
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar user={user} />
        
        <main className="flex-1 overflow-y-auto">
          <div className="container py-[var(--sp-4)]">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile Sidebar */}
      <div className="lg:hidden">
        <Sidebar
          userRole={user?.role || userRole}
          activeRoute={currentRoute}
          onNavigate={onNavigate}
        />
      </div>
    </div>
  );
}