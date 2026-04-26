import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../lib/api';
import axios from 'axios';
import { ShoppingCart, Plus, Minus, Coffee, CheckCircle2, Info } from 'lucide-react';
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
      <header className="sticky top-0 z-20 bg-white border-b border-slate-100 p-4 pt-6 shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-50 rounded-full flex items-center justify-center overflow-hidden">
               <img src={settings?.logoUrl || "/logo.svg"} alt="Logo" className="w-full h-full object-contain" />
            </div>
            <div>
              <h1 className="text-lg font-black text-slate-900 leading-none uppercase">{settings?.storeName || 'Cà Phê POS'}</h1>
              <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mt-1">
                Phục vụ tại {table?.name || 'Bàn của bạn'}
              </p>
            </div>
          </div>
          <div className="relative">
             <div className="bg-emerald-600 text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center absolute -top-2 -right-2 border-2 border-white">
                {cart.reduce((s, i) => s + i.quantity, 0)}
             </div>
             <ShoppingCart className="text-slate-400" />
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <input 
            type="text" 
            placeholder="Tìm món bạn thích..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border-none rounded-xl px-10 py-3 text-sm focus:ring-2 focus:ring-emerald-500"
          />
          <ShoppingCart size={16} className="absolute left-3 top-3.5 text-slate-300" />
        </div>

        {/* Categories */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={cn(
                "px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all whitespace-nowrap",
                selectedCategory === cat ? "bg-emerald-600 border-emerald-600 text-white shadow-lg" : "bg-white border-slate-100 text-slate-500"
              )}
            >
              {cat}
            </button>
          ))}
        </div>
      </header>

      {/* Product List */}
      <main className="flex-1 p-4 grid grid-cols-2 gap-3 overflow-auto pb-32">
        {filteredProducts.map(product => (
          <motion.div
            key={product._id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white p-3 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between"
          >
            <div>
              <div className="aspect-square bg-slate-50 rounded-xl mb-3 flex items-center justify-center overflow-hidden">
                {product.image ? (
                  <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                ) : (
                  <Coffee className="text-slate-200" size={32} />
                )}
              </div>
              <h3 className="text-[10px] font-black text-slate-900 leading-tight mb-1 uppercase tracking-tighter line-clamp-2 h-8">{product.name}</h3>
              <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{product.category}</p>
            </div>
            <div className="flex items-center justify-between mt-3">
              <span className="text-[11px] font-black text-emerald-600 font-mono">{product.basePrice.toLocaleString('vi-VN')}đ</span>
              <button 
                onClick={() => addToCart(product)}
                className="w-8 h-8 bg-emerald-600 text-white rounded-lg flex items-center justify-center shadow-lg shadow-emerald-100 active:scale-90 transition-transform"
              >
                <Plus size={16} />
              </button>
            </div>
          </motion.div>
        ))}
      </main>

      {/* Cart Drawer */}
      <AnimatePresence>
        {cart.length > 0 && (
          <motion.div
            initial={{ y: 200 }}
            animate={{ y: 0 }}
            exit={{ y: 200 }}
            className="fixed bottom-0 left-0 right-0 max-w-lg mx-auto bg-white border-t border-slate-100 rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.1)] p-6 z-30"
          >
            <div className="flex justify-between items-end mb-4">
               <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Tổng cộng ({cart.length} món)</p>
                  <h2 className="text-2xl font-black text-emerald-600 tracking-tighter">{total.toLocaleString('vi-VN')}đ</h2>
               </div>
               <button onClick={handleCheckout} disabled={ordering} className="px-8 py-3 bg-emerald-600 text-white rounded-xl font-black uppercase tracking-widest shadow-xl shadow-emerald-100">
                  {ordering ? 'Đang gửi...' : 'Gọi món ngay'}
               </button>
            </div>
            <div className="max-h-48 overflow-auto flex flex-col gap-2">
               {cart.map(item => (
                 <div key={item.id} className="flex justify-between items-center p-2 bg-slate-50 rounded-lg">
                    <span className="text-[10px] font-bold text-slate-700 uppercase tracking-tight">{item.name}</span>
                    <div className="flex items-center gap-3">
                       <button onClick={() => updateQuantity(item.id, -1)} className="p-1 text-slate-400"><Minus size={12} /></button>
                       <span className="text-xs font-black w-4 text-center">{item.quantity}</span>
                       <button onClick={() => updateQuantity(item.id, 1)} className="p-1 text-emerald-600"><Plus size={12} /></button>
                    </div>
                 </div>
               ))}
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
              className="bg-white rounded-3xl p-8 flex flex-col items-center text-center max-w-xs shadow-2xl"
            >
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-4">
                <CheckCircle2 size={32} />
              </div>
              <h2 className="text-xl font-black text-slate-900 mb-2 uppercase tracking-tighter">Đã nhận đơn!</h2>
              <p className="text-sm text-slate-500 mb-6 font-medium">Bếp đang chuẩn bị món cho bạn. Vui lòng đợi trong ít phút nhé.</p>
              <button 
                onClick={() => setOrderSuccess(false)}
                className="w-full py-3 bg-slate-900 text-white rounded-xl font-black uppercase tracking-widest"
              >
                Tiếp tục xem menu
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CustomerOrderPage;
