import React, { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { LogIn, UserPlus, Fingerprint } from 'lucide-react';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const login = useAuthStore((state) => state.login);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(email, password);
      navigate('/');
    } catch (err: any) {
      const msg = err.response?.data?.error;
      setError(typeof msg === 'string' ? msg : 'Đăng nhập thất bại');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-white rounded-[32px] shadow-2xl shadow-slate-200 border border-slate-100 p-10"
      >
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-emerald-600 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-200 mb-4">
            <Fingerprint className="text-white w-10 h-10" />
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Đăng nhập</h1>
          <p className="text-slate-500 font-medium tracking-wide uppercase text-[10px] mt-2">Hệ thống quản lý cafe</p>
        </div>

        {error && (
          <div className="bg-rose-50 text-rose-600 p-4 rounded-2xl text-sm mb-6 font-medium border border-rose-100 flex items-center gap-3">
             <span className="w-2 h-2 bg-rose-600 rounded-full animate-pulse" />
             {typeof error === 'string' ? error : JSON.stringify(error)}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-widest text-slate-400 px-1">Email</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full h-14 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-emerald-500 px-6 font-medium text-slate-900"
              placeholder="admin@example.com"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-widest text-slate-400 px-1">Mật khẩu</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full h-14 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-emerald-500 px-6 font-medium text-slate-900"
              placeholder="••••••••"
              required
            />
          </div>

          <button 
            type="submit"
            className="w-full h-14 bg-slate-900 text-white rounded-2xl font-bold hover:bg-emerald-600 transition-all flex items-center justify-center gap-3 shadow-xl shadow-slate-900/10 active:scale-95"
          >
            <LogIn className="w-5 h-5" />
            Tiếp tục
          </button>
        </form>

        <div className="mt-10 pt-8 border-t border-slate-100 text-center">
          <p className="text-slate-500 text-sm font-medium">Chưa có tài khoản?</p>
          <Link to="/register" className="text-emerald-600 font-bold hover:underline flex items-center justify-center gap-2 mt-2">
            <UserPlus className="w-4 h-4" />
            Đăng ký cửa hàng mới
          </Link>
        </div>
      </motion.div>
    </div>
  );
};

export default LoginPage;
