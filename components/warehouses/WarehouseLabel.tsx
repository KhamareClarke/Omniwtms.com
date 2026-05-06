import React, { useEffect, useRef } from 'react';
import JsBarcode from 'jsbarcode';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  "https://qpkaklmbiwitlroykjim.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFwa2FrbG1iaXdpdGxyb3lramltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzY4MTM4NjIsImV4cCI6MjA1MjM4OTg2Mn0.4y_ogmlsnMMXCaISQeVo-oS6zDJnyAVEeAo6p7Ms97U"
);

export default function WarehouseLabel({
  company = 'Warehouse Label',
  customerName,
  dateOfArrival,
  timeOfArrival,
  aisle,
  bay,
  level,
  position,
  barcodeValue = ''
}: {
  company?: string;
  customerName: string;
  dateOfArrival: string;
  timeOfArrival: string;
  aisle: string;
  bay: string;
  level: string;
  position: string;
  barcodeValue?: string;
}) {
  const barcodeRef = useRef<SVGSVGElement>(null);
  const shortBarcode = barcodeValue?.slice(0, 8) || '';
  
  useEffect(() => {
    if (typeof window !== 'undefined' && barcodeRef.current && shortBarcode) {
      JsBarcode(barcodeRef.current, shortBarcode, {
        format: 'CODE128',
        displayValue: false,
        fontSize: 18,
        height: 60,
        width: 2,
        margin: 0
      });
    }
  }, [shortBarcode]);

  return (
    <div id={`label-${barcodeValue}`} style={{ border: '2px solid #222', borderRadius: 12, width: 320, background: '#fff', padding: 16, fontFamily: 'Arial, sans-serif', margin: '16px auto' }}>
      {/* Company Name */}
      <div style={{ fontWeight: 'bold', fontSize: 22, textAlign: 'center', marginBottom: 8 }}>{company}</div>
      
      {/* Customer Information */}
      <div style={{ borderTop: '2px solid #222', borderBottom: '2px solid #222', padding: 8, marginBottom: 8 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 16 }}>
          <span>Customer:</span>
          <span style={{ fontWeight: 'bold' }}>{customerName}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 16 }}>
          <span>Date of Arrival:</span>
          <span style={{ fontWeight: 'bold' }}>{dateOfArrival}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 16 }}>
          <span>Time of Arrival:</span>
          <span style={{ fontWeight: 'bold' }}>{timeOfArrival}</span>
        </div>
      </div>

      {/* Location Information */}
      <div style={{ borderBottom: '2px solid #222', padding: 8, marginBottom: 8 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 16 }}>
          <span>Aisle:</span>
          <span style={{ fontWeight: 'bold' }}>{aisle}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 16 }}>
          <span>Bay:</span>
          <span style={{ fontWeight: 'bold' }}>{bay}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 16 }}>
          <span>Level:</span>
          <span style={{ fontWeight: 'bold' }}>{level}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 16 }}>
          <span>Position:</span>
          <span style={{ fontWeight: 'bold' }}>{position}</span>
        </div>
      </div>

      {/* Barcode */}
      <div style={{ textAlign: 'center', marginTop: 8 }}>
        <svg ref={barcodeRef} style={{ maxWidth: '100%' }} />
        <div style={{ fontSize: 20, letterSpacing: 2, marginTop: 4 }}>{shortBarcode}</div>
      </div>
    </div>
  );
} 