import React, { useState, useEffect } from 'react';
import api from '../lib/api';
import { Users, UserPlus, Shield, Edit2, Trash2, Mail, Phone, Lock, Check, X, ShieldAlert } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { useAuthStore } from '../store/authStore';

interface User {
  _id: string;
  name: string;
  email?: string;
  phone?: string;
  role: 'ADMIN' | 'MANAGER' | 'STAFF';
  permissions: string[];
  isActive: boolean;
  managerId?: string;
}

const AVAILABLE_PERMISSIONS = [
  { id: 'POS_EDIT', label: 'Sửa món (Bàn đã gửi bếp)', description: 'Cho phép sửa số lượng món sau khi đã gửi bếp' },
  { id: 'POS_DELETE', label: 'Xóa món (Bàn đã gửi bếp)', description: 'Cho phép xóa món khỏi bàn sau khi đã gửi bếp' },
  { id: 'MENU_MANAGE', label: 'Quản lý thực đơn', description: 'Thêm, sửa, xóa món ăn và danh mục' },
  { id: 'TABLE_MANAGE', label: 'Quản lý bàn', description: 'Thêm, sửa, xóa khu vực và bàn' },
  { id: 'REPORT_VIEW', label: 'Xem báo cáo', description: 'Xem doanh thu, lợi nhuận và thống kê' },
  { id: 'USER_MANAGE', label: 'Quản lý nhân sự', description: 'Thêm, sửa, xóa và phân quyền nhân viên' },
  { id: 'SETTINGS_MANAGE', label: 'Cài đặt hệ thống', description: 'Thay đổi thông tin cửa hàng, thuế, phí' },
];

