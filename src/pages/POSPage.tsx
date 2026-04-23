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
    <div className="flex h-full overflow-hidden bg-[#F5F5F0]">
      {/* Product Grid */}
      <div className="flex-1 p-6 overflow-auto border-r border-[#141414]/10">
        <header className="mb-8">
          <h1 className="text-4xl font-bold font-sans tracking-tight mb-2">Thực Đơn</h1>
          <p className="text-gray-500 italic serif">Chọn món để thêm vào giỏ hàng</p>
        </header>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 animate-pulse">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-40 bg-white rounded-2xl border border-[#141414]/5" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {products.map((product) => (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                key={product._id}
                onClick={() => addToCart(product)}
                className="group relative bg-white p-5 rounded-2xl border border-[#141414]/5 hover:border-[#FF6321] transition-all text-left flex flex-col justify-between h-40 shadow-sm hover:shadow-md"
              >
                <div>
                  <h3 className="font-bold text-lg leading-tight mb-1 group-hover:text-[#FF6321] transition-colors">{product.name}</h3>
                  <p className="text-xs text-gray-400 uppercase tracking-widest">{product.category}</p>
                </div>
                <div className="flex justify-between items-end">
                  <span className="font-mono text-sm font-semibold">
                    {product.basePrice.toLocaleString('vi-VN')}đ
                  </span>
                  <div className="w-8 h-8 bg-black text-white rounded-full flex items-center justify-center group-hover:bg-[#FF6321] transition-colors">
                    <Plus size={16} />
                  </div>
                </div>
              </motion.button>
            ))}
          </div>
        )}
      </div>

      {/* Cart Panel */}
      <div className="w-96 bg-white flex flex-col shadow-2xl z-10">
        <div className="p-6 border-bottom border-[#141414]/10 flex items-center justify-between bg-[#141414] text-white">
          <div className="flex items-center gap-2">
            <ShoppingCart size={20} className="text-[#FF6321]" />
            <h2 className="font-bold text-lg uppercase tracking-wider">Giỏ Hàng</h2>
          </div>
          <span className="bg-[#FF6321] text-black text-xs font-bold px-2 py-1 rounded-full">
            {cart.length} món
          </span>
        </div>

        <div className="flex-1 overflow-auto p-6">
          <AnimatePresence initial={false}>
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-gray-300">
                <Coffee size={48} className="mb-4 opacity-20" />
                <p className="italic serif">Chưa có món nào</p>
              </div>
            ) : (
              <div className="space-y-6">
                {cart.map((item) => (
                  <motion.div
                    layout
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    key={item.id}
                    className="flex flex-col gap-2 p-3 rounded-xl hover:bg-gray-50 transition-colors group"
                  >
                    <div className="flex justify-between items-start">
                      <h4 className="font-bold leading-none">{item.name}</h4>
                      <button onClick={() => removeFromCart(item.id)} className="text-gray-300 hover:text-red-500">
                        <Trash2 size={14} />
                      </button>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="font-mono text-xs text-gray-500">
                        {(item.price * item.quantity).toLocaleString('vi-VN')}đ
                      </span>
                      <div className="flex items-center gap-3 bg-gray-100 rounded-full px-2 py-1">
                        <button onClick={() => updateQuantity(item.id, -1)} className="hover:text-[#FF6321]">
                          <Minus size={14} />
                        </button>
                        <span className="font-mono text-sm font-bold min-w-[20px] text-center">{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.id, 1)} className="hover:text-[#FF6321]">
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

        <div className="p-6 bg-gray-50 border-t border-[#141414]/10">
          <div className="flex justify-between items-center mb-6">
            <span className="text-gray-500 uppercase text-xs font-bold tracking-widest">Tổng cộng</span>
            <span className="text-2xl font-bold font-mono">
              {total.toLocaleString('vi-VN')}đ
            </span>
          </div>

          <button
            disabled={cart.length === 0 || ordering}
            onClick={handleCheckout}
            className={cn(
              "w-full py-4 rounded-2xl font-bold text-lg transition-all flex items-center justify-center gap-2",
              cart.length === 0 ? "bg-gray-200 text-gray-400 cursor-not-allowed" : "bg-[#FF6321] text-black hover:bg-[#FF7A42] active:scale-95 shadow-lg shadow-[#FF6321]/20",
              ordering && "opacity-70"
            )}
          >
            {ordering ? (
              <div className="w-6 h-6 border-2 border-black/20 border-t-black rounded-full animate-spin" />
            ) : orderSuccess ? (
              <>
                <CheckCircle2 size={24} />
                <span>Đã xong!</span>
              </>
            ) : (
              "Thanh toán ngay"
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default POSPage;
