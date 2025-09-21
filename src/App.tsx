import React, { useState } from 'react';
import { SplashPage } from './pages/SplashPage';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { KundliPage } from './pages/KundliPage';
import { QuestionFlowPage } from './pages/QuestionFlowPage';
import { AppLayout } from './components/layout/AppLayout';
import { ToastContainer } from './components/ui/Toast';
import { AuthProvider, useAuth } from './context/AuthContext';

type AppState = 'splash' | 'login' | 'app';
type CurrentRoute = '/' | '/ask' | '/kundli' | '/reports' | '/profile' | '/settings';

function AppContent() {
  const [appState, setAppState] = useState<AppState>('splash');
  const [currentRoute, setCurrentRoute] = useState<CurrentRoute>('/');
  const { user, loading, signOut } = useAuth();

  const handleSplashComplete = () => {
    setAppState('login');
  };

  const handleNavigate = (route: string) => {
    setCurrentRoute(route as CurrentRoute);
  };

  const handleLogout = async () => {
    await signOut();
    setAppState('login');
    setCurrentRoute('/');
  };

  if (loading) {
    return <SplashPage onComplete={() => {}} />;
  }

  if (appState === 'splash') {
    return <SplashPage onComplete={handleSplashComplete} />;
  }

  if (appState === 'login' || !user) {
    return <LoginPage onComplete={() => setAppState('app')} />;
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

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;