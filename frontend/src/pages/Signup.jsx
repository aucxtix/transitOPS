import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Hexagon } from 'lucide-react';
import api from '../services/api';

const Signup = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSignup = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!name || !email || !password) {
      setError('Please fill in all fields.');
      return;
    }

    try {
      setLoading(true);
      const res = await api.post('/auth/signup', { name, email, password });
      
      // Auto login after signup
      const { success, error: loginError } = await login(email, password);
      if (success) {
        navigate('/');
      } else {
        setError(loginError || 'Signup succeeded but auto-login failed. Please sign in manually.');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Signup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center items-center p-4 lg:p-8 relative overflow-hidden">
      
      {/* Decorative blurred backgrounds */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[50%] bg-gradient-violet rounded-full opacity-10 blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[50%] bg-gradient-blue rounded-full opacity-10 blur-[100px] pointer-events-none"></div>

      <div className="w-full max-w-[500px] relative z-10">
        <div className="glass-panel p-10 lg:p-12 rounded-[2.5rem] shadow-float border border-white/60 dark:border-white/10 relative overflow-hidden">
          <div className="absolute inset-0 bg-white/40 dark:bg-black/20 backdrop-blur-md z-0"></div>
          
          <div className="relative z-10 mb-10 text-center">
            <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-primary/10 text-primary mb-6 shadow-sm">
              <Hexagon size={32} className="fill-primary/20" />
            </div>
            <h1 className="text-4xl font-bold tracking-tight mb-3 text-foreground">Create Account</h1>
            <p className="text-foreground/60 font-medium">Join as a Customer to request trips.</p>
          </div>

          <form onSubmit={handleSignup} className="relative z-10 flex flex-col gap-6">
            {error && (
              <div className="px-4 py-3 bg-red-500/10 border border-red-500/20 text-red-500 rounded-2xl text-sm font-medium">
                {error}
              </div>
            )}
            
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold ml-1 text-foreground/80">Full Name</label>
              <input 
                type="text" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="px-5 py-4 bg-white/60 dark:bg-black/30 border border-white/50 dark:border-white/5 rounded-2xl outline-none focus:border-primary/50 focus:bg-white dark:focus:bg-black/50 transition-all font-medium shadow-sm backdrop-blur-sm placeholder:text-foreground/40"
                placeholder="John Doe"
                required
              />
            </div>

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
                placeholder="Min 6 characters"
                minLength={6}
                required
              />
            </div>

            <button 
              type="submit" 
              disabled={loading || !email || !password || !name}
              className="mt-4 pill-button pill-button-dark py-4 text-base shadow-float hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed w-full"
            >
              {loading ? 'Creating account...' : 'Sign Up'}
            </button>
            
            <p className="text-center mt-2 text-sm text-foreground/60 font-medium">
              Already have an account? <Link to="/login" className="text-primary hover:underline">Log in</Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Signup;
