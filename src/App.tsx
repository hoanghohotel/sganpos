import { BrowserRouter as Router, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { Coffee, CookingPot, Settings, LayoutDashboard, QrCode, LogOut, UtensilsCrossed, History, Bell, Grid2X2 } from 'lucide-react';
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
          <h1 className="text-7xl font-black text-slate-900 tracking-tighter mb-4">
            Monday<span className="text-emerald-600">.</span>
          </h1>
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
            <p className="font-black tracking-tighter text-2xl italic">CHINHANH.POS</p>
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
    { to: `${tenantPrefix}/menu`, icon: UtensilsCrossed, label: 'Thực đơn' },
    { to: `${tenantPrefix}/tables`, icon: Grid2X2, label: 'Bàn' },
    { to: `${tenantPrefix}/qr`, icon: QrCode, label: 'Mã QR' },
    { to: `${tenantPrefix}/settings`, icon: Settings, label: 'Cài đặt' },
  ];

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

const AdminPage = () => {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold font-sans tracking-tight mb-4">Quản lý Hệ thống</h1>
      <p className="text-gray-500 italic serif">Quản lý menu và báo cáo.</p>
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
