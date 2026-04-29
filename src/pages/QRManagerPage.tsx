import { IonPage, IonContent } from '@ionic/react';
import React, { useState, useEffect } from 'react';
// ... rest of imports
import api from '../lib/api';
import { getTenantPrefix } from '../lib/tenantUtils';
import { QRCodeCanvas } from 'qrcode.react';
import { Download, Printer, Filter } from 'lucide-react';
import { motion } from 'motion/react';

import { useAuthStore } from '../store/authStore';
import { ShieldAlert } from 'lucide-react';

interface Table {
  _id: string;
  name: string;
}

const QRManagerPage = () => {
  const { user } = useAuthStore();
  const canManageQR = user?.role === 'ADMIN' || user?.role === 'MANAGER' || user?.permissions?.includes('TABLE_MANAGE');
  const [tables, setTables] = useState<Table[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'ALL' | 'DINE_IN' | 'TAKEAWAY' | 'DELIVERY'>('DINE_IN');
  const [settings, setSettings] = useState<any>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [tableRes, settingsRes] = await Promise.all([
        api.get('/api/tables'),
        api.get('/api/settings/public/brand')
      ]);
      setTables(tableRes.data);
      setSettings(settingsRes.data);
    } catch (error) {
      console.error('Lỗi khi lấy dữ liệu:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredTables = tables.filter(t => {
    if (filter === 'DINE_IN') return t.name.startsWith('Bàn');
    if (filter === 'TAKEAWAY') return t.name.startsWith('Mang về');
    if (filter === 'DELIVERY') return t.name.startsWith('Ship');
    return true;
  });

  const getQRLink = (tableId: string) => {
    const prefix = getTenantPrefix();
    return `${window.location.origin}${prefix}/order?tableId=${tableId}`;
  };

  const downloadQR = (tableId: string, tableName: string) => {
    const canvas = document.getElementById(`qr-${tableId}`) as HTMLCanvasElement;
    if (canvas) {
      const url = canvas.toDataURL("image/png");
      const link = document.createElement('a');
      link.download = `QR_${tableName}.png`;
      link.href = url;
      link.click();
    }
  };

  if (loading) {
    return (
      <IonPage>
        <IonContent>
          <div className="p-8 flex items-center justify-center h-full">
             <div className="w-10 h-10 border-4 border-emerald-100 border-t-emerald-600 rounded-full animate-spin" />
          </div>
        </IonContent>
      </IonPage>
    );
  }

  if (!canManageQR) {
    return (
      <IonPage>
        <IonContent>
          <div className="h-full flex flex-col items-center justify-center p-8 text-center text-slate-500">
            <div className="w-24 h-24 bg-red-50 rounded-[32px] flex items-center justify-center mb-6">
              <ShieldAlert size={48} className="text-red-500 opacity-20" />
            </div>
            <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight mb-2">Truy cập bị từ chối</h2>
            <p className="max-w-md font-medium">Bạn không có quyền truy cập vào chức năng quản lý mã QR. Vui lòng liên hệ quản trị viên.</p>
          </div>
        </IonContent>
      </IonPage>
    );
  }

  return (
    <IonPage>
      <IonContent>
        <div className="p-8 h-full overflow-auto bg-[#F8FAFC] text-slate-800">
      <header className="flex justify-between items-end mb-10">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase mb-2">Quản lý Mã QR</h1>
          <p className="text-slate-500 font-medium">In mã QR và đặt tại từng bàn để khách tự gọi món.</p>
        </div>
        <div className="flex gap-2 bg-white p-1 rounded-xl border border-slate-200">
           {(['DINE_IN', 'TAKEAWAY', 'DELIVERY'] as const).map(f => (
             <button
               key={f}
               onClick={() => setFilter(f)}
               className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${filter === f ? 'bg-slate-900 text-white' : 'text-slate-400 hover:bg-slate-50'}`}
             >
               {f === 'DINE_IN' ? 'Tại chỗ' : f === 'TAKEAWAY' ? 'Mang về' : 'Ship'}
             </button>
           ))}
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredTables.map((table) => (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            key={table._id}
            className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-xl shadow-slate-200/30 flex flex-col items-center group hover:border-emerald-500 transition-all"
          >
            <div className="mb-6 p-4 bg-slate-50 rounded-2xl group-hover:bg-emerald-50 transition-colors">
              <QRCodeCanvas
                id={`qr-${table._id}`}
                value={getQRLink(table._id)}
                size={180}
                level="H"
                includeMargin={true}
                imageSettings={{
                  src: settings?.logoUrl || "/logo.svg",
                  x: undefined,
                  y: undefined,
                  height: 30,
                  width: 30,
                  excavate: true,
                }}
              />
            </div>
            
            <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter mb-1">{table.name}</h3>
            <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-6">Quét để gọi món</p>
            
            <div className="flex gap-2 w-full mt-auto">
              <button 
                onClick={() => downloadQR(table._id, table.name)}
                className="flex-1 py-3 bg-slate-50 text-slate-900 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-emerald-600 hover:text-white transition-all flex items-center justify-center gap-2"
              >
                <Download size={14} /> Tải về
              </button>
              <button 
                className="p-3 bg-slate-50 text-slate-400 rounded-xl hover:text-emerald-600 transition-colors"
                title="Sắp tới: In ấn hàng loạt"
              >
                <Printer size={14} />
              </button>
            </div>
          </motion.div>
        ))}
      </div>
      
      {filteredTables.length === 0 && (
         <div className="h-64 flex flex-col items-center justify-center text-slate-300">
            <Filter size={48} className="mb-4 opacity-20" />
            <p className="font-black uppercase tracking-widest text-xs">Không tìm thấy bàn nào</p>
         </div>
      )}
    </div>
    </IonContent>
  </IonPage>
  );
};

export default QRManagerPage;
