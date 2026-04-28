import React from 'react';
import { X, Download, Printer } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { PrintOrderData, PrintSettings, generatePrintHTML } from '../lib/printing';

interface PrintPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: PrintOrderData;
  settings: PrintSettings;
  isProvisional?: boolean;
  onPrint?: () => void;
}

export const PrintPreviewModal: React.FC<PrintPreviewModalProps> = ({
  isOpen,
  onClose,
  order,
  settings,
  isProvisional = false,
  onPrint
}) => {
  const html = generatePrintHTML(order, settings, isProvisional);

  const handlePrint = () => {
    // Get iframe and print it
    const iframe = document.getElementById('print-preview-iframe') as HTMLIFrameElement;
    if (iframe) {
      iframe.contentWindow?.print();
    }
  };

  const handleDownload = () => {
    const html = generatePrintHTML(order, settings, isProvisional);
    const element = document.createElement('a');
    element.setAttribute('href', 'data:text/html;charset=utf-8,' + encodeURIComponent(html));
    element.setAttribute('download', `${isProvisional ? 'tam-tinh' : 'hoa-don'}-${Date.now()}.html`);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-950/50 backdrop-blur-sm"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-4xl h-[85vh] bg-white rounded-lg shadow-2xl overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-200 bg-slate-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                  <Printer className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">
                    {isProvisional ? 'Xem trước phiếu tạm tính' : 'Xem trước hóa đơn'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {order.tableName || 'Đơn hàng'} - {new Date(order.createdAt || Date.now()).toLocaleTimeString('vi-VN')}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-slate-200 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-slate-600" />
              </button>
            </div>

            {/* Preview Content */}
            <div className="flex-1 overflow-auto bg-slate-100 p-4">
              <div className="mx-auto bg-white">
                <iframe
                  id="print-preview-iframe"
                  srcDoc={html}
                  className="w-full h-full border-0"
                  style={{ minHeight: '500px' }}
                />
              </div>
            </div>

            {/* Footer Actions */}
            <div className="flex items-center justify-end gap-3 p-6 border-t border-slate-200 bg-slate-50">
              <button
                onClick={onClose}
                className="px-4 py-2.5 text-slate-700 font-medium rounded-lg border border-slate-200 hover:bg-slate-100 transition-colors"
              >
                Đóng
              </button>
              <button
                onClick={handleDownload}
                className="px-4 py-2.5 text-slate-700 font-medium rounded-lg border border-slate-200 hover:bg-slate-100 transition-colors flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Tải về
              </button>
              <button
                onClick={handlePrint}
                className="px-4 py-2.5 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-2"
              >
                <Printer className="w-4 h-4" />
                In ngay
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
