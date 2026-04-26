import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../lib/api';
import axios from 'axios';
import { ShoppingCart, Plus, Minus, Coffee, CheckCircle2, Info, Search, History, X, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface Product {
  _id: string;
  name: string;
  basePrice: number;
  category: string;
  image?: string;
}

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

interface TableInfo {
  _id: string;
  name: string;
  status?: string;
  currentOrderId?: string;
}

const CustomerOrderPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const tableId = searchParams.get('tableId');
  
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('Tất cả');
  const [table, setTable] = useState<TableInfo | null>(null);
  const [settings, setSettings] = useState<any>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [activeOrder, setActiveOrder] = useState<any>(null);
  const [showActiveOrderModal, setShowActiveOrderModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [loading, setLoading] = useState(true);
  const [ordering, setOrdering] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!tableId) {
      setError('Vui lòng quét mã QR tại bàn để gọi món.');
      setLoading(false);
      return;
    }
    fetchData();

    window.addEventListener('focus', fetchData);
    return () => window.removeEventListener('focus', fetchData);
  }, [tableId]);

  const getOrderTypeFromTableName = (name: string) => {
    if (name.startsWith('Mang về')) return 'TAKEAWAY';
    if (name.startsWith('Ship')) return 'DELIVERY';
    return 'DINE_IN';
  };

  const fetchData = async () => {
    try {
      const [prodRes, tableRes, setRes, allTablesRes] = await Promise.all([
        api.get('/api/products'),
        api.get(`/api/tables/${tableId}`),
        api.get('/api/settings'),
        api.get('/api/tables')
      ]);

      const productsData = Array.isArray(prodRes.data) ? prodRes.data : [];
      setProducts(productsData);
      setSettings(setRes.data);
      
      const targetTable = tableRes.data;
      
      // Auto-redirection for Takeaway/Ship slots if current is occupied
      const currentOrderType = getOrderTypeFromTableName(targetTable.name);
      if ((currentOrderType === 'TAKEAWAY' || currentOrderType === 'DELIVERY') && targetTable.status === 'OCCUPIED') {
        const allTables = Array.isArray(allTablesRes.data) ? allTablesRes.data : [];
        const prefix = currentOrderType === 'TAKEAWAY' ? 'Mang về' : 'Ship';
        const emptySlot = allTables.find((t: any) => t.name.startsWith(prefix) && t.status === 'EMPTY');
        
        if (emptySlot && emptySlot._id !== tableId) {
          console.log(`Slot ${targetTable.name} đang bận, chuyển hướng sang ${emptySlot.name}`);
          setSearchParams({ tableId: emptySlot._id });
          return;
        }
      }

      setTable(targetTable);

      if (targetTable.status === 'OCCUPIED' && targetTable._id) {
        try {
          const orderRes = await api.get(`/api/orders`);
          const allOrders = Array.isArray(orderRes.data) ? orderRes.data : [];
          // Lọc tất cả đơn hàng chưa hoàn thành của bàn này
          const tableOrders = allOrders.filter((o: any) => o.tableId === targetTable._id && o.status !== 'COMPLETED');
          
          if (tableOrders.length > 0) {
            // Aggregate items for display in the modal
            const aggregatedOrder = {
              orderNumber: tableOrders.length > 1 ? 'Nhiều đơn' : tableOrders[0].orderNumber,
              items: tableOrders.flatMap(o => o.items),
              total: tableOrders.reduce((sum, o) => sum + o.total, 0),
              status: tableOrders.some(o => o.status === 'PENDING') ? 'PENDING' : 
                      tableOrders.some(o => o.status === 'PREPARING') ? 'PREPARING' :
                      tableOrders.every(o => o.status === 'READY') ? 'READY' : 'DELIVERED'
            };
            setActiveOrder(aggregatedOrder);
          } else {
            setActiveOrder(null);
          }
        } catch (err) {
          console.error('Lỗi khi lấy thông tin đơn hàng:', err);
        }
      } else {
        setActiveOrder(null);
      }
      
      const rawCategories = productsData.map((p: any) => p.category).filter(Boolean);
      const uniqueCats = Array.from(new Set(rawCategories as string[]));
      const cats: string[] = ['Tất cả', ...uniqueCats.filter(c => c !== 'Tất cả')];
      setCategories(cats);
    } catch (err) {
      console.error(err);
      setError('Không thể kết nối với cửa hàng. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const addToCart = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === product._id);
      if (existing) {
        return prev.map((item) =>
          item.id === product._id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { id: product._id, name: product.name, price: product.basePrice, quantity: 1 }];
    });
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) =>
          item.id === id ? { ...item, quantity: Math.max(0, item.quantity + delta) } : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const handleCheckout = async () => {
    if (cart.length === 0 || !tableId || !table) return;
    setOrdering(true);
    try {
      const orderData = {
        orderType: getOrderTypeFromTableName(table.name),
        tableId: tableId,
        items: cart.map((item) => ({
          productId: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
        })),
        subtotal: total,
        total: total,
      };

      await api.post('/api/orders', orderData);
      setCart([]);
      setOrderSuccess(true);
      setTimeout(() => setOrderSuccess(false), 5000);
      
      // Refresh table status
      fetchData();
    } catch (error: any) {
      const errorMsg = error.response?.data?.error || 'Lỗi khi gửi yêu cầu gọi món';
      alert(errorMsg);
    } finally {
      setOrdering(false);
    }
  };

  const filteredProducts = products.filter(p => {
    const matchesCategory = selectedCategory === 'Tất cả' || p.category === selectedCategory;
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-10 h-10 border-4 border-emerald-100 border-t-emerald-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-white text-center">
        <Info size={48} className="text-slate-300 mb-4" />
        <h2 className="text-xl font-bold text-slate-800 mb-2">{typeof error === 'string' ? error : JSON.stringify(error)}</h2>
        <p className="text-slate-500 text-sm italic">Cảm ơn bạn đã ghé thăm quán!</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col max-w-lg mx-auto shadow-2xl">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-slate-100 p-4 pt-6">
        <div className="flex justify-between items-center mb-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center overflow-hidden shadow-sm border border-emerald-100">
               <img src={settings?.logoUrl || "/logo.svg"} alt="Logo" className="w-full h-full object-contain p-2" />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900 leading-none tracking-tight uppercase">{settings?.storeName || 'SAIGON AN COFFEE'}</h1>
              <div className="flex items-center gap-1.5 mt-1.5">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">
                  Phục vụ tại {table?.name || 'Bàn của bạn'}
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {activeOrder && (
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => setShowActiveOrderModal(true)}
                className="relative p-2 bg-emerald-50 rounded-xl border border-emerald-100 text-emerald-600"
              >
                <History size={20} />
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white animate-pulse" />
              </motion.button>
            )}
            <motion.div 
              whileTap={{ scale: 0.9 }}
              className="relative p-2 bg-slate-50 rounded-xl border border-slate-100"
            >
             {cart.length > 0 && (
               <motion.div 
                 initial={{ scale: 0 }}
                 animate={{ scale: 1 }}
                 className="bg-emerald-600 text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center absolute -top-1.5 -right-1.5 border-2 border-white shadow-lg"
               >
                  {cart.reduce((s, i) => s + i.quantity, 0)}
               </motion.div>
             )}
             <ShoppingCart className="text-slate-600" size={20} />
            </motion.div>
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-5 group">
          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
            <Search size={18} className="text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
          </div>
          <input 
            type="text" 
            placeholder="Tìm món bạn thích..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-100/50 border-transparent border focus:border-emerald-500/30 focus:bg-white rounded-2xl pl-12 pr-4 py-3.5 text-sm transition-all focus:ring-4 focus:ring-emerald-500/10 placeholder:text-slate-400 font-medium"
          />
        </div>

        {/* Categories Bar */}
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide no-scrollbar">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={cn(
                "px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all whitespace-nowrap active:scale-95",
                selectedCategory === cat 
                  ? "bg-slate-900 border-slate-900 text-white shadow-xl shadow-slate-200" 
                  : "bg-white border-slate-100 text-slate-500 hover:bg-slate-50"
              )}
            >
              {cat}
            </button>
          ))}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-4 pb-32">
        {/* Banner (Optional) */}
        {selectedCategory === 'Tất cả' && !searchQuery && (
          <div className="mb-8 rounded-3xl bg-emerald-600 p-6 text-white relative overflow-hidden shadow-2xl shadow-emerald-200">
             <div className="relative z-10 w-2/3">
                <h2 className="text-xl font-black uppercase tracking-tighter mb-2 leading-none">Món mới <br/>trong ngày!</h2>
                <p className="text-[10px] uppercase font-black tracking-widest opacity-80">Giảm 10% khi đặt qua QR</p>
             </div>
             <Coffee className="absolute -right-4 -bottom-4 text-emerald-500/30 w-32 h-32 rotate-12" />
          </div>
        )}

        <div className="flex items-center justify-between mb-4 px-1">
           <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest">{selectedCategory === 'Tất cả' ? 'Danh sách Menu' : selectedCategory}</h2>
           <p className="text-[10px] font-bold text-slate-400 uppercase">{filteredProducts.length} món</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {filteredProducts.map((product, idx) => (
            <motion.div
              key={product._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="bg-white p-3.5 rounded-[28px] border border-slate-100 shadow-sm hover:shadow-xl transition-all group active:scale-[0.98]"
            >
              <div className="relative aspect-square bg-slate-50 rounded-2xl mb-4 overflow-hidden shadow-inner">
                {product.image ? (
                  <img src={product.image} alt={product.name} className="w-full h-full object-cover transition-transform group-hover:scale-110 duration-500" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-200">
                    <Coffee size={40} />
                  </div>
                )}
                {/* Overlay for quick action on desktop (hover) */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors" />
              </div>
              
              <div className="flex flex-col h-20">
                <h3 className="text-[11px] font-black text-slate-900 leading-tight mb-1 uppercase tracking-tight line-clamp-2">{product.name}</h3>
                <p className="text-[9px] font-black text-emerald-600/60 uppercase tracking-widest mt-auto">{product.category}</p>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs font-black text-slate-900">{product.basePrice.toLocaleString('vi-VN')}</span>
                  <motion.button 
                    whileTap={{ scale: 0.8 }}
                    onClick={() => addToCart(product)}
                    className="w-9 h-9 bg-emerald-600 text-white rounded-xl flex items-center justify-center shadow-lg shadow-emerald-200 active:bg-emerald-700 transition-colors"
                  >
                    <Plus size={18} />
                  </motion.button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
        
        {filteredProducts.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
             <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                <Search size={32} className="text-slate-300" />
             </div>
             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Không tìm thấy món "{searchQuery}"</p>
          </div>
        )}
      </main>

      {/* Cart Drawer */}
      <AnimatePresence>
        {cart.length > 0 && (
          <motion.div
            initial={{ y: 200 }}
            animate={{ y: 0 }}
            exit={{ y: 200 }}
            className="fixed bottom-0 left-0 right-0 max-w-lg mx-auto bg-white border-t border-slate-100 rounded-t-[40px] shadow-[0_-20px_50px_rgba(0,0,0,0.1)] p-8 z-40"
          >
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Đơn hàng của bạn</h3>
                <button onClick={() => setCart([])} className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-red-500 transition-colors">Xóa tất cả</button>
            </div>

            <div className="max-h-60 overflow-auto flex flex-col gap-3 mb-8 no-scrollbar">
               {cart.map(item => (
                 <div key={item.id} className="flex justify-between items-center p-4 bg-slate-50/50 rounded-2xl border border-slate-100">
                    <div className="flex flex-col">
                      <span className="text-xs font-black text-slate-800 uppercase tracking-tight mb-1">{item.name}</span>
                      <span className="text-[10px] font-bold text-emerald-600 font-mono">{item.price.toLocaleString('vi-VN')}</span>
                    </div>
                    <div className="flex items-center gap-4 bg-white p-1.5 rounded-xl border border-slate-100 shadow-sm">
                       <button onClick={() => updateQuantity(item.id, -1)} className="w-6 h-6 flex items-center justify-center text-slate-400 hover:text-slate-600"><Minus size={14} /></button>
                       <span className="text-xs font-black w-6 text-center">{item.quantity}</span>
                       <button onClick={() => updateQuantity(item.id, 1)} className="w-6 h-6 flex items-center justify-center text-emerald-600 hover:text-emerald-700 shadow-sm rounded-lg"><Plus size={14} /></button>
                    </div>
                 </div>
               ))}
            </div>

            <div className="flex flex-col gap-4">
              <div className="flex justify-between items-center px-2">
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tổng thanh toán</p>
                 <h2 className="text-2xl font-black text-slate-900 tracking-tighter italic">{total.toLocaleString('vi-VN')}đ</h2>
              </div>
              <motion.button 
                whileTap={{ scale: 0.95 }}
                onClick={handleCheckout} 
                disabled={ordering} 
                className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-black uppercase tracking-widest shadow-2xl shadow-emerald-200 flex items-center justify-center gap-3 disabled:opacity-50"
              >
                {ordering ? (
                  <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <CheckCircle2 size={20} />
                    Gọi món ngay
                  </>
                )}
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Success Modal */}
      <AnimatePresence>
        {orderSuccess && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-white rounded-[40px] p-10 flex flex-col items-center text-center max-w-xs shadow-2xl relative overflow-hidden"
            >
              {/* Confetti-like decor */}
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-emerald-50 rounded-full" />
              <div className="absolute -bottom-10 -left-10 w-24 h-24 bg-blue-50 rounded-full" />
              
              <div className="w-20 h-20 bg-emerald-600 text-white rounded-3xl flex items-center justify-center mb-6 shadow-xl shadow-emerald-100 rotate-6">
                <CheckCircle2 size={40} />
              </div>
              <h2 className="text-2xl font-black text-slate-900 mb-3 uppercase tracking-tighter">Đặt món thành công!</h2>
              <p className="text-xs text-slate-500 mb-8 font-black uppercase tracking-widest leading-relaxed">
                Đơn hàng của bạn đã được chuyển đến Bếp. Vui lòng đợi trong giây lát nhé!
              </p>
              <button 
                onClick={() => setOrderSuccess(false)}
                className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-slate-200 active:scale-95 transition-transform"
              >
                Tiếp tục xem menu
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Active Order Modal */}
      <AnimatePresence>
        {showActiveOrderModal && activeOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowActiveOrderModal(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-sm bg-white rounded-[40px] shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
            >
              <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <div>
                  <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Đơn hàng hiện tại</h3>
                  <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mt-1 italic">Mã đơn: {activeOrder.orderNumber}</p>
                </div>
                <button 
                  onClick={() => setShowActiveOrderModal(false)}
                  className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center text-slate-400 hover:text-slate-600 shadow-sm transition-colors border border-slate-100"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-auto p-6 no-scrollbar">
                <div className="mb-6 flex justify-center">
                   <div className={cn(
                     "px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2",
                     activeOrder.status === 'PENDING' ? "bg-amber-100 text-amber-600" :
                     activeOrder.status === 'PREPARING' ? "bg-blue-100 text-blue-600 animate-pulse" :
                     activeOrder.status === 'READY' ? "bg-emerald-100 text-emerald-600" :
                     "bg-slate-100 text-slate-600"
                   )}>
                      <Clock size={12} />
                      {activeOrder.status === 'PENDING' ? 'Chờ xác nhận' :
                       activeOrder.status === 'PREPARING' ? 'Đang chế biến' :
                       activeOrder.status === 'READY' ? 'Sẵn sàng phục vụ' :
                       'Đã giao'}
                   </div>
                </div>

                <div className="space-y-4">
                  {activeOrder.items.map((item: any, idx: number) => (
                    <div key={idx} className="flex justify-between items-start gap-4 p-4 bg-slate-50/50 rounded-2xl border border-slate-100">
                      <div className="flex-1">
                        <p className="text-xs font-black text-slate-900 uppercase tracking-tight">{item.name}</p>
                        <p className="text-[10px] font-bold text-slate-400 mt-1">Số lượng: {item.quantity}</p>
                      </div>
                      <p className="text-xs font-black text-emerald-600 font-mono">{(item.price * item.quantity).toLocaleString('vi-VN')}đ</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-8 bg-slate-50 border-t border-slate-100">
                <div className="flex justify-between items-center mb-6">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tổng thanh toán</p>
                  <p className="text-2xl font-black text-slate-900 tracking-tighter italic">{activeOrder.total.toLocaleString('vi-VN')}đ</p>
                </div>
                <button 
                  onClick={() => setShowActiveOrderModal(false)}
                  className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-slate-200 active:scale-95 transition-transform"
                >
                  Đóng
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CustomerOrderPage;
