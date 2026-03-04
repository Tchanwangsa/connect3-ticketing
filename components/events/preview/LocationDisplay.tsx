"use client";

import { useState } from "react";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { MapPin } from "lucide-react";
import { useIsMobile } from "@/lib/hooks/useIsMobile";
import type { LocationData, PreviewInputProps } from "../shared/types";

type LocationDisplayProps = PreviewInputProps<LocationData>;

/** Read-only location display — shows name + address, or "TBA" when empty. */
export function LocationDisplay({ value }: LocationDisplayProps) {
  const hasValue = !!value.displayName;
  const isMobile = useIsMobile();
  const [isOpen, setIsOpen] = useState(false);

  const content = hasValue ? (
    <div className="flex min-w-0 flex-col gap-0.5 w-full">
      <span className="truncate text-sm font-medium sm:text-base">
        {value.displayName}
      </span>
      {value.address && (
        <span className="truncate text-xs text-muted-foreground sm:text-sm">
          {value.address}
        </span>
      )}
    </div>
  ) : (
    <span className="text-base text-muted-foreground">TBA</span>
  );

  return (
    <div className="flex min-w-0 items-center gap-3">
      <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
      {hasValue && isMobile ? (
        <HoverCard open={isOpen} onOpenChange={setIsOpen}>
          <HoverCardTrigger asChild>
            <div
              className="min-w-0 cursor-pointer"
              onClick={() => setIsOpen(!isOpen)}
            >
              {content}
            </div>
          </HoverCardTrigger>
          <HoverCardContent
            className="mx-8 w-[calc(100vw-4rem)] max-w-sm p-3"
            align="start"
          >
            <p className="text-sm font-medium">{value.displayName}</p>
            {value.address && (
              <p className="mt-1 text-xs text-muted-foreground">
                {value.address}
              </p>
            )}
          </HoverCardContent>
        </HoverCard>
      ) : (
        content
      )}
    </div>
  );
}
