"use client";

/**
 * BarcodeScanner — camera-based barcode / QR reader.
 * Uses react-zxing (thin React wrapper over @zxing/browser + WASM).
 * Imported via next/dynamic { ssr: false } to keep WASM out of the SSR bundle.
 */

import { useRef } from "react";
import { useZxing } from "react-zxing";

interface Props {
  onScan: (code: string) => void;
  onClose: () => void;
}

export default function BarcodeScanner({ onScan, onClose }: Props) {
  // Debounce: ignore the same code twice within 2 s (camera fires continuously)
  const lastCode = useRef("");
  const lastAt = useRef(0);

  const { ref } = useZxing({
    onDecodeResult(result) {
      const code = result.getText().trim();
      if (!code) return;
      const now = Date.now();
      if (code === lastCode.current && now - lastAt.current < 2000) return;
      lastCode.current = code;
      lastAt.current = now;
      onScan(code);
    },
    // onDecodeError fires every frame when no barcode is found — ignore it
  });

  return (
    <div className="space-y-2">
      {/* Camera viewport */}
      <div className="relative rounded-xl overflow-hidden bg-black" style={{ aspectRatio: "4/3" }}>
        <video ref={ref} className="w-full h-full object-cover" />

        {/* Dark vignette + targeting box */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="absolute inset-0 bg-black/40" />
          <div className="relative w-56 h-24 border-2 border-blue-400 rounded-lg">
            {/* Corner accents */}
            <span className="absolute top-0 left-0 w-4 h-4 border-t-4 border-l-4 border-blue-400 rounded-tl-sm" />
            <span className="absolute top-0 right-0 w-4 h-4 border-t-4 border-r-4 border-blue-400 rounded-tr-sm" />
            <span className="absolute bottom-0 left-0 w-4 h-4 border-b-4 border-l-4 border-blue-400 rounded-bl-sm" />
            <span className="absolute bottom-0 right-0 w-4 h-4 border-b-4 border-r-4 border-blue-400 rounded-br-sm" />
          </div>
        </div>
      </div>

      {/* Controls */}
      <button
        type="button"
        onClick={onClose}
        className="w-full text-sm text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
      >
        ✕ סגור מצלמה
      </button>
    </div>
  );
}
