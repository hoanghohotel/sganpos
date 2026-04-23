import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ShoppingCart, Plus, Minus, Trash2, Coffee, CheckCircle2 } from 'lucide-react';
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
}

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

const POSPage = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [ordering, setOrdering] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await axios.get('/api/products');
      setProducts(response.data);
    } catch (error) {
      console.error('Lỗi khi lấy danh sách sản phẩm:', error);
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

  const removeFromCart = (id: string) => {
    setCart((prev) => prev.filter((item) => item.id !== id));
  };

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    setOrdering(true);
    try {
      const orderData = {
        orderType: 'TAKEAWAY',
        items: cart.map((item) => ({
          productId: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
        })),
        total: total,
      };

      await axios.post('/api/orders', orderData);
      setCart([]);
      setOrderSuccess(true);
      setTimeout(() => setOrderSuccess(false), 3000);
    } catch (error) {
      alert('Lỗi khi tạo đơn hàng');
      console.error(error);
    } finally {
      setOrdering(false);
    }
  };

  return (
    <div className="flex h-full overflow-hidden bg-[#F8FAFC]">
      {/* Product Grid */}
      <div className="flex-1 p-8 overflow-auto">
        <header className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Thực Đơn</h1>
            <p className="text-slate-500 text-sm">Hôm nay: {new Date().toLocaleDateString('vi-VN')}</p>
          </div>
          <div className="flex gap-4">
            <div className="relative">
              <input type="text" placeholder="Tìm kiếm..." className="bg-white border border-slate-200 rounded-xl px-10 py-2 w-64 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
              <ShoppingCart className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            </div>
          </div>
        </header>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 animate-pulse">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-44 bg-white rounded-2xl border border-slate-100 shadow-sm" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {products.map((product) => (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                key={product._id}
                onClick={() => addToCart(product)}
                className="group bg-white p-4 rounded-2xl border border-slate-100 shadow-sm hover:border-emerald-200 hover:shadow-emerald-100/20 transition-all text-left flex flex-col justify-between h-44"
              >
                <div>
                  <div className="w-full h-20 bg-slate-50 rounded-xl mb-3 flex items-center justify-center group-hover:bg-emerald-50 transition-colors">
                    <Coffee className="text-slate-300 group-hover:text-emerald-300 transition-colors" />
                  </div>
                  <h3 className="font-semibold text-slate-900 leading-tight group-hover:text-emerald-600 transition-colors line-clamp-1">{product.name}</h3>
                </div>
                <div className="flex justify-between items-end mt-2">
                  <span className="text-emerald-600 font-bold">
                    {product.basePrice.toLocaleString('vi-VN')}đ
                  </span>
                  <div className="p-1 px-2 text-[10px] bg-slate-100 text-slate-500 rounded-lg font-bold uppercase tracking-tight">
                    {product.category}
                  </div>
                </div>
              </motion.button>
            ))}
          </div>
        )}
      </div>

      {/* Cart Panel */}
      <aside className="w-[340px] bg-white border-l border-slate-200 flex flex-col shadow-xl shadow-slate-200/50">
        <div className="p-6 border-b border-slate-100">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-900">Đơn hàng hiện tại</h2>
            <div className="p-1 px-2 border border-slate-200 rounded-lg text-[10px] font-bold text-slate-400">#TAKEAWAY</div>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-4">
          <AnimatePresence initial={false}>
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-300">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                   <Coffee size={32} className="opacity-20" />
                </div>
                <p className="text-sm font-medium">Giỏ hàng trống</p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {cart.map((item) => (
                  <motion.div
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    key={item.id}
                    className="p-3 bg-white border border-slate-100 rounded-xl hover:border-emerald-100 transition-all flex flex-col gap-2 shadow-sm"
                  >
                    <div className="flex justify-between items-start">
                       <h4 className="text-sm font-bold text-slate-800 line-clamp-1">{item.name}</h4>
                       <button onClick={() => removeFromCart(item.id)} className="text-slate-300 hover:text-red-500 transition-colors">
                        <Trash2 size={16} />
                      </button>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-emerald-600 font-bold text-sm">
                        {(item.price * item.quantity).toLocaleString('vi-VN')}đ
                      </span>
                      <div className="flex items-center gap-3 bg-slate-50 rounded-lg p-1 border border-slate-100">
                        <button onClick={() => updateQuantity(item.id, -1)} className="p-1 hover:text-emerald-600">
                          <Minus size={14} />
                        </button>
                        <span className="font-mono text-sm font-bold min-w-[20px] text-center">{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.id, 1)} className="p-1 hover:text-emerald-600">
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
          <div className="flex flex-col gap-2 mb-6">
            <div className="flex justify-between text-sm text-slate-500">
               <span>Tạm tính</span>
               <span>{total.toLocaleString('vi-VN')}đ</span>
            </div>
            <div className="flex justify-between items-end mt-2 pt-2 border-t border-slate-50">
              <span className="text-lg font-bold text-slate-900">Tổng cộng</span>
              <span className="text-2xl font-black text-emerald-600">
                {total.toLocaleString('vi-VN')}đ
              </span>
            </div>
          </div>

          <button
            disabled={cart.length === 0 || ordering}
            onClick={handleCheckout}
            className={cn(
              "w-full py-4 rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-2",
              cart.length === 0 ? "bg-slate-100 text-slate-300 cursor-not-allowed" : "bg-emerald-600 text-white hover:bg-emerald-700 shadow-xl shadow-emerald-100",
              ordering && "opacity-70"
            )}
          >
            {ordering ? (
              <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" />
            ) : orderSuccess ? (
              <>
                <CheckCircle2 size={24} />
                <span>Hoàn tất!</span>
              </>
            ) : (
              "Thanh toán"
            )}
          </button>
        </div>
      </aside>
    </div>
  );
};

export default POSPage;
