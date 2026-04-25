import React, { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { UserPlus, ArrowLeft, Coffee } from 'lucide-react';
import { getTenantPrefix } from '../lib/tenantUtils';

const RegisterPage = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const register = useAuthStore((state) => state.register);
  const navigate = useNavigate();
  const tenantPrefix = getTenantPrefix();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email && !phone) {
      setError('Vui lòng nhập Email hoặc Số điện thoại');
      return;
    }
    try {
      await register(name, { email, phone }, password);
      navigate(`${tenantPrefix}/login`);
    } catch (err: any) {
      console.error('Register error:', err);
      let errorMessage = 'Đăng ký thất bại';
      
      if (err.response) {
        const serverError = err.response.data?.error || err.response.data?.message;
        const details = err.response.data?.details;
        
        if (serverError) {
          errorMessage = typeof serverError === 'string' ? serverError : JSON.stringify(serverError);
          if (details) errorMessage += `: ${details}`;
        } else {
          errorMessage = `Lỗi từ máy chủ (Mã: ${err.response.status})`;
        }
      } else if (err.request) {
        errorMessage = 'Không thể kết nối tới máy chủ. Vui lòng kiểm tra kết nối mạng của bạn.';
      } else {
        errorMessage = `Lỗi hệ thống: ${err.message}`;
      }
      
      setError(errorMessage);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 text-slate-800">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full bg-white rounded-[32px] shadow-2xl shadow-slate-200 border border-slate-100 p-10"
      >
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-slate-900 rounded-2xl flex items-center justify-center shadow-lg shadow-slate-200 mb-4">
            <Coffee className="text-white w-10 h-10" />
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Đăng ký</h1>
          <p className="text-slate-500 font-medium tracking-wide uppercase text-[10px] mt-2">Bắt đầu cửa hàng của bạn</p>
        </div>

        {error && (
          <div className="bg-rose-50 text-rose-600 p-4 rounded-2xl text-sm mb-6 font-medium border border-rose-100">
             {typeof error === 'string' ? error : JSON.stringify(error)}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-widest text-slate-400 px-1">Tên hiển thị</label>
            <input 
              type="text" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full h-14 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-emerald-500 px-6 font-medium text-slate-900"
              placeholder="Store Admin"
              required
            />
          </div>

          <div className="grid grid-cols-1 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-slate-400 px-1">Email (Tùy chọn)</label>
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full h-14 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-emerald-500 px-6 font-medium text-slate-900"
                placeholder="admin@coffee.com"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-slate-400 px-1">Số điện thoại (Tùy chọn)</label>
              <input 
                type="tel" 
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full h-14 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-emerald-500 px-6 font-medium text-slate-900"
                placeholder="0901234567"
              />
            </div>
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
            className="w-full h-14 bg-emerald-600 text-white rounded-2xl font-bold hover:bg-emerald-700 transition-all flex items-center justify-center gap-3 shadow-xl shadow-emerald-200 active:scale-95"
          >
            <UserPlus className="w-5 h-5" />
            Đăng ký ngay
          </button>
        </form>

        <div className="mt-10 pt-8 border-t border-slate-100 text-center">
          <Link to={`${tenantPrefix}/login`} className="text-slate-400 font-bold hover:text-slate-900 flex items-center justify-center gap-2 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Quay lại đăng nhập
          </Link>
        </div>
      </motion.div>
    </div>
  );
};

export default RegisterPage;
