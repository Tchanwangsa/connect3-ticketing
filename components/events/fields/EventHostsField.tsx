"use client";

import type { ClubProfile, HostsValue } from "../shared/types";
import { HostsDialog } from "../create/HostsDialog";
import { HostsDisplay } from "../preview/HostsDisplay";
import { Users } from "lucide-react";

interface EventHostsFieldProps {
  mode: "edit" | "preview";
  creatorProfile: ClubProfile;
  value: HostsValue;
  onChange?: (value: HostsValue) => void;
  /** Event ID for invite management */
  eventId?: string;
  /** Whether the event row exists in DB */
  eventSaved?: boolean;
  /** Callback after invites are sent */
  onInvitesSent?: () => void;
}

export function EventHostsField({
  mode,
  creatorProfile,
  value,
  onChange,
  eventId,
  eventSaved = false,
  onInvitesSent,
}: EventHostsFieldProps) {
  if (mode === "preview") {
    return <HostsDisplay creatorProfile={creatorProfile} value={value.data} />;
  }

  return (
    <div className="flex items-center gap-3">
      <Users className="h-5 w-5 shrink-0 text-muted-foreground" />
      <HostsDialog
        creatorProfile={creatorProfile}
        value={value}
        onChange={onChange ?? (() => {})}
        eventId={eventId}
        eventSaved={eventSaved}
        onInvitesSent={onInvitesSent}
      />
    </div>
  );
}
