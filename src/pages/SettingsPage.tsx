import React, { useState, useEffect } from 'react';
import api from '../lib/api';
import axios from 'axios';
import { ShieldAlert, Save, Building2, CreditCard, Upload, CheckCircle2, AlertCircle, ChevronDown, Search, Globe, Link as LinkIcon, User, Plus, Move, Trash2, GripVertical, Type, List, Hash, Layout, Printer, Eye, Wifi } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { 
  DndContext, 
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  defaultDropAnimationSideEffects,
  DragStartEvent,
  DragEndEvent
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { restrictToVerticalAxis, restrictToWindowEdges } from '@dnd-kit/modifiers';
import { useAuthStore } from '../store/authStore';
import { getTenantFromHostname } from '../lib/tenantUtils';

interface PrintField {
  id: string;
  type: 'text' | 'image' | 'list' | 'totals' | 'qr' | 'separator';
  label: string;
  value: string;
  enabled: boolean;
  isCustom?: boolean;
}

const SortableFieldItem: React.FC<{ 
  field: PrintField; 
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onUpdate: (id: string, value: string) => void;
}> = ({ field, onToggle, onDelete, onUpdate }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: field.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center gap-3 p-3 bg-white border border-slate-100 rounded-xl mb-2 group shadow-sm hover:shadow-md transition-all",
        !field.enabled && "opacity-50 grayscale"
      )}
    >
      <div {...attributes} {...listeners} className="cursor-grab text-slate-300 hover:text-slate-600 transition-colors">
        <GripVertical size={16} />
      </div>
      
      <div className="flex-1 flex flex-col">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
            {field.type === 'text' && <Type size={10} className="inline mr-1" />}
            {field.type === 'image' && <Upload size={10} className="inline mr-1" />}
            {field.type === 'list' && <List size={10} className="inline mr-1" />}
            {field.type === 'qr' && <Hash size={10} className="inline mr-1" />}
            {field.label}
          </span>
          {field.isCustom && <span className="bg-emerald-100 text-emerald-600 text-[8px] px-1.5 py-0.5 rounded-full font-black uppercase">Tự tạo</span>}
        </div>
        {field.type === 'text' && field.isCustom && (
           <input 
             type="text" 
             value={field.value}
             onChange={(e) => onUpdate(field.id, e.target.value)}
             className="text-xs font-bold text-slate-900 bg-transparent border-b border-dashed border-slate-200 focus:border-emerald-500 focus:ring-0 p-0 h-6 outline-none"
           />
        )}
      </div>

      <div className="flex items-center gap-1">
        <button 
          onClick={() => onToggle(field.id)}
          className={cn(
            "p-1.5 rounded-lg transition-colors",
            field.enabled ? "text-emerald-500 hover:bg-emerald-50" : "text-slate-300 hover:bg-slate-100"
          )}
        >
          <CheckCircle2 size={16} />
        </button>
        {field.isCustom && (
          <button 
            onClick={() => onDelete(field.id)}
            className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
          >
            <Trash2 size={16} />
          </button>
        )}
      </div>
    </div>
  );
};


function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface Bank {
  id: number;
  name: string;
  code: string;
  bin: string;
  shortName: string;
  logo: string;
  transferSupported: number;
  lookupSupported: number;
}

