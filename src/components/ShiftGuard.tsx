import React, { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { motion, AnimatePresence } from 'motion/react';
import { Lock, Play, CircleDollarSign } from 'lucide-react';

const ShiftGuard = ({ children }: { children: React.ReactNode }) => {
  const { shift, openShift } = useAuthStore();
  const [openingBalance, setOpeningBalance] = useState<number>(0);
  const [showModal, setShowModal] = useState(false);

  if (!shift) {
    return (
      <div className="h-screen bg-slate-900 flex items-center justify-center p-6 relative overflow-hidden">
        {/* Background blobs */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-600/20 rounded-full blur-[120px] -mr-64 -mt-64" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-blue-600/10 rounded-full blur-[100px] -ml-48 -mb-48" />

        <div className="relative z-10 max-w-sm w-full text-center">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white/10 backdrop-blur-3xl border border-white/20 p-12 rounded-[48px] shadow-2xl"
          >
            <div className="w-20 h-20 bg-emerald-500 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-xl shadow-emerald-500/20">
              <Lock className="text-white w-10 h-10" />
            </div>
            
            <h2 className="text-3xl font-black text-white tracking-tight mb-4 leading-tight">
              Ca làm việc<br/>
              <span className="text-emerald-400">chưa mở.</span>
            </h2>
            <p className="text-slate-400 font-medium text-sm mb-10 leading-relaxed px-4">
              Vui lòng mở ca làm việc để bắt đầu thực hiện các hoạt động bán hàng.
            </p>

            <button 
              onClick={() => setShowModal(true)}
              className="w-full h-16 bg-white text-slate-900 rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-emerald-400 hover:text-white transition-all active:scale-95 group"
            >
              <Play className="w-5 h-5 group-hover:fill-current" />
              Mở ca mới
            </button>
          </motion.div>
        </div>

        <AnimatePresence>
          {showModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowModal(false)}
                className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
              />
              <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="relative bg-white rounded-[40px] p-10 max-w-md w-full shadow-2xl"
              >
                 <div className="flex items-center gap-4 mb-8">
                    <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center">
                       <CircleDollarSign className="text-slate-900 w-6 h-6" />
                    </div>
                    <div>
                       <h3 className="text-xl font-black text-slate-900">Số dư đầu ca</h3>
                       <p className="text-slate-400 text-xs font-bold uppercase tracking-widest leading-none">Vốn tiền mặt có sẵn</p>
                    </div>
                 </div>

                 <div className="space-y-6">
                    <div className="relative">
                      <input 
                        type="number"
                        value={openingBalance}
                        onChange={(e) => setOpeningBalance(Number(e.target.value))}
                        className="w-full h-20 bg-slate-50 rounded-3xl border-none text-4xl font-black text-slate-900 text-center focus:ring-4 focus:ring-emerald-500/20 transition-all placeholder:text-slate-200"
                        placeholder="0"
                      />
                      <span className="absolute top-1/2 -translate-y-1/2 left-6 text-slate-300 font-black text-xl">đ</span>
                    </div>

                    <button 
                      onClick={() => openShift(openingBalance)}
                      className="w-full h-16 bg-emerald-600 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-200 active:scale-95"
                    >
                      Bắt đầu bán hàng
                    </button>
                 </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return <>{children}</>;
};

export default ShiftGuard;
