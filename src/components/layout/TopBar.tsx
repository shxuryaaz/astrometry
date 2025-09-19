import React, { useState } from 'react';
import { Search, Bell, ChevronDown, LogOut, User, Settings } from 'lucide-react';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';

interface TopBarProps {
  user?: {
    name: string;
    email: string;
    avatar?: string;
    credits?: number;
  };
}

export function TopBar({ user }: TopBarProps) {
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  return (
    <header className="h-16 bg-[var(--bg-800)] border-b border-[rgba(255,255,255,0.06)] flex items-center px-[var(--sp-4)]">
      <div className="flex-1 flex items-center gap-4">
        {/* Search */}
        <div className="max-w-md w-full">
          <Input
            placeholder="Search questions, reports..."
            icon={<Search className="w-4 h-4" />}
            className="bg-[var(--bg-700)]"
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Credits (if user) */}
        {user?.credits !== undefined && (
          <div className="px-3 py-1 bg-[var(--accent-500)] text-white rounded-full text-sm font-medium">
            {user.credits} Credits
          </div>
        )}

        {/* Notifications */}
        <Button
          variant="ghost"
          size="sm"
          icon={Bell}
          aria-label="Notifications"
        />

        {/* Profile Menu */}
        <div className="relative">
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center gap-2 p-2 rounded-lg hover:bg-[var(--glass)] transition-smooth"
          >
            <div className="w-8 h-8 rounded-full bg-[var(--accent-500)] flex items-center justify-center text-sm font-medium text-white">
              {user?.avatar ? (
                <img src={user.avatar} alt={user.name} className="w-8 h-8 rounded-full" />
              ) : (
                user?.name?.charAt(0).toUpperCase() || 'U'
              )}
            </div>
            <span className="hidden md:block text-[var(--text-primary)] font-medium">
              {user?.name || 'User'}
            </span>
            <ChevronDown className="w-4 h-4 text-[var(--text-secondary)]" />
          </button>

          {showProfileMenu && (
            <div className="absolute top-full right-0 mt-2 w-48 bg-[var(--bg-700)] border border-[rgba(255,255,255,0.1)] rounded-[var(--radius-md)] shadow-xl z-50">
              <div className="p-3 border-b border-[rgba(255,255,255,0.1)]">
                <p className="font-medium text-[var(--text-primary)]">{user?.name}</p>
                <p className="text-sm text-[var(--text-secondary)]">{user?.email}</p>
              </div>
              
              <div className="p-1">
                <button className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-[var(--glass)] rounded-lg transition-smooth">
                  <User className="w-4 h-4" />
                  Profile
                </button>
                <button className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-[var(--glass)] rounded-lg transition-smooth">
                  <Settings className="w-4 h-4" />
                  Settings
                </button>
                <hr className="my-1 border-[rgba(255,255,255,0.1)]" />
                <button className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-[var(--glass)] rounded-lg transition-smooth text-[var(--danger)]">
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}