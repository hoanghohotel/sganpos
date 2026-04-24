import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { Coffee, CookingPot, Settings, LayoutDashboard, QrCode, LogOut } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useEffect } from 'react';
import { useAuthStore } from './store/authStore.ts';
import ProtectedRoute from './components/ProtectedRoute.tsx';
import ShiftGuard from './components/ShiftGuard.tsx';
import POSPage from './pages/POSPage.tsx';
import KitchenPage from './pages/KitchenPage.tsx';
import CustomerOrderPage from './pages/CustomerOrderPage.tsx';
import QRManagerPage from './pages/QRManagerPage.tsx';
import SettingsPage from './pages/SettingsPage.tsx';
import LoginPage from './pages/LoginPage.tsx';
import RegisterPage from './pages/RegisterPage.tsx';

// Separate Layout to use location hook
const MainLayout = () => {
  const location = useLocation();
  const logout = useAuthStore((state) => state.logout);
  const user = useAuthStore((state) => state.user);
  
  const isCustomerPage = location.pathname === '/order';
  const isAuthPage = ['/login', '/register'].includes(location.pathname);

  if (isAuthPage) {
    return (
      <main className="flex-1 overflow-hidden">
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
          </Routes>
        </AnimatePresence>
      </main>
    );
  }

  return (
    <div className="flex h-screen bg-[#F8FAFC] text-slate-800">
      {!isCustomerPage && (
        <aside className="w-20 bg-white border-r border-slate-200 flex flex-col items-center py-8 gap-10">
          <Link to="/" className="w-12 h-12 bg-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-200 hover:scale-105 transition-transform">
            <img src="/logo.svg" alt="Logo" className="w-8 h-8" />
          </Link>
          
          <nav className="flex-1 flex flex-col gap-6">
            <Link to="/" className="p-3 text-slate-400 hover:text-emerald-600 transition-colors rounded-xl hover:bg-slate-50 group">
              <LayoutDashboard className="w-6 h-6 group-hover:scale-110 transition-transform" />
            </Link>
            <Link to="/pos" className="p-3 text-slate-400 hover:text-emerald-600 transition-colors rounded-xl hover:bg-slate-50 group transition-all">
              <Coffee className="w-6 h-6 group-hover:scale-110 transition-transform" />
            </Link>
            <Link to="/kitchen" className="p-3 text-slate-400 hover:text-emerald-600 transition-colors rounded-xl hover:bg-slate-50 group">
              <CookingPot className="w-6 h-6 group-hover:scale-110 transition-transform" />
            </Link>
            <Link to="/qr" className="p-3 text-slate-400 hover:text-emerald-600 transition-colors rounded-xl hover:bg-slate-50 group">
              <QrCode className="w-6 h-6 group-hover:scale-110 transition-transform" />
            </Link>
            <Link to="/settings" className="p-3 text-slate-400 hover:text-emerald-600 transition-colors rounded-xl hover:bg-slate-50 group">
              <Settings className="w-6 h-6 group-hover:scale-110 transition-transform" />
            </Link>
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
          <Routes location={location} key={location.pathname}>
            <Route element={<ProtectedRoute />}>
              <Route path="/" element={<Home />} />
              <Route path="/pos" element={
                <ShiftGuard>
                  <POSPage />
                </ShiftGuard>
              } />
              <Route path="/kitchen" element={<KitchenPage />} />
              <Route path="/qr" element={<QRManagerPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/admin" element={<AdminPage />} />
            </Route>
            <Route path="/order" element={<CustomerOrderPage />} />
          </Routes>
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
