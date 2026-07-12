import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../hooks/useTheme';
import { 
  LayoutDashboard, Truck, Users, Map, Wrench, 
  CircleDollarSign, LogOut, Moon, Sun, 
  Hexagon, BarChart3, Settings
} from 'lucide-react';
import { cn } from '../../utils/cn';

const Sidebar = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const navItems = [
    { path: '/', icon: LayoutDashboard, roles: ['Fleet Manager', 'Dispatcher', 'Safety Officer', 'Financial Analyst', 'Driver'], tooltip: 'Dashboard' },
    { path: '/vehicles', icon: Truck, roles: ['Fleet Manager', 'Dispatcher', 'Safety Officer', 'Financial Analyst'], tooltip: 'Vehicles' },
    { path: '/drivers', icon: Users, roles: ['Fleet Manager', 'Dispatcher', 'Safety Officer', 'Financial Analyst'], tooltip: 'Drivers' },
    { path: '/trips', icon: Map, roles: ['Fleet Manager', 'Dispatcher', 'Safety Officer', 'Financial Analyst', 'Driver'], tooltip: 'Trips' },
    { path: '/maintenance', icon: Wrench, roles: ['Fleet Manager', 'Safety Officer'], tooltip: 'Maintenance' },
    { path: '/finance', icon: CircleDollarSign, roles: ['Fleet Manager', 'Financial Analyst'], tooltip: 'Finance' },
    { path: '/reports', icon: BarChart3, roles: ['Fleet Manager', 'Safety Officer', 'Financial Analyst'], tooltip: 'Reports' },
    { path: '/settings', icon: Settings, roles: ['Fleet Manager'], tooltip: 'Settings' },
  ];

  return (
    <div className="w-64 h-full flex flex-col py-8 px-4 gap-8 transition-colors duration-200 z-10 border-r border-border/10 bg-background/50 backdrop-blur-sm">
      <div className="flex items-center gap-3 px-4 mb-4">
        <div className="text-primary bg-primary/10 p-2.5 rounded-xl shadow-sm">
          <Hexagon size={24} className="fill-primary/20" />
        </div>
        <span className="font-bold text-xl tracking-tight text-foreground">TransitOps</span>
      </div>

      <div className="flex-1 flex flex-col items-center gap-4 w-full">
        {navItems.filter(item => user && item.roles.includes(user.role)).map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              title={item.tooltip}
              className={({ isActive }) => cn(
                "p-3.5 rounded-2xl transition-all duration-300 relative group",
                isActive 
                  ? "bg-card shadow-soft text-primary" 
                  : "text-foreground/50 hover:bg-black/5 dark:hover:bg-white/5 hover:text-foreground"
              )}
            >
              {({ isActive }) => (
                <div className="flex items-center gap-4 w-full px-2">
                  <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                  <span className={`font-medium ${isActive ? 'text-primary font-semibold' : 'text-foreground/70'}`}>
                    {item.tooltip}
                  </span>
                  {isActive && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary rounded-r-full" />
                  )}
                </div>
              )}
            </NavLink>
          );
        })}
      </div>

      <div className="flex flex-col gap-2 w-full pt-4 border-t border-border/10">
        <button
          onClick={toggleTheme}
          className="p-3.5 rounded-xl flex items-center gap-4 text-foreground/60 hover:bg-black/5 dark:hover:bg-white/5 transition-colors w-full"
        >
          {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          <span className="font-medium">Toggle Theme</span>
        </button>
        
        <button
          onClick={logout}
          className="p-3.5 rounded-xl flex items-center gap-4 text-foreground/60 hover:bg-red-500/10 hover:text-red-500 transition-colors w-full"
        >
          <LogOut size={20} />
          <span className="font-medium">Log Out</span>
        </button>
        
        <div className="mt-2 flex items-center gap-3 p-3 rounded-xl bg-black/5 dark:bg-white/5 border border-border/30">
          <img 
            src={`https://api.dicebear.com/7.x/notionists/svg?seed=${user?.name || 'User'}&backgroundColor=e2e8f0`} 
            alt="Profile" 
            className="w-9 h-9 rounded-full"
          />
          <div className="flex flex-col overflow-hidden">
            <span className="text-sm font-bold truncate">{user?.name || 'User'}</span>
            <span className="text-xs text-foreground/50 truncate">{user?.role || 'Guest'}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
