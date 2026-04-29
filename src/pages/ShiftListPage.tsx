import { IonPage, IonContent } from '@ionic/react';
import React, { useState, useEffect } from 'react';
// ... rest of imports
import { motion, AnimatePresence } from 'motion/react';
import { History, Search, Calendar, ChevronRight, X, DollarSign, Package, Clock, User, Coffee as CoffeeIcon, Printer } from 'lucide-react';
import api from '../lib/api';
import { cn } from '../lib/utils';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { printOrder } from '../lib/printing';

interface ShiftItem {
  _id: string;
  code: string;
  userName: string;
  startTime: string;
  endTime?: string;
  status: 'OPEN' | 'CLOSED';
  totalSales: number;
  openingBalance: number;
  closingBalance?: number;
}

interface OrderItem {
  _id: string;
  orderNumber: string;
  total: number;
  paymentMethod: string;
  createdAt: string;
  status: string;
  tableId?: { name: string };
  orderType: string;
}

const ShiftListPage = () => {
  const [shifts, setShifts] = useState<ShiftItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedShift, setSelectedShift] = useState<any>(null);
  const [shiftOrders, setShiftOrders] = useState<OrderItem[]>([]);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [settings, setSettings] = useState<any>(null);

  const fetchShifts = async () => {
    try {
      setLoading(true);
      const [shiftsRes, settingsRes] = await Promise.all([
        api.get('/api/shifts'),
        api.get('/api/settings')
      ]);
      setShifts(shiftsRes.data.shifts);
      setSettings(settingsRes.data);
    } catch (error) {
      console.error('Failed to fetch shifts:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShifts();
  }, []);

  const handleViewDetails = async (shift: ShiftItem) => {
    try {
      setSelectedShift(shift);
      setLoadingDetails(true);
      setShiftOrders([]);
      
      const ordersRes = await api.get(`/api/shifts/${shift._id}/orders`);
      setShiftOrders(ordersRes.data);
      
      // Also fetch full detail to get productSales if needed (though it might already be in list)
      const detailRes = await api.get(`/api/shifts/${shift._id}`);
      setSelectedShift(detailRes.data);
    } catch (error) {
      console.error('Failed to fetch shift details:', error);
    } finally {
      setLoadingDetails(false);
    }
  };

  const filteredShifts = shifts.filter(s => 
    s.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.userName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <IonPage>
      <IonContent>
        <div className="h-full flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-800">
      {/* Header */}
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-8 py-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Danh sách ca</h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium tracking-tight">Quản lý lịch sử và doanh thu theo ca</p>
        </div>
        
        <div className="relative w-80">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input 
            type="text"
            placeholder="Tìm theo mã ca hoặc nhân viên..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-12 pl-12 pr-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none font-medium transition-all text-slate-900 dark:text-white"
          />
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 overflow-auto p-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {loading ? (
            Array(6).fill(0).map((_, i) => (
              <div key={i} className="h-48 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 animate-pulse" />
            ))
          ) : filteredShifts.length > 0 ? (
            filteredShifts.map((shift) => (
              <motion.div
                key={shift._id}
                whileHover={{ y: -4, shadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }}
                onClick={() => handleViewDetails(shift)}
                className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 cursor-pointer transition-all border-l-8 border-l-transparent hover:border-l-emerald-500 group shadow-sm"
              >
                <div className="flex justify-between items-start mb-6">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-12 h-12 rounded-2xl flex items-center justify-center",
                      shift.status === 'OPEN' ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-600"
                    )}>
                      <History className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-black text-slate-900 dark:text-white tracking-tight leading-none mb-1">
                        CA-{shift.code || 'N/A'}
                      </h3>
                      <span className={cn(
                        "text-[10px] uppercase font-black tracking-widest px-2 py-0.5 rounded-full",
                        shift.status === 'OPEN' ? "bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300" : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                      )}>
                        {shift.status === 'OPEN' ? 'Đang mở' : 'Đã đóng'}
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-300 dark:text-slate-700 group-hover:text-emerald-500 transition-colors" />
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="space-y-1">
                    <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block">Nhân viên</span>
                    <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 font-bold">
                      <User className="w-3.5 h-3.5" />
                      {shift.userName}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block">Doanh thu</span>
                    <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-black">
                      <DollarSign className="w-3.5 h-3.5" />
                      {shift.totalSales?.toLocaleString('vi-VN')}đ
                    </div>
                  </div>
                </div>

                <div className="space-y-2 pt-4 border-t border-slate-100 dark:border-slate-800/50">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" />
                      {format(new Date(shift.startTime), 'HH:mm dd/MM', { locale: vi })}
                    </div>
                    {shift.endTime && (
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 rotate-180" />
                        {format(new Date(shift.endTime), 'HH:mm dd/MM', { locale: vi })}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="col-span-full h-96 flex flex-col items-center justify-center text-slate-400">
              <History className="w-20 h-20 mb-4 opacity-10" />
              <p className="font-black uppercase tracking-widest text-sm">Không tìm thấy ca nào</p>
            </div>
          )}
        </div>
      </div>

      {/* Details Modal */}
      <AnimatePresence>
        {selectedShift && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 lg:p-8">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedShift(null)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-5xl h-full max-h-[85vh] bg-white rounded-[40px] shadow-2xl flex flex-col overflow-hidden"
            >
              <div className="flex flex-col lg:flex-row h-full">
                {/* Statistics Sidebar */}
                <div className="w-full lg:w-80 bg-slate-50 border-r border-slate-200 p-8 flex flex-col">
                  <div className="flex justify-between items-start mb-8 lg:hidden">
                     <h2 className="text-2xl font-black text-slate-900">Chi tiết ca</h2>
                     <button onClick={() => setSelectedShift(null)} className="p-2 bg-slate-200 rounded-full"><X className="w-5 h-5"/></button>
                  </div>

                  <div className="hidden lg:block mb-10">
                    <span className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.2em] block mb-2">Thông tin ca</span>
                    <h2 className="text-4xl font-black text-slate-900 tracking-tighter">CA-{selectedShift.code}</h2>
                  </div>

                  <div className="space-y-6 flex-1">
                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Doanh thu chốt ca</label>
                      <div className="text-3xl font-black text-emerald-600 tracking-tight">
                        {selectedShift.totalSales?.toLocaleString('vi-VN')}đ
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Tổng tiền hóa đơn</label>
                      <div className="text-xl font-black text-slate-900 tracking-tight">
                        {shiftOrders.reduce((sum, o) => sum + o.total, 0).toLocaleString('vi-VN')}đ
                      </div>
                      <p className="text-[9px] font-bold text-slate-400 uppercase mt-1 italic">
                        {shiftOrders.filter(o => o.status === 'COMPLETED').length} hoàn tất / {shiftOrders.length} đơn hàng
                      </p>
                    </div>

                    <div>
                      <label className="text-[10px] font-black text-emerald-600 uppercase tracking-widest block mb-1">Doanh thu chốt ca (Đã thu)</label>
                      <div className="text-xl font-black text-emerald-600 tracking-tight">
                        {shiftOrders
                          .filter(o => o.paymentStatus === 'PAID')
                          .reduce((sum, o) => sum + o.total, 0)
                          .toLocaleString('vi-VN')}đ
                      </div>
                      <p className="text-[9px] font-bold text-emerald-500 uppercase mt-1 italic">
                        {shiftOrders.filter(o => o.paymentStatus === 'PAID').length} đơn đã thanh toán
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 bg-white rounded-2xl border border-slate-200">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Tiền mặt</label>
                        <div className="font-bold text-slate-900">{selectedShift.cashSales?.toLocaleString('vi-VN')}đ</div>
                      </div>
                      <div className="p-4 bg-white rounded-2xl border border-slate-200">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Chuyển khoản</label>
                        <div className="font-bold text-slate-900">{selectedShift.transferSales?.toLocaleString('vi-VN')}đ</div>
                      </div>
                    </div>

                    <div className="p-6 bg-emerald-600 rounded-3xl text-white">
                      <div className="flex items-center gap-3 mb-4 opacity-80 uppercase text-[10px] font-black tracking-widest">
                        <Calendar className="w-4 h-4" />
                        Thời gian
                      </div>
                      <div className="space-y-3">
                        <div>
                          <span className="text-[10px] font-black uppercase opacity-60">Bắt đầu</span>
                          <div className="font-bold">{format(new Date(selectedShift.startTime), 'HH:mm - dd/MM/yyyy')}</div>
                        </div>
                        {selectedShift.endTime && (
                          <div>
                            <span className="text-[10px] font-black uppercase opacity-60">Kết thúc</span>
                            <div className="font-bold">{format(new Date(selectedShift.endTime), 'HH:mm - dd/MM/yyyy')}</div>
                          </div>
                        )}
                      </div>
                    </div>

                    {selectedShift.notes && (
                      <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100">
                        <label className="text-[10px] font-black text-amber-600 uppercase tracking-widest block mb-1">Ghi chú</label>
                        <p className="text-sm text-amber-800 font-medium italic">"{selectedShift.notes}"</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Orders List Content */}
                <div className="flex-1 flex flex-col bg-white dark:bg-slate-900 overflow-hidden">
                  <header className="p-8 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                    <div>
                      <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight uppercase">Danh sách đơn hàng</h3>
                      <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mt-1">
                        {shiftOrders.length} Giao dịch trong ca này
                      </p>
                    </div>
                    <button 
                      onClick={() => setSelectedShift(null)}
                      className="hidden lg:flex w-12 h-12 bg-slate-50 dark:bg-slate-800 text-slate-400 rounded-2xl items-center justify-center hover:bg-rose-50 dark:hover:bg-rose-500/10 hover:text-rose-500 transition-all group"
                    >
                      <X className="w-6 h-6 group-hover:rotate-90 transition-transform" />
                    </button>
                  </header>

                  <div className="flex-1 overflow-auto p-8">
                    {loadingDetails ? (
                      <div className="flex flex-col items-center justify-center h-full gap-4 text-slate-300 dark:text-slate-700">
                        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}>
                          <History className="w-12 h-12" />
                        </motion.div>
                        <span className="font-black uppercase tracking-[0.2em] text-[10px]">Đang tải đơn hàng...</span>
                      </div>
                    ) : shiftOrders.length > 0 ? (
                      <div className="space-y-4">
                        <div className="grid grid-cols-5 px-6 py-2 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                          <div>Đơn / Món</div>
                          <div>Bàn / Loại</div>
                          <div>Thời gian</div>
                          <div>Thanh toán</div>
                          <div className="text-right">Tổng tiền</div>
                        </div>
                        {shiftOrders.map((order) => (
                          <div 
                            key={order._id}
                            className="flex flex-col bg-slate-50 dark:bg-slate-800/50 hover:bg-emerald-50 dark:hover:bg-emerald-500/5 rounded-3xl transition-colors group cursor-default p-6 border border-transparent hover:border-emerald-100 dark:hover:border-emerald-900"
                          >
                            <div className="grid grid-cols-5 items-center">
                              <div className="flex flex-col">
                                <span className="font-black text-slate-900 dark:text-white text-sm">#{order.orderNumber}</span>
                                <span className={cn(
                                  "text-[9px] font-black uppercase tracking-widest w-fit",
                                  order.status === 'COMPLETED' ? "text-emerald-500" : "text-amber-500"
                                )}>
                                  {order.status === 'COMPLETED' ? 'Hoàn thành' : 'Đang xử lý'}
                                </span>
                              </div>
                              <div className="text-xs font-bold text-slate-600 dark:text-slate-400">
                                {order.tableId?.name || (order.orderType === 'TAKEAWAY' ? 'Mang về' : 'Ship')}
                              </div>
                              <div className="text-xs font-bold text-slate-500 dark:text-slate-500">
                                {format(new Date(order.createdAt), 'HH:mm:ss')}
                              </div>
                              <div>
                                 <span className={cn(
                                   "text-[10px] font-black px-2 py-1 rounded-full uppercase tracking-widest",
                                   order.paymentMethod === 'CASH' ? "bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400" : "bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400"
                                 )}>
                                   {order.paymentMethod === 'CASH' ? 'Tiền mặt' : 'Chuyển khoản'}
                                 </span>
                              </div>
                              <div className="flex items-center justify-end gap-4">
                                <div className="text-right font-black text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                                  {order.total.toLocaleString('vi-VN')}đ
                                </div>
                                {order.status === 'COMPLETED' && (
                                  <button 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      printOrder({
                                        orderCode: order.orderNumber,
                                        tableName: order.tableId?.name || (order.orderType === 'TAKEAWAY' ? 'Mang về' : 'Ship'),
                                        items: (order as any).items || [],
                                        subtotal: order.total,
                                        total: order.total,
                                        paymentMethod: order.paymentMethod,
                                        createdAt: order.createdAt
                                      }, settings);
                                    }}
                                    className="w-10 h-10 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-400 rounded-xl flex items-center justify-center hover:bg-emerald-50 dark:hover:bg-emerald-500/10 hover:text-emerald-600 transition-all shadow-sm"
                                    title="In lại hóa đơn"
                                  >
                                    <Printer size={18} />
                                  </button>
                                )}
                              </div>
                            </div>

                            {/* Order Items Detail */}
                            <div className="mt-4 pt-4 border-t border-slate-200/50 dark:border-slate-800 space-y-2">
                              {(order as any).items?.map((item: any, iIdx: number) => (
                                <div key={iIdx} className="flex justify-between items-center text-[11px]">
                                  <div className="flex items-center gap-2">
                                    <div className="w-5 h-5 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center font-black text-emerald-600">
                                      {item.quantity}
                                    </div>
                                    <span className="font-bold text-slate-700 dark:text-slate-300 uppercase tracking-tight">{item.name}</span>
                                  </div>
                                  <span className="font-mono text-slate-400 dark:text-slate-500">{(item.price * item.quantity).toLocaleString('vi-VN')}đ</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full opacity-20">
                        <Package className="w-20 h-20 mb-4" />
                        <span className="font-black uppercase tracking-[0.2em]">Chưa có đơn hàng nào</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
    </IonContent>
  </IonPage>
  );
};

export default ShiftListPage;
