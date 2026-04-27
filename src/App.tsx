import { BrowserRouter as Router, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { Coffee, CookingPot, Settings, LayoutDashboard, QrCode, LogOut, UtensilsCrossed, History, Bell, Grid2X2, Users } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useEffect, useState } from 'react';
import { cn } from './lib/utils';
import { useAuthStore } from './store/authStore';
import { getTenantPrefix, getTenantId, getTenantFromHostname, getTenantIdFromPath } from './lib/tenantUtils';
import { useSocket } from './hooks/useSocket';
import ProtectedRoute from './components/ProtectedRoute';
import ShiftGuard from './components/ShiftGuard';
import DashboardPage from './pages/DashboardPage';
import POSPage from './pages/POSPage';
import KitchenPage from './pages/KitchenPage';
import MenuPage from './pages/MenuPage';
import TablesPage from './pages/TablesPage';
import DevelopPage from './pages/DevelopPage';
import CustomerOrderPage from './pages/CustomerOrderPage';
import QRManagerPage from './pages/QRManagerPage';
import SettingsPage from './pages/SettingsPage';
import ShiftListPage from './pages/ShiftListPage';
import AdminPage from './pages/AdminPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';

// Separate Layout to use location hook
const MainLayout = () => {
  const location = useLocation();
  const logout = useAuthStore((state) => state.logout);
  const user = useAuthStore((state) => state.user);
  const tenantPrefix = getTenantPrefix();
  // IMPORTANT: Priority goes to hostname for tenant detection
  const fromHostname = getTenantFromHostname();
  const currentTenant = fromHostname || useAuthStore((state) => (state.user as any)?.tenantId) || getTenantIdFromPath(location.pathname);
  
  const [hasNewOrder, setHasNewOrder] = useState(false);
  const [audio] = useState(new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3'));

  useSocket((event, data) => {
    if (event === 'order:new') {
      setHasNewOrder(true);
      audio.play().catch(e => console.log('Audio play blocked:', e));
    }
  });

  useEffect(() => {
    if (location.pathname.includes('/kitchen')) {
      setHasNewOrder(false);
    }
  }, [location.pathname]);

  // If we are on a subdomain (fromHostname exists), we are NEVER on the main landing page
  const isMainLanding = !fromHostname && !currentTenant && (location.pathname === '/' || location.pathname === '');

  const isCustomerPage = location.pathname.startsWith(`${tenantPrefix}/order`);
  const authPaths = [`${tenantPrefix}/login`, `${tenantPrefix}/register`, `/login`, `/register`].map(p => p.replace(/\/$/, ''));
  const isAuthPage = authPaths.includes(location.pathname.replace(/\/$/, ''));

  if (isMainLanding && !isAuthPage) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center overflow-hidden relative">
        {/* Decorative background elements */}
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-50 rounded-full blur-[120px] opacity-60" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-50 rounded-full blur-[120px] opacity-60" />
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="relative z-10"
        >
          <div className="w-24 h-24 bg-slate-900 rounded-[32px] flex items-center justify-center shadow-2xl mb-10 mx-auto transform hover:rotate-12 transition-transform duration-500">
             <Coffee className="text-white w-12 h-12" />
          </div>
          <svg width="267" height="152" viewBox="0 0 267 152" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="267" height="152" fill="white"/>
          <path d="M48.2643 83.8251C46.7763 83.8238 45.4063 83.049 44.6862 81.8015C43.966 80.554 44.0092 79.0304 44.7989 77.8221L52.1672 66.5519C52.924 65.3247 54.3162 64.5876 55.8034 64.6266C57.2906 64.6657 58.6386 65.4748 59.3241 66.7399C60.0096 68.0049 59.9247 69.5267 59.1023 70.7146L51.7384 81.9848C50.9894 83.1315 49.6762 83.8272 48.2643 83.8251Z" fill="#FB275D"/>
          <path d="M60.8182 83.8251C59.3327 83.8238 57.9649 83.0508 57.246 81.8063C56.527 80.5618 56.5701 79.0417 57.3585 77.8364L64.7126 66.5929C65.4575 65.3478 66.8546 64.593 68.353 64.6262C69.8514 64.6593 71.2106 65.4751 71.8946 66.7518C72.5787 68.0285 72.4779 69.5612 71.632 70.7457L64.2779 81.9892C63.5318 83.1306 62.2247 83.8243 60.8182 83.8251V83.8251Z" fill="#FFCC00"/>
          <path d="M73.0578 83.8481C75.3082 83.8481 77.1325 82.0269 77.1325 79.7804C77.1325 77.5339 75.3082 75.7128 73.0578 75.7128C70.8074 75.7128 68.9831 77.5339 68.9831 79.7804C68.9831 82.0269 70.8074 83.8481 73.0578 83.8481Z" fill="#00CA72"/>
          <path d="M207.724 90.8956L211.158 83.1238L203.623 65.9666H209.957L214.258 77.0645L218.659 65.9666H224.726L213.858 90.8956H207.724Z" fill="black"/>
          <path d="M190.348 65.7031C193.149 65.7031 195.116 66.9545 196.116 68.5682V65.9666H201.817V84.3422H196.116V81.7407C195.082 83.3543 193.115 84.6057 190.348 84.6057C185.781 84.6057 182.18 80.9174 182.18 75.1215C182.18 69.3256 185.781 65.7031 190.348 65.7031ZM187.981 75.1215C187.981 78.0524 189.882 79.6989 192.049 79.6989C194.216 79.6989 196.116 78.0853 196.116 75.1544C196.116 72.2235 194.216 70.6099 192.049 70.6099C189.882 70.6099 187.981 72.1906 187.981 75.1215Z" fill="black"/>
          <path d="M168.272 65.7032C170.739 65.7032 172.839 66.8229 173.973 68.5024V59.9732H179.707V84.3424H173.973V81.7079C172.972 83.3874 171.006 84.6058 168.238 84.6058C163.671 84.6058 160.07 80.9175 160.07 75.1216C160.07 69.3257 163.671 65.7032 168.272 65.7032ZM165.871 75.1216C165.871 78.0525 167.772 79.6991 169.939 79.6991C172.106 79.6991 174.006 78.0854 174.006 75.1545C174.006 72.2236 172.106 70.61 169.939 70.61C167.772 70.61 165.871 72.1907 165.871 75.1216Z" fill="black"/>
          <path d="M152.028 74.3641C152.028 71.8613 150.595 70.4782 148.461 70.4782C146.261 70.4782 144.86 71.8613 144.86 74.3641V84.3423H139.159V65.9666H144.86V68.4364C145.994 66.8557 147.994 65.769 150.494 65.769C154.828 65.769 157.696 68.667 157.696 73.6067V84.3423H152.028V74.3641Z" fill="black"/>
          <path d="M126.95 84.7703C121.482 84.7703 117.381 81.1479 117.381 75.1544C117.381 69.1609 121.582 65.5384 127.05 65.5384C132.517 65.5384 136.718 69.1609 136.718 75.1544C136.718 81.1479 132.45 84.7703 126.95 84.7703ZM123.149 75.1544C123.149 78.2499 124.916 79.7318 126.95 79.7318C128.983 79.7318 130.917 78.2499 130.917 75.1544C130.917 72.0259 129.016 70.5769 127.016 70.5769C124.983 70.5769 123.149 72.0259 123.149 75.1544Z" fill="black"/>
          <path d="M83.6429 65.9666H89.3437V68.3047C90.4439 66.7899 92.3775 65.769 94.7779 65.769C97.6117 65.769 99.8787 66.9875 101.146 69.1939C102.379 67.2509 104.679 65.769 107.413 65.769C112.014 65.769 114.981 68.667 114.981 73.6067V84.3423H109.313V74.3641C109.313 71.9601 107.88 70.6428 105.746 70.6428C103.546 70.6428 102.179 71.9601 102.179 74.3641V84.3423H96.5115V74.3641C96.5115 71.9601 95.0779 70.6428 92.9443 70.6428C90.7439 70.6428 89.3437 71.9601 89.3437 74.3641V84.3423H83.6429V65.9666Z" fill="black"/>
          </svg>

          <p className="text-slate-500 text-xl font-medium max-w-lg mb-12 mx-auto leading-relaxed">
            Nền tảng quản lý vận hành chuỗi cà phê & nhà hàng hiện đại. <br/>
            <span className="text-slate-400">Đơn giản, hiệu quả, mọi lúc mọi nơi.</span>
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/login" className="px-10 h-16 bg-slate-900 text-white rounded-2xl font-bold flex items-center justify-center hover:bg-emerald-600 transition-all shadow-2xl shadow-slate-900/20 active:scale-95">
              Đăng nhập hệ thống
            </Link>
            <Link to="/register" className="px-10 h-16 bg-white text-slate-900 border-2 border-slate-100 rounded-2xl font-bold flex items-center justify-center hover:border-emerald-500 transition-all shadow-sm active:scale-95">
              Đăng ký chi nhánh mới
            </Link>
          </div>
          
          <div className="mt-20 pt-10 border-t border-slate-50 flex flex-wrap justify-center gap-12 grayscale opacity-40">
            <p className="font-black tracking-tighter text-2xl">MONDAY.COM.VN</p>
            
          </div>
        </motion.div>
      </div>
    );
  }

  if (isAuthPage) {
    return (
      <main className="flex-1 overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div key={location.pathname} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full">
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path={`${tenantPrefix}/login`} element={<LoginPage />} />
              <Route path={`${tenantPrefix}/register`} element={<RegisterPage />} />
            </Routes>
          </motion.div>
        </AnimatePresence>
      </main>
    );
  }

  const navItems = [
    { to: `${tenantPrefix}/`, icon: LayoutDashboard, label: 'Thống kê' },
    { to: `${tenantPrefix}/pos`, icon: Coffee, label: 'Bán hàng' },
    { to: `${tenantPrefix}/shifts`, icon: History, label: 'Lịch sử ca' },
    { to: `${tenantPrefix}/kitchen`, icon: CookingPot, label: 'Bếp', badge: hasNewOrder },
    { to: `${tenantPrefix}/menu`, icon: UtensilsCrossed, label: 'Thực đơn', permission: 'MENU_MANAGE' },
    { to: `${tenantPrefix}/tables`, icon: Grid2X2, label: 'Bàn', permission: 'TABLE_MANAGE' },
    { to: `${tenantPrefix}/qr`, icon: QrCode, label: 'Mã QR', permission: 'TABLE_MANAGE' },
    { to: `${tenantPrefix}/admin`, icon: Users, label: 'Nhân sự', permission: 'USER_MANAGE' },
    { to: `${tenantPrefix}/settings`, icon: Settings, label: 'Cài đặt', permission: 'SETTINGS_MANAGE' },
  ].filter(item => {
    if (!item.permission) return true;
    if (user?.role === 'ADMIN' || user?.role === 'MANAGER') return true;
    return user?.permissions?.includes(item.permission);
  });

  return (
    <div className="flex h-screen bg-[#F8FAFC] text-slate-800 flex-col sm:flex-row">
      {!isCustomerPage && (
        <>
          {/* Desktop Sidebar - Premium Refinement */}
          <aside className="hidden sm:flex w-[120px] bg-slate-50 border-r border-slate-200 flex-col items-center py-10 gap-12 z-50 shadow-[4px_0_24px_rgba(0,0,0,0.02)] shrink-0">
            <Link to={`${tenantPrefix}/`} className="w-16 h-16 bg-slate-900 rounded-[28px] flex items-center justify-center shadow-2xl shadow-slate-300 hover:scale-[1.08] transition-all duration-300 shrink-0 group rotate-3 hover:rotate-0">
               <Coffee className="text-white w-9 h-9 group-hover:scale-110 transition-transform" />
            </Link>
            
            <nav className="flex-1 flex flex-col gap-6 overflow-y-auto no-scrollbar w-full px-3">
              {navItems.map((item) => {
                const isActive = (location.pathname === item.to || (item.to === `${tenantPrefix}/` && (location.pathname === tenantPrefix || location.pathname === `${tenantPrefix}/`)));
                return (
                  <Link 
                    key={item.to}
                    to={item.to} 
                    className={cn(
                      "py-4 transition-all duration-300 rounded-[28px] group relative flex flex-col items-center gap-2.5 w-full active:scale-95", 
                      isActive 
                        ? "text-emerald-700 bg-white shadow-[0_12px_40px_rgba(0,0,0,0.06)] border border-slate-100" 
                        : "text-slate-400 hover:text-emerald-600 hover:bg-emerald-50/50"
                    )}
                  >
                    <div className="relative">
                      <item.icon className={cn("w-7 h-7 transition-all duration-300", isActive ? "scale-110 text-emerald-600" : "group-hover:scale-110")} />
                      {isActive && (
                        <motion.div 
                          layoutId="active-nav-dot"
                          className="absolute -bottom-1 -right-1 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white"
                        />
                      )}
                    </div>
                    <span className={cn("text-[9px] font-black uppercase tracking-[0.08em] text-center leading-none", isActive ? "text-emerald-700" : "text-slate-400 opacity-60 group-hover:opacity-100")}>
                      {item.label}
                    </span>
                    {item.badge && (
                      <div className="absolute top-3 right-3 w-4 h-4 bg-rose-500 rounded-full border-2 border-white flex items-center justify-center shadow-lg shadow-rose-200">
                        <span className="text-[8px] text-white font-black truncate">!</span>
                      </div>
                    )}
                  </Link>
                );
              })}
            </nav>

            <button 
              onClick={() => logout()}
              className="p-4 text-slate-400 hover:text-rose-600 transition-all rounded-[24px] hover:bg-rose-50/50 shrink-0 mb-6 group active:scale-95"
              title="Đăng xuất"
            >
              <LogOut className="w-7 h-7 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </aside>

          {/* Mobile Bottom Bar - Premium Refinement */}
          <nav className="sm:hidden fixed bottom-6 left-6 right-6 h-20 bg-slate-900/95 backdrop-blur-2xl rounded-[32px] flex justify-around items-center px-4 z-[100] shadow-[0_20px_50px_rgba(0,0,0,0.3)] border border-white/10">
            {navItems.map((item) => {
               const isActive = (location.pathname === item.to || (item.to === `${tenantPrefix}/` && (location.pathname === tenantPrefix || location.pathname === `${tenantPrefix}/`)));
               return (
                <Link 
                  key={item.to}
                  to={item.to} 
                  className={cn(
                    "p-3 rounded-2xl group relative flex flex-col items-center gap-1.5 transition-all duration-300", 
                    isActive ? "text-emerald-400 scale-110 shadow-[0_0_20px_rgba(52,211,153,0.3)]" : "text-white opacity-40 hover:opacity-100"
                  )}
                >
                  <div className="relative">
                    <item.icon className="w-6 h-6" />
                    {isActive && (
                      <motion.div 
                        layoutId="mobile-dot"
                        className="absolute -top-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-emerald-400 rounded-full"
                      />
                    )}
                  </div>
                  {item.badge && (
                    <div className="absolute top-2 right-2 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-slate-900 shadow-sm" />
                  )}
                </Link>
              );
            })}
          </nav>
        </>
      )}

      <main className={cn("flex-1 overflow-hidden sm:overflow-visible", !isCustomerPage && "pb-24 sm:pb-0")}>
        <div className="h-full overflow-y-auto no-scrollbar">
          <AnimatePresence mode="wait">
            <motion.div 
              key={location.pathname} 
              initial={{ opacity: 0, x: -10 }} 
              animate={{ opacity: 1, x: 0 }} 
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.2 }}
              className="min-h-full"
            >
            <Routes>
              {/* Wrapped in a tenant-aware route prefix group */}
              <Route path={`${tenantPrefix}`}>
                <Route element={<ProtectedRoute />}>
                  <Route index element={<DashboardPage />} />
                  <Route path="pos" element={
                    <ShiftGuard>
                      <POSPage />
                    </ShiftGuard>
                  } />
                  <Route path="shifts" element={<ShiftListPage />} />
                  <Route path="kitchen" element={<KitchenPage />} />
                  <Route path="menu" element={<MenuPage />} />
                  <Route path="tables" element={<TablesPage />} />
                  <Route path="qr" element={<QRManagerPage />} />
                  <Route path="settings" element={<SettingsPage />} />
                  <Route path="admin" element={<AdminPage />} />
                </Route>
                <Route path="develop" element={<DevelopPage />} />
                <Route path="order" element={<CustomerOrderPage />} />
              </Route>
              
              {/* Fallback for deep links without prefix if they match routes */}
              {tenantPrefix === '' && (
                <>
                  <Route element={<ProtectedRoute />}>
                    <Route path="/pos" element={<ShiftGuard><POSPage /></ShiftGuard>} />
                    <Route path="/shifts" element={<ShiftListPage />} />
                    <Route path="/kitchen" element={<KitchenPage />} />
                    <Route path="/menu" element={<MenuPage />} />
                    <Route path="/tables" element={<TablesPage />} />
                    <Route path="/qr" element={<QRManagerPage />} />
                    <Route path="/settings" element={<SettingsPage />} />
                    <Route path="/admin" element={<AdminPage />} />
                  </Route>
                  <Route path="/develop" element={<DevelopPage />} />
                  <Route path="/order" element={<CustomerOrderPage />} />
                </>
              )}
            </Routes>
          </motion.div>
        </AnimatePresence>
        </div>
      </main>
    </div>
  );
};

export default function App() {
  const checkAuth = useAuthStore((state) => state.checkAuth);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return (
    <Router>
      <MainLayout />
    </Router>
  );
}
