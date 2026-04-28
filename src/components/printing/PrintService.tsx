import React, { useRef, useState, useEffect, useCallback } from 'react';
import { useReactToPrint } from 'react-to-print';
import ReceiptTemplate from './ReceiptTemplate';
import { PrintEventDetail, PRINT_EVENT } from '../../types/printing';

const PrintService: React.FC = () => {
  const [printData, setPrintData] = useState<PrintEventDetail | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    contentRef,
    documentTitle: 'Receipt',
    onAfterPrint: () => setPrintData(null),
    onPrintError: (error) => console.error('Printing failed:', error),
  });

  // Listen for global print events
  useEffect(() => {
    const listener = (event: Event) => {
      const detail = (event as CustomEvent<PrintEventDetail>).detail;
      setPrintData(detail);
    };

    window.addEventListener(PRINT_EVENT, listener);
    return () => window.removeEventListener(PRINT_EVENT, listener);
  }, []);

  // Trigger print with delay and cleanup
  useEffect(() => {
    if (printData && contentRef.current) {
      const timer = setTimeout(() => {
        handlePrint();
      }, 500); // 500ms delay to ensure rendering is complete
      return () => clearTimeout(timer);
    }
  }, [printData, handlePrint]);

  if (!printData) return null;

  return (
    <>
      <style>
        {`
          @media print {
            .no-print { display: none !important; }
            body { 
              background: white !important;
              visibility: hidden;
            }
            .app-print-container, .app-print-container * {
              visibility: visible !important;
            }
            .app-print-container {
              display: block !important;
              position: absolute !important;
              left: 0 !important;
              top: 0 !important;
              width: ${printData.settings?.printWidth === '58mm' ? '58mm' : '80mm'} !important;
              margin: 0 !important;
              padding: 0 !important;
              background: white !important;
            }
            /* Remove margins from @page to avoid extra space */
            @page {
              margin: 0;
            }
          }
        `}
      </style>
      <div className="app-print-container" style={{ position: 'fixed', top: '-10000px', left: '-10000px', opacity: 0, pointerEvents: 'none', zIndex: -1 }}>
        <div ref={contentRef}>
          <ReceiptTemplate 
            order={printData.order} 
            settings={printData.settings} 
            isProvisional={printData.isProvisional} 
          />
        </div>
      </div>
    </>
  );
};

export default PrintService;

// Helper to trigger print from anywhere
export const triggerPrint = (data: PrintEventDetail) => {
  const event = new CustomEvent<PrintEventDetail>(PRINT_EVENT, { detail: data });
  window.dispatchEvent(event);
};
