import React, { useState, useEffect, useRef } from 'react';
import api from '../lib/api';
import { Coffee, Plus, Search, Upload, Download, Edit2, Trash2, X, Save, Image as ImageIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import * as XLSX from 'xlsx';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface Product {
  _id: string;
  name: string;
  category: string;
  basePrice: number;
  image?: string;
}

const MenuPage = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('Tất cả');
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const importInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchProducts();
    
    window.addEventListener('focus', fetchProducts);
    return () => window.removeEventListener('focus', fetchProducts);
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await api.get('/api/products');
      const productsData = Array.isArray(res.data) ? res.data : [];
      setProducts(productsData);
      
      const rawCategories = productsData.map((p: Product) => p.category).filter(Boolean);
      const uniqueCats = Array.from(new Set(rawCategories as string[]));
      setCategories(['Tất cả', ...uniqueCats.filter(c => c !== 'Tất cả')]);
    } catch (err) {
      console.error('Failed to fetch products:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    const exportData = products.map(({ name, category, basePrice }) => ({
      'Tên sản phẩm': name,
      'Danh mục': category,
      'Giá cơ bản': basePrice
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Menu');
    XLSX.writeFile(wb, 'Menu_Cua_Hang.xlsx');
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      const bstr = evt.target?.result;
      const wb = XLSX.read(bstr, { type: 'binary' });
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      const data = XLSX.utils.sheet_to_json(ws);

      const formattedData = data
        .map((item: any) => ({
          name: item['Tên sản phẩm'] || item['Name'],
          category: item['Danh mục'] || item['Category'] || 'Khác',
          basePrice: Number(item['Giá cơ bản'] || item['Price'] || 0)
        }))
        .filter(item => item.name && item.name.trim() !== '');

      if (formattedData.length === 0) {
        alert('Không tìm thấy dữ liệu hợp lệ trong file. Vui lòng kiểm tra tiêu đề cột (Tên sản phẩm, Danh mục, Giá cơ bản).');
        return;
      }

      try {
        await api.post('/api/products', formattedData);
        fetchProducts();
        alert(`Import thành công ${formattedData.length} sản phẩm!`);
      } catch (err: any) {
        console.error('Import failed:', err);
        const errorMsg = err.response?.data?.error || err.message || 'Lỗi không xác định';
        alert(`Import thất bại: ${errorMsg}`);
      }
    };
    reader.readAsBinaryString(file);
    if (importInputRef.current) importInputRef.current.value = '';
  };

  const handleSaveProduct = async () => {
    if (!editingProduct?.name || !editingProduct?.basePrice) {
      alert('Vui lòng điền đủ tên và giá');
      return;
    }

    try {
      if (editingProduct._id) {
        await api.put(`/api/products/${editingProduct._id}`, editingProduct);
      } else {
        await api.post('/api/products', editingProduct);
      }
      setIsModalOpen(false);
      fetchProducts();
    } catch (err) {
      console.error('Save product failed:', err);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!confirm('Bạn có chắc muốn xóa món này?')) return;
    try {
      await api.delete(`/api/products/${id}`);
      fetchProducts();
    } catch (err) {
      console.error('Delete product failed:', err);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setEditingProduct(prev => prev ? { ...prev, image: reader.result as string } : null);
    };
    reader.readAsDataURL(file);
  };

  const filteredProducts = products.filter(p => {
    const matchesCategory = selectedCategory === 'Tất cả' || p.category === selectedCategory;
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="p-8 h-full flex flex-col gap-6">
      <header className="flex justify-between items-end">
        <div>
          <p className="text-emerald-600 font-bold text-sm uppercase tracking-widest mb-1">Quản lý Menu</p>
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter">Danh sách món ăn</h1>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => {
              setEditingProduct({ name: '', category: '', basePrice: 0 });
              setIsModalOpen(true);
            }}
            className="flex items-center gap-2 bg-emerald-600 text-white px-5 py-3 rounded-xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100"
          >
            <Plus size={20} />
            Thêm món mới
          </button>
          <button 
            onClick={() => importInputRef.current?.click()}
            className="flex items-center gap-2 bg-white text-slate-700 border border-slate-200 px-5 py-3 rounded-xl font-bold hover:bg-slate-50 transition-all"
          >
            <Upload size={20} />
            Import
          </button>
          <input type="file" ref={importInputRef} onChange={handleImport} accept=".xlsx, .xls" className="hidden" />
          <button 
            onClick={handleExport}
            className="flex items-center gap-2 bg-white text-slate-700 border border-slate-200 px-5 py-3 rounded-xl font-bold hover:bg-slate-50 transition-all"
          >
            <Download size={20} />
            Export
          </button>
        </div>
      </header>

      <div className="flex flex-col gap-4">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input 
            type="text"
            placeholder="Tìm kiếm sản phẩm..."
            className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-lg font-medium"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex gap-2 overflow-auto pb-2 -mx-1 px-1 no-scrollbar">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={cn(
                "px-5 py-2.5 rounded-xl font-bold uppercase tracking-widest text-[10px] border transition-all whitespace-nowrap",
                selectedCategory === cat 
                  ? "bg-slate-900 border-slate-900 text-white shadow-lg shadow-slate-200" 
                  : "bg-white border-slate-100 text-slate-400 hover:border-slate-200 hover:text-slate-600"
              )}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-auto bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Hình ảnh</th>
              <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Tên món</th>
              <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Danh mục</th>
              <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Giá</th>
              <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredProducts.map((product) => (
              <tr key={product._id} className="hover:bg-slate-50/50 transition-colors group">
                <td className="px-6 py-4">
                  <div className="w-16 h-16 bg-slate-100 rounded-xl flex items-center justify-center overflow-hidden">
                    {product.image ? (
                      <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                    ) : (
                      <Coffee className="text-slate-300" />
                    )}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <p className="font-bold text-slate-900 uppercase tracking-tighter">{product.name}</p>
                </td>
                <td className="px-6 py-4">
                  <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-lg text-xs font-black uppercase tracking-widest">
                    {product.category}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <p className="font-black text-emerald-600 font-mono">
                    {product.basePrice.toLocaleString('vi-VN')}đ
                  </p>
                </td>
                <td className="px-6 py-4 text-center">
                  <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => {
                        setEditingProduct(product);
                        setIsModalOpen(true);
                      }}
                      className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button 
                      onClick={() => handleDeleteProduct(product._id)}
                      className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filteredProducts.length === 0 && !loading && (
              <tr>
                <td colSpan={5} className="px-6 py-20 text-center text-slate-400 font-medium">
                  Không tìm thấy sản phẩm nào
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white w-full max-w-xl rounded-[32px] shadow-2xl overflow-hidden"
            >
              <div className="p-8">
                <header className="flex justify-between items-center mb-8">
                  <h2 className="text-2xl font-black text-slate-900 tracking-tighter uppercase">
                    {editingProduct?._id ? 'Chỉnh sửa món' : 'Thêm món mới'}
                  </h2>
                  <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                    <X size={24} />
                  </button>
                </header>

                <div className="grid gap-6">
                  <div className="flex gap-6">
                    <div 
                      onClick={() => fileInputRef.current?.click()}
                      className="w-32 h-32 bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-emerald-500 hover:bg-emerald-50 transition-all overflow-hidden relative"
                    >
                      {editingProduct?.image ? (
                        <>
                          <img src={editingProduct.image} alt="Preview" className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                            <ImageIcon className="text-white" />
                          </div>
                        </>
                      ) : (
                        <>
                          <ImageIcon className="text-slate-300" />
                          <span className="text-[10px] font-black text-slate-400 uppercase">Ảnh</span>
                        </>
                      )}
                    </div>
                    <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />

                    <div className="flex-1 flex flex-col gap-4">
                      <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Tên món</label>
                        <input 
                          type="text"
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-bold"
                          value={editingProduct?.name || ''}
                          onChange={(e) => setEditingProduct(prev => prev ? { ...prev, name: e.target.value } : null)}
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Giá cơ bản (VNĐ)</label>
                        <input 
                          type="number"
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-mono font-black"
                          value={editingProduct?.basePrice || 0}
                          onChange={(e) => setEditingProduct(prev => prev ? { ...prev, basePrice: Number(e.target.value) } : null)}
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Danh mục</label>
                    <input 
                      type="text"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-bold"
                      value={editingProduct?.category || ''}
                      placeholder="VD: Cà phê, Trà sữa, Bánh mỳ..."
                      onChange={(e) => setEditingProduct(prev => prev ? { ...prev, category: e.target.value } : null)}
                    />
                  </div>
                </div>

                <div className="mt-10 flex gap-3">
                  <button 
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 px-6 py-4 bg-slate-50 text-slate-600 rounded-2xl font-bold hover:bg-slate-100 transition-all"
                  >
                    Hủy
                  </button>
                  <button 
                    onClick={handleSaveProduct}
                    className="flex-3 px-6 py-4 bg-emerald-600 text-white rounded-2xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100 flex items-center justify-center gap-2"
                  >
                    <Save size={20} />
                    Lưu sản phẩm
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MenuPage;
