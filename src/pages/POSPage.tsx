import React, { useState, useEffect } from 'react';
import api from '../lib/api';
import axios from 'axios';
import { ShoppingCart, Plus, Minus, Trash2, Coffee, CheckCircle2, Banknote, CreditCard, X, ChevronRight, LogOut, CircleDollarSign } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuthStore } from '../store/authStore';
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
}

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

interface Table {
  _id: string;
  name: string;
  status: 'EMPTY' | 'OCCUPIED';
}

const POSPage = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('Tất cả');
  const [tables, setTables] = useState<Table[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [tableCarts, setTableCarts] = useState<Record<string, CartItem[]>>(() => {
    const saved = localStorage.getItem('tableCarts');
    return saved ? JSON.parse(saved) : {};
  });
  
  // Sync tableCarts to localStorage
  useEffect(() => {
    localStorage.setItem('tableCarts', JSON.stringify(tableCarts));
  }, [tableCarts]);
  
  // Flow states
  const [step, setStep] = useState<'TYPE' | 'TABLE' | 'MENU'>('TYPE');
  const [orderType, setOrderType] = useState<'DINE_IN' | 'TAKEAWAY' | 'DELIVERY' | null>(null);
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [settings, setSettings] = useState<any>(null);

  const [loading, setLoading] = useState(true);
  const [ordering, setOrdering] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  
  // Payment states
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'TRANSFER' | null>(null);
  const [paymentStep, setPaymentStep] = useState<'SELECT' | 'QR'>('SELECT');
  const [orderCode, setOrderCode] = useState('');
  
  // Shift states
  const { shift, closeShift } = useAuthStore();
  const [showCloseShiftModal, setShowCloseShiftModal] = useState(false);
  const [showShiftWarning, setShowShiftWarning] = useState(false);
  const [closingBalance, setClosingBalance] = useState<number>(0);
  const [closing, setClosing] = useState(false);

  const generateOrderCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
       code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      const [prodRes, tableRes, setRes] = await Promise.all([
        api.get('/api/products'),
        api.get('/api/tables'),
        api.get('/api/settings')
      ]);
      const productsData = Array.isArray(prodRes.data) ? prodRes.data : [];
      setProducts(productsData);
      setTables(Array.isArray(tableRes.data) ? tableRes.data : []);
      setSettings(setRes.data);
      
      const rawCategories = productsData.map((p: Product) => p.category).filter(Boolean);
      const uniqueCats = Array.from(new Set(rawCategories as string[]));
      const cats: string[] = ['Tất cả', ...uniqueCats.filter(c => c !== 'Tất cả')];
      setCategories(cats);
    } catch (error) {
      console.error('Lỗi khi lấy dữ liệu:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter(p => {
    const matchesCategory = selectedCategory === 'Tất cả' || p.category === selectedCategory;
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleTypeSelect = (type: 'DINE_IN' | 'TAKEAWAY' | 'DELIVERY') => {
    setOrderType(type);
    setStep('TABLE');
  };

  const handleTableSelect = (table: Table) => {
    setSelectedTable(table);
    // Load existing cart for this table if any
    setCart(tableCarts[table._id] || []);
    setStep('MENU');
  };

  // Sync cart to tableCarts whenever it changes
  useEffect(() => {
    if (selectedTable && step === 'MENU') {
      setTableCarts(prev => ({ ...prev, [selectedTable._id]: cart }));
    }
  }, [cart, selectedTable, step]);

  const resetFlow = () => {
    // When resetting, we might want to clear the specific table's cart after checkout
    if (selectedTable) {
      setTableCarts(prev => {
         const newCarts = { ...prev };
         delete newCarts[selectedTable._id];
         return newCarts;
      });
    }
    setStep('TYPE');
    setOrderType(null);
    setSelectedTable(null);
    setCart([]);
    setShowPaymentModal(false);
    setPaymentMethod(null);
    setPaymentStep('SELECT');
  };

  const filteredTables = tables.filter(t => {
    if (orderType === 'DINE_IN') return t.name.startsWith('Bàn');
    if (orderType === 'TAKEAWAY') return t.name.startsWith('Mang về');
    if (orderType === 'DELIVERY') return t.name.startsWith('Ship đi');
    return true;
  });

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

  const removeFromCart = (id: string) => {
    setCart((prev) => prev.filter((item) => item.id !== id));
  };

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const handleCheckoutInitiate = () => {
    if (cart.length === 0 || !orderType) return;
    setOrderCode(generateOrderCode());
    setShowPaymentModal(true);
    setPaymentStep('SELECT');
  };

  const handleConfirmPayment = async (method: 'CASH' | 'TRANSFER') => {
    setPaymentMethod(method);
    if (method === 'TRANSFER') {
      setPaymentStep('QR');
    } else {
      await processOrder(method);
    }
  };

  const processOrder = async (method: string) => {
    if (ordering) return;
    setOrdering(true);
    try {
      const orderData = {
        orderCode: orderCode,
        orderType: orderType,
        tableId: selectedTable?._id,
        items: cart.map((item) => ({
          productId: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
        })),
        total: total,
        paymentMethod: method,
        status: 'PENDING'
      };

      await api.post('/api/orders', orderData);
      setOrderSuccess(true);
      setShowPaymentModal(false);
      
      setTimeout(() => {
        setOrderSuccess(false);
        resetFlow();
      }, 2000);
    } catch (error) {
      alert('Lỗi khi tạo đơn hàng');
      console.error(error);
    } finally {
      setOrdering(false);
    }
  };

  const getActiveTables = () => {
    return tables.filter(t => (tableCarts[t._id]?.length || 0) > 0);
  };

  const handleCloseShiftInitiate = () => {
    const active = getActiveTables();
    if (active.length > 0) {
      setShowShiftWarning(true);
    } else {
      setShowCloseShiftModal(true);
    }
  };

  const handleCloseShift = async () => {
    setClosing(true);
    try {
      const activeTables = getActiveTables();
      const reportData = await closeShift(closingBalance, activeTables.length);
      
      // Print report
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>Báo Cáo Chốt Ca</title>
              <style>
                body { font-family: sans-serif; padding: 20px; line-height: 1.6; }
                .header { text-align: center; margin-bottom: 20px; }
                .row { display: flex; justify-content: space-between; margin: 10px 0; border-bottom: 1px dashed #eee; }
                .footer { margin-top: 30px; text-align: center; font-size: 12px; }
                h2 { border-bottom: 2px solid #000; padding-bottom: 10px; }
              </style>
            </head>
            <body>
              <div class="header">
                <h2>BÁO CÁO KẾT THÚC CA</h2>
                <p>${new Date().toLocaleString('vi-VN')}</p>
              </div>
              <div class="row"><span>Nhân viên:</span> <b>${reportData.userName}</b></div>
              <div class="row"><span>Bắt đầu:</span> <span>${new Date(reportData.startTime).toLocaleString('vi-VN')}</span></div>
              <div class="row"><span>Kết thúc:</span> <span>${new Date(reportData.endTime).toLocaleString('vi-VN')}</span></div>
              <div class="row"><span>Tiền đầu ca:</span> <b>${reportData.openingBalance.toLocaleString('vi-VN')}đ</b></div>
              <div class="row"><span>Doanh thu ca:</span> <b>${reportData.totalSales.toLocaleString('vi-VN')}đ</b></div>
              <div class="row"><span>Tiền mặt cuối ca:</span> <b>${reportData.closingBalance.toLocaleString('vi-VN')}đ</b></div>
              <div class="row"><span>Bàn giao bàn đang phục vụ:</span> <b>${activeTables.length} bàn</b></div>
              <div class="footer">
                <p>Hệ thống quản lý PosApp</p>
                <p>Cảm ơn quý khách!</p>
              </div>
              <script>window.print(); setTimeout(() => window.close(), 1000);</script>
            </body>
          </html>
        `);
        printWindow.document.close();
      }

      setShowCloseShiftModal(false);
      setShowShiftWarning(false);
    } catch (error) {
      alert('Lỗi khi chốt ca');
    } finally {
      setClosing(false);
    }
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-[#F8FAFC]">
        <div className="w-12 h-12 border-4 border-emerald-100 border-t-emerald-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex h-full overflow-hidden bg-[#F8FAFC]">
      {/* Main Content Area */}
      <div className="flex-1 p-8 overflow-auto">
        <AnimatePresence mode="wait">
          {/* STEP 1: Select Order Type */}
          {step === 'TYPE' && (
            <motion.div 
              key="type-step"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="h-full flex flex-col justify-center max-w-4xl mx-auto"
            >
              <h2 className="text-4xl font-black text-slate-900 mb-12 text-center tracking-tighter">Bắt đầu đơn hàng mới</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {[
                  { id: 'DINE_IN', label: 'Tại chỗ', icon: '🏠', color: 'bg-emerald-600' },
                  { id: 'TAKEAWAY', label: 'Mang về', icon: '🥡', color: 'bg-slate-900' },
                  { id: 'DELIVERY', label: 'Ship đi', icon: '🛵', color: 'bg-emerald-400' }
                ].map((t, idx) => (
                  <button
                    key={`type-${t.id}-${idx}`}
                    onClick={() => handleTypeSelect(t.id as any)}
                    className="group bg-white p-10 rounded-[32px] border border-slate-100 shadow-xl shadow-slate-200/50 hover:border-emerald-500 hover:scale-[1.05] transition-all flex flex-col items-center gap-6"
                  >
                    <span className="text-6xl group-hover:scale-125 transition-transform">{t.icon}</span>
                    <span className="text-2xl font-black text-slate-900 uppercase tracking-tighter">{t.label}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* STEP 2: Select Table/Slot */}
          {step === 'TABLE' && (
            <motion.div 
              key="table-step"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              className="h-full flex flex-col"
            >
              <div className="flex items-center gap-4 mb-10">
                <button onClick={() => setStep('TYPE')} className="p-3 bg-white border border-slate-200 rounded-xl hover:bg-slate-50">
                  <Plus className="rotate-45 text-slate-400" />
                </button>
                <h2 className="text-3xl font-black text-slate-900 tracking-tighter">Chọn {orderType === 'DINE_IN' ? 'Bàn' : orderType === 'TAKEAWAY' ? 'Ô mang về' : 'Slot ship'}</h2>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {filteredTables.map((table, idx) => {
                  const hasItems = (tableCarts[table._id]?.length || 0) > 0;
                  return (
                    <button
                      key={`table-${table._id}-${idx}`}
                      onClick={() => handleTableSelect(table)}
                      disabled={table.status === 'OCCUPIED'}
                      className={cn(
                        "p-6 rounded-[24px] border-2 font-bold text-lg transition-all flex flex-col items-center gap-2 relative overflow-hidden group",
                        table.status === 'OCCUPIED' 
                          ? "bg-slate-50 border-slate-100 text-slate-300 cursor-not-allowed"
                          : hasItems
                            ? "bg-amber-50 border-amber-400 text-amber-900 shadow-lg shadow-amber-100/50"
                            : "bg-white border-slate-100 hover:border-emerald-500 hover:bg-emerald-50/10 text-slate-900"
                      )}
                    >
                      <div className={cn(
                        "text-[9px] uppercase tracking-widest font-black px-2 py-0.5 rounded-full",
                        table.status === 'OCCUPIED'
                          ? "bg-slate-200 text-slate-400"
                          : hasItems
                            ? "bg-amber-400 text-white animate-pulse"
                            : "bg-slate-100 text-slate-400"
                      )}>
                        {table.status === 'OCCUPIED' ? 'Đã khóa' : hasItems ? 'Phục vụ' : 'Trống'}
                      </div>
                      <span className="font-black text-2xl tracking-tighter italic">{table.name}</span>
                      {hasItems && (
                        <div className="absolute top-1 right-1 w-2 h-2 bg-amber-500 rounded-full" />
                      )}
                    </button>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* STEP 3: Select Menu Items */}
          {step === 'MENU' && (
            <motion.div 
              key="menu-step"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col h-full"
            >
              <header className="flex justify-between items-center mb-8">
                <div className="flex flex-col gap-4 w-full">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-4">
                      <button onClick={() => setStep('TABLE')} className="p-3 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 shadow-sm">
                        <Plus className="rotate-45 text-slate-400" />
                      </button>
                      <div>
                        <h1 className="text-2xl font-black text-slate-900 tracking-tighter uppercase">{selectedTable?.name}</h1>
                        <p className="text-emerald-600 text-[10px] font-black uppercase tracking-widest">{orderType?.replace('_', ' ')}</p>
                      </div>
                    </div>
                    <div className="relative">
                      <input 
                        type="text" 
                        placeholder="Tìm món..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="bg-white border border-slate-200 rounded-xl px-10 py-2 w-64 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm" 
                      />
                      <ShoppingCart className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    </div>
                    <button 
                      onClick={handleCloseShiftInitiate}
                      className="p-3 bg-rose-50 text-rose-600 rounded-xl hover:bg-rose-100 transition-colors flex items-center gap-2 font-black text-[10px] uppercase tracking-widest"
                    >
                      <LogOut size={16} />
                      Chốt ca
                    </button>
                  </div>
                  
                  {/* Category Filter */}
                  <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                    {categories.map((cat, index) => (
                      <button
                        key={`cat-${cat}-${index}`}
                        onClick={() => setSelectedCategory(cat)}
                        className={cn(
                          "px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest transition-all whitespace-nowrap border",
                          selectedCategory === cat 
                            ? "bg-emerald-600 text-white border-emerald-600 shadow-lg shadow-emerald-100" 
                            : "bg-white text-slate-500 border-slate-100 hover:border-emerald-200"
                        )}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>
              </header>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 overflow-auto pb-8">
                {filteredProducts.map((product, idx) => (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    key={`prod-${product._id}-${idx}`}
                    onClick={() => addToCart(product)}
                    className="group bg-white p-4 rounded-2xl border border-slate-100 shadow-sm hover:border-emerald-200 hover:shadow-emerald-100/20 transition-all text-left flex flex-col justify-between h-44"
                  >
                    <div>
                      <div className="w-full h-20 bg-slate-50 rounded-xl mb-3 flex items-center justify-center group-hover:bg-emerald-50 transition-colors">
                        <Coffee className="text-slate-300 group-hover:text-emerald-300 transition-colors" />
                      </div>
                      <h3 className="font-bold text-slate-900 leading-tight group-hover:text-emerald-600 transition-colors line-clamp-1 text-sm uppercase tracking-tighter font-sans">{product.name}</h3>
                    </div>
                    <div className="flex justify-between items-end mt-2">
                      <span className="text-emerald-600 font-extrabold text-sm font-mono">
                        {product.basePrice.toLocaleString('vi-VN')}đ
                      </span>
                    </div>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Cart Panel (Only show in MENU step) */}
      <AnimatePresence>
        {step === 'MENU' && (
          <motion.aside 
            initial={{ x: 400 }}
            animate={{ x: 0 }}
            exit={{ x: 400 }}
            className="w-[340px] bg-white border-l border-slate-200 flex flex-col shadow-2xl z-20"
          >
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-xl font-black text-slate-900 tracking-tighter uppercase">Giỏ hàng</h2>
              <button onClick={resetFlow} className="text-[10px] font-black text-red-500 uppercase hover:bg-red-50 px-2 py-1 rounded">Xoá hết</button>
            </div>

            <div className="flex-1 overflow-auto p-4">
              <AnimatePresence initial={false}>
                {cart.length === 0 ? (
                  <div key="empty-cart" className="h-full flex flex-col items-center justify-center text-slate-200">
                    <img src="/logo.svg" alt="Logo" className="w-20 h-20 opacity-20 grayscale mb-4" />
                    <p className="text-xs font-black uppercase tracking-widest text-slate-300">Chưa chọn món</p>
                  </div>
                ) : (
                  <div key="cart-list" className="flex flex-col gap-3">
                    {cart.map((item) => (
                      <motion.div
                        layout
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        key={item.id}
                        className="p-4 bg-slate-50/50 border border-slate-100 rounded-2xl flex flex-col gap-3 shadow-sm hover:border-emerald-200 transition-colors"
                      >
                        <div className="flex justify-between items-start">
                           <h4 className="text-xs font-black text-slate-800 line-clamp-1 uppercase tracking-tighter">{item.name}</h4>
                           <button onClick={() => removeFromCart(item.id)} className="text-slate-300 hover:text-red-500 transition-colors">
                            <Trash2 size={16} />
                          </button>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-emerald-600 font-black text-sm font-mono">
                            {(item.price * item.quantity).toLocaleString('vi-VN')}đ
                          </span>
                          <div className="flex items-center gap-3 bg-white rounded-xl p-1 border border-slate-100 shadow-inner">
                            <button onClick={() => updateQuantity(item.id, -1)} className="p-1 hover:text-emerald-600 transition-colors">
                              <Minus size={14} />
                            </button>
                            <span className="font-mono text-xs font-black min-w-[20px] text-center">{item.quantity}</span>
                            <button onClick={() => updateQuantity(item.id, 1)} className="p-1 hover:text-emerald-600 transition-colors">
                              <Plus size={14} />
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </AnimatePresence>
            </div>

            <div className="p-6 bg-white border-t border-slate-100">
              <div className="flex justify-between items-end mb-6">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tổng tiền</span>
                <span className="text-3xl font-black text-emerald-600 tracking-tighter font-mono">
                  {total.toLocaleString('vi-VN')}đ
                </span>
              </div>

              <button
                disabled={cart.length === 0 || ordering}
                onClick={handleCheckoutInitiate}
                className={cn(
                  "w-full py-4 rounded-2xl font-black text-lg transition-all flex items-center justify-center gap-3 uppercase tracking-widest shadow-xl",
                  cart.length === 0 ? "bg-slate-100 text-slate-300 cursor-not-allowed" : "bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-100",
                  ordering && "opacity-70"
                )}
              >
                {ordering ? (
                  <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                ) : orderSuccess ? (
                  <>
                    <CheckCircle2 size={24} />
                    <span>Xong!</span>
                  </>
                ) : (
                  <>
                    <ShoppingCart size={20} />
                    <span>Thanh toán</span>
                  </>
                )}
              </button>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Payment Modal */}
      <AnimatePresence>
        {showPaymentModal && (
          <div key="payment-modal-container" className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              key="payment-modal-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !ordering && setShowPaymentModal(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div
              key="payment-modal-content"
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-lg bg-white rounded-[40px] shadow-2xl overflow-hidden"
            >
               {paymentStep === 'SELECT' ? (
                 <div className="p-8">
                    <div className="flex justify-between items-center mb-8">
                       <h3 className="text-2xl font-black text-slate-900 tracking-tighter uppercase italic">Thanh toán</h3>
                       <button onClick={() => setShowPaymentModal(false)} className="p-2 hover:bg-slate-50 rounded-full transition-colors text-slate-400">
                          <X size={24} />
                       </button>
                    </div>

                    <div className="space-y-4 mb-8">
                       <button 
                        onClick={() => handleConfirmPayment('CASH')}
                        className="w-full p-6 bg-slate-50 border border-slate-100 rounded-3xl flex items-center justify-between group hover:border-emerald-500 hover:bg-emerald-50 transition-all text-left"
                       >
                          <div className="flex items-center gap-4">
                             <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm text-slate-400 group-hover:text-emerald-600 transition-colors">
                                <Banknote size={24} />
                             </div>
                             <div>
                                <p className="text-sm font-black text-slate-900 uppercase">Tiền mặt</p>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Thanh toán trực tiếp</p>
                             </div>
                          </div>
                          <ChevronRight size={20} className="text-slate-300 group-hover:translate-x-1 transition-transform" />
                       </button>

                       <button 
                        onClick={() => handleConfirmPayment('TRANSFER')}
                        className="w-full p-6 bg-slate-50 border border-slate-100 rounded-3xl flex items-center justify-between group hover:border-emerald-500 hover:bg-emerald-50 transition-all text-left"
                       >
                          <div className="flex items-center gap-4">
                             <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm text-slate-400 group-hover:text-emerald-600 transition-colors">
                                <CreditCard size={24} />
                             </div>
                             <div>
                                <p className="text-sm font-black text-slate-900 uppercase">Chuyển khoản</p>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Quét mã VietQR động</p>
                             </div>
                          </div>
                          <ChevronRight size={20} className="text-slate-300 group-hover:translate-x-1 transition-transform" />
                       </button>
                    </div>

                    <div className="p-6 bg-emerald-50 rounded-3xl border border-emerald-100 flex justify-between items-center">
                       <span className="text-[10px] font-black text-emerald-800 uppercase tracking-widest">Tổng tiền cần thu</span>
                       <span className="text-2xl font-black text-emerald-600 font-mono tracking-tighter">
                          {total.toLocaleString('vi-VN')}đ
                       </span>
                    </div>
                 </div>
               ) : (
                 <div className="p-8 flex flex-col items-center text-center">
                    <div className="w-full flex justify-between items-center mb-8">
                       <button onClick={() => setPaymentStep('SELECT')} className="p-2 hover:bg-slate-50 rounded-full transition-colors text-slate-400">
                          <Plus size={24} className="rotate-45" />
                       </button>
                       <h3 className="text-xl font-black text-slate-900 tracking-tighter uppercase italic">Quét mã VietQR</h3>
                       <button onClick={() => setShowPaymentModal(false)} className="p-2 hover:bg-slate-50 rounded-full transition-colors text-slate-400">
                          <X size={24} />
                       </button>
                    </div>

                    <div className="bg-slate-50 p-6 rounded-[32px] border border-slate-100 shadow-inner mb-8">
                       {settings && (
                          <img 
                            src={`https://img.vietqr.io/image/${settings.bankCode || 'ICB'}-${settings.bankAccount || '0000'}-compact2.png?amount=${total}&addInfo=${encodeURIComponent(`TT ${orderCode} ${selectedTable?.name || ''}`)}&accountName=${encodeURIComponent(settings.bankAccountHolder || '')}`}
                            alt="VietQR"
                            className="w-64 h-auto rounded-xl shadow-xl mx-auto"
                          />
                       )}
                    </div>

                    <div className="w-full space-y-2 mb-8 text-left">
                       <div className="flex justify-between items-center p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                          <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest italic">Mã đơn hàng</span>
                          <span className="text-sm font-black text-emerald-700 tracking-widest">{orderCode}</span>
                       </div>
                       <div className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl border border-slate-100">
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Người thụ hưởng</span>
                          <span className="text-xs font-black text-slate-900 uppercase">{settings?.bankAccountHolder}</span>
                       </div>
                       <div className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl border border-slate-100">
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Số tài khoản</span>
                          <span className="text-xs font-black text-slate-900 font-mono">{settings?.bankAccount}</span>
                       </div>
                    </div>

                    <button 
                      onClick={() => processOrder('TRANSFER')}
                      disabled={ordering}
                      className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-black text-lg uppercase tracking-widest shadow-xl shadow-emerald-100 hover:bg-emerald-700 transition-all flex items-center justify-center gap-3"
                    >
                       {ordering ? (
                          <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                       ) : (
                          <>
                             <CheckCircle2 size={24} />
                             <span>Đã nhận tiền</span>
                          </>
                       )}
                    </button>
                    <p className="mt-4 text-[10px] text-slate-400 font-bold uppercase tracking-widest">Kiểm tra tài khoản trước khi nhấn xác nhận</p>
                 </div>
               )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Shift Closing Warning Modal */}
      <AnimatePresence>
        {showShiftWarning && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-950/90 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="relative w-full max-w-sm bg-white rounded-[48px] p-12 text-center shadow-2xl"
            >
               <div className="w-20 h-20 bg-amber-100 rounded-3xl flex items-center justify-center mx-auto mb-8">
                  <CircleDollarSign className="text-amber-600 w-10 h-10" />
               </div>
               <h3 className="text-2xl font-black text-slate-900 mb-4 tracking-tighter uppercase italic">Cảnh báo bàn đang phục vụ</h3>
               <p className="text-slate-500 font-medium mb-10 leading-relaxed text-sm">
                  Hiện vẫn còn <span className="text-rose-600 font-black">{getActiveTables().length} bàn</span> đang có khách hoặc chưa thanh toán. Nhân viên ca sau sẽ tiếp quản các bàn này. Bạn vẫn muốn chốt ca?
               </p>
               <div className="space-y-4">
                  <button 
                    onClick={() => {
                      setShowShiftWarning(false);
                      setShowCloseShiftModal(true);
                    }}
                    className="w-full h-16 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-emerald-600 transition-all active:scale-95"
                  >
                    Tiếp tục chốt ca
                  </button>
                  <button 
                    onClick={() => setShowShiftWarning(false)}
                    className="w-full h-16 bg-slate-50 text-slate-400 rounded-2xl font-black uppercase tracking-widest hover:text-slate-900 transition-all"
                  >
                    Quay lại kiểm tra
                  </button>
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Close Shift Modal */}
      <AnimatePresence>
        {showCloseShiftModal && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !closing && setShowCloseShiftModal(false)}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-md bg-white rounded-[40px] p-10 shadow-2xl"
            >
               <div className="flex items-center gap-4 mb-8">
                  <div className="w-12 h-12 bg-rose-100 rounded-2xl flex items-center justify-center">
                     <CircleDollarSign className="text-rose-600 w-6 h-6" />
                  </div>
                  <div>
                     <h3 className="text-xl font-black text-slate-900 leading-none">Chốt ca bán hàng</h3>
                     <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-1">Tổng kết tiền mặt cuối ca</p>
                  </div>
               </div>

               <div className="space-y-6">
                  <div className="bg-slate-50 p-6 rounded-3xl space-y-4">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Tiền đầu ca</span>
                      <span className="font-black text-slate-900">{shift?.openingBalance.toLocaleString('vi-VN')}đ</span>
                    </div>
                    <div className="h-px bg-slate-100" />
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Tiền mặt cuối ca (Thực tế)</label>
                       <div className="relative">
                          <input 
                            type="number"
                            value={closingBalance}
                            onChange={(e) => setClosingBalance(Number(e.target.value))}
                            className="w-full h-16 bg-white rounded-2xl border-none text-2xl font-black text-slate-900 text-center focus:ring-4 focus:ring-rose-500/20 shadow-inner"
                            placeholder="0"
                          />
                          <span className="absolute top-1/2 -translate-y-1/2 left-4 text-slate-300 font-black">đ</span>
                       </div>
                    </div>
                  </div>

                  <button 
                    onClick={handleCloseShift}
                    disabled={closing}
                    className="w-full h-16 bg-rose-600 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-rose-700 transition-all shadow-xl shadow-rose-100 flex items-center justify-center gap-3 active:scale-95"
                  >
                    {closing ? (
                      <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <LogOut size={20} />
                        Xác nhận chốt ca
                      </>
                    )}
                  </button>
                  <button 
                    onClick={() => setShowCloseShiftModal(false)}
                    className="w-full text-slate-400 font-black uppercase tracking-widest text-[10px] hover:text-slate-600 transition-colors"
                  >
                    Huỷ bỏ
                  </button>
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default POSPage;