const PrintPreview = ({ fields, settings }: { fields: PrintField[], settings: any }) => {
  const isModern = settings.defaultPrintTemplate === 'modern';
  const isMinimal = settings.defaultPrintTemplate === 'minimal';
  const isRetro = settings.defaultPrintTemplate === 'retro';
  const isElegant = settings.defaultPrintTemplate === 'elegant';

  return (
    <div 
      id="print-preview-content"
      className={cn(
        "w-[320px] min-h-[500px] bg-white shadow-2xl p-6 transition-all duration-500 mx-auto border-t-[10px] border-emerald-500 rounded-t-sm",
        isRetro && "font-mono scale-[0.98] border-dashed border-slate-300 shadow-none border-t-slate-800",
        isModern && "rounded-3xl shadow-emerald-200/20 border-none",
        isElegant && "border-double border-4 border-slate-900 shadow-none px-8",
        isMinimal && "border-none shadow-sm"
      )}
      style={{
        fontFamily: isRetro ? "'JetBrains Mono', monospace" : "'Inter', sans-serif"
      }}
    >
      <div className="space-y-4">
        {fields.filter(f => f.enabled).map(field => {
          switch (field.id) {
            case 'logo':
              return settings.logoUrl ? (
                <div key={field.id} className="flex justify-center">
                  <img src={settings.logoUrl} alt="Logo" className="w-16 h-16 object-contain" />
                </div>
              ) : null;
            case 'store-name':
              return (
                <div key={field.id} className={cn(
                   "text-center font-black uppercase tracking-tight",
                   isModern ? "text-xl text-emerald-600" : "text-lg text-slate-900",
                   isElegant && "border-b-2 border-slate-900 pb-2 mb-2"
                )}>
                  {settings.storeName || 'SAIGON AN COFFEE'}
                </div>
              );
            case 'address':
              return (
                <div key={field.id} className="text-[10px] text-center text-slate-500 font-medium leading-tight">
                  {settings.address || '123 Đường ABC, Quận 1, TP.HCM'}
                </div>
              );
            case 'hotline':
              return (
                <div key={field.id} className="text-[10px] text-center font-bold text-slate-700">
                  Hotline: {settings.hotline || '0123.456.789'}
                </div>
              );
            case 'sep-1':
            case 'sep-2':
              return (
                <div key={field.id} className={cn(
                  "border-t my-2",
                  isRetro ? "border-dashed border-slate-300" : "border-slate-100"
                )} />
              );
            case 'order-info':
              return (
                <div key={field.id} className="space-y-1 text-[10px] text-slate-600">
                   <div className="text-center font-black text-slate-900 mb-2 uppercase tracking-widest italic">Hóa đơn thanh toán</div>
                   <div className="flex justify-between"><span>Mã Đơn:</span><span className="font-bold text-slate-900">#ABC123</span></div>
                   <div className="flex justify-between"><span>Bàn:</span><span className="font-bold text-slate-900">Bàn 05</span></div>
                   <div className="flex justify-between"><span>Ngày:</span><span>{new Date().toLocaleString('vi-VN')}</span></div>
                   <div className="flex justify-between"><span>Nhân viên:</span><span>Admin</span></div>
                </div>
              );
            case 'items-list':
              return (
                <div key={field.id} className="space-y-2 py-2">
                  {[1, 2].map((_, i) => (
                    <div key={i} className="flex justify-between text-[11px] items-start gap-4">
                      <div className="flex-1">
                        <div className="font-bold text-slate-900">{i === 0 ? 'Cà phê sữa đá' : 'Bạc xỉu'}</div>
                        {i === 0 && <div className="text-[9px] text-slate-400 italic font-medium">Ghi chú: Ít đá, nhiều sữa</div>}
                      </div>
                      <div className="text-slate-500">x{i + 1}</div>
                      <div className="font-bold text-slate-900">{(35000 * (i + 1)).toLocaleString()}</div>
                    </div>
                  ))}
                </div>
              );
            case 'totals':
              return (
                <div key={field.id} className="space-y-1 pt-2 border-t border-slate-900 mt-4">
                  <div className="flex justify-between text-[10px] text-slate-500">
                    <span>Tạm tính</span>
                    <span>105.000</span>
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-500">
                    <span>Giảm giá</span>
                    <span>-5.000</span>
                  </div>
                  <div className="flex justify-between text-base font-black text-slate-900 pt-2 border-t border-slate-100 mt-2">
                    <span>TỔNG CỘNG</span>
                    <span className={isModern ? "text-emerald-600" : ""}>100.000đ</span>
                  </div>
                </div>
              );
            case 'qr':
              return (
                <div key={field.id} className="flex flex-col items-center gap-2 py-4">
                  <div className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">Quét mã thanh toán</div>
                  <div className="w-32 h-32 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-center overflow-hidden">
                    <img src="https://img.vietqr.io/image/970423-123456789-compact2.png?amount=100000&addInfo=TT%20BAN05" alt="QR" className="w-full h-full object-contain p-2" />
                  </div>
                </div>
              );
            case 'footer':
              return (
                <div key={field.id} className="text-[10px] text-center text-slate-400 italic mt-4 px-4 leading-relaxed">
                  {field.value || 'Cảm ơn quý khách và hẹn gặp lại!'}
                </div>
              );
            default:
              if (field.isCustom) {
                return (
                  <div key={field.id} className="text-[10px] text-center py-1 border-b border-slate-50 text-slate-500">
                    {field.value}
                  </div>
                );
              }
              return null;
          }
        })}
      </div>
    </div>
  );
};

