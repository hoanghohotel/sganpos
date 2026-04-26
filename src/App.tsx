import { BrowserRouter as Router, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { Coffee, CookingPot, Settings, LayoutDashboard, QrCode, LogOut, UtensilsCrossed, History, Bell } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useEffect, useState } from 'react';
import { cn } from './lib/utils';
import { useAuthStore } from './store/authStore';
import { getTenantPrefix } from './lib/tenantUtils';
import { useSocket } from './hooks/useSocket';
import ProtectedRoute from './components/ProtectedRoute';
import ShiftGuard from './components/ShiftGuard';
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

  const isCustomerPage = location.pathname.startsWith(`${tenantPrefix}/order`);
  const authPaths = [`${tenantPrefix}/login`, `${tenantPrefix}/register`];
  const isAuthPage = authPaths.includes(location.pathname.replace(/\/$/, ''));

  if (isAuthPage) {
    return (
      <main className="flex-1 overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div key={location.pathname} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full">
            <Routes>
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
    { to: `${tenantPrefix}/tables`, icon: UtensilsCrossed, label: 'Bàn' },
    { to: `${tenantPrefix}/qr`, icon: QrCode, label: 'Mã QR' },
    { to: `${tenantPrefix}/settings`, icon: Settings, label: 'Cài đặt' },
  ];

  return (
    <div className="flex h-screen bg-[#F8FAFC] text-slate-800">
      {!isCustomerPage && (
        <aside className="w-20 bg-white border-r border-slate-200 flex flex-col items-center py-8 gap-10">
          <Link to={`${tenantPrefix}/`} className="w-12 h-12 bg-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-200 hover:scale-105 transition-transform">
            <img src="/logo.svg" alt="Logo" className="w-8 h-8" />
          </Link>
          
          <nav className="flex-1 flex flex-col gap-6 overflow-y-auto no-scrollbar">
            {navItems.map((item) => (
              <Link 
                key={item.to}
                to={item.to} 
                className={cn(
                  "p-3 transition-colors rounded-xl hover:bg-slate-50 group relative", 
                  (location.pathname === item.to || (item.to === `${tenantPrefix}/` && (location.pathname === tenantPrefix || location.pathname === `${tenantPrefix}/`))) ? "text-emerald-600 bg-emerald-50" : "text-slate-400 hover:text-emerald-600"
                )}
              >
                <item.icon className="w-6 h-6 group-hover:scale-110 transition-transform" />
                {item.badge && (
                  <motion.div 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute top-2 right-2 w-3 h-3 bg-rose-500 rounded-full border-2 border-white flex items-center justify-center"
                   >
                     <motion.div
                       animate={{ rotate: [0, -20, 20, -20, 20, 0] }}
                       transition={{ repeat: Infinity, duration: 0.5 }}
                     >
                       <Bell size={6} className="text-white fill-current" />
                     </motion.div>
                   </motion.div>
                )}
                <span className="absolute left-full ml-4 px-2 py-1 bg-slate-800 text-white text-[10px] rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
                  {item.label}
                </span>
              </Link>
            ))}
          </nav>

          <button 
            onClick={() => logout()}
            className="p-3 text-slate-400 hover:text-rose-600 transition-colors rounded-xl hover:bg-rose-50"
          >
            <LogOut className="w-6 h-6" />
          </button>
        </aside>
      )}

      <main className="flex-1 overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div key={location.pathname} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full">
            <Routes>
              {/* Wrapped in a tenant-aware route prefix group */}
              <Route path={`${tenantPrefix}`}>
                <Route element={<ProtectedRoute />}>
                  <Route index element={<Home />} />
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
      </main>
    </div>
  );
};

const Home = () => (
  <motion.div 
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -10 }}
    className="p-10"
  >
    <p className="text-emerald-600 font-bold text-sm uppercase tracking-widest mb-2">Hệ thống POS</p>
    <h1 className="text-5xl font-black text-slate-900 tracking-tighter leading-none mb-8">
      Chào mừng,<br/>
      <span className="text-slate-400">Ngày mới tốt lành.</span>
    </h1>
  </motion.div>
);

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
