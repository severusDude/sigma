"use client";

import { Suspense } from "react";
import { PreviewSkeleton } from "./preview-skeleton";

type PreviewSize = "full" | "modal" | "thumbnail";

interface DocumentPreviewProps {
  docId?: string;
  templateType?: string;
  size?: PreviewSize;
}

const sizeClasses: Record<PreviewSize, string> = {
  full: "w-full h-[calc(100vh-12rem)]",
  modal: "w-full h-[80vh]",
  thumbnail: "w-full h-60",
};

function PreviewIframe({ src }: { src: string }) {
  return (
    <iframe
      src={src}
      className="w-full h-full rounded-md border"
      title="PDF Preview"
    />
  );
}

export function DocumentPreview({ docId, templateType = "certificate", size = "modal" }: DocumentPreviewProps) {
  const src = docId
    ? `/api/documents/${docId}/file`
    : `/api/templates/${templateType}/preview`;

  return (
    <Suspense fallback={<PreviewSkeleton size={size} />}>
      <div className={sizeClasses[size]}>
        <PreviewIframe src={src} />
      </div>
    </Suspense>
  );
}
