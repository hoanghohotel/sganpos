import React, { useState, useEffect } from 'react';
import axios from 'axios';
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
      const response = await axios.get('/api/orders');
      const activeOrders = response.data.filter((o: Order) => o.status !== 'COMPLETED');
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
      await axios.patch(`/api/orders/${orderId}`, { status: newStatus });
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
    <div className="h-full flex flex-col bg-[#F5F5F0]">
      {/* Top Header */}
      <header className="p-6 bg-[#141414] text-white flex justify-between items-center shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#FF6321] rounded-full flex items-center justify-center">
            <ChefHat className="text-black" />
          </div>
          <div>
            <h1 className="text-xl font-bold uppercase tracking-tight">Điều Phối Nhà Bếp</h1>
            <p className="text-[10px] text-gray-400 uppercase tracking-widest flex items-center gap-1">
              <Clock size={10} /> Cập nhật lúc: {lastRefreshed.toLocaleTimeString('vi-VN')}
            </p>
          </div>
        </div>
        
        <div className="flex gap-4">
          <div className="flex flex-col items-end">
            <span className="text-2xl font-mono font-bold text-[#FF6321]">{orders.length}</span>
            <span className="text-[10px] text-gray-500 uppercase font-bold">Đơn hiện tại</span>
          </div>
        </div>
      </header>

      {/* Orders Grid */}
      <div className="flex-1 p-6 overflow-auto">
        {loading && orders.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-400">
            <div className="w-12 h-12 border-4 border-[#FF6321]/20 border-t-[#FF6321] rounded-full animate-spin mb-4" />
            <p className="italic serif">Đang tải đơn hàng...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-300">
            <CookingPot size={64} className="mb-4 opacity-10" />
            <p className="text-xl italic serif">Chưa có đơn hàng nào cần chế biến</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
            <AnimatePresence>
              {orders.map((order) => (
                <motion.div
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  key={order._id}
                  className={cn(
                    "flex flex-col bg-white rounded-2xl border-2 overflow-hidden shadow-sm transition-all",
                    order.status === 'PENDING' ? "border-[#FF6321] animate-pulse-subtle" : "border-transparent"
                  )}
                >
                  {/* Order Card Header */}
                  <div className="p-4 bg-gray-50 border-b flex justify-between items-center">
                    <div>
                      <span className="text-xs font-mono font-bold text-gray-400">#{order.orderNumber}</span>
                      <h3 className="font-bold">{order.orderType === 'TAKEAWAY' ? 'Mang Về' : 'Tại Chỗ'}</h3>
                    </div>
                    <div className={cn("px-2 py-1 rounded-full text-[10px] font-bold uppercase border", getStatusColor(order.status))}>
                      {getStatusLabel(order.status)}
                    </div>
                  </div>

                  {/* Order Items */}
                  <div className="flex-1 p-4 space-y-3">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-start">
                        <div className="flex gap-3">
                          <span className="w-6 h-6 rounded bg-gray-100 flex items-center justify-center font-mono font-bold text-xs">
                            {item.quantity}
                          </span>
                          <div>
                            <p className="font-bold text-sm leading-tight">{item.name}</p>
                            {item.notes && <p className="text-[10px] text-[#FF6321] italic mt-1 flex items-center gap-1"><AlertCircle size={10} /> {item.notes}</p>}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Order Card Footer */}
                  <div className="p-4 bg-gray-50 mt-auto border-t space-y-2">
                    <div className="flex justify-between items-center text-[10px] text-gray-400 uppercase font-bold tracking-tight">
                      <span>Đợi: {Math.floor((new Date().getTime() - new Date(order.createdAt).getTime()) / 60000)} phút</span>
                    </div>

                    <div className="flex gap-2">
                      {order.status === 'PENDING' && (
                        <button
                          onClick={() => updateStatus(order._id, 'PREPARING')}
                          className="flex-1 py-2 bg-black text-white rounded-xl text-xs font-bold uppercase transition-transform active:scale-95"
                        >
                          Chế biến ngay
                        </button>
                      )}
                      {(order.status === 'PREPARING' || order.status === 'PENDING') && (
                        <button
                          onClick={() => updateStatus(order._id, 'READY')}
                          className="flex-1 py-2 bg-[#FF6321] text-black rounded-xl text-xs font-bold uppercase transition-transform active:scale-95"
                        >
                          Hoàn thành
                        </button>
                      )}
                      {order.status === 'READY' && (
                        <button
                          onClick={() => updateStatus(order._id, 'COMPLETED')}
                          className="flex-1 py-2 bg-green-500 text-white rounded-xl text-xs font-bold uppercase flex items-center justify-center gap-2 transition-transform active:scale-95"
                        >
                          <CheckCircle size={14} /> Giao Sản Phẩm
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
          0%, 100% { opacity: 1; }
          50% { border-color: rgba(255, 99, 33, 0.5); }
        }
        .animate-pulse-subtle {
          animation: pulse-subtle 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
      `}</style>
    </div>
  );
};

export default KitchenPage;
