import React from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { RadialProgress } from '../components/ui/RadialProgress';
import { 
  MessageSquare, 
  Sparkles, 
  FileText, 
  Share2, 
  TrendingUp,
  Calendar,
  Users,
  Gift
} from 'lucide-react';

interface DashboardPageProps {
  user: {
    name: string;
    email: string;
    avatar?: string;
    credits?: number;
  };
  onNavigate: (route: string) => void;
}

export function DashboardPage({ user, onNavigate }: DashboardPageProps) {
  const recentPredictions = [
    {
      id: 1,
      title: "Career Growth Prediction",
      summary: "Strong potential for promotion in Q2 2025",
      percentage: 78,
      date: "2 days ago",
      category: "Career"
    },
    {
      id: 2,
      title: "Love Compatibility",
      summary: "High compatibility with current partner",
      percentage: 85,
      date: "1 week ago",
      category: "Love"
    },
    {
      id: 3,
      title: "Financial Outlook",
      summary: "Favorable investment opportunities ahead",
      percentage: 68,
      date: "2 weeks ago",
      category: "Finance"
    }
  ];

  const referralCode = "ASTRO2025";

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Welcome Section */}
      <div className="flex items-center gap-4 mb-8">
        <div className="w-16 h-16 rounded-full bg-[var(--accent-500)] flex items-center justify-center text-2xl font-bold text-white">
          {user.avatar ? (
            <img src={user.avatar} alt={user.name} className="w-16 h-16 rounded-full" />
          ) : (
            user.name.charAt(0).toUpperCase()
          )}
        </div>
        <div>
          <h1 className="h1 text-[var(--text-primary)]">
            Welcome, {user.name} ✨
          </h1>
          <p className="text-[var(--text-secondary)]">
            Ready to explore your cosmic insights?
          </p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main Content Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Quick Actions */}
          <Card>
            <h2 className="h2 text-[var(--text-primary)] mb-4">Quick Actions</h2>
            <div className="grid sm:grid-cols-3 gap-4">
              <Button
                onClick={() => onNavigate('/ask')}
                variant="primary"
                size="lg"
                icon={MessageSquare}
                className="h-20 flex-col"
              >
                Ask Question
              </Button>
              <Button
                onClick={() => onNavigate('/kundli')}
                variant="secondary"
                size="lg"
                icon={Sparkles}
                className="h-20 flex-col"
              >
                View Kundli
              </Button>
              <Button
                onClick={() => onNavigate('/reports')}
                variant="secondary"
                size="lg"
                icon={FileText}
                className="h-20 flex-col"
              >
                Generate Report
              </Button>
            </div>
          </Card>

          {/* Recent Predictions */}
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h2 className="h2 text-[var(--text-primary)]">Recent Predictions</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onNavigate('/history')}
              >
                View All
              </Button>
            </div>

            {recentPredictions.length > 0 ? (
              <div className="space-y-4">
                {recentPredictions.map((prediction) => (
                  <div
                    key={prediction.id}
                    className="p-4 bg-[var(--bg-800)] rounded-lg border border-[rgba(255,255,255,0.05)] hover:border-[rgba(255,255,255,0.1)] transition-smooth cursor-pointer"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs px-2 py-1 bg-[var(--accent-500)] text-white rounded-full">
                        {prediction.category}
                      </span>
                      <span className="text-xs text-[var(--text-secondary)]">
                        {prediction.date}
                      </span>
                    </div>
                    <h3 className="font-medium text-[var(--text-primary)] mb-1">
                      {prediction.title}
                    </h3>
                    <p className="text-sm text-[var(--text-secondary)] mb-3">
                      {prediction.summary}
                    </p>
                    <div className="flex items-center gap-3">
                      <div className="text-lg font-bold text-[var(--accent-500)]">
                        {prediction.percentage}%
                      </div>
                      <div className="h-2 flex-1 bg-[rgba(255,255,255,0.1)] rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-[var(--accent-500)] rounded-full transition-all duration-1000 ease-out"
                          style={{ width: `${prediction.percentage}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <MessageSquare className="w-12 h-12 text-[var(--muted)] mx-auto mb-4" />
                <p className="text-[var(--text-secondary)] mb-4">
                  You haven't asked any questions yet.
                </p>
                <p className="text-[var(--text-secondary)] mb-6">
                  Try asking: "How's my career prospects in 2025?"
                </p>
                <Button
                  onClick={() => onNavigate('/ask')}
                  variant="primary"
                  icon={MessageSquare}
                >
                  Ask Your First Question
                </Button>
              </div>
            )}
          </Card>
        </div>

        {/* Sidebar Column */}
        <div className="space-y-6">
          {/* Credits Counter */}
          <Card className="text-center">
            <div className="mb-4">
              <RadialProgress 
                value={(user.credits || 0) * 20} // Convert credits to percentage for display
                size={100}
                label="Questions"
                className="mx-auto"
              />
            </div>
            <h3 className="font-semibold text-[var(--text-primary)] mb-1">
              Free Questions Left
            </h3>
            <p className="text-2xl font-bold text-[var(--accent-500)] mb-4">
              {user.credits || 0} / 5
            </p>
            {(user.credits || 0) === 0 && (
              <Button
                onClick={() => onNavigate('/unlock')}
                variant="primary"
                fullWidth
                icon={Gift}
              >
                Unlock More Questions
              </Button>
            )}
          </Card>

          {/* Referral Card */}
          <Card>
            <div className="text-center mb-4">
              <div className="w-12 h-12 mx-auto bg-[var(--success)] rounded-full flex items-center justify-center mb-3">
                <Share2 className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-semibold text-[var(--text-primary)] mb-2">
                Refer & Earn
              </h3>
              <p className="text-sm text-[var(--text-secondary)] mb-4">
                Share your invite. You earn 1 free question per successful referral.
              </p>
            </div>

            <div className="bg-[var(--bg-800)] rounded-lg p-3 mb-4">
              <p className="text-xs text-[var(--text-secondary)] mb-1">Your referral code:</p>
              <div className="flex items-center justify-between">
                <code className="font-mono text-[var(--text-primary)] font-medium">
                  {referralCode}
                </code>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigator.clipboard.writeText(referralCode)}
                >
                  Copy
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Button variant="secondary" size="sm" fullWidth>
                WhatsApp
              </Button>
              <Button variant="secondary" size="sm" fullWidth>
                SMS
              </Button>
            </div>

            <div className="mt-4 text-center">
              <p className="text-xs text-[var(--text-secondary)]">
                0/3 referrals claimed this month
              </p>
            </div>
          </Card>

          {/* Upcoming Session (if astrologer) */}
          <Card>
            <div className="flex items-center gap-3 mb-3">
              <Calendar className="w-5 h-5 text-[var(--accent-500)]" />
              <h3 className="font-semibold text-[var(--text-primary)]">
                Next Session
              </h3>
            </div>
            <p className="text-sm text-[var(--text-secondary)] mb-2">
              No upcoming sessions scheduled
            </p>
            <Button variant="secondary" size="sm" fullWidth>
              Book Consultation
            </Button>
          </Card>
        </div>
      </div>
    </div>
  );
}