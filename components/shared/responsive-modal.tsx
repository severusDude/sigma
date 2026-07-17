"use client";

import type { ReactNode } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from "@/components/ui/drawer";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useIsMobile } from "@/hooks/use-mobile";

interface ResponsiveModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: ReactNode;
  scrollable?: boolean;
}

export function ResponsiveModal({
  open,
  onOpenChange,
  title,
  description,
  children,
  scrollable = true,
}: ResponsiveModalProps) {
  const isMobile = useIsMobile();

  if (!isMobile) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="h-screen max-w-screen md:min-w-[calc(100%-32rem)] md:h-fit gap-0 p-0 overflow-hidden">
          <DialogHeader className="px-6 pt-6 pb-4 space-y-1 border-b">
            <DialogTitle className="text-2xl font-semibold tracking-tight text-primary">
              {title}
            </DialogTitle>
            {description && <DialogDescription>{description}</DialogDescription>}
          </DialogHeader>
          {scrollable ? (
            <ScrollArea className="max-h-[calc(100vh-12rem)]">
              <div className="px-6 py-6">{children}</div>
            </ScrollArea>
          ) : (
            <div className="px-6 py-6">{children}</div>
          )}
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>{title}</DrawerTitle>
          {description && <DrawerDescription>{description}</DrawerDescription>}
        </DrawerHeader>
        <div className="px-4 pb-6 overflow-y-auto max-h-[calc(100dvh-12rem)]">
          {children}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
