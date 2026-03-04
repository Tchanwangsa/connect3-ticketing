"use client";

import { useState } from "react";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { ResponsiveModal } from "@/components/ui/responsive-modal";
import { Tags } from "lucide-react";
import type { TicketTier, PreviewInputProps } from "../shared/types";
import { formatPricingLabel } from "../shared/pricingUtils";
import { PricingDisplayContent } from "./PricingDisplayContent";
import { useIsMobile } from "@/lib/hooks/useIsMobile";

type PricingDisplayProps = PreviewInputProps<TicketTier[]>;

/** Read-only pricing display — shows "Free", "$5", or "$5 – $10" with hover card for details. */
export function PricingDisplay({ value }: PricingDisplayProps) {
  const [isOpen, setIsOpen] = useState(false);
  const isMobile = useIsMobile();
  const hasTiers = value.length > 0;

  const trigger = (
    <span
      className="max-w-xs cursor-pointer truncate text-base font-medium transition-colors hover:text-foreground"
      onClick={() => isMobile && setIsOpen(true)}
    >
      {formatPricingLabel(value)}
    </span>
  );

  return (
    <div className="flex items-center gap-3">
      <Tags className="h-5 w-5 shrink-0 text-muted-foreground" />
      {hasTiers ? (
        isMobile ? (
          <>
            {trigger}
            <ResponsiveModal
              open={isOpen}
              onOpenChange={setIsOpen}
              title="Ticket Tiers"
            >
              <PricingDisplayContent tiers={value} />
            </ResponsiveModal>
          </>
        ) : (
          <HoverCard openDelay={200} closeDelay={100}>
            <HoverCardTrigger asChild>{trigger}</HoverCardTrigger>
            <HoverCardContent className="w-56 p-3" align="start">
              <PricingDisplayContent tiers={value} />
            </HoverCardContent>
          </HoverCard>
        )
      ) : (
        <span className="text-base font-medium">
          {formatPricingLabel(value)}
        </span>
      )}
    </div>
  );
}
