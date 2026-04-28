import React, { useState, useEffect } from 'react';
import api from '../lib/api';
import { CookingPot, CheckCircle, Clock, ChefHat, AlertCircle, Bell, Volume2, VolumeX } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useSocket } from '../hooks/useSocket';
import { cn } from '@/lib/utils';

interface OrderItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  notes?: string;
}

interface Table {
  _id: string;
  name: string;
}

interface Order {
  _id: string;
  orderNumber: string;
  orderType: string;
  tableId?: string;
  items: OrderItem[];
  total: number;
  status: 'PENDING' | 'PREPARING' | 'READY' | 'DELIVERED' | 'COMPLETED';
  createdAt: string;
}

const KitchenPage = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [tables, setTables] = useState<Table[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());
  const [isNotificationsEnabled, setIsNotificationsEnabled] = useState(true);
  const [isRinging, setIsRinging] = useState(false);

  useEffect(() => {
    // Request notification permission on mount
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  const showNotification = (order: any) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(`Đơn mới từ ${order.table?.name || 'Mang về'}`, {
        body: `${order.items.length} món • ${order.total.toLocaleString('vi-VN')}đ`,
        icon: '/favicon.ico'
      });
    }
  };

  const fetchInitialData = async () => {
    try {
      const [orderRes, tableRes] = await Promise.all([
        api.get('/api/orders'),
        api.get('/api/tables')
      ]);
      
      const orderData = Array.isArray(orderRes.data) ? orderRes.data : [];
      // Kho chỉ hiện các đơn chưa hoàn thành (COMPLETED = Da thanh toan)
      const activeOrders = orderData.filter((o: Order) => o.status !== 'COMPLETED');
      setOrders(activeOrders);
      
      setTables(Array.isArray(tableRes.data) ? tableRes.data : []);
      setLastRefreshed(new Date());
    } catch (error) {
      console.error('Lỗi khi lấy dữ liệu nhà bếp:', error);
    } finally {
      setLoading(false);
    }
  };

  const [audio] = useState(new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3'));

  // 🔥 REALTIME: Listen for new orders and updates
  useSocket((event, data) => {
    console.log(`[Socket] Received ${event}:`, data);
    if (event === 'order:new') {
      setOrders(prev => [data, ...prev]);
      
      // Browser Push Notification
      showNotification(data);

      // Play ding-dong sound
      if (isNotificationsEnabled) {
        audio.currentTime = 0;
        audio.play().catch(e => console.log('Audio play blocked:', e));
      }
      // Ring the bell
      setIsRinging(true);
      setTimeout(() => setIsRinging(false), 3000);
    } else if (event === 'order:update') {
      setOrders(prev => {
        if (data.status === 'COMPLETED' || data.deleted) {
          return prev.filter(o => o._id !== data._id);
        }
        return prev.map(o => o._id === data._id ? data : o);
      });
    }
  });

  useEffect(() => {
    fetchInitialData();
  }, []);

  const updateStatus = async (orderId: string, newStatus: string) => {
    try {
      await api.patch(`/api/orders/${orderId}`, { status: newStatus });
      fetchInitialData();
    } catch (error) {
      console.error('Lỗi khi cập nhật trạng thái:', error);
    }
  };

  const getTableName = (tableId?: string) => {
    if (!tableId) return 'Mang Về/Giao Hàng';
    const table = tables.find(t => t._id === tableId);
    return table ? table.name : `Bàn ${tableId.slice(-4)}`;
  };

  // Grouping logic
  const groupedOrders = orders.reduce((acc: Record<string, Order[]>, order) => {
    const key = order.tableId || `order-${order._id}`; // Group by tableId if exists, else individual for takeaway
    if (!acc[key]) acc[key] = [];
    acc[key].push(order);
    return acc;
  }, {});

  const pendingCount = orders.filter(o => o.status === 'PENDING').length;
  const preparingCount = orders.filter(o => o.status === 'PREPARING').length;

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
      case 'DELIVERED': return 'Đã Giao';
      case 'COMPLETED': return 'Hoàn Thành';
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
        
        <div className="flex gap-4 items-center">
          <button 
            onClick={() => {
              setIsNotificationsEnabled(!isNotificationsEnabled);
              if (!isNotificationsEnabled) {
                audio.play().catch(() => {});
              }
            }}
            className={cn(
              "p-3 rounded-xl border transition-all flex items-center gap-2",
              isNotificationsEnabled 
                ? "bg-emerald-50 border-emerald-200 text-emerald-600" 
                : "bg-slate-50 border-slate-200 text-slate-400"
            )}
          >
            {isNotificationsEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
            <span className="text-xs font-black uppercase tracking-widest">
              {isNotificationsEnabled ? 'Âm thanh: Bật' : 'Âm thanh: Tắt'}
            </span>
          </button>

          <motion.div 
            animate={isRinging ? {
              rotate: [0, -15, 15, -15, 15, -10, 10, -5, 5, 0],
              scale: [1, 1.2, 1.2, 1.2, 1.2, 1.1, 1.1, 1, 1, 1]
            } : { rotate: 0, scale: 1 }}
            transition={{ duration: 1.5, ease: "easeInOut" }}
            className={cn(
              "w-12 h-12 rounded-xl flex items-center justify-center border transition-colors",
              isRinging ? "bg-rose-500 text-white border-rose-400 shadow-lg shadow-rose-200" : "bg-white text-slate-400 border-slate-100"
            )}
          >
            <Bell size={24} className={isRinging ? "animate-pulse" : ""} />
          </motion.div>

          <div className="bg-slate-50 px-6 py-2 rounded-2xl border border-slate-100 flex items-center gap-4">
            <div className="flex flex-col text-center">
              <span className="text-2xl font-black text-rose-600 leading-none">{pendingCount}</span>
              <span className="text-xs text-slate-400 uppercase font-black tracking-tighter">Mới</span>
            </div>
            <div className="w-px h-8 bg-slate-200" />
            <div className="flex flex-col text-center">
              <span className="text-2xl font-black text-orange-600 leading-none">{preparingCount}</span>
              <span className="text-xs text-slate-400 uppercase font-black tracking-tighter">Đang làm</span>
            </div>
            <div className="w-px h-8 bg-slate-200" />
            <div className="flex flex-col text-center">
              <span className="text-2xl font-black text-emerald-600 leading-none">{orders.length}</span>
              <span className="text-xs text-slate-400 uppercase font-black tracking-tighter">Tổng đơn</span>
            </div>
          </div>
        </div>
      </header>

      {/* Orders Grid grouped by Table */}
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 items-start">
            <AnimatePresence>
              {(Object.entries(groupedOrders) as [string, Order[]][]).map(([groupKey, groupOrders]) => {
                const tableId = groupOrders[0].tableId;
                const tableName = getTableName(tableId);
                const isNew = groupOrders.some(o => o.status === 'PENDING');
                const oldestOrder = groupOrders[0];

                return (
                  <motion.div
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    key={groupKey}
                    className={cn(
                      "flex flex-col bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden transition-all",
                      isNew ? "ring-2 ring-rose-500 ring-offset-4 bg-rose-50/5 animate-pulse-subtle" : ""
                    )}
                  >
                    {/* Header: Table Info */}
                    <div className="p-5 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
                      <div>
                        <h3 className="font-black text-slate-900 uppercase tracking-tighter text-xl italic">{tableName}</h3>
                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest leading-none mt-1">
                          {groupOrders.length} Yêu cầu • <Clock size={10} className="inline mb-0.5" /> {Math.floor((new Date().getTime() - new Date(oldestOrder.createdAt).getTime()) / 60000)}p
                        </p>
                      </div>
                      {isNew && (
                        <div className="px-3 py-1 rounded-full bg-rose-500 text-white text-xs font-black uppercase tracking-widest animate-bounce">
                          Mới
                        </div>
                      )}
                    </div>

                    {/* All items for this table/group (Consolidated) */}
                    <div className="p-5 space-y-6 max-h-[400px] overflow-auto no-scrollbar">
                      {(() => {
                        const allItems: any[] = [];
                        groupOrders.forEach(order => {
                          order.items.forEach(item => {
                            const existing = allItems.find(i => 
                              i.productId === item.productId && 
                              i.notes === item.notes && 
                              i.status === order.status
                            );
                            if (existing) {
                              existing.quantity += item.quantity;
                            } else {
                              allItems.push({ ...item, status: order.status });
                            }
                          });
                        });

                        return (
                          <div className="space-y-4">
                            {allItems.map((item, iIdx) => {
                              const isFinished = item.status === 'READY' || item.status === 'DELIVERED';
                              const isNew = item.status === 'PENDING';
                              return (
                                <div key={iIdx} className={cn(
                                  "flex gap-3 items-start transition-all",
                                  isFinished ? "opacity-50" : ""
                                )}>
                                  <div className={cn(
                                    "w-7 h-7 shrink-0 rounded-lg flex items-center justify-center font-black text-xs",
                                    isFinished ? "bg-slate-100 text-slate-400" : "bg-emerald-100 text-emerald-600 shadow-sm"
                                  )}>
                                    {item.quantity}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className={cn(
                                      "font-bold text-sm uppercase tracking-tighter transition-all",
                                      isFinished ? "text-slate-400 line-through decoration-2" : "text-slate-900",
                                      isNew ? "text-rose-600 scale-105 origin-left" : ""
                                    )}>
                                      {item.name}
                                      {isNew && <span className="ml-2 text-[10px] px-1.5 py-0.5 bg-rose-500 text-white rounded-md tracking-widest animate-pulse">MỚI</span>}
                                    </p>
                                    {item.notes && (
                                      <p className="text-xs text-rose-500 font-bold mt-0.5 italic flex items-center gap-1">
                                        <AlertCircle size={10} /> {item.notes}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        );
                      })()}

                      {/* Order Actions */}
                      <div className="mt-4 space-y-2">
                        {groupOrders.map(order => (
                          <div key={order._id} className="flex items-center justify-between border-t border-slate-50 pt-2 first:border-0 first:pt-0">
                            <span className="text-xs font-black text-slate-400 uppercase tracking-widest">#{order.orderNumber}</span>
                            <div className="flex gap-2">
                              {order.status === 'PENDING' && (
                                <button
                                  onClick={() => updateStatus(order._id, 'PREPARING')}
                                  className="px-3 py-1 bg-slate-900 text-white rounded-lg text-[10px] font-black uppercase tracking-widest"
                                >
                                  Làm
                                </button>
                              )}
                              {(order.status === 'PREPARING' || order.status === 'PENDING') && (
                                <button
                                  onClick={() => updateStatus(order._id, 'READY')}
                                  className="px-3 py-1 bg-emerald-600 text-white rounded-lg text-[10px] font-black uppercase tracking-widest"
                                >
                                  Xong
                                </button>
                              )}
                              {order.status === 'READY' && (
                                <button
                                  onClick={() => updateStatus(order._id, 'DELIVERED')}
                                  className="px-3 py-1 bg-white border border-emerald-600 text-emerald-600 rounded-lg text-[10px] font-black uppercase tracking-widest"
                                >
                                  Giao
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
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
