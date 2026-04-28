import { BrowserRouter as Router, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { Coffee, CookingPot, Settings, LayoutDashboard, QrCode, LogOut, UtensilsCrossed, History, Bell, Grid2X2, Users, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useEffect, useState } from 'react';
import { cn } from './lib/utils';
import { useAuthStore } from './store/authStore';
import { getTenantPrefix, getTenantId, getTenantFromHostname, getTenantIdFromPath } from './lib/tenantUtils';
import { useSocket } from './hooks/useSocket';
import Logo from './components/Logo';
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

  const checkShift = useAuthStore((state) => state.checkShift);
  
  useSocket((event, data) => {
    if (event === 'order:new') {
      setHasNewOrder(true);
      audio.play().catch(e => console.log('Audio play blocked:', e));
    }
    if (event === 'shift:update') {
      checkShift();
    }
  });

  useEffect(() => {
    if (location.pathname.includes('/kitchen')) {
      setHasNewOrder(false);
    }
  }, [location.pathname]);

  // If we are on a subdomain (fromHostname exists), we are NEVER on the main landing page
  const isMainLanding = !fromHostname && !currentTenant && (location.pathname === '/' || location.pathname === '');

  const isCustomerPage = location.pathname.includes('/order');
  const isDevelopPage = location.pathname.includes('/develop');
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
          className="relative z-10 flex flex-col items-center"
        >
          <Logo size="xl" className="mb-8" />

          <h1 className="text-4xl sm:text-6xl font-black text-slate-900 tracking-tight leading-tight mb-6">
            Quản lý vận hành <br/> 
            <span className="text-emerald-600">với đẳng cấp mới</span>
          </h1>

          <p className="text-slate-500 text-lg sm:text-xl font-medium max-w-lg mb-12 mx-auto leading-relaxed">
            Hệ sinh thái thông minh chuyên biệt cho chuỗi cà phê & nhà hàng hiện đại. 
            Tối ưu quy trình, bứt phá doanh thu.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center w-full max-w-md">
            <Link to="/login" className="px-10 h-16 bg-slate-900 text-white rounded-2xl font-bold flex items-center justify-center hover:bg-emerald-600 transition-all shadow-2xl shadow-slate-900/20 active:scale-95 group">
              Truy cập hệ thống
              <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            {!fromHostname && (
              <Link to="/register" className="px-10 h-16 bg-white text-slate-900 border-2 border-slate-100 rounded-2xl font-bold flex items-center justify-center hover:border-emerald-500 transition-all shadow-sm active:scale-95">
                Mở chi nhánh mới
              </Link>
            )}
          </div>
          
          <div className="mt-20 pt-10 border-t border-slate-50 flex flex-wrap justify-center gap-12 grayscale opacity-30 items-center">
            <span className="font-black tracking-tighter text-2xl">MONDAY.COM.VN</span>
            <div className="w-1 h-1 bg-slate-400 rounded-full" />
            <span className="font-bold text-sm uppercase tracking-widest text-slate-500">Professional POS Solutions</span>
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
              {!fromHostname && <Route path="/register" element={<RegisterPage />} />}
              <Route path={`${tenantPrefix}/login`} element={<LoginPage />} />
              {tenantPrefix !== '' && !fromHostname && <Route path={`${tenantPrefix}/register`} element={<RegisterPage />} />}
              {/* If someone tries to register on a subdomain, redirect to login */}
              {fromHostname && <Route path="/register" element={<Navigate to="/login" replace />} />}
              {fromHostname && <Route path={`${tenantPrefix}/register`} element={<Navigate to="/login" replace />} />}
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
    <div className="flex h-screen bg-slate-50 text-slate-900 flex-col sm:flex-row">
      {!isCustomerPage && !isDevelopPage && (
        <>
          {/* Desktop Sidebar - Modern & Clean */}
          <aside className="hidden sm:flex w-24 bg-white border-r border-slate-200 flex-col items-center py-8 gap-12 z-50 shadow-sm shrink-0">
            <Link to={`${tenantPrefix}/`} className="transition-all duration-300 hover:scale-110 active:scale-95">
               <Logo variant="icon" size="md" />
            </Link>
            
            <nav className="flex-1 flex flex-col gap-4 overflow-y-auto no-scrollbar w-full px-2">
              {navItems.map((item) => {
                const isActive = (location.pathname === item.to || (item.to === `${tenantPrefix}/` && (location.pathname === tenantPrefix || location.pathname === `${tenantPrefix}/`)));
                return (
                  <Link 
                    key={item.to}
                    to={item.to} 
                    className={cn(
                      "py-3 px-2 rounded-lg group relative flex flex-col items-center gap-2 w-full transition-all duration-200 active:scale-95", 
                      isActive 
                        ? "bg-emerald-50 text-emerald-600" 
                        : "text-slate-500 hover:bg-slate-100"
                    )}
                    title={item.label}
                  >
                    <div className="relative">
                      <item.icon className={cn("w-6 h-6 transition-all duration-200", isActive ? "text-emerald-600" : "group-hover:text-emerald-600")} />
                      {isActive && (
                        <motion.div 
                          layoutId="active-nav-dot"
                          className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-emerald-500 rounded-full"
                        />
                      )}
                    </div>
                    <span className={cn("text-[8px] font-semibold uppercase tracking-wider text-center leading-none", isActive ? "text-emerald-600" : "text-slate-400 group-hover:text-slate-600")}>
                      {item.label}
                    </span>
                    {item.badge && (
                      <div className="absolute top-2 right-2 w-3 h-3 bg-red-500 rounded-full border-2 border-white flex items-center justify-center shadow-md text-[7px] text-white font-bold">
                        •
                      </div>
                    )}
                  </Link>
                );
              })}
            </nav>

            <button 
              onClick={() => logout()}
              className="p-2.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all shrink-0 mb-4 group active:scale-95"
              title="Đăng xuất"
            >
              <LogOut className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </aside>

          {/* Mobile Bottom Bar - Modern & Clean */}
          <nav className="sm:hidden fixed bottom-4 left-4 right-4 h-16 bg-white border border-slate-200 rounded-2xl flex justify-around items-center px-2 z-50 shadow-lg">
            {navItems.map((item) => {
               const isActive = (location.pathname === item.to || (item.to === `${tenantPrefix}/` && (location.pathname === tenantPrefix || location.pathname === `${tenantPrefix}/`)));
               return (
                <Link 
                  key={item.to}
                  to={item.to} 
                  className={cn(
                    "p-2 rounded-lg group relative flex flex-col items-center gap-1 transition-all duration-200 flex-1", 
                    isActive ? "bg-emerald-50 text-emerald-600" : "text-slate-500 hover:bg-slate-100"
                  )}
                  title={item.label}
                >
                  <div className="relative">
                    <item.icon className={cn("w-5 h-5", isActive ? "text-emerald-600" : "group-hover:text-emerald-600")} />
                    {isActive && (
                      <motion.div 
                        layoutId="mobile-dot"
                        className="absolute -top-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-emerald-500 rounded-full"
                      />
                    )}
                  </div>
                  <span className={cn("text-[8px] font-semibold uppercase tracking-wider", isActive ? "text-emerald-600" : "text-slate-400")}>
                    {item.label.slice(0, 3)}
                  </span>
                  {item.badge && (
                    <div className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
                  )}
                </Link>
              );
            })}
          </nav>
        </>
      )}

      <main className={cn("flex-1 overflow-hidden sm:overflow-visible", (!isCustomerPage && !isDevelopPage) && "pb-24 sm:pb-0")}>
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
              
              {/* Fallback for bare routes if not matched by tenant prefix (e.g. on main domain) */}
              {tenantPrefix !== '' && (
                <Route path="/develop" element={<DevelopPage />} />
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
