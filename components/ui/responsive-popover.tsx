"use client";

import * as React from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { DismissableSheet } from "@/components/ui/dismissable-sheet";
import { useIsMobile } from "@/lib/hooks/useIsMobile";

interface ResponsivePopoverProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trigger: React.ReactNode;
  children: React.ReactNode;
  /** Extra className for the PopoverContent (desktop only) */
  contentClassName?: string;
  /** Alignment for the popover (desktop only) */
  align?: "start" | "center" | "end";
  /** Side offset for the popover (desktop only) */
  sideOffset?: number;
}

/**
 * Renders a Popover on desktop and a DismissableSheet on mobile.
 * On mobile, the trigger fires onClick to open the sheet.
 */
export function ResponsivePopover({
  open,
  onOpenChange,
  trigger,
  children,
  contentClassName,
  align = "start",
  sideOffset = 4,
}: ResponsivePopoverProps) {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <>
        <div onClick={() => onOpenChange(true)}>{trigger}</div>
        <DismissableSheet open={open} onOpenChange={onOpenChange}>
          {children}
        </DismissableSheet>
      </>
    );
  }

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent
        className={contentClassName}
        align={align}
        sideOffset={sideOffset}
      >
        {children}
      </PopoverContent>
    </Popover>
  );
}
