"use client";

import { useState } from "react";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { ResponsiveModal } from "@/components/ui/responsive-modal";
import { Link2 } from "lucide-react";
import type { EventLink, PreviewInputProps } from "../shared/types";
import { useIsMobile } from "@/lib/hooks/useIsMobile";

type LinksDisplayProps = PreviewInputProps<EventLink[]>;

/** Strip protocol for cleaner display. */
function stripProtocol(url: string) {
  return url.replace(/^https?:\/\//, "").replace(/^www\./, "");
}

/** Content rendered inside hover-card / modal — list of links. */
function LinksDisplayContent({ links }: { links: EventLink[] }) {
  return (
    <div className="space-y-3">
      {links.map((link) => (
        <a
          key={link.id}
          href={link.url.startsWith("http") ? link.url : `https://${link.url}`}
          target="_blank"
          rel="noopener noreferrer"
          className="block rounded-md px-1 py-1 transition-colors hover:bg-muted"
        >
          <p className="text-sm font-medium leading-tight">
            {link.title || stripProtocol(link.url)}
          </p>
          <p className="mt-0.5 truncate text-xs text-muted-foreground">
            {stripProtocol(link.url)}
          </p>
        </a>
      ))}
    </div>
  );
}

/** Read-only links display — shows first URL + count, hover/tap for all. */
export function LinksDisplay({ value }: LinksDisplayProps) {
  const [isOpen, setIsOpen] = useState(false);
  const isMobile = useIsMobile();
  const hasLinks = value.length > 0;

  if (!hasLinks) {
    return null;
  }

  const firstUrl = stripProtocol(value[0].url);
  const extra = value.length - 1;

  const trigger = (
    <div
      className="cursor-pointer flex items-center gap-1 flex-1 min-w-0"
      onClick={() => isMobile && setIsOpen(true)}
    >
      <span className="flex-1 truncate text-base font-medium transition-colors hover:text-foreground">
        {firstUrl}
      </span>
      {extra > 0 && (
        <span className="shrink-0 w-fit text-muted-foreground">+{extra}</span>
      )}
    </div>
  );

  return (
    <div className="flex items-center gap-3">
      <Link2 className="h-5 w-5 shrink-0 text-muted-foreground" />
      {isMobile ? (
        <>
          {trigger}
          <ResponsiveModal
            open={isOpen}
            onOpenChange={setIsOpen}
            title="Event Links"
          >
            <LinksDisplayContent links={value} />
          </ResponsiveModal>
        </>
      ) : (
        <HoverCard openDelay={200} closeDelay={100}>
          <HoverCardTrigger asChild>{trigger}</HoverCardTrigger>
          <HoverCardContent className="w-72 p-3" align="start">
            <LinksDisplayContent links={value} />
          </HoverCardContent>
        </HoverCard>
      )}
    </div>
  );
}
