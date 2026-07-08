"use client";

import { Camera, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { parsePhoneFromScan } from "@/lib/phone-utils";

type QrPhoneScannerProps = {
  onScan: (phoneE164: string) => void;
  onClose?: () => void;
};

export function QrPhoneScanner({ onScan, onClose }: QrPhoneScannerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const scannerRef = useRef<{ stop: () => Promise<void> } | null>(null);
  const [error, setError] = useState("");
  const [active, setActive] = useState(false);

  const stopScanner = useCallback(async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
      } catch {
        /* ignore */
      }
      scannerRef.current = null;
    }
    setActive(false);
  }, []);

  useEffect(() => {
    return () => {
      void stopScanner();
    };
  }, [stopScanner]);

  async function startScanner() {
    setError("");
    if (!containerRef.current) return;

    try {
      const { Html5Qrcode } = await import("html5-qrcode");
      const scanner = new Html5Qrcode("qr-phone-scanner-region");
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: "environment" },
        { fps: 8, qrbox: { width: 220, height: 220 } },
        (decoded) => {
          const phone = parsePhoneFromScan(decoded);
          if (phone) {
            onScan(phone);
            void stopScanner();
            onClose?.();
          }
        },
        () => {}
      );
      setActive(true);
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Camera access denied or scanner unavailable. Enter the number manually."
      );
      setActive(false);
    }
  }

  return (
    <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-emerald-900">Scan WhatsApp / contact QR</p>
        {onClose && (
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-700">
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
      <p className="text-xs text-emerald-800/80">
        Point your camera at a WhatsApp contact QR or wa.me code. Default country is India (+91).
      </p>
      <div
        id="qr-phone-scanner-region"
        ref={containerRef}
        className={`overflow-hidden rounded-lg bg-black/90 ${active ? "min-h-[240px]" : "hidden"}`}
      />
      {error && <p className="text-xs text-red-600">{error}</p>}
      <div className="flex gap-2">
        {!active ? (
          <Button type="button" variant="secondary" onClick={() => void startScanner()}>
            <Camera className="h-4 w-4" />
            Open scanner
          </Button>
        ) : (
          <Button type="button" variant="secondary" onClick={() => void stopScanner()}>
            Stop camera
          </Button>
        )}
      </div>
    </div>
  );
}
