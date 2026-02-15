import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, User, ArrowRight, Loader2, ShoppingBag, ShieldCheck, AlertCircle } from 'lucide-react';
import api from '../api/apiClient';

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: ''
  });
  
  const navigate = useNavigate();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError(null);
    setMessage(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      if (isLogin) {
        const response = await api.post('/auth/signin', { email: formData.email, password: formData.password });
        const { accessToken, refreshToken, sessionToken, user } = response.data;

        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', refreshToken);
        localStorage.setItem('sessionToken', sessionToken);
        localStorage.setItem('user', JSON.stringify(user));

        window.location.href = '/';
      } else {
        await api.post('/auth/signup', { 
          email: formData.email, 
          password: formData.password, 
          name: formData.name 
        });
        setMessage('Registration successful. Please verify your email before signing in.');
        setIsLogin(true);
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || 'Authentication failed';
      setError(errorMsg);
      
      if (errorMsg.toLowerCase().includes('verify')) {
        setTimeout(() => {
          navigate(`/verify-email?email=${encodeURIComponent(formData.email)}`);
        }, 2000);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-96 h-96 bg-indigo-100 rounded-full blur-[120px] -translate-x-1/2 -translate-y-1/2 opacity-60"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-100 rounded-full blur-[120px] translate-x-1/2 translate-y-1/2 opacity-60"></div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md z-10"
      >
        <div className="text-center mb-10">
          <div className="inline-flex h-16 w-16 bg-indigo-600 rounded-2xl items-center justify-center text-white shadow-2xl shadow-indigo-200 mb-6 transition-transform hover:rotate-12">
            <ShoppingBag size={32} />
          </div>
          <h1 className="text-4xl font-black tracking-tighter mb-2 italic text-slate-900 uppercase">Outlet</h1>
          <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Customer Authorization Node</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-[40px] p-10 shadow-xl">
          <div className="flex bg-slate-100 p-1 rounded-2xl mb-8 border border-slate-200">
            <button 
              type="button"
              onClick={() => { setIsLogin(true); setError(null); setMessage(null); }}
              className={`flex-1 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${isLogin ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-900'}`}
            >
              Sign In
            </button>
            <button 
              type="button"
              onClick={() => { setIsLogin(false); setError(null); setMessage(null); }}
              className={`flex-1 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${!isLogin ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-900'}`}
            >
              Register
            </button>
          </div>

          {error && (
            <motion.div 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-red-50 text-red-600 p-4 rounded-xl flex items-center gap-3 mb-6 text-xs font-black uppercase tracking-wider border border-red-100"
            >
              <AlertCircle size={18} />
              {error}
            </motion.div>
          )}

          {message && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-emerald-50 text-emerald-600 p-4 rounded-xl flex items-center gap-3 mb-6 text-xs font-black uppercase tracking-wider border border-emerald-100"
            >
              <ShieldCheck size={18} />
              {message}
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {!isLogin && (
               <div className="space-y-2 px-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Full Name</label>
                <div className="relative group">
                  <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                  <input 
                    type="text" 
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="John Doe" 
                    className="w-full pl-12 pr-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:bg-white focus:border-indigo-600 focus:ring-4 ring-indigo-50 outline-none transition-all font-bold text-slate-900"
                    required
                  />
                </div>
              </div>
            )}
            
            <div className="space-y-2 px-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Email Address</label>
              <div className="relative group">
                <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                <input 
                  type="email" 
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="name@example.com" 
                  className="w-full pl-12 pr-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:bg-white focus:border-indigo-600 focus:ring-4 ring-indigo-50 outline-none transition-all font-bold text-slate-900"
                  required
                />
              </div>
            </div>

            <div className="space-y-2 px-2">
              <div className="flex justify-between items-center pr-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Security Key</label>
                {isLogin && <Link to="/forgot-password" className="text-[10px] text-indigo-600 font-black uppercase tracking-widest hover:translate-x-1 transition-transform">Forgot?</Link>}
              </div>
              <div className="relative group">
                <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                <input 
                  type="password" 
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="••••••••" 
                  className="w-full pl-12 pr-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:bg-white focus:border-indigo-600 focus:ring-4 ring-indigo-50 outline-none transition-all font-bold text-slate-900"
                  required
                />
              </div>
            </div>

            <button 
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 text-white py-4 rounded-xl font-black flex items-center justify-center gap-2 hover:bg-indigo-700 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-indigo-100 mt-4 disabled:opacity-50 disabled:scale-100"
            >
              {loading ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  PROCESSING...
                </>
              ) : (
                <>
                  {isLogin ? 'AUTHORIZE ACCESS' : 'CREATE ACCOUNT'}
                  <ArrowRight size={20} />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 pt-8 border-t flex flex-col gap-4 text-center">
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
              Secured Outlet Access Node
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
