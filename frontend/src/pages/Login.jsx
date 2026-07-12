import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Shield, Truck, Users, Activity, Banknote, Map, Hexagon } from 'lucide-react';
import { DemoAccountCard } from '../components/ui/DemoAccountCard';

const demoAccounts = [
  { role: 'Fleet Manager', email: 'admin@transitops.com', pass: 'Admin@123', icon: Shield, color: 'text-indigo-500', bg: 'bg-indigo-500/10' },
  { role: 'Dispatcher', email: 'dispatcher@transitops.com', pass: 'Dispatch@123', icon: Map, color: 'text-cyan-500', bg: 'bg-cyan-500/10' },
  { role: 'Safety Officer', email: 'safety@transitops.com', pass: 'Safety@123', icon: Activity, color: 'text-purple-500', bg: 'bg-purple-500/10' },
  { role: 'Financial Analyst', email: 'finance@transitops.com', pass: 'Finance@123', icon: Banknote, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
  { role: 'Driver', email: 'alex@transitops.com', pass: 'Driver@123', icon: Truck, color: 'text-slate-500', bg: 'bg-slate-500/10' },
];

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login, loading } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e, overrideEmail, overridePassword) => {
    e?.preventDefault();
    setError('');
    const loginEmail = overrideEmail ?? email;
    const loginPassword = overridePassword ?? password;
    if (!loginEmail || !loginPassword) {
      setError('Please enter your email and password.');
      return;
    }
    const { success, error: loginError } = await login(loginEmail, loginPassword);
    if (success) {
      navigate('/');
    } else {
      setError(loginError || 'Login failed. Check your credentials and try again.');
    }
  };

  const handleDemoClick = (account) => {
    setEmail(account.email);
    setPassword(account.pass);
    // Directly call login with the account values — avoids React state timing race
    handleLogin(null, account.email, account.pass);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center items-center p-4 lg:p-8 relative overflow-hidden">
      
      {/* Decorative blurred backgrounds */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[50%] bg-gradient-violet rounded-full opacity-10 blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[50%] bg-gradient-blue rounded-full opacity-10 blur-[100px] pointer-events-none"></div>

      <div className="w-full max-w-[1100px] grid grid-cols-1 lg:grid-cols-2 gap-12 items-center relative z-10">
        
        {/* Left Side: Login Form */}
        <div className="glass-panel p-10 lg:p-12 rounded-[2.5rem] shadow-float border border-white/60 dark:border-white/10 relative overflow-hidden">
          <div className="absolute inset-0 bg-white/40 dark:bg-black/20 backdrop-blur-md z-0"></div>
          
          <div className="relative z-10 mb-10 text-center lg:text-left">
            <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-primary/10 text-primary mb-6 shadow-sm">
              <Hexagon size={32} className="fill-primary/20" />
            </div>
            <h1 className="text-4xl font-bold tracking-tight mb-3 text-foreground">Welcome Back</h1>
            <p className="text-foreground/60 font-medium">Sign in to your fleet management portal.</p>
          </div>

          <form onSubmit={handleLogin} className="relative z-10 flex flex-col gap-6">
            {error && (
              <div className="px-4 py-3 bg-red-500/10 border border-red-500/20 text-red-500 rounded-2xl text-sm font-medium">
                {error}
              </div>
            )}
            
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold ml-1 text-foreground/80">Email address</label>
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="px-5 py-4 bg-white/60 dark:bg-black/30 border border-white/50 dark:border-white/5 rounded-2xl outline-none focus:border-primary/50 focus:bg-white dark:focus:bg-black/50 transition-all font-medium shadow-sm backdrop-blur-sm placeholder:text-foreground/40"
                placeholder="name@company.com"
                required
              />
            </div>
            
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold ml-1 text-foreground/80">Password</label>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="px-5 py-4 bg-white/60 dark:bg-black/30 border border-white/50 dark:border-white/5 rounded-2xl outline-none focus:border-primary/50 focus:bg-white dark:focus:bg-black/50 transition-all font-medium shadow-sm backdrop-blur-sm placeholder:text-foreground/40"
                placeholder="••••••••"
                required
              />
            </div>

            <button 
              type="submit" 
              disabled={loading || !email || !password}
              className="mt-4 pill-button pill-button-dark py-4 text-base shadow-float hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed w-full"
            >
              {loading ? 'Authenticating...' : 'Sign In'}
            </button>
          </form>
        </div>

        {/* Right Side: Demo Accounts */}
        <div className="flex flex-col">
          <div className="mb-8">
            <h2 className="text-2xl font-bold tracking-tight mb-2">Demo Roles</h2>
            <p className="text-foreground/60 font-medium">Select a role to instantly autofill and test the RBAC matrix.</p>
          </div>
          
          <div className="grid grid-cols-1 gap-4">
            {demoAccounts.map((account) => (
              <DemoAccountCard
                key={account.role}
                role={account.role}
                email={account.email}
                pass={account.pass}
                icon={account.icon}
                color={account.color}
                bg={account.bg}
                onClick={() => handleDemoClick(account)}
              />
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};

export default Login;
