import React, { useState, useEffect } from 'react';
import api from '../lib/api';
import { CookingPot, CheckCircle, Clock, ChefHat, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useSocket } from '../hooks/useSocket.ts';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface OrderItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  notes?: string;
}

interface Order {
  _id: string;
  orderNumber: string;
  orderType: string;
  items: OrderItem[];
  total: number;
  status: 'PENDING' | 'PREPARING' | 'READY' | 'COMPLETED';
  createdAt: string;
}

const KitchenPage = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());

  const fetchOrders = async () => {
    try {
      const response = await api.get('/api/orders');
      const data = Array.isArray(response.data) ? response.data : [];
      const activeOrders = data.filter((o: Order) => o.status !== 'COMPLETED');
      setOrders(activeOrders);
      setLastRefreshed(new Date());
    } catch (error) {
      console.error('Lỗi khi lấy danh sách đơn hàng:', error);
    } finally {
      setLoading(false);
    }
  };

  // 🔥 REALTIME: Listen for new orders and updates
  useSocket((event, data) => {
    console.log(`[Socket] Received ${event}:`, data);
    if (event === 'order:new') {
      setOrders(prev => [data, ...prev]);
    } else if (event === 'order:update') {
      setOrders(prev => {
        if (data.status === 'COMPLETED') {
          return prev.filter(o => o._id !== data._id);
        }
        return prev.map(o => o._id === data._id ? data : o);
      });
    }
  });

  useEffect(() => {
    fetchOrders();
    // No more setInterval polling!
  }, []);

  const updateStatus = async (orderId: string, newStatus: string) => {
    try {
      await api.patch(`/api/orders/${orderId}`, { status: newStatus });
      fetchOrders();
    } catch (error) {
      console.error('Lỗi khi cập nhật trạng thái:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-red-100 text-red-600 border-red-200';
      case 'PREPARING': return 'bg-orange-100 text-orange-600 border-orange-200';
      case 'READY': return 'bg-green-100 text-green-600 border-green-200';
      default: return 'bg-gray-100 text-gray-600 border-gray-200';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'PENDING': return 'Đang Chờ';
      case 'PREPARING': return 'Đang Làm';
      case 'READY': return 'Sẵn Sàng';
      default: return status;
    }
  };

  return (
    <div className="h-full flex flex-col bg-[#F8FAFC]">
      {/* Top Header */}
      <header className="p-6 bg-white border-b border-slate-200 flex justify-between items-center shadow-sm z-10">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-100">
            <img src="/logo.svg" alt="Logo" className="w-10 h-10" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Khu vực Nhà Bếp</h1>
            <p className="text-xs text-slate-400 uppercase tracking-widest flex items-center gap-1 font-bold">
              <Clock size={12} className="text-emerald-500" /> Cập nhật: {lastRefreshed.toLocaleTimeString('vi-VN')}
            </p>
          </div>
        </div>
        
        <div className="bg-slate-50 px-6 py-2 rounded-2xl border border-slate-100 flex items-center gap-4">
          <div className="flex flex-col">
            <span className="text-2xl font-black text-emerald-600 leading-none">{orders.length}</span>
            <span className="text-[10px] text-slate-400 uppercase font-black tracking-tighter">Đơn chờ</span>
          </div>
        </div>
      </header>

      {/* Orders Grid */}
      <div className="flex-1 p-8 overflow-auto">
        {loading && orders.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-300">
            <div className="w-12 h-12 border-4 border-emerald-100 border-t-emerald-600 rounded-full animate-spin mb-4" />
            <p className="text-sm font-medium">Đang đồng bộ đơn hàng...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-200">
            <CookingPot size={80} className="mb-4 opacity-50" />
            <p className="text-lg font-bold text-slate-400">Không có đơn hàng nào cần xử lý</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            <AnimatePresence>
              {orders.map((order) => (
                <motion.div
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  key={order._id}
                  className={cn(
                    "flex flex-col bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden transition-all",
                    order.status === 'PENDING' ? "ring-2 ring-emerald-500 ring-offset-4 animate-pulse-subtle bg-emerald-50/10" : ""
                  )}
                >
                  {/* Order Card Header */}
                  <div className="p-5 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
                    <div>
                      <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">#{order.orderNumber}</span>
                      <h3 className="font-bold text-slate-800">{order.orderType === 'TAKEAWAY' ? 'Mang Về' : 'Tại Chỗ'}</h3>
                    </div>
                    <div className={cn("px-3 py-1 rounded-full text-[10px] font-black uppercase border-2", 
                      order.status === 'PENDING' ? "bg-white text-emerald-600 border-emerald-100" : 
                      order.status === 'PREPARING' ? "bg-orange-50 text-orange-600 border-orange-100" : 
                      "bg-blue-50 text-blue-600 border-blue-100"
                    )}>
                      {getStatusLabel(order.status)}
                    </div>
                  </div>

                  {/* Order Items */}
                  <div className="flex-1 p-5 space-y-4">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="flex gap-4">
                        <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center font-bold text-emerald-600">
                          {item.quantity}
                        </div>
                        <div className="flex-1">
                          <p className="font-bold text-slate-900 leading-tight">{item.name}</p>
                          {item.notes && (
                            <div className="mt-1 flex items-center gap-1 p-2 bg-emerald-50 rounded-lg">
                               <AlertCircle size={10} className="text-emerald-500" />
                               <p className="text-[10px] text-emerald-700 font-medium">{item.notes}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Order Card Footer */}
                  <div className="p-5 bg-slate-50/30 mt-auto border-t border-slate-50 flex flex-col gap-4">
                    <div className="flex justify-between items-center text-[10px] text-slate-400 uppercase font-black tracking-widest">
                      <span className="flex items-center gap-1"><Clock size={10} /> Đợi: {Math.floor((new Date().getTime() - new Date(order.createdAt).getTime()) / 60000)} phút</span>
                    </div>

                    <div className="flex gap-2">
                      {order.status === 'PENDING' && (
                        <button
                          onClick={() => updateStatus(order._id, 'PREPARING')}
                          className="flex-1 py-3 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition-colors"
                        >
                          Bắt đầu làm
                        </button>
                      )}
                      {(order.status === 'PREPARING' || order.status === 'PENDING') && (
                        <button
                          onClick={() => updateStatus(order._id, 'READY')}
                          className="flex-1 py-3 bg-emerald-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-700 shadow-lg shadow-emerald-100 transition-all"
                        >
                          Xong món
                        </button>
                      )}
                      {order.status === 'READY' && (
                        <button
                          onClick={() => updateStatus(order._id, 'COMPLETED')}
                          className="flex-1 py-3 bg-white border-2 border-emerald-600 text-emerald-600 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-emerald-50 transition-colors"
                        >
                          <CheckCircle size={12} /> Đã Giao
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      <style>{`
        @keyframes pulse-subtle {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { border-color: #059669; }
        }
        .animate-pulse-subtle {
          animation: pulse-subtle 2.5s infinite;
        }
      `}</style>
    </div>
  );
};

export default KitchenPage;
