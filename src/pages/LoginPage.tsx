import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { motion } from 'motion/react';
import { LogIn, UserPlus, Fingerprint, Globe, ArrowLeft } from 'lucide-react';
import { getTenantPrefix, getTenantFromHostname } from '../lib/tenantUtils';
import Logo from '../components/Logo';

const LoginPage = () => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [subdomain, setSubdomain] = useState('');
  const [error, setError] = useState('');
  const [brand, setBrand] = useState<{ storeName: string; logoUrl: string }>({
    storeName: 'Monday',
    logoUrl: '/logo.svg'
  });
  const [showResend, setShowResend] = useState(false);
  const [resendStatus, setResendStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [unverifiedEmail, setUnverifiedEmail] = useState('');
  const [unverifiedTenantId, setUnverifiedTenantId] = useState('');
  const { login, user } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const tenantPrefix = getTenantPrefix();
  const currentTenantFromHost = getTenantFromHostname();

  useEffect(() => {
    // Fetch brand info if we have a tenant context
    const fetchBrand = async () => {
      try {
        const api = (await import('../lib/api')).default;
        const res = await api.get('/api/settings/public/brand');
        if (res.data) {
          setBrand(res.data);
        }
      } catch (err) {
        console.error('Failed to fetch brand:', err);
      }
    };
    
    fetchBrand();
  }, []);

  useEffect(() => {
    if (user) {
      const params = new URLSearchParams(location.search);
      const redirectTo = params.get('redirect');
      if (redirectTo) {
        navigate(`${tenantPrefix}/${redirectTo}`);
      } else {
        navigate(`${tenantPrefix}/`);
      }
    }
  }, [user, navigate, tenantPrefix, location.search]);

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
      const params = new URLSearchParams(location.search);
      const redirectTo = params.get('redirect');
      if (redirectTo) {
        navigate(`${tenantPrefix}/${redirectTo}`);
      } else {
        navigate(`${tenantPrefix}/`);
      }
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
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-emerald-100 rounded-full blur-[120px] opacity-40 pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-96 h-96 bg-blue-100 rounded-full blur-[120px] opacity-40 pointer-events-none" />
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full card-base relative z-10 overflow-hidden"
      >
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-emerald-600" />
        
        <div className="flex flex-col items-center mb-8">
          {brand.logoUrl ? (
            <img 
              src={brand.logoUrl} 
              alt={brand.storeName} 
              className="h-16 w-auto mb-6 object-contain"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/logo.svg';
              }}
            />
          ) : (
            <Logo size="lg" className="mb-6" />
          )}
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Đăng nhập</h1>
          <p className="text-slate-500 text-xs font-semibold tracking-widest uppercase mt-3 py-1.5 px-4 bg-slate-100 rounded-full">
            {currentTenantFromHost ? `Chi nhánh: ${brand.storeName || currentTenantFromHost}` : 'Hệ thống vận hành'}
          </p>
        </div>

        {error && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="badge-danger mb-6 flex flex-col gap-2"
          >
             <div className="flex items-center gap-3">
               <span className="w-2 h-2 bg-red-600 rounded-full animate-pulse" />
               <span>{typeof error === 'string' ? error : JSON.stringify(error)}</span>
             </div>
             {showResend && (
               <button 
                 onClick={handleResendVerification}
                 disabled={resendStatus === 'loading'}
                 className="text-xs font-semibold uppercase tracking-widest mt-1 hover:underline ml-5 disabled:opacity-50 text-red-700"
               >
                 {resendStatus === 'loading' ? 'Đang gửi...' : 'Gửi lại email xác thực'}
               </button>
             )}
          </motion.div>
        )}

        {resendStatus === 'success' && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="badge-success mb-6"
          >
            <span className="w-2 h-2 bg-emerald-600 rounded-full" />
            Email xác thực đã được gửi lại tới {unverifiedEmail}. Vui lòng kiểm tra.
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {!currentTenantFromHost && (
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-widest text-slate-600 px-1 block">Tên chi nhánh</label>
              <div className="relative">
                <Globe className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 pointer-events-none" />
                <input 
                  type="text" 
                  value={subdomain}
                  onChange={(e) => setSubdomain(e.target.value.toLowerCase())}
                  className="input-base input-focus pl-12"
                  placeholder="ten-chi-nhanh"
                  required={!currentTenantFromHost}
                />
              </div>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-widest text-slate-600 px-1 block">Email hoặc Số điện thoại</label>
            <input 
              type="text" 
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              className="input-base input-focus"
              placeholder="admin@example.com"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-widest text-slate-600 px-1 block">Mật khẩu</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-base input-focus"
              placeholder="••••••••"
              required
            />
          </div>

          <button 
            type="submit"
            className="button-primary w-full mt-8"
          >
            <LogIn className="w-5 h-5" />
            Đăng nhập
          </button>
        </form>

        <div className="mt-8 pt-8 border-t border-slate-200 text-center">
          {currentTenantFromHost ? (
            <a 
              href="https://monday.com.vn/register" 
              className="text-slate-500 font-semibold hover:text-emerald-600 transition-colors flex items-center justify-center gap-2"
            >
              <UserPlus className="w-4 h-4" />
              Đăng ký chi nhánh mới
            </a>
          ) : (
            <>
              <p className="text-slate-500 text-xs font-semibold uppercase tracking-widest mb-3">Chưa có tài khoản?</p>
              <Link to="/register" className="text-emerald-600 font-semibold hover:text-emerald-700 transition-colors flex items-center justify-center gap-2">
                <UserPlus className="w-5 h-5" />
                Đăng ký cửa hàng mới
              </Link>
            </>
          )}
          {!currentTenantFromHost && (
             <Link to="/" className="inline-flex items-center gap-2 text-slate-400 hover:text-slate-900 text-xs font-semibold uppercase tracking-widest mt-8 transition-colors">
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
