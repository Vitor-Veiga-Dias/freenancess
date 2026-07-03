"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

import { cn } from "@/ui/tokens/cn";

export type DrawerSide = "left" | "bottom";

interface DrawerProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  side?: DrawerSide;
  closeLabel?: string;
  children: React.ReactNode;
  className?: string;
}

export function Drawer({
  open,
  onClose,
  title,
  side = "bottom",
  closeLabel = "Close",
  children,
  className,
}: DrawerProps) {
  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onClose]);

  if (!open || typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <div className="fixed inset-0 z-50">
      <button
        type="button"
        aria-label={closeLabel}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn(
          "absolute flex flex-col border border-subtle bg-surface shadow-2xl backdrop-blur-xl",
          side === "left" &&
            "inset-y-0 left-0 w-[min(100vw-2rem,18rem)] rounded-r-[1.75rem]",
          side === "bottom" &&
            "inset-x-0 bottom-0 max-h-[min(90dvh,720px)] rounded-t-[1.75rem]",
          className,
        )}
      >
        <div className="flex items-center justify-between gap-3 border-b border-subtle px-5 py-4">
          {title ? (
            <h2 className="text-sm font-semibold text-primary">{title}</h2>
          ) : (
            <span />
          )}
          <button
            type="button"
            onClick={onClose}
            aria-label={closeLabel}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-elevated text-secondary transition-colors hover:text-primary"
          >
            <X className="h-4 w-4" strokeWidth={1.5} />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">{children}</div>
      </div>
    </div>,
    document.body,
  );
}
