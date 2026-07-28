"use client";

import { useRef, useEffect, useCallback } from "react";

const WORKER_URL = "https://unpkg.com/pdfjs-dist@6.1.200/build/pdf.worker.min.mjs";

type PdfPreviewProps = {
  templateId: string;
  canvasW: number;
  canvasH: number;
  onRenderScaleChange: (scale: number) => void;
};

export default function PdfPreview({
  templateId,
  canvasW,
  canvasH,
  onRenderScaleChange,
}: PdfPreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pdfDocRef = useRef<any>(null);
  const disposeRef = useRef<(() => void) | null>(null);

  const renderPage = useCallback(async () => {
    const pdfDoc = pdfDocRef.current;
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!pdfDoc || !canvas || !container) return;

    const containerWidth = container.clientWidth;
    if (containerWidth <= 0) return;

    const displayScale = containerWidth / canvasW;
    const displayHeight = canvasH * displayScale;

    const dpr = window.devicePixelRatio || 1;
    const pixelScale = displayScale * dpr;

    const page = await pdfDoc.getPage(1);
    const viewport = page.getViewport({ scale: pixelScale });

    canvas.width = viewport.width;
    canvas.height = viewport.height;
    canvas.style.width = `${displayScale * canvasW}px`;
    canvas.style.height = `${displayHeight}px`;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const renderTask = page.render({
      canvas: canvas,
      canvasContext: ctx,
      viewport,
    });
    await renderTask.promise;

    onRenderScaleChange(displayScale);
  }, [canvasW, canvasH, onRenderScaleChange]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let cancelled = false;

    const init = async () => {
      try {
        const pdfjsLib = await import("pdfjs-dist");

        pdfjsLib.GlobalWorkerOptions.workerSrc = WORKER_URL;

        if (cancelled) return;

        const res = await fetch(`/api/templates/${templateId}/file`);
        if (!res.ok) return;

        const arrayBuffer = await res.arrayBuffer();
        if (cancelled) return;

        const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
        const pdfDoc = await loadingTask.promise;
        pdfDocRef.current = pdfDoc;

        if (!cancelled) {
          await renderPage();
        }
      } catch {
        console.error("Failed to load PDF preview");
      }
    };

    init();

    const ro = new ResizeObserver(() => {
      renderPage();
    });
    ro.observe(container);

    return () => {
      cancelled = true;
      ro.disconnect();
      if (disposeRef.current) {
        disposeRef.current();
      }
    };
  }, [templateId, renderPage]);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full overflow-hidden flex items-start justify-center"
    >
      <canvas ref={canvasRef} className="block" />
    </div>
  );
}
