"use client";

import * as React from "react";
import { useRef, useCallback } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

interface DismissableSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
  className?: string;
  /** Optional accessible title (hidden visually). Provide for a11y. */
  title?: string;
}

/**
 * Bottom sheet built on shadcn Sheet (side="bottom") with a drag handle.
 * Drag the handle down to dismiss. Min height ≈ 60vh so it always feels roomy.
 */
export function DismissableSheet({
  open,
  onOpenChange,
  children,
  className,
  title,
}: DismissableSheetProps) {
  const handleRef = useRef<HTMLDivElement>(null);
  const dragStartY = useRef(0);
  const currentTranslateY = useRef(0);
  const isDragging = useRef(false);
  const contentRef = useRef<HTMLDivElement>(null);

  const close = useCallback(() => onOpenChange(false), [onOpenChange]);

  /* ── Drag logic (handle only) ── */
  const handleDragStart = useCallback(
    (clientY: number) => {
      if (!open) return;
      isDragging.current = true;
      dragStartY.current = clientY;
      currentTranslateY.current = 0;
      const el = contentRef.current;
      if (el) el.style.transition = "none";
    },
    [open],
  );

  const handleDragMove = useCallback((clientY: number) => {
    if (!isDragging.current) return;
    const delta = Math.max(0, clientY - dragStartY.current);
    currentTranslateY.current = delta;
    const el = contentRef.current;
    if (el) el.style.transform = `translateY(${delta}px)`;
  }, []);

  const handleDragEnd = useCallback(() => {
    if (!isDragging.current) return;
    isDragging.current = false;
    const el = contentRef.current;
    if (el) {
      el.style.transition = "transform 300ms cubic-bezier(0.32, 0.72, 0, 1)";
      if (currentTranslateY.current > 100) {
        el.style.transform = "translateY(100%)";
        setTimeout(close, 300);
      } else {
        el.style.transform = "translateY(0)";
      }
    }
    currentTranslateY.current = 0;
  }, [close]);

  // Touch
  const onTouchStart = useCallback(
    (e: React.TouchEvent) => handleDragStart(e.touches[0].clientY),
    [handleDragStart],
  );
  const onTouchMove = useCallback(
    (e: React.TouchEvent) => handleDragMove(e.touches[0].clientY),
    [handleDragMove],
  );
  const onTouchEnd = useCallback(() => handleDragEnd(), [handleDragEnd]);

  // Mouse (desktop testing)
  const onMouseDown = useCallback(
    (e: React.MouseEvent) => {
      handleDragStart(e.clientY);
      const onMove = (ev: MouseEvent) => handleDragMove(ev.clientY);
      const onUp = () => {
        handleDragEnd();
        document.removeEventListener("mousemove", onMove);
        document.removeEventListener("mouseup", onUp);
      };
      document.addEventListener("mousemove", onMove);
      document.addEventListener("mouseup", onUp);
    },
    [handleDragStart, handleDragMove, handleDragEnd],
  );

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        ref={contentRef}
        side="bottom"
        showCloseButton={false}
        className={cn("min-h-[60vh] max-h-[85vh] rounded-t-xl p-0", className)}
      >
        {/* Accessible title (visually hidden if no explicit title) */}
        <SheetHeader className="sr-only">
          <SheetTitle>{title ?? "Sheet"}</SheetTitle>
        </SheetHeader>

        {/* Drag handle */}
        <div
          ref={handleRef}
          className="flex shrink-0 cursor-grab items-center justify-center py-3 active:cursor-grabbing"
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
          onMouseDown={onMouseDown}
        >
          <div className="h-1.5 w-10 rounded-full bg-muted-foreground/30" />
        </div>

        {/* Content — scrollable, flex-col so children can use mt-auto for pinned footers */}
        <div className="flex flex-1 flex-col overflow-y-auto px-6 pb-6">
          {children}
        </div>
      </SheetContent>
    </Sheet>
  );
}
