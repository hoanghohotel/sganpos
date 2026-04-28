import { Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { Coffee, CookingPot, Settings, LayoutDashboard, QrCode, UtensilsCrossed, History, Grid2X2, Users, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useEffect, useState } from 'react';
import { cn } from '../../lib/utils';
import { useAuthStore } from '../../store/authStore';
import { getTenantPrefix, getTenantFromHostname, getTenantIdFromPath } from '../../lib/tenantUtils';
import { useSocket } from '../../hooks/useSocket';
import Logo from '../Logo';
import ProtectedRoute from '../ProtectedRoute';
import ShiftGuard from '../ShiftGuard';
import DashboardPage from '../../pages/DashboardPage';
import POSPage from '../../pages/POSPage';
import KitchenPage from '../../pages/KitchenPage';
import MenuPage from '../../pages/MenuPage';
import TablesPage from '../../pages/TablesPage';
import DevelopPage from '../../pages/DevelopPage';
import CustomerOrderPage from '../../pages/CustomerOrderPage';
import QRManagerPage from '../../pages/QRManagerPage';
import SettingsPage from '../../pages/SettingsPage';
import ShiftListPage from '../../pages/ShiftListPage';
import AdminPage from '../../pages/AdminPage';
import LoginPage from '../../pages/LoginPage';
import RegisterPage from '../../pages/RegisterPage';
import Sidebar from './Sidebar';
import MobileNav from './MobileNav';

const MainLayout = () => {
  const location = useLocation();
  const logout = useAuthStore((state) => state.logout);
  const user = useAuthStore((state) => state.user);
  const tenantPrefix = getTenantPrefix();
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

  const isMainLanding = !fromHostname && !currentTenant && (location.pathname === '/' || location.pathname === '');
  const isCustomerPage = location.pathname.includes('/order');
  const isDevelopPage = location.pathname.includes('/develop');
  const authPaths = [`${tenantPrefix}/login`, `${tenantPrefix}/register`, `/login`, `/register`].map(p => p.replace(/\/$/, ''));
  const isAuthPage = authPaths.includes(location.pathname.replace(/\/$/, ''));

  if (isMainLanding && !isAuthPage) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center overflow-hidden relative">
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
          <Sidebar 
            navItems={navItems} 
            location={location} 
            tenantPrefix={tenantPrefix} 
            logout={logout} 
          />
          <MobileNav 
            navItems={navItems} 
            location={location} 
            tenantPrefix={tenantPrefix} 
          />
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

export default MainLayout;
