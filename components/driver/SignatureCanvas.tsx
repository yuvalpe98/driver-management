"use client";

import { useEffect, useRef, useImperativeHandle, forwardRef } from "react";
import SignaturePad from "signature_pad";

export interface SignatureCanvasRef {
  isEmpty: () => boolean;
  toDataURL: () => string;
  clear: () => void;
}

const SignatureCanvas = forwardRef<SignatureCanvasRef>((_, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const padRef = useRef<SignaturePad | null>(null);

  useImperativeHandle(ref, () => ({
    isEmpty: () => padRef.current?.isEmpty() ?? true,
    toDataURL: () => padRef.current?.toDataURL("image/png") ?? "",
    clear: () => padRef.current?.clear(),
  }));

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const pad = new SignaturePad(canvas, {
      minWidth: 1,
      maxWidth: 3,
      penColor: "#1e293b",
      backgroundColor: "rgb(255,255,255)",
    });
    padRef.current = pad;

    function resize() {
      if (!canvas || !pad) return;
      const ratio = Math.max(window.devicePixelRatio || 1, 1);
      const data = pad.toData();
      canvas.width = canvas.offsetWidth * ratio;
      canvas.height = canvas.offsetHeight * ratio;
      const ctx = canvas.getContext("2d");
      if (ctx) ctx.scale(ratio, ratio);
      pad.clear();
      if (data.length > 0) pad.fromData(data);
    }

    resize();
    window.addEventListener("resize", resize);
    return () => {
      window.removeEventListener("resize", resize);
      pad.off();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full touch-none cursor-crosshair"
      style={{ touchAction: "none" }}
    />
  );
});

SignatureCanvas.displayName = "SignatureCanvas";
export default SignatureCanvas;
