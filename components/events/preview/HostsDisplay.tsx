"use client";

import { useState } from "react";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { ResponsiveModal } from "@/components/ui/responsive-modal";
import { Users } from "lucide-react";
import { HostAvatarStack } from "../shared/HostAvatarStack";
import { HostDisplayContent } from "./HostDisplayContent";
import { useIsMobile } from "@/lib/hooks/useIsMobile";
import type { ClubProfile, PreviewInputProps } from "../shared/types";

interface HostsDisplayProps extends PreviewInputProps<ClubProfile[]> {
  creatorProfile: ClubProfile;
}

/** Read-only hosts display — avatar stack with HoverCard listing all hosts. */
export function HostsDisplay({ creatorProfile, value }: HostsDisplayProps) {
  const [isOpen, setIsOpen] = useState(false);
  const isMobile = useIsMobile();
  const othersCount = value.length;
  const displayLabel =
    othersCount > 0
      ? `${creatorProfile.first_name} + ${othersCount} other${othersCount > 1 ? "s" : ""}`
      : creatorProfile.first_name;

  const trigger = (
    <div
      className="flex cursor-pointer items-center gap-2"
      onClick={() => isMobile && setIsOpen(true)}
    >
      <HostAvatarStack creator={creatorProfile} hosts={value} />
      <span className="truncate text-sm text-muted-foreground max-w-45 sm:max-w-none">
        {displayLabel}
      </span>
    </div>
  );

  return (
    <div className="flex items-center gap-3">
      <Users className="h-5 w-5 shrink-0 text-muted-foreground" />

      {isMobile ? (
        <>
          {trigger}
          <ResponsiveModal open={isOpen} onOpenChange={setIsOpen} title="Hosts">
            <HostDisplayContent creatorProfile={creatorProfile} hosts={value} />
          </ResponsiveModal>
        </>
      ) : (
        <HoverCard openDelay={200} closeDelay={100}>
          <HoverCardTrigger asChild>{trigger}</HoverCardTrigger>
          <HoverCardContent
            className="min-w-56 max-w-96 p-3 w-full"
            align="start"
          >
            <HostDisplayContent creatorProfile={creatorProfile} hosts={value} />
          </HoverCardContent>
        </HoverCard>
      )}
    </div>
  );
}