const AdminPage = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const { user: currentUser } = useAuthStore();
  const canManageUsers = currentUser?.role === 'ADMIN' || currentUser?.role === 'MANAGER' || currentUser?.permissions?.includes('USER_MANAGE');

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    role: 'STAFF' as 'ADMIN' | 'MANAGER' | 'STAFF',
    permissions: [] as string[],
    isActive: true
  });

  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchUsers = async () => {
    try {
      // In this template, /api/admin/users is already tenant-aware because of the middleware
      // but let's double check if we need to pass tenantId
      const res = await api.get('/api/admin/users');
      setUsers(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Failed to fetch users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleOpenModal = (user: User | null = null) => {
    if (user) {
      setEditingUser(user);
      setFormData({
        name: user.name,
        email: user.email || '',
        phone: user.phone || '',
        password: '', // Don't show password
        role: user.role,
        permissions: user.permissions || [],
        isActive: user.isActive
      });
    } else {
      setEditingUser(null);
      setFormData({
        name: '',
        email: '',
        phone: '',
        password: '',
        role: 'STAFF',
        permissions: [],
        isActive: true
      });
    }
    setError('');
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      if (editingUser) {
        await api.put(`/api/admin/users/${editingUser._id}`, formData);
      } else {
        await api.post('/api/admin/users', formData);
      }
      setShowModal(false);
      fetchUsers();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Lỗi khi lưu thông tin');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    const target = users.find(u => u._id === id);
    if (target?.role === 'ADMIN' && currentUser?.role !== 'ADMIN') {
      alert('Bạn không có quyền xóa tài khoản ADMIN!');
      return;
    }

    if (id === currentUser?.id || id === (currentUser as any)._id) {
       alert('Bạn không có quyền tự xóa chính mình!');
       return;
    }
    if (!window.confirm('Bạn có chắc chắn muốn xóa nhân viên này?')) return;
    try {
      await api.delete(`/api/admin/users/${id}`);
      fetchUsers();
    } catch (err) {
      console.error('Failed to delete user:', err);
    }
  };

  const togglePermission = (permId: string) => {
    setFormData(prev => ({
      ...prev,
      permissions: prev.permissions.includes(permId)
        ? prev.permissions.filter(id => id !== permId)
        : [...prev.permissions, permId]
    }));
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-slate-200 border-t-emerald-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (!canManageUsers) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 text-center text-slate-500">
        <div className="w-24 h-24 bg-red-50 rounded-[32px] flex items-center justify-center mb-6">
          <ShieldAlert size={48} className="text-red-500 opacity-20" />
        </div>
        <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight mb-2">Truy cập bị từ chối</h2>
        <p className="max-w-md font-medium">Bạn không có quyền truy cập vào chức năng quản lý nhân sự. Vui lòng liên hệ quản trị viên.</p>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <Users className="text-emerald-600" size={32} />
            QUẢN LÝ NHÂN SỰ
          </h1>
          <p className="text-slate-500 font-medium mt-1">Thêm, sửa và phân quyền truy cập cho nhân viên của bạn.</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 bg-slate-900 text-white px-6 py-3 rounded-2xl font-bold hover:bg-emerald-600 transition-all shadow-lg shadow-slate-200 active:scale-95"
        >
          <UserPlus size={20} />
          THÊM NHÂN VIÊN
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence>
          {users.map((user) => (
            <motion.div
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              key={user._id}
              className={cn(
                "bg-white rounded-[32px] border border-slate-100 p-6 shadow-sm hover:shadow-xl hover:shadow-slate-200/50 transition-all group relative overflow-hidden",
                !user.isActive && "opacity-60 bg-slate-50 grayscale"
              )}
            >
              <div className="flex justify-between items-start mb-4">
                <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-emerald-50 group-hover:text-emerald-600 transition-colors">
                  <Users size={24} />
                </div>
                <div className="flex items-center gap-1">
                  {(currentUser?.role === 'ADMIN' || (currentUser?.role === 'MANAGER' && user.role === 'STAFF')) && (
                    <>
                      <button 
                        onClick={() => handleOpenModal(user)}
                        className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button 
                        onClick={() => handleDelete(user._id)}
                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                      >
                        <Trash2 size={16} />
                      </button>
                    </>
                  )}
                </div>
              </div>

              <div className="mb-6">
                <h3 className="text-lg font-black text-slate-900 truncate uppercase tracking-tight">{user.name}</h3>
                <div className="flex items-center gap-4 mt-2">
                  <span className={cn(
                    "text-[10px] font-black px-2.5 py-1 rounded-lg uppercase tracking-widest",
                    user.role === 'ADMIN' ? "bg-amber-100 text-amber-700" : 
                    user.role === 'MANAGER' ? "bg-emerald-100 text-emerald-700" :
                    "bg-slate-100 text-slate-600"
                  )}>
                    {user.role}
                  </span>
                  {!user.isActive && (
                    <span className="text-[10px] font-black px-2.5 py-1 rounded-lg uppercase tracking-widest bg-red-100 text-red-600">
                      Đã khóa
                    </span>
                  )}
                </div>
              </div>

              <div className="space-y-2 mb-6">
                {user.email && (
                  <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                    <Mail size={14} className="opacity-40" />
                    {user.email}
                  </div>
                )}
                {user.phone && (
                  <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                    <Phone size={14} className="opacity-40" />
                    {user.phone}
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-dashed border-slate-100">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                  <Shield size={12} />
                  Quyền hạn ({user.permissions?.length || 0})
                </p>
                <div className="flex flex-wrap gap-2">
                  {user.permissions?.map(p => {
                    const label = AVAILABLE_PERMISSIONS.find(ap => ap.id === p)?.label || p;
                    return (
                      <span key={p} className="text-[9px] font-black bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-md uppercase tracking-tight">
                        {label}
                      </span>
                    );
                  })}
                  {(user.permissions?.length || 0) === 0 && user.role !== 'ADMIN' && (
                    <span className="text-[9px] font-medium text-slate-400 italic">Chưa phân quyền</span>
                  )}
                  {user.role === 'ADMIN' && (user.permissions?.length || 0) === 0 && (
                    <span className="text-[9px] font-black text-amber-600 uppercase tracking-tight bg-amber-50 px-2 py-0.5 rounded-md">Full Access</span>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowModal(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white w-full max-w-2xl rounded-[40px] shadow-2xl relative z-10 overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-8 bg-slate-50 border-b border-slate-100 flex justify-between items-center shrink-0">
                <div>
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight uppercase">
                    {editingUser ? 'CẬP NHẬT NHÂN VIÊN' : 'THÊM NHÂN VIÊN MỚI'}
                  </h2>
                  <p className="text-slate-500 text-sm font-medium">Điền thông tin và thiết lập quyền hạn.</p>
                </div>
                <button 
                  onClick={() => setShowModal(false)}
                  className="w-12 h-12 flex items-center justify-center text-slate-400 hover:bg-white hover:text-slate-900 rounded-full transition-all"
                >
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleSave} className="flex-1 overflow-y-auto no-scrollbar p-8">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="col-span-full">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Họ và tên</label>
                    <div className="relative">
                      <Users className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                      <input
                        required
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full bg-slate-50 border-none rounded-2xl p-4 pl-12 text-slate-900 font-bold focus:ring-2 focus:ring-emerald-500 transition-all"
                        placeholder="Nguyễn Văn A"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Email</label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full bg-slate-50 border-none rounded-2xl p-4 pl-12 text-slate-900 font-bold focus:ring-2 focus:ring-emerald-500 transition-all"
                        placeholder="email@example.com"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Số điện thoại</label>
                    <div className="relative">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full bg-slate-50 border-none rounded-2xl p-4 pl-12 text-slate-900 font-bold focus:ring-2 focus:ring-emerald-500 transition-all"
                        placeholder="0901234567"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Mật khẩu {editingUser ? '(Để trống nếu không đổi)' : ''}</label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                      <input
                        type="password"
                        required={!editingUser}
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        className="w-full bg-slate-50 border-none rounded-2xl p-4 pl-12 text-slate-900 font-bold focus:ring-2 focus:ring-emerald-500 transition-all"
                        placeholder="••••••••"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Vai trò</label>
                    <div className="flex p-1 bg-slate-50 rounded-2xl gap-1">
                      {(currentUser?.role === 'ADMIN' ? ['STAFF', 'MANAGER', 'ADMIN'] : ['STAFF']).map((r) => (
                        <button
                          key={r}
                          type="button"
                          onClick={() => setFormData({ ...formData, role: r as any })}
                          className={cn(
                            "flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                            formData.role === r ? "bg-white text-slate-900 shadow-sm" : "text-slate-400 hover:text-slate-600"
                          )}
                        >
                          {r}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-8">
                  <label className="text-xs font-black text-slate-900 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <Shield size={16} className="text-emerald-600" />
                    Phân quyền truy cập
                  </label>
                  <div className="space-y-3">
                    {AVAILABLE_PERMISSIONS.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => togglePermission(p.id)}
                        className={cn(
                          "w-full flex items-center justify-between p-4 rounded-3xl border text-left transition-all",
                          formData.permissions.includes(p.id)
                            ? "bg-emerald-50 border-emerald-200"
                            : "bg-white border-slate-100 hover:border-slate-200"
                        )}
                      >
                        <div className="flex items-center gap-4">
                          <div className={cn(
                            "w-10 h-10 rounded-xl flex items-center justify-center transition-colors",
                            formData.permissions.includes(p.id) ? "bg-emerald-500 text-white" : "bg-slate-50 text-slate-400"
                          )}>
                            <Check size={20} className={cn("transition-transform", formData.permissions.includes(p.id) ? "scale-100" : "scale-0")} />
                          </div>
                          <div>
                            <p className={cn("text-sm font-black uppercase tracking-tight", formData.permissions.includes(p.id) ? "text-emerald-900" : "text-slate-600")}>
                              {p.label}
                            </p>
                            <p className="text-[10px] text-slate-400 font-medium leading-none mt-1">{p.description}</p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mt-8 p-4 bg-amber-50 rounded-3xl border border-amber-100 flex gap-4">
                   <ShieldAlert className="text-amber-600 shrink-0" size={24} />
                   <p className="text-xs text-amber-800 font-medium leading-relaxed">
                     Nhân viên có vai trò <span className="font-black">ADMIN</span> mặc định sẽ có toàn quyền truy cập bất kể thiết lập ở trên. Cần cẩn trọng khi cấp quyền này.
                   </p>
                </div>
              </form>

              <div className="p-8 border-t border-slate-100 shrink-0">
                {error && <p className="text-red-500 text-xs font-bold mb-4">{error}</p>}
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="py-4 bg-slate-50 text-slate-500 rounded-2xl font-black uppercase tracking-widest hover:bg-slate-100 transition-all border border-slate-100"
                  >
                    Hủy bỏ
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="py-4 bg-emerald-600 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-100 flex items-center justify-center gap-3 disabled:opacity-50"
                  >
                    {saving ? <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : 'Lưu thông tin'}
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

export default AdminPage;
