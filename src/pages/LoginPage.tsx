import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { LogIn, UserPlus, Fingerprint, Globe, ArrowLeft } from 'lucide-react';
import { getTenantPrefix, getTenantFromHostname } from '../lib/tenantUtils';
import Logo from '../components/Logo';

const LoginPage = () => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [subdomain, setSubdomain] = useState('');
  const [error, setError] = useState('');
  const [showResend, setShowResend] = useState(false);
  const [resendStatus, setResendStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [unverifiedEmail, setUnverifiedEmail] = useState('');
  const [unverifiedTenantId, setUnverifiedTenantId] = useState('');
  const { login, user } = useAuthStore();
  const navigate = useNavigate();
  const tenantPrefix = getTenantPrefix();
  const currentTenantFromHost = getTenantFromHostname();

  useEffect(() => {
    if (user) {
      navigate(`${tenantPrefix}/`);
    }
  }, [user, navigate, tenantPrefix]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // If we are on the main domain, we must ensure we have a subdomain or redirect to it
    if (!currentTenantFromHost && subdomain) {
      // Redirect to the subdomain login page
      const protocol = window.location.protocol;
      const domain = 'monday.com.vn';
      // Only redirect if not on localhost
      if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
        window.location.href = `${protocol}//${subdomain}.${domain}/login`;
        return;
      } else {
        // On localhost, we can just use the path-based approach by navigating
        navigate(`/${subdomain}/login`);
        return;
      }
    }

    try {
      setError('');
      setShowResend(false);
      await login(identifier, password);
      navigate(`${tenantPrefix}/`);
    } catch (err: any) {
      console.error('Login error:', err);
      if (err.response) {
        const msg = err.response.data?.error;
        const details = err.response.data?.details;
        const requireVerification = err.response.data?.requireVerification;
        
        setError(typeof msg === 'string' ? (details ? `${msg}: ${details}` : msg) : 'Đăng nhập thất bại');
        
        if (requireVerification) {
          setShowResend(true);
          setUnverifiedEmail(err.response.data.email);
          setUnverifiedTenantId(err.response.data.tenantId);
        }
      } else if (err.request) {
        setError('Không thể kết nối tới máy chủ. Vui lòng kiểm tra mạng.');
      } else {
        setError(`Lỗi: ${err.message}`);
      }
    }
  };

  const handleResendVerification = async () => {
    if (!unverifiedEmail || !unverifiedTenantId) return;
    
    setResendStatus('loading');
    try {
      const api = (await import('../lib/api')).default;
      await api.post('/api/auth/resend-verification', {
        email: unverifiedEmail,
        tenantId: unverifiedTenantId
      });
      setResendStatus('success');
      setShowResend(false);
    } catch (err) {
      console.error('Resend error:', err);
      setResendStatus('error');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-white rounded-[32px] shadow-2xl shadow-slate-200 border border-slate-100 p-10 relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 w-full h-1 bg-emerald-500" />
        
        <div className="flex flex-col items-center mb-8">
          <Logo size="lg" className="mb-6" />
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Đăng nhập</h1>
          <p className="text-slate-500 font-bold tracking-widest uppercase text-[9px] mt-3 py-1 px-3 bg-slate-50 rounded-full">
            {currentTenantFromHost ? `Chi nhánh: ${currentTenantFromHost}` : 'Hệ thống vận hành chuyên nghiệp'}
          </p>
        </div>

        {error && (
          <div className="bg-rose-50 text-rose-600 p-4 rounded-2xl text-sm mb-6 font-medium border border-rose-100 flex flex-col gap-2">
             <div className="flex items-center gap-3">
               <span className="w-2 h-2 bg-rose-600 rounded-full animate-pulse" />
               {typeof error === 'string' ? error : JSON.stringify(error)}
             </div>
             {showResend && (
               <button 
                 onClick={handleResendVerification}
                 disabled={resendStatus === 'loading'}
                 className="text-xs text-rose-800 font-black uppercase tracking-widest mt-1 hover:underline ml-5 disabled:opacity-50"
               >
                 {resendStatus === 'loading' ? 'Đang gửi...' : 'Gửi lại email xác thực'}
               </button>
             )}
          </div>
        )}

        {resendStatus === 'success' && (
          <div className="bg-emerald-50 text-emerald-600 p-4 rounded-2xl text-sm mb-6 font-medium border border-emerald-100 flex items-center gap-3">
            <span className="w-2 h-2 bg-emerald-600 rounded-full" />
            Email xác thực đã được gửi lại vào hòm thư {unverifiedEmail}. Vui lòng kiểm tra.
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {!currentTenantFromHost && (
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-slate-400 px-1">Nhập chi nhánh của bạn</label>
              <div className="relative">
                <input 
                  type="text" 
                  value={subdomain}
                  onChange={(e) => setSubdomain(e.target.value.toLowerCase())}
                  className="w-full h-14 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-emerald-500 pl-12 pr-4 font-medium text-slate-900"
                  placeholder="ten-chi-nhanh"
                  required={!currentTenantFromHost}
                />
                <Globe className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
              </div>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-widest text-slate-400 px-1">Email hoặc Số điện thoại</label>
            <input 
              type="text" 
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              className="w-full h-14 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-emerald-500 px-6 font-medium text-slate-900"
              placeholder="admin@example.com hoặc 090..."
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
          {currentTenantFromHost ? (
            <a 
              href="https://monday.com.vn/register" 
              className="text-slate-400 font-bold hover:text-emerald-600 flex items-center justify-center gap-2 transition-colors"
            >
              <UserPlus className="w-4 h-4" />
              Đăng ký chi nhánh mới tại monday.com.vn
            </a>
          ) : (
            <>
              <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-3">Chưa có tài khoản?</p>
              <Link to="/register" className="text-emerald-600 font-bold hover:text-emerald-700 flex items-center justify-center gap-2">
                <UserPlus className="w-5 h-5" />
                Đăng ký cửa hàng mới
              </Link>
            </>
          )}
          {!currentTenantFromHost && (
             <Link to="/" className="inline-flex items-center gap-2 text-slate-400 hover:text-slate-900 text-xs font-bold uppercase tracking-widest mt-8 transition-colors">
               <ArrowLeft size={12} />
               Quay lại trang chủ
             </Link>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default LoginPage;
