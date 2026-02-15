import { useState } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, ArrowRight, ArrowLeft, Loader2, ShoppingBag, ShieldCheck, AlertCircle, Key, Lock } from 'lucide-react';
import api from '../api/apiClient';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState(searchParams.get('email') || '');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      await api.post('/auth/reset-password', { email, code, newPassword });
      setMessage('Security credentials updated. System ready for authorization.');
      setTimeout(() => {
        navigate('/auth');
      }, 2000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Credential override failed. Please try again.');
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
          <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Protocol Execution Phase</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-[40px] p-10 shadow-xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2 px-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Registry Email</label>
              <div className="relative group">
                <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com" 
                  className="w-full pl-12 pr-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:bg-white focus:border-indigo-600 focus:ring-4 ring-indigo-50 outline-none transition-all font-bold text-slate-900"
                  required
                />
              </div>
            </div>

            <div className="space-y-2 px-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Recovery Code</label>
              <div className="relative group">
                <Key size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                <input 
                  type="text" 
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="EX: A1B2C3" 
                  className="w-full pl-12 pr-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:bg-white focus:border-indigo-600 focus:ring-4 ring-indigo-50 outline-none transition-all font-bold text-slate-900 uppercase tracking-widest"
                  required
                />
              </div>
            </div>

            <div className="space-y-2 px-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">New Security Key</label>
              <div className="relative group">
                <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                <input 
                  type="password" 
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••" 
                  className="w-full pl-12 pr-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:bg-white focus:border-indigo-600 focus:ring-4 ring-indigo-50 outline-none transition-all font-bold text-slate-900"
                  required
                />
              </div>
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

            <button 
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 text-white py-4 rounded-xl font-black flex items-center justify-center gap-2 hover:bg-indigo-700 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-indigo-100 mt-4 disabled:opacity-50 disabled:scale-100"
            >
              {loading ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  UPDATING CREDENTIALS...
                </>
              ) : (
                <>
                  COMMIT CREDENTIALS
                  <ArrowRight size={20} />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 pt-8 border-t flex flex-col gap-4 text-center">
             <Link to="/auth" className="flex items-center justify-center gap-2 text-slate-500 hover:text-slate-900 transition-all text-[10px] font-black uppercase tracking-widest">
               <ArrowLeft size={16} />
               Return to Authorization
             </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
