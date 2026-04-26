import React, { useState, useEffect } from 'react';
import api from '../lib/api';
import axios from 'axios';
import { ShoppingCart, Plus, Minus, Trash2, Coffee, CheckCircle2, Banknote, CreditCard, X, ChevronRight, LogOut, CircleDollarSign } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuthStore } from '../store/authStore';
import { useSocket } from '../hooks/useSocket';
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
  isSent?: boolean;
  orderId?: string;
}

interface Table {
  _id: string;
  name: string;
  status: 'EMPTY' | 'OCCUPIED';
  currentOrderId?: string;
}

const ProductCard: React.FC<{ product: Product, onAdd: () => void }> = ({ product, onAdd }) => (
  <motion.button
    whileHover={{ scale: 1.02 }}
    whileTap={{ scale: 0.98 }}
    onClick={onAdd}
    className="group bg-white p-4 rounded-2xl border border-slate-100 shadow-sm hover:border-emerald-200 hover:shadow-emerald-100/20 transition-all text-left flex flex-col justify-between h-44"
  >
    <div>
      <div className="w-full h-20 bg-slate-50 rounded-xl mb-3 flex items-center justify-center group-hover:bg-emerald-50 transition-colors overflow-hidden">
        {product.image ? (
          <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
        ) : (
          <Coffee className="text-slate-300 group-hover:text-emerald-300 transition-colors" />
        )}
      </div>
      <h3 className="font-bold text-slate-900 leading-tight group-hover:text-emerald-600 transition-colors line-clamp-1 text-sm uppercase tracking-tighter font-sans">{product.name}</h3>
    </div>
    <div className="flex justify-between items-end mt-2">
      <span className="text-emerald-600 font-extrabold text-sm font-mono">
        {product.basePrice.toLocaleString('vi-VN')}đ
      </span>
    </div>
  </motion.button>
);

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
  const [activeOrderId, setActiveOrderId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [settings, setSettings] = useState<any>(null);

  const [loading, setLoading] = useState(true);
  const [ordering, setOrdering] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  
  // Discount and Tax
  const [discountType, setDiscountType] = useState<'PERCENTAGE' | 'FIXED'>('FIXED');
  const [discountValue, setDiscountValue] = useState<number>(0);

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
  const [shiftNotes, setShiftNotes] = useState('');
  const [shiftSummary, setShiftSummary] = useState<any>(null);
  const [closing, setClosing] = useState(false);

  const fetchShiftSummary = async () => {
    try {
      const res = await api.get('/api/shifts/summary');
      setShiftSummary(res.data);
      // Auto-fill closing balance with expected to help user
      setClosingBalance(res.data.expectedBalance || 0);
    } catch (err) {
      console.error('Failed to fetch shift summary:', err);
    }
  };

  const generateOrderCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
       code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  };

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

  const socket = useSocket();

  useEffect(() => {
    fetchInitialData();
    
    // Refresh data when window regains focus to keep sync with Menu changes
    window.addEventListener('focus', fetchInitialData);

    if (socket) {
      socket.on('table:update', (updatedTable: any) => {
        setTables(prev => prev.map(t => t._id === updatedTable._id ? { ...t, ...updatedTable } : t));
        if (selectedTable?._id === updatedTable._id && updatedTable.status === 'EMPTY') {
          resetFlow();
        }
      });
      
      socket.on('order:new', (order: any) => {
        if (selectedTable?._id === order.tableId && step === 'MENU') {
           // Refresh active order data if we are currently in that table's menu
           handleTableSelect(selectedTable);
        }
      });

      socket.on('order:update', (order: any) => {
        if (selectedTable?._id === order.tableId && step === 'MENU') {
           handleTableSelect(selectedTable);
        }
      });

      // Also refresh products and settings if they change
      socket.on('product:update', fetchInitialData);
      socket.on('settings:update', fetchInitialData);
    }

    return () => {
      window.removeEventListener('focus', fetchInitialData);
      if (socket) {
        socket.off('table:update');
        socket.off('order:new');
        socket.off('order:update');
        socket.off('product:update');
        socket.off('settings:update');
      }
    };
  }, [socket]);

  const filteredProducts = products.filter(p => {
    const matchesCategory = selectedCategory === 'Tất cả' || p.category === selectedCategory;
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleTypeSelect = (type: 'DINE_IN' | 'TAKEAWAY' | 'DELIVERY') => {
    setOrderType(type);
    setStep('TABLE');
  };

  const handleTableSelect = async (table: Table) => {
    setSelectedTable(table);
    // Keep reference to current unsent items to merge later
    const unsentItems = cart.filter(item => !item.isSent);
    
    if (table.status === 'OCCUPIED') {
      setLoading(true);
      try {
        const res = await api.get(`/api/orders`);
        const allOrders = Array.isArray(res.data) ? res.data : [];
        const tableOrders = allOrders.filter((o: any) => o.tableId === table._id && o.status !== 'COMPLETED');
        
        if (tableOrders.length > 0) {
          // Flatten all items from all active orders
          const allItems = tableOrders.flatMap((o: any) => o.items.map((item: any) => ({
            id: item.productId,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            isSent: true
          })));

          // Consolidate identical items
          const consolidatedCart: CartItem[] = [];
          allItems.forEach(item => {
            const existing = consolidatedCart.find(c => c.id === item.id && c.isSent === item.isSent);
            if (existing) {
              existing.quantity += item.quantity;
            } else {
              consolidatedCart.push({ ...item });
            }
          });

          // If multiple orders exist, merge them into the last one for a single source of truth
          if (tableOrders.length > 1) {
            const lastOrder = tableOrders[tableOrders.length - 1];
            await api.patch(`/api/orders/${lastOrder._id}`, {
              items: consolidatedCart.filter(i => i.isSent).map(i => ({
                productId: i.id,
                name: i.name,
                price: i.price,
                quantity: i.quantity
              })),
              subtotal: consolidatedCart.reduce((s, i) => s + i.price * i.quantity, 0),
              total: consolidatedCart.reduce((s, i) => s + i.price * i.quantity, 0)
            });
            
            await Promise.all(tableOrders.slice(0, -1).map(o => 
              api.patch(`/api/orders/${o._id}`, { status: 'COMPLETED', total: 0, items: [] })
            ));
          }

          // MERGE with local unsent items
          unsentItems.forEach(u => {
            const existing = consolidatedCart.find(c => c.id === u.id && !c.isSent);
            if (existing) {
              existing.quantity += u.quantity;
            } else {
              consolidatedCart.push({ ...u });
            }
          });

          setCart(consolidatedCart);
          setActiveOrderId(tableOrders[tableOrders.length - 1]._id);
          
          setDiscountType(tableOrders[0].discountType || 'FIXED');
          setDiscountValue(tableOrders.reduce((sum, o) => sum + (o.discountValue || 0), 0));
        } else {
          setCart(tableCarts[table._id] || unsentItems);
          setActiveOrderId(null);
        }
      } catch (err) {
        console.error('Failed to fetch table order:', err);
        setCart(tableCarts[table._id] || unsentItems);
      } finally {
        setLoading(false);
      }
    } else {
      setCart(tableCarts[table._id] || unsentItems);
      setActiveOrderId(null);
    }
    setStep('MENU');
  };

  // Sync cart to tableCarts whenever it changes
  useEffect(() => {
    if (selectedTable && step === 'MENU') {
      setTableCarts(prev => ({ ...prev, [selectedTable._id]: cart }));
    }
  }, [cart, selectedTable, step]);

  const handlePrintProvisional = () => {
    if (cart.length === 0) return;
    
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const qrUrl = settings?.bankCode 
      ? `https://img.vietqr.io/image/${settings.bankCode}-${settings.bankAccount}-compact2.png?amount=${total}&addInfo=TT%20BAN%20${selectedTable?.name || ''}&accountName=${encodeURIComponent(settings.bankAccountHolder || '')}`
      : null;

    const templateId = settings?.defaultPrintTemplate || 'classic';
    
    // Simple template mapping for demo
    const isModern = templateId === 'modern';
    const isMinimal = templateId === 'minimal';
    const isRetro = templateId === 'retro';
    const isElegant = templateId === 'elegant';

    printWindow.document.write(`
      <html>
        <head>
          <title>Phiếu Tạm Tính</title>
          <style>
            body { 
              font-family: ${isRetro ? 'monospace' : 'sans-serif'}; 
              padding: 20px; 
              line-height: 1.4; 
              font-size: 14px; 
              ${isMinimal ? 'color: #333;' : ''}
              width: 300px;
              margin: 0 auto;
            }
            .header { text-align: center; margin-bottom: 20px; ${isElegant ? 'border-bottom: 2px solid #000; padding-bottom: 10px;' : ''} }
            .store-name { font-size: ${isModern ? '24px' : '20px'}; font-weight: bold; text-transform: uppercase; }
            .order-info { margin: 10px 0; border-bottom: 1px dashed #ccc; padding-bottom: 10px; font-size: 12px; }
            .item-row { display: flex; justify-content: space-between; margin: 5px 0; }
            .totals { margin-top: 20px; border-top: 1px solid #eee; padding-top: 10px; }
            .total-row { display: flex; justify-content: space-between; font-weight: bold; margin: 3px 0; }
            .grand-total { font-size: 18px; margin-top: 10px; border-top: 1px double #333; padding-top: 10px; }
            .qr-container { text-align: center; margin-top: 20px; }
            .qr-container img { width: 150px; h-auto; }
            .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #666; font-style: italic; }
            ${isRetro ? '.item-row { border-bottom: 1px dotted #ccc; }' : ''}
          </style>
        </head>
        <body>
          <div class="header">
            <div class="store-name">${settings?.storeName || 'SAIGON AN COFFEE'}</div>
            <div style="font-size: 10px;">${settings?.address || ''}</div>
            <div style="font-size: 10px;">Hotline: ${settings?.hotline || ''}</div>
            <h3 style="margin-top: 15px; text-transform: uppercase;">Phiếu Tạm Tính</h3>
          </div>

          <div class="order-info">
            <div>Bàn: <b>${selectedTable?.name || 'Mang về'}</b></div>
            <div>Giờ vào: ${new Date().toLocaleTimeString('vi-VN')}</div>
            <div>Nhân viên: ${useAuthStore.getState().user?.name || ''}</div>
          </div>

          <div class="items">
            ${cart.map(item => `
              <div class="item-row">
                <span>${item.name} x${item.quantity}</span>
                <span>${(item.price * item.quantity).toLocaleString('vi-VN')}đ</span>
              </div>
            `).join('')}
          </div>

          <div class="totals">
            <div class="total-row">
              <span>Tạm tính:</span>
              <span>${subtotal.toLocaleString('vi-VN')}đ</span>
            </div>
            ${discountAmount > 0 ? `
              <div class="total-row">
                <span>Giảm giá:</span>
                <span>-${discountAmount.toLocaleString('vi-VN')}đ</span>
              </div>
            ` : ''}
            ${taxAmount > 0 ? `
              <div class="total-row">
                <span>Thuế (${taxRate}%):</span>
                <span>${taxAmount.toLocaleString('vi-VN')}đ</span>
              </div>
            ` : ''}
            <div class="total-row grand-total">
              <span>TỔNG CỘNG:</span>
              <span>${total.toLocaleString('vi-VN')}đ</span>
            </div>
          </div>

          ${qrUrl ? `
            <div class="qr-container">
              <p style="font-size: 10px; font-weight: bold; margin-bottom: 10px;">QUÉT MÃ ĐỂ THANH TOÁN</p>
              <img src="${qrUrl}" alt="QR Thanh toán" />
            </div>
          ` : ''}

          <div class="footer">
            <p>Đây là phiếu tạm tính, chưa phải hóa đơn thanh toán.</p>
            <p>Cảm ơn quý khách và hẹn gặp lại!</p>
          </div>

          <script>window.print(); setTimeout(() => window.close(), 500);</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const resetFlow = () => {
    setStep('TYPE');
    setOrderType(null);
    setSelectedTable(null);
    setCart([]);
    setShowPaymentModal(false);
    setPaymentMethod(null);
    setPaymentStep('SELECT');
    setActiveOrderId(null);
  };

  const filteredTables = tables.filter(t => {
    if (orderType === 'DINE_IN') return t.name.startsWith('Bàn');
    if (orderType === 'TAKEAWAY') return t.name.startsWith('Mang về');
    if (orderType === 'DELIVERY') return t.name.startsWith('Ship');
    return true;
  });

  const addToCart = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === product._id && !item.isSent);
      if (existing) {
        return prev.map((item) =>
          (item.id === product._id && !item.isSent) ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { id: product._id, name: product.name, price: product.basePrice, quantity: 1, isSent: false }];
    });
  };

  const handleSendToKitchen = async () => {
    const unsentItems = cart.filter(item => !item.isSent);
    if (unsentItems.length === 0 || !selectedTable) return;
    
    setOrdering(true);
    try {
      const orderData = {
        orderType: orderType,
        tableId: selectedTable._id,
        items: unsentItems.map((item) => ({
          productId: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
        })),
        subtotal: unsentItems.reduce((s, i) => s + i.price * i.quantity, 0),
        total: unsentItems.reduce((s, i) => s + i.price * i.quantity, 0),
        status: 'PENDING',
        paymentStatus: 'UNPAID'
      };

      await api.post('/api/orders', orderData);
      
      // Update cart to mark these items as sent
      setCart(prev => prev.map(item => ({ ...item, isSent: true })));
      
      // If we weren't occupied, we are now
      if (selectedTable.status === 'EMPTY') {
        setSelectedTable({ ...selectedTable, status: 'OCCUPIED' });
      }
    } catch (error) {
      console.error('Failed to send to kitchen:', error);
      alert('Lỗi khi báo bếp');
    } finally {
      setOrdering(false);
    }
  };

  const updateQuantity = async (id: string, delta: number) => {
    const itemToUpdate = cart.find(i => i.id === id);
    const isSentItem = itemToUpdate?.isSent;
    
    setCart((prev) => {
      const updated = prev
        .map((item) =>
          item.id === id ? { ...item, quantity: Math.max(0, item.quantity + delta) } : item
        )
        .filter((item) => item.quantity > 0);
      
      // Sync with DB if it's a sent item and we have an active order
      if (isSentItem && activeOrderId && selectedTable) {
        const sentItems = updated.filter(i => i.isSent);
        if (sentItems.length === 0) {
          // If no items left, we might want to delete the order or mark it completed
          api.delete(`/api/orders/${activeOrderId}`).catch(err => console.error(err));
          // If the whole cart is empty, reset table
          if (updated.length === 0) {
            api.patch(`/api/tables/${selectedTable._id}`, { status: 'EMPTY' }).catch(err => console.error(err));
            setStep('TABLE');
            setSelectedTable(null);
            setActiveOrderId(null);
          }
        } else {
          api.patch(`/api/orders/${activeOrderId}`, {
            items: sentItems.map(i => ({
              productId: i.id,
              name: i.name,
              price: i.price,
              quantity: i.quantity
            })),
            subtotal: sentItems.reduce((s, i) => s + i.price * i.quantity, 0),
            total: sentItems.reduce((s, i) => s + i.price * i.quantity, 0)
          }).catch(err => console.error('Failed to sync updated quantity:', err));
        }
      }
      
      return updated;
    });
  };

  const removeFromCart = async (id: string) => {
    const itemToRemove = cart.find(i => i.id === id);
    const isSentItem = itemToRemove?.isSent;

    setCart((prev) => {
      const updated = prev.filter((item) => item.id !== id);

      // Sync with DB if it's a sent item and we have an active order
      if (isSentItem && activeOrderId && selectedTable) {
        const sentItems = updated.filter(i => i.isSent);
        if (sentItems.length === 0) {
          api.delete(`/api/orders/${activeOrderId}`).catch(err => console.error(err));
          if (updated.length === 0) {
            api.patch(`/api/tables/${selectedTable._id}`, { status: 'EMPTY' }).catch(err => console.error(err));
            setStep('TABLE');
            setSelectedTable(null);
            setActiveOrderId(null);
          }
        } else {
          api.patch(`/api/orders/${activeOrderId}`, {
            items: sentItems.map(i => ({
              productId: i.id,
              name: i.name,
              price: i.price,
              quantity: i.quantity
            })),
            subtotal: sentItems.reduce((s, i) => s + i.price * i.quantity, 0),
            total: sentItems.reduce((s, i) => s + i.price * i.quantity, 0)
          }).catch(err => console.error('Failed to sync removed item:', err));
        }
      }

      return updated;
    });
  };

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const taxRate = settings?.taxRate || 0;
  
  const discountAmount = discountType === 'PERCENTAGE' 
    ? (subtotal * discountValue) / 100 
    : discountValue;
    
  const taxAmount = ((subtotal - discountAmount) * taxRate) / 100;
  const total = subtotal - discountAmount + taxAmount;

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
      // Find all active orders for this table to complete them
      const res = await api.get('/api/orders');
      const allOrders = Array.isArray(res.data) ? res.data : [];
      const tableOrders = allOrders.filter((o: any) => o.tableId === selectedTable?._id && o.status !== 'COMPLETED');
      
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
        subtotal: subtotal,
        taxRate: taxRate,
        taxAmount: taxAmount,
        discountAmount: discountAmount,
        discountType: discountType,
        discountValue: discountValue,
        total: total,
        paymentMethod: method,
        status: 'COMPLETED',
        paymentStatus: 'PAID'
      };

      // We complete all orders for the table. 
      // If there are multiple, we update them all to COMPLETED.
      // We also create/update one of them with the final receipt details or handle as needed.
      // Best approach: Mark all existing as COMPLETED, and if new items were added (not yet in DB), 
      // we've already handled the aggregation in 'cart'.
      
      await Promise.all(tableOrders.map(o => 
        api.patch(`/api/orders/${o._id}`, { status: 'COMPLETED', paymentStatus: 'PAID' })
      ));

      // If we had a cart that included items not yet in ANY order, we should probably create a "Final" order 
      // or ensure all items were sent to kitchen first.
      // But based on handleSendToKitchen, all items should be isSent: true before checkout if we follow the flow.
      // To be safe, if there's no active order but we have a cart, we create a new one.
      if (tableOrders.length === 0) {
        await api.post('/api/orders', orderData);
      } else {
        // Update the last one with full details for record keeping
        await api.patch(`/api/orders/${tableOrders[tableOrders.length - 1]._id}`, orderData);
      }
      
      // Print Final Invoice
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        const qrUrl = (method === 'TRANSFER' && settings?.bankCode)
          ? `https://img.vietqr.io/image/${settings.bankCode}-${settings.bankAccount}-compact2.png?amount=${total}&addInfo=TT%20BAN%20${selectedTable?.name || ''}&accountName=${encodeURIComponent(settings.bankAccountHolder || '')}`
          : null;

        const templateId = settings?.defaultPrintTemplate || 'classic';
        const isModern = templateId === 'modern';
        const isMinimal = templateId === 'minimal';
        const isRetro = templateId === 'retro';
        const isElegant = templateId === 'elegant';

        printWindow.document.write(`
          <html>
            <head>
              <title>Hóa Đơn Thanh Toán</title>
              <style>
                body { 
                  font-family: ${isRetro ? 'monospace' : 'sans-serif'}; 
                  padding: 20px; 
                  line-height: 1.4; 
                  font-size: 14px; 
                  width: 300px;
                  margin: 0 auto;
                }
                .header { text-align: center; margin-bottom: 20px; ${isElegant ? 'border-bottom: 2px solid #000; padding-bottom: 10px;' : ''} }
                .store-name { font-size: 20px; font-weight: bold; text-transform: uppercase; }
                .order-info { margin: 10px 0; border-bottom: 1px dashed #ccc; padding-bottom: 10px; font-size: 12px; }
                .item-row { display: flex; justify-content: space-between; margin: 3px 0; }
                .totals { margin-top: 15px; border-top: 1px solid #eee; padding-top: 10px; }
                .total-row { display: flex; justify-content: space-between; font-weight: bold; margin: 2px 0; }
                .grand-total { font-size: 18px; border-top: 1px double #333; margin-top: 10px; padding-top: 10px; }
                .qr-container { text-align: center; margin-top: 20px; }
                .qr-container img { width: 150px; h-auto; }
                .footer { text-align: center; margin-top: 30px; font-size: 10px; color: #666; }
              </style>
            </head>
            <body>
              <div class="header">
                <div class="store-name">${settings?.storeName || 'SAIGON AN COFFEE'}</div>
                <div style="font-size: 10px;">${settings?.address || ''}</div>
                <h3 style="margin-top: 10px; text-transform: uppercase;">Hóa Đơn Thanh Toán</h3>
              </div>

              <div class="order-info">
                <div>Mã Đơn: <b>${orderCode}</b></div>
                <div>Bàn: <b>${selectedTable?.name || 'Mang về'}</b></div>
                <div>Ngày: ${new Date().toLocaleString('vi-VN')}</div>
                <div>PTTT: <b>${method === 'CASH' ? 'Tiền mặt' : 'Chuyển khoản'}</b></div>
              </div>

              <div class="items">
                ${cart.map(item => `
                  <div class="item-row">
                    <span>${item.name} x${item.quantity}</span>
                    <span>${(item.price * item.quantity).toLocaleString('vi-VN')}đ</span>
                  </div>
                `).join('')}
              </div>

              <div class="totals">
                <div class="total-row"><span>Tạm tính:</span><span>${subtotal.toLocaleString('vi-VN')}đ</span></div>
                ${discountAmount > 0 ? `<div class="total-row"><span>Giảm giá:</span><span>-${discountAmount.toLocaleString('vi-VN')}đ</span></div>` : ''}
                ${taxAmount > 0 ? `<div class="total-row"><span>Thuế (${taxRate}%):</span><span>${taxAmount.toLocaleString('vi-VN')}đ</span></div>` : ''}
                <div class="total-row grand-total"><span>TỔNG CỘNG:</span><span>${total.toLocaleString('vi-VN')}đ</span></div>
              </div>

              ${qrUrl ? `
                <div class="qr-container">
                  <p style="font-size: 9px; font-weight: bold;">MÃ QR THANH TOÁN (ĐÃ GIAO DỊCH)</p>
                  <img src="${qrUrl}" alt="QR" />
                </div>
              ` : ''}

              <div class="footer">
                <p>Cảm ơn quý khách! Hẹn gặp lại.</p>
                <p>Bản in từ hệ thống PosApp</p>
              </div>
              <script>window.print(); setTimeout(() => window.close(), 500);</script>
            </body>
          </html>
        `);
        printWindow.document.close();
      }

      setOrderSuccess(true);
      setShowPaymentModal(false);

      // Clear the cart for this table in localStorage
      if (selectedTable) {
        setTableCarts(prev => {
          const newCarts = { ...prev };
          delete newCarts[selectedTable._id];
          return newCarts;
        });
      }
      
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

  const handleCloseShiftInitiate = async () => {
    const active = getActiveTables();
    if (active.length > 0) {
      setShowShiftWarning(true);
    } else {
      await fetchShiftSummary();
      setShowCloseShiftModal(true);
    }
  };

  const handleCloseShift = async () => {
    setClosing(true);
    try {
      const activeTables = getActiveTables();
      const reportData = await closeShift(closingBalance, shiftNotes, activeTables.length);
      
      // Print report
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        const productRows = reportData.productSales?.map((p: any) => `
          <div class="row">
            <span>${p.name} (x${p.quantity})</span>
            <b>${p.amount.toLocaleString('vi-VN')}đ</b>
          </div>
        `).join('') || '';

        printWindow.document.write(`
          <html>
            <head>
              <title>Báo Cáo Chốt Ca</title>
              <style>
                body { font-family: sans-serif; padding: 20px; line-height: 1.4; font-size: 14px; }
                .header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #000; padding-bottom: 10px; }
                .section-title { font-weight: bold; text-transform: uppercase; margin-top: 15px; border-bottom: 1px solid #eee; padding-bottom: 5px; font-size: 12px; color: #666; }
                .row { display: flex; justify-content: space-between; margin: 5px 0; border-bottom: 1px dashed #eee; }
                .footer { margin-top: 30px; text-align: center; font-size: 11px; color: #999; }
                h2 { margin: 0; }
                .highlight { background: #f9f9f9; padding: 10px; border-radius: 5px; margin: 10px 0; }
                .notes { font-style: italic; color: #666; margin-top: 10px; padding: 10px; background: #fff8e1; border-left: 4px solid #ffc107; }
              </style>
            </head>
            <body>
              <div class="header">
                <h2>BÁO CÁO KẾT THÚC CA</h2>
                <div style="font-weight: bold; margin-top: 5px;">MÃ CA: ${reportData.code}</div>
                <div>${new Date().toLocaleString('vi-VN')}</div>
              </div>
              <div class="row"><span>Nhân viên:</span> <b>${reportData.userName}</b></div>
              <div class="row"><span>Thời gian:</span> <span>${new Date(reportData.startTime).toLocaleTimeString('vi-VN')} - ${new Date(reportData.endTime).toLocaleTimeString('vi-VN')}</span></div>
              
              <div class="section-title">Tổng hợp doanh thu</div>
              <div class="row"><span>Tiền đầu ca:</span> <span>${reportData.openingBalance.toLocaleString('vi-VN')}đ</span></div>
              <div class="row"><span>Doanh thu Tiền mặt:</span> <span>${reportData.cashSales?.toLocaleString('vi-VN') || 0}đ</span></div>
              <div class="row"><span>Doanh thu Chuyển khoản:</span> <span>${reportData.transferSales?.toLocaleString('vi-VN') || 0}đ</span></div>
              <div class="row" style="font-weight: bold;"><span>TỔNG DOANH THU:</span> <span>${reportData.totalSales.toLocaleString('vi-VN')}đ</span></div>
              
              <div class="section-title">Kiểm kê tiền mặt</div>
              <div class="row"><span>Tiền mặt theo hệ thống:</span> <b>${(reportData.openingBalance + (reportData.cashSales || 0)).toLocaleString('vi-VN')}đ</b></div>
              <div class="row"><span>Tiền mặt thực tế:</span> <b>${reportData.closingBalance.toLocaleString('vi-VN')}đ</b></div>
              <div class="row" style="color: ${reportData.closingBalance - (reportData.openingBalance + (reportData.cashSales || 0)) === 0 ? 'black' : 'red'};">
                <span>Chênh lệch:</span> 
                <b>${(reportData.closingBalance - (reportData.openingBalance + (reportData.cashSales || 0))).toLocaleString('vi-VN')}đ</b>
              </div>

              ${reportData.notes ? `<div class="notes"><b>Ghi chú:</b> ${reportData.notes}</div>` : ''}

              <div class="section-title">Chi tiết sản phẩm bán ra</div>
              ${productRows}

              <div class="highlight">
                <div class="row"><span>Bàn giao bàn đang phục vụ:</span> <b>${activeTables.length} bàn</b></div>
              </div>

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
      setShiftNotes('');
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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                {[
                  { id: 'DINE_IN', label: 'Tại chỗ', icon: '🏠', color: 'bg-emerald-600', action: () => handleTypeSelect('DINE_IN') },
                  { id: 'TAKEAWAY', label: 'Mang về', icon: '🥡', color: 'bg-slate-900', action: () => handleTypeSelect('TAKEAWAY') },
                  { id: 'DELIVERY', label: 'Ship đi', icon: '🛵', color: 'bg-emerald-400', action: () => handleTypeSelect('DELIVERY') },
                  { id: 'SHIFT', label: 'Chốt ca', icon: '💰', color: 'bg-rose-500', action: handleCloseShiftInitiate }
                ].map((t, idx) => (
                  <button
                    key={`type-${t.id}-${idx}`}
                    onClick={t.action}
                    className={cn(
                      "group bg-white p-10 rounded-[32px] border border-slate-100 shadow-xl shadow-slate-200/50 hover:border-emerald-500 hover:scale-[1.05] transition-all flex flex-col items-center gap-6",
                      t.id === 'SHIFT' && "hover:border-rose-500"
                    )}
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
                      className={cn(
                        "p-6 rounded-[24px] border-2 font-bold text-lg transition-all flex flex-col items-center gap-2 relative overflow-hidden group",
                        table.status === 'OCCUPIED' 
                          ? "bg-emerald-50 border-emerald-400 text-emerald-900 shadow-lg shadow-emerald-100/50"
                          : hasItems
                            ? "bg-amber-50 border-amber-400 text-amber-900 shadow-lg shadow-amber-100/50"
                            : "bg-white border-slate-100 hover:border-emerald-500 hover:bg-emerald-50/10 text-slate-900"
                      )}
                    >
                      <div className={cn(
                        "text-[9px] uppercase tracking-widest font-black px-2 py-0.5 rounded-full",
                        table.status === 'OCCUPIED'
                          ? "bg-emerald-600 text-white animate-pulse"
                          : hasItems
                            ? "bg-amber-400 text-white animate-pulse"
                            : "bg-slate-100 text-slate-400"
                      )}>
                        {table.status === 'OCCUPIED' ? 'Phục vụ' : hasItems ? 'Phục vụ' : 'Trống'}
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
                      <button 
                        onClick={async () => {
                          const hasUnsent = cart.some(i => !i.isSent);
                          if (hasUnsent) {
                            await handleSendToKitchen();
                          }
                          setStep('TABLE');
                        }} 
                        className="p-3 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 shadow-sm"
                      >
                        <Plus className="rotate-45 text-slate-400" />
                      </button>
                      <div>
                        <h1 className="text-2xl font-black text-slate-900 tracking-tighter uppercase">{selectedTable?.name}</h1>
                        <div className="flex items-center gap-2">
                          <p className="text-emerald-600 text-[10px] font-black uppercase tracking-widest">{orderType?.replace('_', ' ')}</p>
                          <span className="text-slate-300">|</span>
                          <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Ca: {shift?.code}</p>
                        </div>
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

              <div className="flex-1 overflow-auto pb-8 scrollbar-hide">
                {selectedCategory === 'Tất cả' && !searchQuery ? (
                  categories.filter(c => c !== 'Tất cả').map((cat) => {
                    const catProducts = products.filter(p => p.category === cat);
                    if (catProducts.length === 0) return null;
                    return (
                      <div key={`cat-group-${cat}`} className="mb-8">
                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-4 border-b border-slate-100 pb-2">{cat}</h3>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                          {catProducts.map((product, idx) => (
                            <ProductCard key={`${cat}-${product._id}-${idx}`} product={product} onAdd={() => addToCart(product)} />
                          ))}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    {filteredProducts.map((product, idx) => (
                      <ProductCard key={`filtered-${product._id}-${idx}`} product={product} onAdd={() => addToCart(product)} />
                    ))}
                  </div>
                )}
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
              <div className="space-y-3 mb-6">
                <div className="flex justify-between items-center text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  <span>Tạm tính</span>
                  <span className="text-slate-600 font-mono italic">{subtotal.toLocaleString('vi-VN')}đ</span>
                </div>
                
                {/* Discount Section */}
                <div className="flex flex-col gap-2">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Giảm giá</span>
                    <div className="flex items-center gap-1">
                      <button 
                        onClick={() => setDiscountType(discountType === 'PERCENTAGE' ? 'FIXED' : 'PERCENTAGE')}
                        className="text-[9px] font-black bg-slate-100 px-2 py-0.5 rounded text-slate-500 hover:bg-emerald-50 hover:text-emerald-600 transition-colors"
                      >
                        {discountType === 'PERCENTAGE' ? '%' : 'VNĐ'}
                      </button>
                      <input 
                        type="number"
                        value={discountValue}
                        onChange={(e) => setDiscountValue(Number(e.target.value))}
                        className="w-16 bg-slate-50 border-none rounded text-right text-xs font-black text-emerald-600 p-1 focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>
                  </div>
                </div>

                {taxRate > 0 && (
                  <div className="flex justify-between items-center text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    <span>Thuế ({taxRate}%)</span>
                    <span className="text-slate-600 font-mono italic">{taxAmount.toLocaleString('vi-VN')}đ</span>
                  </div>
                )}

                <div className="flex justify-between items-end pt-2 border-t border-dashed border-slate-100">
                  <span className="text-[11px] font-black text-slate-900 uppercase tracking-widest">Tổng cộng</span>
                  <span className="text-3xl font-black text-emerald-600 tracking-tighter font-mono">
                    {total.toLocaleString('vi-VN')}đ
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-3">
                <button
                  disabled={cart.length === 0 || !cart.some(i => !i.isSent) || ordering}
                  onClick={handleSendToKitchen}
                  className="py-3 bg-white border border-slate-200 text-slate-600 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
                >
                  <Coffee size={14} />
                  <span>Báo bếp</span>
                </button>
                <button
                  disabled={cart.length === 0}
                  onClick={handlePrintProvisional}
                  className="py-3 bg-white border border-slate-200 text-slate-600 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
                >
                  <Plus className="rotate-45" size={14} />
                  <span>In tạm tính</span>
                </button>
                <button
                  disabled={cart.length === 0}
                  onClick={() => {/* Custom note logic if needed */}}
                  className="py-3 bg-white border border-slate-200 text-slate-600 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
                >
                  <CircleDollarSign size={14} />
                  <span>Ghi chú</span>
                </button>
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
                    onClick={async () => {
                      setShowShiftWarning(false);
                      await fetchShiftSummary();
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
                      <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-1">Tổng kết doanh thu và tiền mặt</p>
                   </div>
                </div>

                <div className="space-y-6">
                  <div className="bg-slate-50 p-6 rounded-3xl space-y-4">
                    {shiftSummary && (
                      <div className="space-y-2 mb-4">
                        <div className="flex justify-between items-center text-[10px]">
                          <span className="text-slate-400 font-bold uppercase tracking-widest">Tiền đầu ca</span>
                          <span className="font-bold text-slate-700">{shiftSummary.openingBalance.toLocaleString('vi-VN')}đ</span>
                        </div>
                        <div className="flex justify-between items-center text-[10px]">
                          <span className="text-slate-400 font-bold uppercase tracking-widest">Doanh thu Tiền mặt</span>
                          <span className="font-bold text-emerald-600">+{shiftSummary.cashSales.toLocaleString('vi-VN')}đ</span>
                        </div>
                        <div className="flex justify-between items-center text-[10px]">
                          <span className="text-slate-400 font-bold uppercase tracking-widest">Doanh thu Chuyển khoản</span>
                          <span className="font-bold text-blue-600">+{shiftSummary.transferSales.toLocaleString('vi-VN')}đ</span>
                        </div>
                        <div className="h-px bg-slate-100" />
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-slate-900 font-black uppercase tracking-tight">Tiền mặt hệ thống</span>
                          <span className="font-black text-slate-900">{shiftSummary.expectedBalance.toLocaleString('vi-VN')}đ</span>
                        </div>
                      </div>
                    )}

                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Tiền mặt thực thực tế</label>
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

                    {shiftSummary && closingBalance !== shiftSummary.expectedBalance && (
                      <motion.div 
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-3"
                      >
                        <div className="flex justify-between items-center p-3 bg-rose-50 rounded-xl border border-rose-100 italic">
                          <span className="text-[10px] font-bold text-rose-600 uppercase tracking-widest">Chênh lệch:</span>
                          <span className="text-sm font-black text-rose-600 font-mono">
                            {(closingBalance - shiftSummary.expectedBalance).toLocaleString('vi-VN')}đ
                          </span>
                        </div>
                        
                        <div className="space-y-1">
                          <label className="text-[10px] font-black text-rose-600 uppercase tracking-widest px-1">Ghi chú giải trình (Bắt buộc)</label>
                          <textarea 
                            value={shiftNotes}
                            onChange={(e) => setShiftNotes(e.target.value)}
                            placeholder="Nhập lý do chênh lệch tiền mặt..."
                            className="w-full p-4 bg-white rounded-2xl border border-rose-100 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-rose-500 text-slate-900 min-h-[80px]"
                          />
                        </div>
                      </motion.div>
                    )}
                  </div>

                  <button 
                    onClick={handleCloseShift}
                    disabled={closing || (shiftSummary && closingBalance !== shiftSummary.expectedBalance && !shiftNotes.trim())}
                    className="w-full h-16 bg-rose-600 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-rose-700 transition-all shadow-xl shadow-rose-100 flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed"
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
