import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../hooks/useTheme';
import { 
  LayoutDashboard, 
  Truck, 
  Users, 
  Map, 
  Wrench, 
  CircleDollarSign, 
  Settings, 
  LogOut,
  Moon,
  Sun
} from 'lucide-react';

const Sidebar = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Vehicles', path: '/vehicles', icon: Truck },
    { name: 'Drivers', path: '/drivers', icon: Users },
    { name: 'Trips', path: '/trips', icon: Map },
    { name: 'Maintenance', path: '/maintenance', icon: Wrench },
    { name: 'Finance', path: '/finance', icon: CircleDollarSign },
  ];

  return (
    <div className="w-64 bg-card border-r border-border h-full flex flex-col transition-colors duration-200">
      <div className="p-6 border-b border-border">
        <h1 className="text-xl font-bold tracking-tight text-primary">TransitOps.</h1>
        <p className="text-sm text-foreground/60 font-medium mt-1">Smart Fleet Platform</p>
      </div>

      <div className="flex-1 overflow-y-auto py-6 flex flex-col gap-2 px-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isActive 
                    ? 'bg-primary/10 text-primary' 
                    : 'text-foreground/70 hover:bg-foreground/5 hover:text-foreground'
                }`
              }
            >
              <Icon size={18} />
              {item.name}
            </NavLink>
          );
        })}
      </div>

      <div className="p-4 border-t border-border flex flex-col gap-4">
        <div className="px-3">
          <p className="text-sm font-semibold truncate">{user?.name}</p>
          <p className="text-xs text-foreground/50 truncate mt-0.5">{user?.role}</p>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg text-foreground/70 hover:bg-foreground/5 transition-colors flex-1 flex justify-center"
            title="Toggle Theme"
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          
          <button
            onClick={logout}
            className="p-2 rounded-lg text-red-500 hover:bg-red-500/10 transition-colors flex-1 flex justify-center"
            title="Log Out"
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
