import React from 'react';
import { Home, Activity, Settings } from 'lucide-react';

export type NavView = 'HOME' | 'ACTIVITY' | 'SETTINGS';

interface NavigationProps {
  currentView: NavView;
  onSelectView: (view: NavView) => void;
  unacknowledgedAlertCount: number;
}

export const Navigation: React.FC<NavigationProps> = ({
  currentView,
  onSelectView,
  unacknowledgedAlertCount,
}) => {
  const navItems = [
    {
      id: 'HOME' as NavView,
      label: 'Home',
      icon: Home,
      badge: null,
    },
    {
      id: 'ACTIVITY' as NavView,
      label: 'Activity',
      icon: Activity,
      badge: unacknowledgedAlertCount > 0 ? unacknowledgedAlertCount : null,
    },
    {
      id: 'SETTINGS' as NavView,
      label: 'Settings',
      icon: Settings,
      badge: null,
    },
  ];

  return (
    <>
      {/* Desktop / Tablet Horizontal Header Tabs */}
      <div className="hidden md:flex items-center space-x-1.5 bg-surface-card/80 p-1 rounded-xl border border-surface-border">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectView(item.id)}
              className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center space-x-2 transition-all relative ${
                isActive
                  ? 'bg-teal-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-surface-border/50'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{item.label}</span>
              {item.badge !== null && (
                <span
                  className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full font-bold ${
                    isActive ? 'bg-slate-950 text-amber-400' : 'bg-amber-500 text-slate-950'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Mobile Bottom Navigation Bar (Fixed at bottom for easy thumb access) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-charcoal-900/95 backdrop-blur-lg border-t border-surface-border px-4 py-2 pb-safe">
        <div className="flex items-center justify-around max-w-md mx-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectView(item.id)}
                className={`flex flex-col items-center justify-center py-1 px-4 rounded-xl text-xs font-medium transition-colors relative ${
                  isActive ? 'text-teal-400' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <div className="relative">
                  <Icon className="w-5 h-5 mb-1" />
                  {item.badge !== null && (
                    <span className="absolute -top-1 -right-2 w-3.5 h-3.5 rounded-full bg-amber-500 text-slate-950 text-[9px] font-bold flex items-center justify-center">
                      {item.badge}
                    </span>
                  )}
                </div>
                <span className="text-[11px] font-semibold">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
};
