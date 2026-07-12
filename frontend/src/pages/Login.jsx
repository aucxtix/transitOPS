import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Shield, Truck, Users, Activity, Banknote, Map } from 'lucide-react';

const demoAccounts = [
  { role: 'Fleet Manager', email: 'admin@transitops.com', pass: 'Admin@123', icon: Shield, color: 'text-blue-500', bg: 'bg-blue-500/10' },
  { role: 'Dispatcher', email: 'dispatcher@transitops.com', pass: 'Dispatch@123', icon: Map, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
  { role: 'Safety Officer', email: 'safety@transitops.com', pass: 'Safety@123', icon: Activity, color: 'text-purple-500', bg: 'bg-purple-500/10' },
  { role: 'Financial Analyst', email: 'finance@transitops.com', pass: 'Finance@123', icon: Banknote, color: 'text-amber-500', bg: 'bg-amber-500/10' },
  { role: 'Driver', email: 'alex@transitops.com', pass: 'Driver@123', icon: Truck, color: 'text-slate-500', bg: 'bg-slate-500/10' },
];

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login, loading } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e?.preventDefault();
    setError('');
    const { success, error: loginError } = await login(email, password);
    if (success) {
      navigate('/');
    } else {
      setError(loginError || 'Failed to login');
    }
  };

  const handleDemoClick = (account) => {
    setEmail(account.email);
    setPassword(account.pass);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center items-center p-4 selection:bg-primary/20">
      <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
        
        {/* Left Side: Login Form */}
        <div className="bg-card border border-border p-8 rounded-2xl shadow-xl shadow-black/5">
          <div className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight mb-2">TransitOps.</h1>
            <p className="text-foreground/60">Sign in to your fleet management portal</p>
          </div>

          <form onSubmit={handleLogin} className="flex flex-col gap-5">
            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-500 rounded-lg text-sm font-medium">
                {error}
              </div>
            )}
            
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium">Email address</label>
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="px-4 py-2.5 bg-background border border-border rounded-lg outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all font-medium"
                placeholder="name@company.com"
                required
              />
            </div>
            
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium">Password</label>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="px-4 py-2.5 bg-background border border-border rounded-lg outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all font-medium"
                placeholder="••••••••"
                required
              />
            </div>

            <button 
              type="submit" 
              disabled={loading || !email || !password}
              className="mt-2 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-2.5 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary/20"
            >
              {loading ? 'Authenticating...' : 'Sign In'}
            </button>
          </form>
        </div>

        {/* Right Side: Demo Accounts */}
        <div className="flex flex-col gap-4">
          <div>
            <h2 className="text-lg font-semibold tracking-tight">Demo Accounts</h2>
            <p className="text-sm text-foreground/60 mb-4">Click any account to autofill credentials instantly.</p>
          </div>
          
          <div className="grid grid-cols-1 gap-3">
            {demoAccounts.map((account) => {
              const Icon = account.icon;
              return (
                <button
                  key={account.role}
                  onClick={() => handleDemoClick(account)}
                  className="flex items-center gap-4 p-4 bg-card border border-border hover:border-primary/50 rounded-xl text-left transition-all hover:shadow-md group"
                >
                  <div className={`p-3 rounded-lg ${account.bg} ${account.color} transition-transform group-hover:scale-105`}>
                    <Icon size={20} />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-sm">{account.role}</p>
                    <p className="text-xs text-foreground/60 font-medium">{account.email}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
};

export default Login;
