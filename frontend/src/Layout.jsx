import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { Truck, Users, Map, Wrench, FileText, BarChart3, LogOut, LayoutDashboard } from 'lucide-react';
import { Button } from './components/ui/Button';

function Layout() {
  const location = useLocation();
  const navigate = useNavigate();

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Vehicles', href: '/vehicles', icon: Truck },
    { name: 'Drivers', href: '/drivers', icon: Users },
    { name: 'Trips', href: '/trips', icon: Map },
    { name: 'Maintenance', href: '/maintenance', icon: Wrench },
    { name: 'Fuel & Expenses', href: '/logs', icon: FileText },
    { name: 'Reports', href: '/reports', icon: BarChart3 },
  ];

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userName');
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-950 flex">
      {/* Sidebar */}
      <div className="w-64 bg-white dark:bg-zinc-900 border-r border-gray-200 dark:border-zinc-800 flex flex-col">
        <div className="h-16 flex items-center px-6 border-b border-gray-200 dark:border-zinc-800">
          <Truck className="w-6 h-6 text-blue-600 mr-2" />
          <span className="text-xl font-bold dark:text-white">TransitOps</span>
        </div>
        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname.startsWith(item.href);
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/50 dark:text-blue-400'
                    : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-zinc-800'
                }`}
              >
                <Icon className={`w-5 h-5 mr-3 ${isActive ? 'text-blue-700 dark:text-blue-400' : 'text-gray-400'}`} />
                {item.name}
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-gray-200 dark:border-zinc-800">
          <div className="mb-4 px-2">
            <p className="text-sm font-medium text-gray-900 dark:text-white">{localStorage.getItem('userName') || 'User'}</p>
            <p className="text-xs text-gray-500">{localStorage.getItem('userRole') || 'Role'}</p>
          </div>
          <Button variant="outline" className="w-full justify-start" onClick={handleLogout}>
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-white dark:bg-zinc-900 border-b border-gray-200 dark:border-zinc-800 flex items-center px-8 shadow-sm z-10">
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
            {navigation.find(n => location.pathname.startsWith(n.href))?.name || 'Dashboard'}
          </h1>
        </header>
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 dark:bg-zinc-950 p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default Layout;
