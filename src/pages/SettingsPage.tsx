import React, { useState, useEffect } from 'react';
import api from '../lib/api';
import axios from 'axios';
import { Save, Building2, CreditCard, Upload, CheckCircle2, AlertCircle, ChevronDown, Search, Globe, Link as LinkIcon, User, Plus, Move, Trash2, GripVertical, Type, List, Hash, Layout, Printer, Eye } from 'lucide-react';
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
    <div className={cn(
      "w-[300px] min-h-[500px] bg-white shadow-2xl p-6 transition-all duration-500 mx-auto border border-slate-100",
      isRetro && "font-mono scale-[0.98] border-dashed border-slate-300 shadow-none",
      isModern && "rounded-3xl shadow-emerald-200/20",
      isElegant && "border-double border-4 border-slate-900 shadow-none px-8",
      isMinimal && "border-none shadow-sm"
    )}>
      <div className="flex flex-col gap-4 text-slate-800">
        {fields.filter(f => f.enabled).map(field => {
          switch (field.id) {
            case 'logo':
              return settings.logoUrl ? (
                <div key={field.id} className="flex justify-center">
                  <img src={settings.logoUrl} alt="Logo" className="w-16 h-16 object-contain grayscale" />
                </div>
              ) : null;
            case 'store-name':
              return (
                <div key={field.id} className={cn(
                   "text-center font-black uppercase tracking-tight",
                   isModern ? "text-xl text-emerald-600" : "text-lg",
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
                <div key={field.id} className="text-[10px] text-center font-bold">
                  Hotline: {settings.hotline || '0123.456.789'}
                </div>
              );
            case 'sep-1':
            case 'sep-2':
              return (
                <div key={field.id} className={cn(
                  "border-t my-1",
                  isRetro ? "border-dotted border-slate-400" : "border-slate-100"
                )} />
              );
            case 'order-info':
              return (
                <div key={field.id} className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="font-bold">Mã đơn:</span>
                    <span>#ORD-123456</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-bold">Bàn:</span>
                    <span>Bàn 05</span>
                  </div>
                </div>
              );
            case 'items-list':
              return (
                <div key={field.id} className="space-y-2 py-2">
                  <div className="flex justify-between text-[10px] font-black uppercase text-slate-400">
                    <span>Món</span>
                    <span>T.Tiền</span>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                        <span>Cà phê sữa đá x2</span>
                        <span>50k</span>
                    </div>
                    <div className="flex justify-between text-xs">
                        <span>Bạc xỉu x1</span>
                        <span>25k</span>
                    </div>
                  </div>
                </div>
              );
            case 'totals':
              return (
                <div key={field.id} className="space-y-1 pt-2 border-t border-slate-100">
                  <div className="flex justify-between text-xs">
                    <span>Tạm tính</span>
                    <span>75k</span>
                  </div>
                  <div className="flex justify-between text-base font-black">
                    <span>TỔNG CỘNG</span>
                    <span className={isModern ? "text-emerald-600" : ""}>75k</span>
                  </div>
                </div>
              );
            case 'qr':
              return (
                <div key={field.id} className="flex flex-col items-center gap-2 mt-4">
                  <div className="text-[8px] font-black uppercase text-slate-400">Quét mã để thanh toán</div>
                  <div className="w-32 h-32 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-center grayscale overflow-hidden">
                    <img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=example" alt="QR" className="w-24 h-24 opacity-50" />
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
                  <div key={field.id} className="text-xs text-center py-1">
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
  const [activeTab, setActiveTab] = useState<'overview' | 'payment' | 'subdomain' | 'templates'>('overview');
  const [banks, setBanks] = useState<Bank[]>([]);
  const [showBankList, setShowBankList] = useState(false);
  const [bankSearch, setBankSearch] = useState('');
  
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
    defaultPrintTemplate: 'classic'
  });

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
      await api.put('/api/settings', { 
        ...settings, 
        templateFields: templateFields // Save custom template structure
      });
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
          <CreditCard size={16} />
          Mẫu in
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

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                {/* Designer Side */}
                <div className="space-y-6">
                  {!isDesigning ? (
                    <div className="grid grid-cols-1 gap-4">
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
                <div className="sticky top-0 bg-slate-50 p-8 rounded-[40px] flex flex-col gap-6 items-center">
                  <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    <Eye size={14} />
                    Xem trước bản in
                  </div>
                  
                  <PrintPreview fields={templateFields} settings={settings} />

                  <div className="max-w-[280px] text-center italic text-[9px] text-slate-400 leading-relaxed font-medium">
                    Lưu ý: Hình ảnh thực tế khi in ra từ máy in nhiệt có thể khác nhau tùy thuộc vào khổ giấy (58mm/80mm) và độ phân giải của máy.
                  </div>
                </div>
              </div>
            </motion.div>
          ) : (
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
                      .pos.com
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-400 italic ml-1">Người dùng có thể truy cập qua: <span className="text-emerald-600 font-bold">{settings.subdomain || 'yourshop'}.pos.com</span></p>
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
                      className="w-full bg-slate-50 border-none rounded-2xl pl-32 pr-5 py-4 text-sm font-bold focus:ring-2 focus:ring-emerald-500 transition-all placeholder:text-slate-300"
                    />
                    <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-black uppercase tracking-tight">
                      pos.com/
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-400 italic ml-1">Hoặc qua đường dẫn: <span className="text-emerald-600 font-bold">pos.com/{settings.customPath || 'yourshop'}</span></p>
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
          )}
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
