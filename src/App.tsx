import React, { useState, useEffect } from 'react';
import { SplashPage } from './pages/SplashPage';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { KundliPage } from './pages/KundliPage';
import { QuestionFlowPage } from './pages/QuestionFlowPage';
import { AppLayout } from './components/layout/AppLayout';
import { ToastContainer } from './components/ui/Toast';

interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: 'user' | 'astrologer' | 'admin';
  credits: number;
  dateOfBirth?: string;
  timeOfBirth?: string;
  placeOfBirth?: string;
}

type AppState = 'splash' | 'login' | 'app';
type CurrentRoute = '/' | '/ask' | '/kundli' | '/reports' | '/profile' | '/settings';

function App() {
  const [appState, setAppState] = useState<AppState>('splash');
  const [currentRoute, setCurrentRoute] = useState<CurrentRoute>('/');
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // Check for existing session
    const savedUser = localStorage.getItem('astroai_user');
    if (savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        setUser(parsedUser);
        setAppState('app');
      } catch (error) {
        console.error('Failed to parse saved user:', error);
        localStorage.removeItem('astroai_user');
      }
    }
  }, []);

  const handleSplashComplete = () => {
    setAppState('login');
  };

  const handleLogin = (loginUser: { id: string; name: string; email: string; avatar?: string }) => {
    const newUser: User = {
      ...loginUser,
      role: 'user',
      credits: 5, // Free questions
      dateOfBirth: '1990-01-15',
      timeOfBirth: '10:30 AM',
      placeOfBirth: 'New Delhi, India'
    };
    
    setUser(newUser);
    localStorage.setItem('astroai_user', JSON.stringify(newUser));
    setAppState('app');
    setCurrentRoute('/');
  };

  const handleNavigate = (route: string) => {
    setCurrentRoute(route as CurrentRoute);
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('astroai_user');
    setAppState('login');
    setCurrentRoute('/');
  };

  if (appState === 'splash') {
    return <SplashPage onComplete={handleSplashComplete} />;
  }

  if (appState === 'login') {
    return <LoginPage onLogin={handleLogin} />;
  }

  if (!user) {
    return <LoginPage onLogin={handleLogin} />;
  }

  const renderCurrentPage = () => {
    switch (currentRoute) {
      case '/':
        return <DashboardPage user={user} onNavigate={handleNavigate} />;
      case '/ask':
        return <QuestionFlowPage onNavigate={handleNavigate} />;
      case '/kundli':
        return <KundliPage user={user} />;
      case '/reports':
        return (
          <div className="text-center py-12">
            <h1 className="h1 text-[var(--text-primary)] mb-4">Reports</h1>
            <p className="text-[var(--text-secondary)]">Generate and download personalized PDF reports</p>
          </div>
        );
      case '/profile':
        return (
          <div className="text-center py-12">
            <h1 className="h1 text-[var(--text-primary)] mb-4">Profile</h1>
            <p className="text-[var(--text-secondary)]">Manage your account settings and preferences</p>
          </div>
        );
      case '/settings':
        return (
          <div className="text-center py-12">
            <h1 className="h1 text-[var(--text-primary)] mb-4">Settings</h1>
            <p className="text-[var(--text-secondary)]">Customize your astrology experience</p>
          </div>
        );
      default:
        return <DashboardPage user={user} onNavigate={handleNavigate} />;
    }
  };

  return (
    <>
      <AppLayout
        userRole={user.role}
        currentRoute={currentRoute}
        onNavigate={handleNavigate}
        user={user}
      >
        {renderCurrentPage()}
      </AppLayout>
      <ToastContainer />
    </>
  );
}

export default App;