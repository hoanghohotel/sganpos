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
      <div className="flex h-screen bg-[#F8FAFC] text-slate-800">
        {/* Sidebar */}
        <aside className="w-20 bg-white border-r border-slate-200 flex flex-col items-center py-8 gap-10">
          <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-200">
            <Coffee className="text-white w-6 h-6" />
          </div>
          
          <nav className="flex flex-col gap-6">
            <Link to="/" className="p-3 text-slate-400 hover:text-emerald-600 transition-colors rounded-xl hover:bg-slate-50 group">
              <LayoutDashboard className="w-6 h-6 group-hover:scale-110 transition-transform" />
            </Link>
            <Link to="/pos" className="p-3 bg-emerald-50 text-emerald-600 rounded-xl group transition-all">
              <Coffee className="w-6 h-6 group-hover:scale-110 transition-transform" />
            </Link>
            <Link to="/kitchen" className="p-3 text-slate-400 hover:text-emerald-600 transition-colors rounded-xl hover:bg-slate-50 group">
              <CookingPot className="w-6 h-6 group-hover:scale-110 transition-transform" />
            </Link>
            <Link to="/admin" className="p-3 text-slate-400 hover:text-emerald-600 transition-colors rounded-xl hover:bg-slate-50 group">
              <Settings className="w-6 h-6 group-hover:scale-110 transition-transform" />
            </Link>
          </nav>
          
          <div className="mt-auto mb-4 px-4">
            <div className="w-10 h-10 rounded-full bg-slate-200 border-2 border-white shadow-sm overflow-hidden">
               <div className="w-full h-full bg-slate-300" />
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-hidden">
          <AnimatePresence mode="wait">
            <Routes>
              <Route path="/" element={
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
