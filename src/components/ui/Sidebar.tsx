import React, { useState } from 'react';
import { 
  Home, 
  MessageSquare, 
  FileText, 
  User, 
  Users,
  BarChart3,
  Settings,
  Menu,
  X,
  Sparkles,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { Button } from './Button';

interface SidebarProps {
  userRole?: 'user' | 'astrologer' | 'admin';
  activeRoute?: string;
  onNavigate: (route: string) => void;
}

interface NavItem {
  icon: typeof Home;
  label: string;
  route: string;
  roles: ('user' | 'astrologer' | 'admin')[];
}

const navItems: NavItem[] = [
  { icon: Home, label: 'Dashboard', route: '/', roles: ['user', 'astrologer', 'admin'] },
  { icon: MessageSquare, label: 'Ask Questions', route: '/ask', roles: ['user'] },
  { icon: Sparkles, label: 'Kundli', route: '/kundli', roles: ['user', 'astrologer'] },
  { icon: FileText, label: 'Reports', route: '/reports', roles: ['user', 'astrologer'] },
  { icon: Users, label: 'Clients', route: '/clients', roles: ['astrologer', 'admin'] },
  { icon: BarChart3, label: 'Analytics', route: '/analytics', roles: ['admin'] },
  { icon: Settings, label: 'Settings', route: '/settings', roles: ['user', 'astrologer', 'admin'] },
  { icon: User, label: 'Profile', route: '/profile', roles: ['user', 'astrologer', 'admin'] },
];

export function Sidebar({ userRole = 'user', activeRoute = '/', onNavigate }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const filteredItems = navItems.filter(item => item.roles.includes(userRole));

  const SidebarContent = () => (
    <div className={`
      h-full bg-[var(--bg-800)] border-r border-[rgba(255,255,255,0.06)]
      flex flex-col transition-medium
      ${isCollapsed ? 'w-18' : 'w-64'}
    `}>
      {/* Logo */}
      <div className="p-[var(--sp-3)] border-b border-[rgba(255,255,255,0.06)]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-[var(--accent-500)] rounded-lg flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          {!isCollapsed && (
            <span className="font-semibold text-[var(--text-primary)]">
              AstroAI
            </span>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-[var(--sp-2)]">
        <ul className="space-y-1">
          {filteredItems.map((item) => {
            const isActive = activeRoute === item.route;
            return (
              <li key={item.route}>
                <button
                  onClick={() => onNavigate(item.route)}
                  className={`
                    w-full flex items-center gap-3 px-3 py-3 rounded-lg
                    transition-smooth text-left relative
                    ${isActive 
                      ? 'bg-[var(--accent-500)] text-white' 
                      : 'text-[var(--text-secondary)] hover:bg-[var(--glass)] hover:text-[var(--text-primary)]'
                    }
                  `}
                >
                  {isActive && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-white rounded-r" />
                  )}
                  <item.icon className="w-5 h-5 flex-shrink-0" />
                  {!isCollapsed && (
                    <span className="font-medium">{item.label}</span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Collapse Toggle */}
      <div className="p-[var(--sp-2)] border-t border-[rgba(255,255,255,0.06)]">
        <Button
          variant="ghost"
          size="sm"
          icon={isCollapsed ? ChevronRight : ChevronLeft}
          onClick={() => setIsCollapsed(!isCollapsed)}
          fullWidth
          className="hidden lg:flex"
        >
          {!isCollapsed && 'Collapse'}
        </Button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Menu Button */}
      <Button
        variant="ghost"
        size="sm"
        icon={Menu}
        onClick={() => setIsMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-40"
        aria-label="Open menu"
      />

      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <SidebarContent />
      </div>

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div 
            className="absolute inset-0 bg-black bg-opacity-50"
            onClick={() => setIsMobileOpen(false)}
          />
          <div className="relative">
            <SidebarContent />
            <Button
              variant="ghost"
              size="sm"
              icon={X}
              onClick={() => setIsMobileOpen(false)}
              className="absolute top-4 right-4"
              aria-label="Close menu"
            />
          </div>
        </div>
      )}
    </>
  );
}