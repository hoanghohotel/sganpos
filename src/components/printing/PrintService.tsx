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
            /* Reset body/html for printing */
            html, body {
              height: initial !important;
              overflow: initial !important;
              position: initial !important;
              background: white !important;
            }
            /* Hide everything except print container */
            body > *:not(.app-print-container) {
              display: none !important;
            }
            .app-print-container {
              display: block !important;
              position: relative !important;
              width: 100% !important;
              margin: 0 !important;
              padding: 0 !important;
            }
          }
        `}
      </style>
      <div className="app-print-container" style={{ position: 'absolute', top: '-9999px', left: '-9999px' }}>
        <ReceiptTemplate 
          ref={contentRef} 
          order={printData.order} 
          settings={printData.settings} 
          isProvisional={printData.isProvisional} 
        />
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
