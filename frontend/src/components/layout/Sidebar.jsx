import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../hooks/useTheme';
import { 
  LayoutDashboard, Truck, Users, Map, Wrench, 
  CircleDollarSign, LogOut, Moon, Sun, 
  Hexagon, BarChart3, Settings, X
} from 'lucide-react';
import { cn } from '../../utils/cn';

const Sidebar = ({ isMobileOpen, setIsMobileOpen }) => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [isHovered, setIsHovered] = useState(false);

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
    <aside 
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={cn(
        "fixed inset-y-0 left-0 z-50 h-full flex flex-col py-6 gap-6 transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] border-r border-border/10 bg-background/95 backdrop-blur-md shadow-2xl overflow-x-hidden",
        isMobileOpen ? "translate-x-0 w-72" : "-translate-x-full md:translate-x-0",
        !isMobileOpen && isHovered ? "md:w-72" : "md:w-20"
      )}
    >
      <div className="flex items-center justify-between px-4 mb-2">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="text-primary bg-primary/10 min-w-[40px] h-[40px] flex items-center justify-center rounded-xl shadow-sm shrink-0">
            <Hexagon size={24} className="fill-primary/20" />
          </div>
          <span className={cn(
            "font-bold text-xl tracking-tight text-foreground whitespace-nowrap transition-opacity duration-300",
            (isHovered || isMobileOpen) ? "opacity-100" : "md:opacity-0"
          )}>
            TransitOps
          </span>
        </div>
        
        <button 
          onClick={() => setIsMobileOpen(false)}
          className="md:hidden p-2 text-foreground/50 hover:text-foreground bg-black/5 dark:bg-white/5 rounded-lg transition-colors shrink-0"
        >
          <X size={20} />
        </button>
      </div>

      <div className="flex-1 flex flex-col gap-2 w-full mt-2 px-3 overflow-y-auto no-scrollbar">
        {navItems.filter(item => user && item.roles.includes(user.role)).map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => setIsMobileOpen?.(false)}
              title={(!isHovered && !isMobileOpen) ? item.tooltip : undefined}
              className={({ isActive }) => cn(
                "w-full flex items-center p-3 rounded-xl transition-all duration-300 relative group overflow-hidden shrink-0",
                isActive 
                  ? "bg-card shadow-soft text-primary" 
                  : "text-foreground/50 hover:bg-black/5 dark:hover:bg-white/5 hover:text-foreground"
              )}
            >
              {({ isActive }) => (
                <>
                  <div className="min-w-[40px] flex items-center justify-center shrink-0 -ml-1.5 transition-transform duration-300 group-hover:scale-110">
                    <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
                  </div>
                  <span className={cn(
                    "font-medium whitespace-nowrap transition-all duration-300",
                    isActive ? "text-primary font-semibold" : "text-foreground/70 group-hover:text-foreground",
                    (isHovered || isMobileOpen) ? "opacity-100 ml-1 translate-x-0" : "md:opacity-0 md:-translate-x-4"
                  )}>
                    {item.tooltip}
                  </span>
                  {isActive && (
                    <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-1.5 h-8 bg-primary rounded-r-full shadow-[2px_0_8px_rgba(79,70,229,0.5)]" />
                  )}
                </>
              )}
            </NavLink>
          );
        })}
      </div>

      <div className="flex flex-col gap-2 w-full pt-4 border-t border-border/10 px-3 shrink-0">
        <button
          onClick={toggleTheme}
          title={(!isHovered && !isMobileOpen) ? "Toggle Theme" : undefined}
          className="p-3 rounded-xl flex items-center text-foreground/60 hover:bg-black/5 dark:hover:bg-white/5 transition-colors w-full overflow-hidden group shrink-0"
        >
          <div className="min-w-[40px] flex items-center justify-center shrink-0 -ml-1.5 transition-transform duration-300 group-hover:rotate-12">
            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          </div>
          <span className={cn(
            "font-medium whitespace-nowrap transition-all duration-300",
             (isHovered || isMobileOpen) ? "opacity-100 ml-1 translate-x-0" : "md:opacity-0 md:-translate-x-4"
          )}>Toggle Theme</span>
        </button>
        
        <button
          onClick={logout}
          title={(!isHovered && !isMobileOpen) ? "Log Out" : undefined}
          className="p-3 rounded-xl flex items-center text-foreground/60 hover:bg-red-500/10 hover:text-red-500 transition-colors w-full overflow-hidden group shrink-0"
        >
          <div className="min-w-[40px] flex items-center justify-center shrink-0 -ml-1.5 transition-transform duration-300 group-hover:translate-x-1">
             <LogOut size={20} />
          </div>
          <span className={cn(
            "font-medium whitespace-nowrap transition-all duration-300",
             (isHovered || isMobileOpen) ? "opacity-100 ml-1 translate-x-0" : "md:opacity-0 md:-translate-x-4"
          )}>Log Out</span>
        </button>
        
        <div className={cn(
          "mt-2 flex items-center p-2 rounded-xl bg-black/5 dark:bg-white/5 border border-border/30 transition-all overflow-hidden shrink-0",
          (isHovered || isMobileOpen) ? "justify-start gap-3" : "md:justify-center border-transparent bg-transparent"
        )}>
          <img 
            src={`https://api.dicebear.com/7.x/notionists/svg?seed=${user?.name || 'User'}&backgroundColor=e2e8f0`} 
            alt="Profile" 
            className={cn(
              "rounded-full shrink-0 transition-all duration-300",
              (isHovered || isMobileOpen) ? "w-10 h-10" : "w-10 h-10"
            )}
          />
          <div className={cn(
            "flex flex-col overflow-hidden transition-all duration-300",
            (isHovered || isMobileOpen) ? "opacity-100 w-full translate-x-0" : "md:opacity-0 md:w-0 md:-translate-x-4"
          )}>
            <span className="text-sm font-bold truncate">{user?.name || 'User'}</span>
            <span className="text-xs text-foreground/50 truncate">{user?.role || 'Guest'}</span>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
