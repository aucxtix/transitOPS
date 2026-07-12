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
    <div className="w-24 h-full flex flex-col items-center py-8 gap-8 transition-colors duration-200 z-10">
      <div className="text-primary bg-primary/10 p-3 rounded-2xl shadow-sm mb-4">
        <Hexagon size={28} className="fill-primary/20" />
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
                <>
                  <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
                  {isActive && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary rounded-r-full -ml-4" />
                  )}
                </>
              )}
            </NavLink>
          );
        })}
      </div>

      <div className="flex flex-col items-center gap-4 w-full">
        <button
          onClick={toggleTheme}
          className="p-3.5 rounded-2xl text-foreground/50 hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
          title="Toggle Theme"
        >
          {theme === 'dark' ? <Sun size={22} /> : <Moon size={22} />}
        </button>
        
        <button
          onClick={logout}
          className="p-3.5 rounded-2xl text-foreground/50 hover:bg-red-500/10 hover:text-red-500 transition-colors mt-2"
          title="Log Out"
        >
          <LogOut size={22} />
        </button>
        
        <div className="mt-4 p-1 rounded-full border-2 border-border/50">
          <img 
            src={`https://api.dicebear.com/7.x/notionists/svg?seed=${user?.name || 'User'}&backgroundColor=e2e8f0`} 
            alt="Profile" 
            className="w-10 h-10 rounded-full"
          />
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