const SettingsPage = () => {
  const { user } = useAuthStore();
  const canManageSettings = user?.role === 'ADMIN' || user?.role === 'MANAGER' || user?.permissions?.includes('SETTINGS_MANAGE');
  const [activeTab, setActiveTab] = useState<'overview' | 'payment' | 'subdomain' | 'templates' | 'printers'>('overview');
  const [banks, setBanks] = useState<Bank[]>([]);
  const [showBankList, setShowBankList] = useState(false);
  const [bankSearch, setBankSearch] = useState('');
  const [originalSubdomain, setOriginalSubdomain] = useState('');
  
  const [settings, setSettings] = useState({
    storeName: '',
    logoUrl: '',
    address: '',
    hotline: '',
    bankAccount: '',
    bankName: '',
    bankCode: '',
    bankLogoUrl: '',
    bankAccountHolder: '',
    subdomain: '',
    customPath: '',
    taxRate: 0,
    defaultPrintTemplate: 'classic',
    printers: [] as any[]
  });

  const getBaseDomain = () => {
    if (typeof window === 'undefined') return 'monday.com.vn';
    const host = window.location.hostname;
    
    // Explicit support for monday.com.vn
    if (host.includes('monday.com.vn')) return 'monday.com.vn';
    
    // For other domains, try to strip the tenant if we're on a subdomain
    const tenant = getTenantFromHostname();
    if (tenant) {
      return host.replace(`${tenant}.`, '');
    }
    
    // Otherwise return the host itself (could be localhost or branch link)
    return host;
  };
  
  const baseDomain = getBaseDomain();

  const printTemplates = [
    { id: 'classic', name: 'Cổ điển', description: 'Giao diện truyền thống, dễ đọc.' },
    { id: 'modern', name: 'Hiện đại', description: 'Thiết kế tinh tế, font chữ hiện đại.' },
    { id: 'minimal', name: 'Tối giản', description: 'Tập trung vào thông tin quan trọng nhất.' },
    { id: 'retro', name: 'Phóng khoáng', description: 'Phong cách máy in nhiệt cũ, cá tính.' },
    { id: 'elegant', name: 'Sang trọng', description: 'Bố cục cân đối, phù hợp nhà hàng cao cấp.' }
  ];

  const [templateFields, setTemplateFields] = useState<PrintField[]>([
    { id: 'logo', type: 'image', label: 'Logo cửa hàng', value: '', enabled: true },
    { id: 'store-name', type: 'text', label: 'Tên cửa hàng', value: '', enabled: true },
    { id: 'address', type: 'text', label: 'Địa chỉ', value: '', enabled: true },
    { id: 'hotline', type: 'text', label: 'Hotline', value: '', enabled: true },
    { id: 'sep-1', type: 'separator', label: 'Phân cách', value: '', enabled: true },
    { id: 'order-info', type: 'text', label: 'Thông tin đơn hàng', value: '', enabled: true },
    { id: 'items-list', type: 'list', label: 'Danh sách món', value: '', enabled: true },
    { id: 'sep-2', type: 'separator', label: 'Phân cách', value: '', enabled: true },
    { id: 'totals', type: 'totals', label: 'Tổng cộng', value: '', enabled: true },
    { id: 'qr', type: 'qr', label: 'Mã QR thanh toán', value: '', enabled: true },
    { id: 'footer', type: 'text', label: 'Lời cảm ơn', value: 'Cảm ơn và hẹn gặp lại!', enabled: true },
  ]);

  const [activeId, setActiveId] = useState<string | null>(null);
  const [isDesigning, setIsDesigning] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setTemplateFields((items) => {
        const oldIndex = items.findIndex((i) => i.id === active.id);
        const newIndex = items.findIndex((i) => i.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
    setActiveId(null);
  };

  const toggleField = (id: string) => {
    setTemplateFields(prev => prev.map(f => f.id === id ? { ...f, enabled: !f.enabled } : f));
  };

  const deleteField = (id: string) => {
    setTemplateFields(prev => prev.filter(f => f.id !== id));
  };

  const updateField = (id: string, value: string) => {
    setTemplateFields(prev => prev.map(f => f.id === id ? { ...f, value } : f));
  };

  const addCustomField = () => {
    const id = `custom-${Date.now()}`;
    setTemplateFields(prev => [
      ...prev,
      { id, type: 'text', label: 'Trường tùy chỉnh', value: 'Nội dung mới', enabled: true, isCustom: true }
    ]);
  };

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      // Fetch banks first as it's public
      axios.get('https://api.vietqr.io/v2/banks').then(res => {
         if (res.data?.data) setBanks(res.data.data);
      }).catch(err => console.error('Lỗi khi lấy danh sách ngân hàng:', err));

      // Fetch settings via authenticated API
      try {
        const settingsRes = await api.get('/api/settings');
        const data = settingsRes.data;
        setSettings(prev => ({ ...prev, ...data }));
        if (data.subdomain) {
          setOriginalSubdomain(data.subdomain);
        }
        if (data.templateFields) {
          setTemplateFields(data.templateFields);
        }
      } catch (err) {
        console.error('Lỗi khi lấy cài đặt:', err);
      }
    } catch (err) {
      console.error('Lỗi khi tải dữ liệu:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setSettings(prev => ({ ...prev, [name]: value }));
  };

  const handleBankSelect = (bank: Bank) => {
    setSettings(prev => ({
      ...prev,
      bankName: bank.shortName,
      bankCode: bank.code,
      bankLogoUrl: bank.logo
    }));
    setShowBankList(false);
    setBankSearch('');
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      // Check subdomain availability if changed
      if (settings.subdomain && settings.subdomain !== originalSubdomain) {
        const checkRes = await api.get(`/api/auth/check-availability?tenantId=${settings.subdomain}`);
        if (!checkRes.data.available) {
          setMessage({ type: 'error', text: 'Subdomain này đã được sử dụng bởi cửa hàng khác. Vui lòng chọn subdomain khác.' });
          setSaving(false);
          return;
        }
      }

      await api.put('/api/settings', { 
        ...settings, 
        templateFields: templateFields // Save custom template structure
      });
      setOriginalSubdomain(settings.subdomain || '');
      setMessage({ type: 'success', text: 'Đã lưu cài đặt thành công!' });
      setTimeout(() => setMessage(null), 3000);
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || err.message || 'Lỗi không xác định';
      setMessage({ type: 'error', text: `Có lỗi xảy ra: ${errorMsg}` });
    } finally {
      setSaving(false);
    }
  };

  const filteredBanks = banks.filter(bank => 
    bank.name.toLowerCase().includes(bankSearch.toLowerCase()) || 
    bank.shortName.toLowerCase().includes(bankSearch.toLowerCase()) ||
    bank.code.toLowerCase().includes(bankSearch.toLowerCase())
  );

  const fillWithUsername = () => {
    if (user?.name) {
      const slug = user.name.toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[đĐ]/g, 'd')
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
      
      setSettings(prev => ({ 
        ...prev, 
        subdomain: prev.subdomain || slug,
        customPath: prev.customPath || slug 
      }));
    }
  };

  if (loading) {
    return (
      <div className="p-10 flex items-center justify-center h-full">
        <div className="w-10 h-10 border-4 border-emerald-100 border-t-emerald-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (!canManageSettings) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 text-center text-slate-500">
        <div className="w-24 h-24 bg-red-50 rounded-[32px] flex items-center justify-center mb-6">
          <ShieldAlert size={48} className="text-red-500 opacity-20" />
        </div>
        <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight mb-2">Truy cập bị từ chối</h2>
        <p className="max-w-md font-medium">Bạn không có quyền truy cập vào chức năng cài đặt. Vui lòng liên hệ quản trị viên.</p>
      </div>
    );
  }

  return (
    <div className="p-10 max-w-4xl h-full overflow-auto outline-none">
      <header className="mb-10">
        <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase mb-2 italic">Cài đặt hệ thống</h1>
        <p className="text-slate-500 font-medium">Quản lý định danh thương hiệu và cấu hình thanh toán của bạn.</p>
      </header>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-2xl w-fit mb-8 shadow-inner">
        <button
          onClick={() => setActiveTab('overview')}
          className={cn(
            "flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
            activeTab === 'overview' ? "bg-white text-slate-900 shadow-sm" : "text-slate-400 hover:text-slate-600"
          )}
        >
          <Building2 size={16} />
          Tổng quan
        </button>
        <button
          onClick={() => setActiveTab('payment')}
          className={cn(
            "flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
            activeTab === 'payment' ? "bg-white text-slate-900 shadow-sm" : "text-slate-400 hover:text-slate-600"
          )}
        >
          <CreditCard size={16} />
          Thanh toán
        </button>
        <button
          onClick={() => setActiveTab('subdomain')}
          className={cn(
            "flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
            activeTab === 'subdomain' ? "bg-white text-slate-900 shadow-sm" : "text-slate-400 hover:text-slate-600"
          )}
        >
          <Globe size={16} />
          Subdomain
        </button>
        <button
          onClick={() => setActiveTab('templates')}
          className={cn(
            "flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
            activeTab === 'templates' ? "bg-white text-slate-900 shadow-sm" : "text-slate-400 hover:text-slate-600"
          )}
        >
          <Layout size={16} />
          Mẫu in
        </button>
        <button
          onClick={() => setActiveTab('printers')}
          className={cn(
            "flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
            activeTab === 'printers' ? "bg-white text-slate-900 shadow-sm" : "text-slate-400 hover:text-slate-600"
          )}
        >
          <Printer size={16} />
          Máy in
        </button>
      </div>

      <form onSubmit={handleSave} className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-2xl shadow-slate-200/40">
        <AnimatePresence mode="wait">
          {activeTab === 'overview' ? (
            <motion.div
              key="overview-tab"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className="space-y-6"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tên quán</label>
                  <input
                    type="text"
                    name="storeName"
                    value={settings.storeName || ''}
                    onChange={handleChange}
                    placeholder="VD: Antigravity Coffee"
                    className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 text-sm font-bold focus:ring-2 focus:ring-emerald-500 transition-all placeholder:text-slate-300"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Hotline</label>
                  <input
                    type="text"
                    name="hotline"
                    value={settings.hotline || ''}
                    onChange={handleChange}
                    placeholder="Số điện thoại liên hệ"
                    className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 text-sm font-bold focus:ring-2 focus:ring-emerald-500 transition-all placeholder:text-slate-300"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Thuế (%)</label>
                  <input
                    type="number"
                    name="taxRate"
                    value={settings.taxRate || 0}
                    onChange={(e) => setSettings(prev => ({ ...prev, taxRate: Number(e.target.value) }))}
                    placeholder="VD: 10"
                    className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 text-sm font-bold focus:ring-2 focus:ring-emerald-500 transition-all placeholder:text-slate-300"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Logo URL</label>
                <div className="flex gap-4">
                  <input
                    type="text"
                    name="logoUrl"
                    value={settings.logoUrl || ''}
                    onChange={handleChange}
                    placeholder="https://example.com/logo.png"
                    className="flex-1 bg-slate-50 border-none rounded-2xl px-5 py-4 text-sm font-bold focus:ring-2 focus:ring-emerald-500 transition-all placeholder:text-slate-300"
                  />
                  <div className="w-14 h-14 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 flex items-center justify-center overflow-hidden">
                    {settings.logoUrl ? (
                      <img src={settings.logoUrl} alt="Logo Preview" className="w-full h-full object-contain" />
                    ) : (
                      <Upload size={20} className="text-slate-300" />
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Địa chỉ quán</label>
                <textarea
                  name="address"
                  value={settings.address || ''}
                  onChange={handleChange}
                  placeholder="Địa chỉ chi tiết của quán"
                  rows={3}
                  className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 text-sm font-bold focus:ring-2 focus:ring-emerald-500 transition-all placeholder:text-slate-300 resize-none"
                />
              </div>
            </motion.div>
          ) : activeTab === 'payment' ? (
            <motion.div
              key="payment-tab"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="space-y-6"
            >
              <div className="space-y-2 relative">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Ngân hàng thụ hưởng</label>
                <div 
                  onClick={() => setShowBankList(!showBankList)}
                  className="w-full bg-slate-50 rounded-2xl px-5 py-4 flex items-center justify-between cursor-pointer group hover:bg-slate-100 transition-all border-2 border-transparent focus-within:border-emerald-500 shadow-sm"
                >
                  <div className="flex items-center gap-4">
                    {settings.bankLogoUrl ? (
                      <div className="bg-white p-1 rounded-lg border border-slate-100 flex items-center justify-center">
                        <img src={settings.bankLogoUrl} alt="Bank Logo" className="h-6 w-auto object-contain" />
                      </div>
                    ) : (
                      <CreditCard size={20} className="text-slate-300" />
                    )}
                    <span className={cn("text-sm font-bold uppercase tracking-tight", settings.bankName ? "text-slate-900" : "text-slate-300")}>
                      {settings.bankName || 'Chọn ngân hàng từ danh sách'}
                    </span>
                  </div>
                  <ChevronDown size={20} className={cn("text-slate-400 transition-transform", showBankList && "rotate-180")} />
                </div>

                <AnimatePresence>
                  {showBankList && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-100 rounded-2xl shadow-2xl z-50 overflow-hidden flex flex-col max-h-[400px]"
                    >
                      <div className="p-4 border-b border-slate-50 sticky top-0 bg-white z-10">
                        <div className="relative">
                          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                          <input 
                            type="text"
                            placeholder="Tìm tên ngân hàng..."
                            className="w-full bg-slate-50 border-none rounded-xl pl-10 pr-4 py-2 text-xs font-bold focus:ring-2 focus:ring-emerald-500"
                            value={bankSearch}
                            onChange={(e) => setBankSearch(e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                          />
                        </div>
                      </div>
                      <div className="overflow-auto flex-1">
                        {filteredBanks.length > 0 ? (
                          filteredBanks.map(bank => (
                            <div 
                              key={bank.id}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleBankSelect(bank);
                              }}
                              className="flex items-center gap-4 p-4 hover:bg-emerald-50 cursor-pointer transition-colors border-b border-slate-50 last:border-none"
                            >
                              <img src={bank.logo} alt={bank.shortName} className="h-6 w-auto object-contain bg-white rounded p-0.5" />
                              <div className="flex flex-col">
                                <span className="text-[10px] font-black text-slate-900 uppercase leading-none mb-1">{bank.shortName}</span>
                                <span className="text-[9px] text-slate-400 font-medium truncate max-w-[250px]">{bank.name}</span>
                              </div>
                              {settings.bankCode === bank.code && (
                                <CheckCircle2 size={16} className="ml-auto text-emerald-600" />
                              )}
                            </div>
                          ))
                        ) : (
                          <div className="p-8 text-center text-slate-400 text-[10px] font-black uppercase tracking-widest">Không tìm thấy ngân hàng</div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Số tài khoản</label>
                  <input
                    type="text"
                    name="bankAccount"
                    value={settings.bankAccount || ''}
                    onChange={handleChange}
                    placeholder="Nhập số tài khoản ngân hàng"
                    className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 text-sm font-bold focus:ring-2 focus:ring-emerald-500 transition-all placeholder:text-slate-300 font-mono"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tên chủ tài khoản</label>
                  <input
                    type="text"
                    name="bankAccountHolder"
                    value={settings.bankAccountHolder || ''}
                    onChange={handleChange}
                    placeholder="VD: NGUYEN VAN A"
                    className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 text-sm font-bold focus:ring-2 focus:ring-emerald-500 transition-all placeholder:text-slate-300 uppercase"
                  />
                </div>
              </div>

              <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="flex gap-3 items-start">
                   <AlertCircle size={20} className="text-emerald-600 mt-1" />
                   <div>
                      <p className="text-xs font-bold text-slate-700 mb-1">Thông báo thanh toán</p>
                      <p className="text-[10px] text-slate-500 leading-relaxed">Thông tin này sẽ được sử dụng để hiển thị mã QR chuyển khoản cho khách hàng khi thanh toán tại quầy hoặc tại bàn.</p>
                   </div>
                </div>
              </div>
            </motion.div>
          ) : activeTab === 'templates' ? (
            <motion.div
              key="templates-tab"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="space-y-8"
            >
              <div className="bg-slate-900 text-white p-6 rounded-3xl shadow-xl flex justify-between items-center gap-4">
                 <div>
                    <h3 className="text-sm font-black uppercase tracking-widest mb-2 italic">Thiết kế mẫu in</h3>
                    <p className="text-[10px] text-slate-400 font-medium tracking-tight">Tùy chỉnh nội dung và hình thức hiển thị trên hóa đơn của bạn.</p>
                 </div>
                 <button 
                   type="button"
                   onClick={() => setIsDesigning(!isDesigning)}
                   className={cn(
                     "px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                     isDesigning ? "bg-emerald-500 text-white shadow-lg shadow-emerald-200" : "bg-white/10 text-white hover:bg-white/20"
                   )}
                 >
                   {isDesigning ? 'Chọn mẫu có sẵn' : 'Sửa mẫu đang chọn'}
                 </button>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-[1fr,350px] gap-8 items-start">
                {/* Designer Side */}
                <div className="space-y-6">
                  {!isDesigning ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-4">
                      {printTemplates.map((template) => (
                        <div 
                          key={template.id}
                          onClick={() => setSettings(prev => ({ ...prev, defaultPrintTemplate: template.id }))}
                          className={cn(
                            "p-5 rounded-[24px] border-2 transition-all cursor-pointer group flex items-center gap-4",
                            settings.defaultPrintTemplate === template.id 
                              ? "bg-emerald-50 border-emerald-500 shadow-xl shadow-emerald-200/20" 
                              : "bg-white border-slate-100 hover:border-emerald-200"
                          )}
                        >
                          <div className={cn(
                            "w-12 h-12 rounded-2xl flex items-center justify-center transition-colors",
                            settings.defaultPrintTemplate === template.id ? "bg-emerald-500 text-white" : "bg-slate-50 text-slate-400 group-hover:text-emerald-500"
                          )}>
                            <Printer size={20} />
                          </div>
                          <div className="flex-1">
                            <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest mb-0.5">{template.name}</h4>
                            <p className="text-[9px] text-slate-500 font-medium leading-relaxed">{template.description}</p>
                          </div>
                          {settings.defaultPrintTemplate === template.id && (
                            <div className="bg-emerald-500 text-white p-1 rounded-full">
                              <CheckCircle2 size={14} />
                            </div>
                          )}
                        </div>
                      ))}

                      <div 
                        onClick={() => {
                          setIsDesigning(true);
                          setSettings(prev => ({ ...prev, defaultPrintTemplate: 'custom' }));
                        }}
                        className="p-5 rounded-[24px] border-2 border-dashed border-slate-200 flex items-center gap-4 bg-slate-50/50 hover:bg-slate-50 transition-all cursor-pointer group"
                      >
                        <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-slate-300 group-hover:text-emerald-500 transition-colors">
                          <Plus size={20} />
                        </div>
                        <div className="flex-1">
                          <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-0.5">Tạo mẫu mới</h4>
                          <p className="text-[9px] text-slate-300 font-bold uppercase tracking-tight">Tự do kéo thả các trường thông tin</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Sắp xếp các trường</h4>
                        <button 
                          type="button" 
                          onClick={addCustomField}
                          className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-emerald-100 transition-all shadow-sm"
                        >
                          <Plus size={12} />
                          Thêm trường
                        </button>
                      </div>

                      <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragStart={handleDragStart}
                        onDragEnd={handleDragEnd}
                        modifiers={[restrictToVerticalAxis]}
                      >
                        <SortableContext
                          items={templateFields.map(f => f.id)}
                          strategy={verticalListSortingStrategy}
                        >
                          {templateFields.map((field) => (
                            <SortableFieldItem 
                              key={field.id} 
                              field={field} 
                              onToggle={toggleField}
                              onDelete={deleteField}
                              onUpdate={updateField}
                            />
                          ))}
                        </SortableContext>

                        <DragOverlay dropAnimation={{
                          sideEffects: defaultDropAnimationSideEffects({
                            styles: {
                              active: {
                                opacity: '0.4',
                              },
                            },
                          }),
                        }}>
                          {activeId ? (
                            <div className="flex items-center gap-3 p-3 bg-white border-2 border-emerald-500 rounded-xl shadow-2xl opacity-90 scale-105">
                               <GripVertical size={16} className="text-emerald-500" />
                               <span className="text-xs font-black uppercase text-slate-900">
                                 {templateFields.find(f => f.id === activeId)?.label}
                               </span>
                            </div>
                          ) : null}
                        </DragOverlay>
                      </DndContext>
                    </div>
                  )}
                </div>

                {/* Preview Side */}
                <div className="sticky top-6 bg-slate-900 p-8 rounded-[40px] flex flex-col gap-6 items-center shadow-2xl shadow-slate-900/20 order-last xl:order-none">
                  <div className="w-full flex items-center justify-between">
                    <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      <Eye size={14} className="text-emerald-500" />
                      Xem trước bản in
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const content = document.getElementById('print-preview-content')?.innerHTML;
                        const printWindow = window.open('', '_blank');
                        if (printWindow && content) {
                          printWindow.document.write(`
                            <html>
                              <head>
                                <title>In thử mẫu hóa đơn</title>
                                <style>
                                  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&family=JetBrains+Mono&display=swap');
                                  body { font-family: 'Inter', sans-serif; margin: 0; padding: 20px; display: flex; justify-content: center; background: #f8fafc; }
                                  .print-wrapper { background: white; padding: 20px; width: 80mm; box-shadow: 0 0 10px rgba(0,0,0,0.1); }
                                  ${settings.defaultPrintTemplate === 'retro' ? ".print-wrapper { font-family: 'JetBrains Mono', monospace; }" : ""}
                                  .print-wrapper * { max-width: 100%; box-sizing: border-box; }
                                  @media print {
                                    body { background: white; padding: 0; }
                                    .print-wrapper { box-shadow: none; width: 100%; border: none; padding: 0; }
                                  }
                                </style>
                              </head>
                              <body onload="window.print(); window.close();">
                                <div class="print-wrapper">
                                  ${content}
                                </div>
                              </body>
                            </html>
                          `);
                          printWindow.document.close();
                        }
                      }}
                      className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20"
                    >
                      <Printer size={14} />
                      In thử
                    </button>
                  </div>
                  
                  <div className="scale-[0.85] origin-top">
                    <PrintPreview fields={templateFields} settings={settings} />
                  </div>

                  <div className="max-w-[280px] text-center italic text-[9px] text-slate-500 leading-relaxed font-medium">
                    Lưu ý: Bạn nên sử dụng chế độ "In thử" để kiểm tra chính xác định dạng trên máy in thực tế.
                  </div>
                </div>
              </div>
            </motion.div>
          ) : activeTab === 'printers' ? (
            <motion.div
              key="printers-tab"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <div className="flex justify-between items-center mb-6">
                 <div>
                   <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight mb-1">Kết nối máy in</h3>
                   <p className="text-xs text-slate-500">Quản lý máy in hóa đơn (LAN/USB/Browser).</p>
                 </div>
                 <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        const newPrinters = [...(settings.printers || [])];
                        newPrinters.push({
                          id: Date.now().toString(),
                          name: `Máy in ${newPrinters.length + 1}`,
                          type: 'LAN',
                          address: '192.168.1.100',
                          role: 'RECEIPT',
                          status: 'ONLINE'
                        });
                        setSettings({ ...settings, printers: newPrinters });
                      }}
                      className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-100 transition-all shadow-sm"
                    >
                      <Plus size={14} />
                      Thêm thủ công
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          // @ts-ignore
                          if (!navigator.usb) throw new Error('Not supported');
                          // @ts-ignore
                          const device = await navigator.usb.requestDevice({ filters: [] });
                          if (device) {
                            const newPrinters = [...(settings.printers || [])];
                            newPrinters.push({
                              id: device.serialNumber || Date.now().toString(),
                              name: device.productName || `USB Printer ${device.vendorId}`,
                              type: 'USB',
                              role: 'RECEIPT',
                              status: 'ONLINE',
                              vendorId: device.vendorId,
                              productId: device.productId
                            });
                            setSettings({ ...settings, printers: newPrinters });
                          }
                        } catch (err) {
                           console.error(err);
                           alert('KHÔNG TÌM THẤY MÁY IN USB:\n1. Nếu dùng Android/iOS: Trình duyệt bị hạn chế quyền USB.\n2. PC: Hãy đảm bảo máy in đã bật và cắm dây.\n3. Hãy thử "Thêm thủ công" nếu vẫn không quét được.');
                        }
                      }}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-100 transition-all shadow-sm"
                    >
                      <Printer size={14} />
                      Quét USB
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          // @ts-ignore
                          if (!navigator.bluetooth) throw new Error('Not supported');
                          // @ts-ignore
                          const device = await navigator.bluetooth.requestDevice({
                            acceptAllDevices: true,
                            optionalServices: ['00001101-0000-1000-8000-00805f9b34fb']
                          });
                          if (device) {
                            const newPrinters = [...(settings.printers || [])];
                            newPrinters.push({
                              id: device.id,
                              name: device.name || 'Bluetooth Printer',
                              type: 'BLUETOOTH',
                              role: 'RECEIPT',
                              status: 'ONLINE'
                            });
                            setSettings({ ...settings, printers: newPrinters });
                          }
                        } catch (err) {
                           console.error(err);
                           alert('LỖI KẾT NỐI BLUETOOTH:\n1. Phải bật Vị trí (GPS) và Bluetooth.\n2. iPad/iPhone: Mặc định không hỗ trợ Bluetooth trên trình duyệt này.\n3. Thử quét lại hoặc kết nối LAN để ổn định nhất.');
                        }
                      }}
                      className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-100 transition-all shadow-sm"
                    >
                      <Wifi size={14} />
                      Quét Bluetooth
                    </button>
                 </div>
              </div>

              <div className="space-y-4">
                 {settings.printers && settings.printers.length > 0 ? (
                   settings.printers.map((pr: any, idx: number) => (
                     <div key={pr.id} className="p-5 bg-white border border-slate-100 rounded-2xl shadow-sm hover:shadow-md transition-all group">
                        <div className="flex justify-between items-start">
                          <div className="flex gap-4">
                             <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 group-hover:text-emerald-500 transition-colors">
                               <Printer size={20} />
                             </div>
                             <div>
                               <div className="flex items-center gap-2 mb-1">
                                 <input 
                                   className="text-xs font-black text-slate-900 bg-transparent border-none p-0 focus:ring-0 uppercase tracking-tight w-40"
                                   value={pr.name}
                                   onChange={(e) => {
                                      const updated = [...settings.printers];
                                      updated[idx].name = e.target.value;
                                      setSettings({ ...settings, printers: updated });
                                   }}
                                 />
                                 <span className={cn(
                                   "px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest",
                                   pr.status === 'ONLINE' ? "bg-emerald-100 text-emerald-600" : "bg-red-100 text-red-600"
                                 )}>
                                   {pr.status}
                                 </span>
                               </div>
                               <div className="flex gap-4 text-[10px] font-bold text-slate-400">
                                  <select 
                                    className="bg-transparent border-none p-0 focus:ring-0 cursor-pointer hover:text-slate-900 transition-colors"
                                    value={pr.type}
                                    onChange={(e) => {
                                       const updated = [...settings.printers];
                                       updated[idx].type = e.target.value;
                                       setSettings({ ...settings, printers: updated });
                                    }}
                                  >
                                    <option value="LAN">LAN / WIFI</option>
                                    <option value="USB">USB</option>
                                    <option value="BLUETOOTH">BLUETOOTH</option>
                                    <option value="BROWSER">TRÌNH DUYỆT</option>
                                  </select>
                                  {pr.type === 'LAN' && (
                                    <input 
                                      className="bg-transparent border-none p-0 focus:ring-0 text-slate-500 w-32"
                                      value={pr.address}
                                      onChange={(e) => {
                                        const updated = [...settings.printers];
                                        updated[idx].address = e.target.value;
                                        setSettings({ ...settings, printers: updated });
                                      }}
                                      placeholder="192.168.1.100"
                                    />
                                  )}
                                  {pr.type === 'USB' && (
                                    <span className="text-slate-400">ID: {pr.vendorId}:{pr.productId}</span>
                                  )}
                                  <select 
                                    className="bg-transparent border-none p-0 focus:ring-0 cursor-pointer hover:text-slate-900 transition-colors"
                                    value={pr.role}
                                    onChange={(e) => {
                                       const updated = [...settings.printers];
                                       updated[idx].role = e.target.value;
                                       setSettings({ ...settings, printers: updated });
                                    }}
                                  >
                                    <option value="RECEIPT">MÁY IN HOÁ ĐƠN</option>
                                    <option value="KITCHEN">MÁY IN BẾP</option>
                                    <option value="STAMP">MÁY IN TEM</option>
                                  </select>
                               </div>
                             </div>
                          </div>
                          <div className="flex gap-2">
                             <button
                               type="button"
                               className="p-2 text-slate-300 hover:text-emerald-500 hover:bg-emerald-50 rounded-lg transition-all"
                               title="In thử"
                               onClick={() => alert(`Đang gửi lệnh in thử đến ${pr.name}...`)}
                             >
                               <Printer size={16} />
                             </button>
                             <button
                               type="button"
                               className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                               title="Gỡ bỏ"
                               onClick={() => {
                                  const updated = settings.printers.filter((_: any, i: number) => i !== idx);
                                  setSettings({ ...settings, printers: updated });
                               }}
                             >
                               <Trash2 size={16} />
                             </button>
                          </div>
                        </div>
                     </div>
                   ))
                 ) : (
                   <div className="p-12 border-2 border-dashed border-slate-100 rounded-[32px] flex flex-col items-center justify-center text-center">
                      <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-200 mb-4">
                        <Printer size={32} />
                      </div>
                      <p className="text-xs font-black text-slate-400 tracking-tighter uppercase mb-1">Chưa có máy in nào</p>
                      <p className="text-[10px] text-slate-300 font-medium">Bấm "Thêm máy in" để bắt đầu cấu hình kết nối.</p>
                   </div>
                 )}
              </div>
              
              <div className="p-6 bg-amber-50 rounded-2xl border border-amber-100 flex gap-4">
                 <AlertCircle size={20} className="text-amber-600 mt-1 shrink-0" />
                 <div>
                    <h4 className="text-xs font-black text-amber-900 uppercase mb-1">Hướng dẫn kết nối theo thiết bị</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-3">
                       <div className="space-y-1">
                          <p className="text-[10px] font-black text-amber-800 uppercase">Máy tính (PC/Laptop)</p>
                          <p className="text-[9px] text-amber-700/70 leading-relaxed">Sử dụng "Quét USB" để nhận diện máy in cắm trực tiếp. Cần cài Driver nếu in qua Browser.</p>
                       </div>
                       <div className="space-y-1">
                          <p className="text-[10px] font-black text-amber-800 uppercase">Android</p>
                          <p className="text-[9px] text-amber-700/70 leading-relaxed">Bật Bluetooth và vị trí. Sử dụng "Quét Bluetooth" để tìm máy in nhiệt di động.</p>
                       </div>
                       <div className="space-y-1">
                          <p className="text-[10px] font-black text-amber-800 uppercase">iOS / iPad</p>
                          <p className="text-[9px] text-amber-700/70 leading-relaxed">Ưu tiên máy in LAN/WIFI. Với Bluetooth, cần app hỗ trợ hoặc trình duyệt có Web Bluetooth.</p>
                       </div>
                    </div>
                 </div>
              </div>
            </motion.div>
          ) : activeTab === 'subdomain' ? (
            <motion.div
              key="subdomain-tab"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="space-y-8"
            >
              <div className="bg-gradient-to-br from-emerald-50 to-teal-50 p-6 rounded-3xl border border-emerald-100">
                <div className="flex gap-4">
                  <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm text-emerald-600">
                    <Globe size={24} />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight mb-1">Cấu hình định danh</h3>
                    <p className="text-xs text-slate-500 leading-relaxed">Cấp quyền và quản lý đường dẫn truy cập riêng cho cửa hàng của bạn.</p>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 mb-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Subdomain riêng</label>
                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[8px] font-black rounded-full uppercase">Đề xuất</span>
                  </div>
                  <div className="relative group">
                    <input
                      type="text"
                      name="subdomain"
                      value={settings.subdomain || ''}
                      onChange={handleChange}
                      placeholder="VD: antigravity"
                      className="w-full bg-slate-50 border-none rounded-2xl pr-32 pl-5 py-4 text-sm font-bold focus:ring-2 focus:ring-emerald-500 transition-all placeholder:text-slate-300"
                    />
                    <div className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-black uppercase tracking-tight">
                      .{baseDomain}
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-400 italic ml-1">Người dùng có thể truy cập qua: <span className="text-emerald-600 font-bold">{settings.subdomain || 'yourshop'}.{baseDomain}</span></p>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Đường dẫn tùy chỉnh (Slug)</label>
                  <div className="relative group">
                    <input
                      type="text"
                      name="customPath"
                      value={settings.customPath || ''}
                      onChange={handleChange}
                      placeholder="VD: coffee-house"
                      className="w-full bg-slate-50 border-none rounded-2xl pl-40 pr-5 py-4 text-sm font-bold focus:ring-2 focus:ring-emerald-500 transition-all placeholder:text-slate-300"
                    />
                    <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-black uppercase tracking-tight">
                      {baseDomain}/
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-400 italic ml-1">Hoặc qua đường dẫn: <span className="text-emerald-600 font-bold">{baseDomain}/{settings.customPath || 'yourshop'}</span></p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                  <div 
                    onClick={fillWithUsername}
                    className="p-5 bg-white border border-slate-100 rounded-2xl shadow-sm hover:shadow-md transition-shadow cursor-pointer group"
                  >
                    <div className="w-8 h-8 bg-slate-50 rounded-lg flex items-center justify-center text-slate-400 mb-3 group-hover:text-emerald-500 group-hover:bg-emerald-50 transition-colors">
                      <User size={16} />
                    </div>
                    <h4 className="text-[10px] font-black text-slate-900 uppercase mb-1">Theo tên người dùng</h4>
                    <p className="text-[9px] text-slate-400 leading-relaxed">Tự động sử dụng định danh dựa trên username của người quản trị cửa hàng.</p>
                  </div>
                  <div className="p-5 bg-white border border-slate-100 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                    <div className="w-8 h-8 bg-slate-50 rounded-lg flex items-center justify-center text-slate-400 mb-3 group-hover:text-emerald-500">
                      <LinkIcon size={16} />
                    </div>
                    <h4 className="text-[10px] font-black text-slate-900 uppercase mb-1">Liên kết vĩnh viễn</h4>
                    <p className="text-[9px] text-slate-400 leading-relaxed">Đường dẫn sẽ được bảo lưu và không thay đổi trừ khi có yêu cầu từ hệ thống.</p>
                  </div>
                </div>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>

        <div className="mt-10 flex items-center justify-between border-t border-slate-100 pt-8">
          <AnimatePresence>
            {message && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className={cn(
                  "flex items-center gap-2 text-xs font-black uppercase tracking-tight",
                  message.type === 'success' ? "text-emerald-600" : "text-red-500"
                )}
              >
                {message.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                {message.text}
              </motion.div>
            )}
          </AnimatePresence>

          <button
            type="submit"
            disabled={saving}
            className="ml-auto flex items-center gap-2 px-10 py-4 bg-slate-900 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-emerald-600 hover:scale-[1.02] transition-all shadow-xl disabled:opacity-50 disabled:hover:bg-slate-900"
          >
            {saving ? (
              <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
            ) : (
              <Save size={16} />
            )}
            Lưu thay đổi
          </button>
        </div>
      </form>
    </div>
  );
};

export default SettingsPage;
