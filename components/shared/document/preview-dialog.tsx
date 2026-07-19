"use client";

import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { DocumentPreview } from "./document-preview";

interface PreviewDialogProps {
  docId: string | null;
  onClose: () => void;
}

export function PreviewDialog({ docId, onClose }: PreviewDialogProps) {
  return (
    <Dialog open={!!docId} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-7xl max-h-[80vh]">
        <DialogTitle className="sr-only">Preview Sertifikat</DialogTitle>
        {docId && <DocumentPreview docId={docId} size="modal" />}
      </DialogContent>
    </Dialog>
  );
}
