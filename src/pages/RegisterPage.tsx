import { IonPage, IonContent } from '@ionic/react';
import React, { useState, useEffect } from 'react';
// ... rest of imports
import { useAuthStore } from '../store/authStore';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { UserPlus, ArrowLeft, Coffee, Globe, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { getTenantPrefix, getTenantFromHostname } from '../lib/tenantUtils';
import Logo from '../components/Logo';
import api from '../lib/api';

const RegisterPage = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [subdomain, setSubdomain] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [isSubdomainAvailable, setIsSubdomainAvailable] = useState<boolean | null>(null);
  const [isCheckingSubdomain, setIsCheckingSubdomain] = useState(false);
  const { register, user } = useAuthStore();
  const navigate = useNavigate();
  const tenantPrefix = getTenantPrefix();
  const fromHostname = getTenantFromHostname();

  useEffect(() => {
    if (fromHostname) {
      navigate(`${tenantPrefix}/login`);
      return;
    }
    if (user && !isSuccess) {
      navigate(`${tenantPrefix}/`);
    }
  }, [user, navigate, tenantPrefix, isSuccess]);

  useEffect(() => {
    if (subdomain.length < 3) {
      setIsSubdomainAvailable(null);
      return;
    }

    const timer = setTimeout(async () => {
      setIsCheckingSubdomain(true);
      try {
        const response = await api.get(`/api/auth/check-availability?tenantId=${subdomain}`);
        setIsSubdomainAvailable(response.data.available);
      } catch (err) {
        console.error('Check subdomain error:', err);
      } finally {
        setIsCheckingSubdomain(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [subdomain]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email && !phone) {
      setError('Vui lòng nhập Email hoặc Số điện thoại');
      return;
    }
    if (!subdomain) {
      setError('Vui lòng nhập Subdomain cho chi nhánh của bạn');
      return;
    }
    
    // Validate subdomain format (alphanumeric and dashes only)
    if (!/^[a-z0-9-]+$/.test(subdomain)) {
      setError('Subdomain chỉ được chứa chữ cái viết thường, số và dấu gạch nối');
      return;
    }

    try {
      const response = await register(name, { email, phone }, password, subdomain);
      
      if (email) {
        setIsSuccess(true);
        return;
      }

      // Construct the login URL for the new subdomain
      const protocol = window.location.protocol;
      const loginUrl = `${protocol}//${subdomain}.monday.com.vn/login`;
      
      // If we are on localhost, just navigate
      if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        navigate(`/${subdomain}/login`);
      } else {
        // Force redirect to the new subdomain login
        window.location.href = loginUrl;
      }
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
    <IonPage>
      <IonContent>
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4 text-slate-800">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full bg-white dark:bg-slate-900 rounded-[32px] shadow-2xl shadow-slate-200 dark:shadow-none border border-slate-100 dark:border-slate-800 p-10 relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 w-full h-1 bg-emerald-500" />
        
        <div className="flex flex-col items-center mb-8">
          <Logo size="lg" className="mb-6" />
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Đăng ký</h1>
          <p className="text-slate-500 dark:text-slate-400 font-bold tracking-widest uppercase text-[9px] mt-3 py-1 px-3 bg-slate-50 dark:bg-slate-800 rounded-full">Bắt đầu chi nhánh mới</p>
        </div>

        {isSuccess ? (
          <div className="text-center py-10">
            <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 font-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">Đăng ký thành công!</h2>
            <p className="text-slate-600 dark:text-slate-400 mb-8 leading-relaxed">
              Chúng tôi đã gửi một email xác thực đến <strong>{email}</strong>. 
              Vui lòng kiểm tra hộp thư (bao gồm cả thư rác) và nhấn vào liên kết xác thực để kích hoạt tài khoản của bạn.
            </p>
            <Link to={`${tenantPrefix}/login`} className="inline-block w-full h-14 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-bold hover:bg-slate-800 dark:hover:bg-slate-100 transition-all flex items-center justify-center gap-3 shadow-xl shadow-slate-200 dark:shadow-none">
              Quay lại đăng nhập
            </Link>
          </div>
        ) : (
          <>
            {error && (
              <div className="bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 p-4 rounded-2xl text-sm mb-6 font-medium border border-rose-100 dark:border-rose-900/50">
                {typeof error === 'string' ? error : JSON.stringify(error)}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 px-1">Tên cửa hàng / Chi nhánh</label>
            <input 
              type="text" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full h-14 bg-slate-50 dark:bg-slate-950 rounded-2xl border-none focus:ring-2 focus:ring-emerald-500 px-6 font-medium text-slate-900 dark:text-white"
              placeholder="Saigon Coffee HQ"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 px-1">Địa chỉ Subdomain</label>
            <div className="relative">
              <input 
                type="text" 
                value={subdomain}
                onChange={(e) => setSubdomain(e.target.value.toLowerCase().replace(/\s+/g, '-'))}
                className="w-full h-14 bg-slate-50 dark:bg-slate-950 rounded-2xl border-none focus:ring-2 focus:ring-emerald-500 pl-12 pr-40 font-medium text-slate-900 dark:text-white"
                placeholder="saigon-coffee"
                required
              />
              <Globe className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-600 w-5 h-5" />
              <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 text-xs font-bold bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700">
                .monday.com.vn
              </div>
            </div>
            {subdomain.length >= 3 && (
              <div className="flex items-center gap-2 mt-2 px-2">
                {isCheckingSubdomain ? (
                  <>
                    <Loader2 className="w-3 h-3 text-slate-400 dark:text-slate-600 animate-spin" />
                    <span className="text-[10px] font-bold text-slate-400 dark:text-slate-600 uppercase tracking-widest">Đang kiểm tra...</span>
                  </>
                ) : isSubdomainAvailable === true ? (
                  <>
                    <CheckCircle2 className="w-3 h-3 text-emerald-500 dark:text-emerald-400" />
                    <span className="text-[10px] font-bold text-emerald-500 dark:text-emerald-400 uppercase tracking-widest">Khả dụng</span>
                  </>
                ) : isSubdomainAvailable === false ? (
                  <>
                    <AlertCircle className="w-3 h-3 text-rose-500 dark:text-rose-400" />
                    <span className="text-[10px] font-bold text-rose-500 dark:text-rose-400 uppercase tracking-widest">Đã được sử dụng</span>
                  </>
                ) : null}
              </div>
            )}
            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium px-1 mt-1">Đây sẽ là đường dẫn truy cập riêng của bạn</p>
          </div>

          <div className="grid grid-cols-1 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 px-1">Email (Tùy chọn)</label>
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full h-14 bg-slate-50 dark:bg-slate-950 rounded-2xl border-none focus:ring-2 focus:ring-emerald-500 px-6 font-medium text-slate-900 dark:text-white"
                placeholder="admin@coffee.com"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 px-1">Số điện thoại (Tùy chọn)</label>
              <input 
                type="tel" 
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full h-14 bg-slate-50 dark:bg-slate-950 rounded-2xl border-none focus:ring-2 focus:ring-emerald-500 px-6 font-medium text-slate-900 dark:text-white"
                placeholder="0901234567"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 px-1">Mật khẩu</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full h-14 bg-slate-50 dark:bg-slate-950 rounded-2xl border-none focus:ring-2 focus:ring-emerald-500 px-6 font-medium text-slate-900 dark:text-white"
              placeholder="••••••••"
              required
            />
          </div>

          <button 
            type="submit"
            className="w-full h-14 bg-emerald-600 text-white rounded-2xl font-bold hover:bg-emerald-700 transition-all flex items-center justify-center gap-3 shadow-xl shadow-emerald-200 dark:shadow-none active:scale-95"
          >
            <UserPlus className="w-5 h-5" />
            Đăng ký ngay
          </button>
        </form>
        </>
        )}

        <div className="mt-10 pt-8 border-t border-slate-100 dark:border-slate-800 text-center">
          <Link to={`${tenantPrefix}/login`} className="text-slate-400 dark:text-slate-500 font-bold hover:text-slate-900 dark:hover:text-white flex items-center justify-center gap-2 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Quay lại đăng nhập
          </Link>
        </div>
      </motion.div>
    </div>
    </IonContent>
  </IonPage>
  );
};

export default RegisterPage;
