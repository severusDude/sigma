"use client";

import { Suspense } from "react";
import { PreviewSkeleton } from "./preview-skeleton";

type PreviewSize = "full" | "modal" | "thumbnail";

export interface DocumentPreviewProps {
  docId?: string;
  templateType?: string;
  size?: PreviewSize;
}

const sizeClasses: Record<PreviewSize, string> = {
  full: "w-full h-[calc(100vh-12rem)]",
  modal: "w-full h-[80vh]",
  thumbnail: "w-full h-60",
};

function PreviewEmbed({ src }: { src: string }) {
  return (
    <embed
      src={src}
      type="application/pdf"
      className="w-full h-full rounded-md border"
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
        <PreviewEmbed src={src} />
      </div>
    </Suspense>
  );
}
