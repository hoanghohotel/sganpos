import React, { useState, useEffect } from 'react';
import { Plus, Search, Trash2, Edit2, QrCode, SlidersHorizontal, Table as TableIcon, Users } from 'lucide-react';
import api from '../lib/api';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { QRCodeSVG } from 'qrcode.react';
import { useSocket } from '../hooks/useSocket';
import { useAuthStore } from '../store/authStore';
import { ShieldAlert } from 'lucide-react';
import { toast } from 'sonner';

interface Table {
  _id: string;
  name: string;
  isActive: boolean;
  status: 'EMPTY' | 'OCCUPIED';
  currentOrderId?: string;
  qrCode?: string;
}

const TablesPage = () => {
  const { user } = useAuthStore();
  const canManageTables = user?.role === 'ADMIN' || user?.role === 'MANAGER' || user?.permissions?.includes('TABLE_MANAGE');
  const [tables, setTables] = useState<Table[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingTable, setEditingTable] = useState<Partial<Table> | null>(null);
  const [showQrModal, setShowQrModal] = useState<Table | null>(null);
  const [showQuickCreate, setShowQuickCreate] = useState(false);
  const [quickCreateType, setQuickCreateType] = useState('Bàn');
  const [quickCreateCount, setQuickCreateCount] = useState(5);
  const [creating, setCreating] = useState(false);

  const socket = useSocket();

  useEffect(() => {
    fetchTables();

    if (socket) {
      socket.on('table:update', (updatedTable: any) => {
        setTables(prev => prev.map(t => t._id === updatedTable._id ? { ...t, ...updatedTable } : t));
      });
    }

    return () => {
      if (socket) socket.off('table:update');
    };
  }, [socket]);

  const fetchTables = async () => {
    try {
      const res = await api.get('/api/tables');
      setTables(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Failed to fetch tables:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTable?.name) return;

    try {
      if (editingTable._id) {
        await api.put(`/api/tables/${editingTable._id}`, editingTable);
      } else {
        await api.post('/api/tables', { ...editingTable, isActive: true });
      }
      setEditingTable(null);
      fetchTables();
    } catch (err) {
      toast.error('Lỗi khi lưu bàn');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa bàn này?')) return;
    try {
      await api.delete(`/api/tables/${id}`);
      fetchTables();
    } catch (err) {
      toast.error('Lỗi khi xóa bàn');
    }
  };

  const handleQuickCreate = async () => {
    setCreating(true);
    try {
      const promises = [];
      for (let i = 1; i <= quickCreateCount; i++) {
        const name = `${quickCreateType} ${String(i).padStart(2, '0')}`;
        // Check if name already exists to avoid duplicates
        if (!tables.some(t => t.name === name)) {
          promises.push(api.post('/api/tables', { name, isActive: true }));
        }
      }
      await Promise.all(promises);
      setShowQuickCreate(false);
      fetchTables();
      toast.success('Tạo danh sách bàn thành công');
    } catch (err) {
      toast.error('Lỗi khi tạo nhanh danh sách bàn');
    } finally {
      setCreating(false);
    }
  };

  const filteredTables = tables.filter(t => 
    t.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getFullOrderUrl = (tableId: string) => {
    const baseUrl = window.location.origin;
    return `${baseUrl}/order?tableId=${tableId}`;
  };

  if (!canManageTables) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 text-center text-slate-500">
        <div className="w-24 h-24 bg-red-50 rounded-[32px] flex items-center justify-center mb-6">
          <ShieldAlert size={48} className="text-red-500 opacity-20" />
        </div>
        <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight mb-2">Truy cập bị từ chối</h2>
        <p className="max-w-md font-medium">Bạn không có quyền truy cập vào chức năng quản lý bàn. Vui lòng liên hệ quản trị viên.</p>
      </div>
    );
  }

  return (
    <div className="p-8 h-full flex flex-col gap-6">
      <header className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-2">QUẢN LÝ BÀN</h1>
          <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">
            {tables.length} bàn đang hoạt động
          </p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => setShowQuickCreate(true)}
            className="h-14 px-6 bg-white border border-slate-200 text-slate-600 rounded-2xl font-black uppercase tracking-widest flex items-center gap-3 hover:border-slate-900 hover:text-slate-900 transition-all active:scale-95"
          >
            <SlidersHorizontal size={20} />
            Tạo nhanh
          </button>
          <button 
            onClick={() => setEditingTable({ name: '', isActive: true })}
            className="h-14 px-8 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest flex items-center gap-3 hover:bg-emerald-600 transition-all shadow-xl shadow-slate-200 active:scale-95"
          >
            <Plus size={20} />
            Thêm bàn mới
          </button>
        </div>
      </header>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
        <input 
          type="text"
          placeholder="Tìm kiếm tên bàn..."
          className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-lg font-medium shadow-sm"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="flex-1 overflow-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          <AnimatePresence mode="popLayout">
            {filteredTables.map(table => (
              <motion.div
                key={table._id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="bg-white border border-slate-200 p-6 rounded-3xl shadow-sm hover:shadow-md transition-all group"
              >
                <div className="flex justify-between items-start mb-6">
                  <div className={cn(
                    "w-12 h-12 rounded-2xl flex items-center justify-center transition-all shadow-sm",
                    table.status === 'OCCUPIED' 
                      ? "bg-amber-500 text-white shadow-amber-200/50" 
                      : "bg-slate-50 text-slate-400 group-hover:bg-emerald-50 group-hover:text-emerald-500"
                  )}>
                    {table.status === 'OCCUPIED' ? <Users size={24} /> : <TableIcon size={24} />}
                  </div>
                  <div className="flex gap-1">
                    <button 
                      onClick={() => setShowQrModal(table)}
                      className="p-2.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                      title="Xem mã QR"
                    >
                      <QrCode size={18} />
                    </button>
                    <button 
                      onClick={() => setEditingTable(table)}
                      className="p-2.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all"
                      title="Chỉnh sửa"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button 
                      onClick={() => handleDelete(table._id)}
                      className="p-2.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                      title="Xóa"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
                
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-xl font-black text-slate-900 group-hover:text-emerald-600 transition-colors uppercase tracking-tight">{table.name}</h3>
                    {table.status === 'OCCUPIED' && (
                      <span className="px-2 py-0.5 bg-amber-100 text-amber-600 text-[10px] font-black uppercase rounded-full tracking-widest">Đang bận</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={cn("w-1.5 h-1.5 rounded-full", table.isActive ? "bg-emerald-500" : "bg-slate-300")} />
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                      {table.isActive ? (table.status === 'OCCUPIED' ? 'Đang phục vụ' : 'Đang trống') : 'Tạm ngưng'}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {loading && (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-10 h-10 border-4 border-slate-100 border-t-emerald-500 rounded-full animate-spin" />
            <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Đang tải danh sách bàn...</p>
          </div>
        )}

        {!loading && filteredTables.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 bg-slate-50 border border-dashed border-slate-200 rounded-3xl">
            <TableIcon size={48} className="text-slate-200 mb-4" />
            <p className="text-slate-400 font-medium">Không tìm thấy bàn nào</p>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      <AnimatePresence>
        {editingTable && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setEditingTable(null)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-md bg-white rounded-[40px] p-10 shadow-2xl overflow-hidden"
            >
              <h2 className="text-3xl font-black text-slate-900 mb-8 uppercase tracking-tight">
                {editingTable._id ? 'Cập nhật bàn' : 'Thêm bàn mới'}
              </h2>
              
              <form onSubmit={handleSave} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">Tên bàn</label>
                  <input 
                    type="text"
                    required
                    autoFocus
                    placeholder="VD: Bàn 01, VIP 1..."
                    className="w-full h-14 px-6 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-bold text-slate-900"
                    value={editingTable.name || ''}
                    onChange={(e) => setEditingTable({ ...editingTable, name: e.target.value })}
                  />
                </div>

                <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <input 
                    type="checkbox"
                    id="isActive"
                    className="w-5 h-5 rounded-lg border-slate-300 text-emerald-600 focus:ring-emerald-500"
                    checked={editingTable.isActive ?? true}
                    onChange={(e) => setEditingTable({ ...editingTable, isActive: e.target.checked })}
                  />
                  <label htmlFor="isActive" className="text-sm font-bold text-slate-700 uppercase tracking-widest select-none pt-0.5">Cho phép hoạt động</label>
                </div>

                <div className="flex gap-4 pt-4">
                  <button 
                    type="button"
                    onClick={() => setEditingTable(null)}
                    className="flex-1 h-14 text-slate-400 font-black uppercase tracking-widest hover:text-slate-600 transition-colors"
                  >
                    Hủy
                  </button>
                  <button 
                    type="submit"
                    className="flex-[2] h-14 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-xl shadow-slate-200 active:scale-95"
                  >
                    Lưu thay đổi
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* QR Modal */}
      <AnimatePresence>
        {showQrModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowQrModal(null)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="relative w-full max-w-sm bg-white rounded-[40px] p-8 shadow-2xl flex flex-col items-center text-center"
            >
              <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-2xl flex items-center justify-center mb-6">
                <QrCode size={32} />
              </div>
              <h2 className="text-2xl font-black text-slate-900 mb-2 uppercase tracking-tight">Mã QR Đặt món</h2>
              <p className="text-slate-400 font-bold uppercase tracking-widest text-xs mb-8">{showQrModal.name}</p>

              <div className="bg-white p-6 rounded-3xl border-2 border-slate-50 shadow-inner mb-8">
                <QRCodeSVG 
                  value={getFullOrderUrl(showQrModal._id)}
                  size={200}
                  level="H"
                  includeMargin={true}
                />
              </div>

              <p className="text-slate-400 text-xs italic mb-8 max-w-[200px]">Quét mã này tại bàn để khách hàng có thể tự đặt món & gọi phục vụ</p>

              <button 
                onClick={() => {
                  const svg = document.querySelector('svg');
                  if (!svg) return;
                  const svgData = new XMLSerializer().serializeToString(svg);
                  const canvas = document.createElement('canvas');
                  const ctx = canvas.getContext('2d');
                  const img = new Image();
                  img.onload = () => {
                    canvas.width = img.width;
                    canvas.height = img.height;
                    ctx?.drawImage(img, 0, 0);
                    const pngFile = canvas.toDataURL('image/png');
                    const downloadLink = document.createElement('a');
                    downloadLink.download = `QR_${showQrModal.name.replace(/\s+/g, '_')}.png`;
                    downloadLink.href = pngFile;
                    downloadLink.click();
                  };
                  img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
                }}
                className="w-full h-14 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-blue-600 transition-all shadow-xl shadow-slate-200 active:scale-95"
              >
                Tải mã QR (PNG)
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Quick Create Modal */}
      <AnimatePresence>
        {showQuickCreate && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowQuickCreate(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-md bg-white rounded-[40px] p-10 shadow-2xl overflow-hidden"
            >
              <h2 className="text-3xl font-black text-slate-900 mb-2 uppercase tracking-tight">Tạo nhanh</h2>
              <p className="text-slate-400 font-bold uppercase tracking-widest text-xs mb-8">Thiết lập hàng loạt bàn/vị trí</p>

              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">Loại hình</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'Table', label: 'Tại chỗ', prefix: 'Bàn' },
                      { id: 'Takeaway', label: 'Mang về', prefix: 'Mang về' },
                      { id: 'Ship', label: 'Ship đi', prefix: 'Ship' }
                    ].map(type => (
                      <button
                        key={type.id}
                        type="button"
                        onClick={() => setQuickCreateType(type.prefix)}
                        className={cn(
                          "py-3 rounded-xl font-bold text-xs border transition-all",
                          quickCreateType === type.prefix
                            ? "bg-slate-900 border-slate-900 text-white"
                            : "bg-white border-slate-100 text-slate-400 hover:border-slate-200"
                        )}
                      >
                        {type.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">Số lượng</label>
                  <div className="grid grid-cols-4 gap-2">
                    {[5, 10, 20, 30].map(count => (
                      <button
                        key={count}
                        type="button"
                        onClick={() => setQuickCreateCount(count)}
                        className={cn(
                          "py-3 rounded-xl font-bold text-xs border transition-all",
                          quickCreateCount === count
                            ? "bg-emerald-600 border-emerald-600 text-white"
                            : "bg-white border-slate-100 text-slate-400 hover:border-slate-200"
                        )}
                      >
                        {count}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 text-center">
                  <p className="text-slate-400 text-xs font-medium">Sẽ tạo ra:</p>
                  <p className="text-xl font-black text-slate-900 mt-1">
                    {quickCreateType} 01 → {quickCreateType} {String(quickCreateCount).padStart(2, '0')}
                  </p>
                </div>

                <div className="flex gap-4 pt-4">
                  <button 
                    disabled={creating}
                    type="button"
                    onClick={() => setShowQuickCreate(false)}
                    className="flex-1 h-14 text-slate-400 font-black uppercase tracking-widest hover:text-slate-600 transition-colors disabled:opacity-50"
                  >
                    Hủy
                  </button>
                  <button 
                    disabled={creating}
                    type="button"
                    onClick={handleQuickCreate}
                    className="flex-[2] h-14 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-xl shadow-slate-200 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {creating ? (
                      <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    ) : 'Bắt đầu tạo'}
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

export default TablesPage;
