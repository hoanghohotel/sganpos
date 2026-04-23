import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Save, Building2, CreditCard, Upload, CheckCircle2, AlertCircle, ChevronDown, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

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

const SettingsPage = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'payment'>('overview');
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
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      const [settingsRes, banksRes] = await Promise.all([
        axios.get('/api/settings'),
        axios.get('https://api.vietqr.io/v2/banks')
      ]);
      
      setSettings(settingsRes.data);
      if (banksRes.data && banksRes.data.data) {
        setBanks(banksRes.data.data);
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
      await axios.put('/api/settings', settings);
      setMessage({ type: 'success', text: 'Đã lưu cài đặt thành công!' });
      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      setMessage({ type: 'error', text: 'Có lỗi xảy ra khi lưu cài đặt.' });
    } finally {
      setSaving(false);
    }
  };

  const filteredBanks = banks.filter(bank => 
    bank.name.toLowerCase().includes(bankSearch.toLowerCase()) || 
    bank.shortName.toLowerCase().includes(bankSearch.toLowerCase()) ||
    bank.code.toLowerCase().includes(bankSearch.toLowerCase())
  );

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
                    value={settings.storeName}
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
                    value={settings.hotline}
                    onChange={handleChange}
                    placeholder="Số điện thoại liên hệ"
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
                    value={settings.logoUrl}
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
                  value={settings.address}
                  onChange={handleChange}
                  placeholder="Địa chỉ chi tiết của quán"
                  rows={3}
                  className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 text-sm font-bold focus:ring-2 focus:ring-emerald-500 transition-all placeholder:text-slate-300 resize-none"
                />
              </div>
            </motion.div>
          ) : (
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
                    value={settings.bankAccount}
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
                    value={settings.bankAccountHolder}
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
