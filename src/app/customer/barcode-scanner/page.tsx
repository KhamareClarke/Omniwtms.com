// @ts-nocheck
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Html5QrcodeScanner } from "html5-qrcode";
import { toast } from "react-hot-toast";

export default function CustomerBarcodeScannerPage() {
  const [scanner, setScanner] = useState<Html5QrcodeScanner | null>(null);
  const router = useRouter();

  useEffect(() => {
    const customerStr = localStorage.getItem("currentCustomer");
    if (!customerStr) {
      router.push("/auth/login");
      return;
    }

    // Initialize scanner
    const newScanner = new Html5QrcodeScanner(
      "reader",
      {
        qrbox: {
          width: 250,
          height: 250,
        },
        fps: 10,
        aspectRatio: 1.0,
      },
      false
    );

    newScanner.render(onScanSuccess, onScanFailure);
    setScanner(newScanner);

    // Cleanup
    return () => {
      if (scanner) {
        scanner.clear();
      }
    };
  }, [router]);

  const onScanSuccess = (decodedText: string) => {
    // Handle successful scan
    toast.success(`Scanned: ${decodedText}`);
    // You can add additional logic here, like sending the barcode to your backend
  };

  const onScanFailure = (error: string) => {
    // Handle scan failure
    console.warn(`QR code scanning failed: ${error}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="w-full max-w-md mx-auto">
        <h1 className="text-2xl font-bold mb-4 text-center text-gray-900">
          Barcode Scanner
        </h1>
        <div className="bg-white rounded-xl shadow p-6">
          <div id="reader" className="w-full"></div>
        </div>
      </div>
    </div>
  );
}
