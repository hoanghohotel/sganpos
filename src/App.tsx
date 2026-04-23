import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { Coffee, CookingPot, Settings, LayoutDashboard } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import POSPage from './pages/POSPage.tsx';
import KitchenPage from './pages/KitchenPage.tsx';

const AdminPage = () => (
  <div className="p-8">
    <h1 className="text-3xl font-bold font-sans tracking-tight mb-4">Quản lý Hệ thống</h1>
    <p className="text-gray-500 italic serif">Quản lý menu và báo cáo.</p>
  </div>
);

export default function App() {
  return (
    <Router>
      <div className="flex h-screen bg-[#F5F5F0]">
        {/* Sidebar */}
        <aside className="w-64 bg-[#141414] text-white flex flex-col">
          <div className="p-6">
            <div className="flex items-center gap-2 mb-8">
              <div className="w-10 h-10 bg-[#FF6321] rounded-full flex items-center justify-center">
                <Coffee className="text-black" />
              </div>
              <span className="font-bold text-xl tracking-tight">CÀ PHÊ POS</span>
            </div>
            
            <nav className="space-y-4">
              <Link to="/" className="flex items-center gap-3 text-gray-400 hover:text-white transition-colors group">
                <LayoutDashboard className="w-5 h-5 group-hover:scale-110 transition-transform" />
                <span className="text-sm font-medium uppercase tracking-wider">Tổng quan</span>
              </Link>
              <Link to="/pos" className="flex items-center gap-3 text-gray-400 hover:text-white transition-colors group">
                <Coffee className="w-5 h-5 group-hover:scale-110 transition-transform" />
                <span className="text-sm font-medium uppercase tracking-wider">Bán hàng</span>
              </Link>
              <Link to="/kitchen" className="flex items-center gap-3 text-gray-400 hover:text-white transition-colors group">
                <CookingPot className="w-5 h-5 group-hover:scale-110 transition-transform" />
                <span className="text-sm font-medium uppercase tracking-wider">Nhà bếp</span>
              </Link>
              <Link to="/admin" className="flex items-center gap-3 text-gray-400 hover:text-white transition-colors group">
                <Settings className="w-5 h-5 group-hover:scale-110 transition-transform" />
                <span className="text-sm font-medium uppercase tracking-wider">Cài đặt</span>
              </Link>
            </nav>
          </div>
          
          <div className="mt-auto p-6 border-t border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gray-600"></div>
              <div>
                <p className="text-xs font-bold">Admin</p>
                <p className="text-[10px] text-gray-500 italic">Quản Lý</p>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-auto">
          <AnimatePresence mode="wait">
            <Routes>
              <Route path="/" element={
                 <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="p-8"
                >
                  <h1 className="text-6vw font-bold font-sans tracking-tighter leading-tight mb-8">
                    Chào mừng trở lại,<br/>
                    <span className="text-[#FF6321]">Hôm nay thế nào?</span>
                  </h1>
                </motion.div>
              } />
              <Route path="/pos" element={<POSPage />} />
              <Route path="/kitchen" element={<KitchenPage />} />
              <Route path="/admin" element={<AdminPage />} />
            </Routes>
          </AnimatePresence>
        </main>
      </div>
    </Router>
  );
}
