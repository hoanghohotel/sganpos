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

  // Trigger print once data is set and component is rendered
  useEffect(() => {
    if (printData && contentRef.current) {
      handlePrint();
    }
  }, [printData, handlePrint]);

  if (!printData) return null;

  return (
    <div style={{ display: 'none' }}>
      <ReceiptTemplate 
        ref={contentRef} 
        order={printData.order} 
        settings={printData.settings} 
        isProvisional={printData.isProvisional} 
      />
    </div>
  );
};

export default PrintService;

// Helper to trigger print from anywhere
export const triggerPrint = (data: PrintEventDetail) => {
  const event = new CustomEvent<PrintEventDetail>(PRINT_EVENT, { detail: data });
  window.dispatchEvent(event);
};
