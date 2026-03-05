"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { RealtimeChannel } from "@supabase/supabase-js";
import type { FieldGroup } from "@/lib/api/patchEvent";

/** A collaborator's presence / focus state. */
export interface CollaboratorPresence {
  userId: string;
  name: string;
  focusField: FieldGroup | null;
}

interface UseEventRealtimeOptions {
  eventId: string | undefined;
  userId: string | undefined;
  userName: string | undefined;
  enabled: boolean;
  /**
   * Called when another collaborator saves changes.
   * Receives the field groups they updated so we can selectively re-fetch.
   */
  onRemoteChange: (groups: FieldGroup[]) => void;
}

/**
 * Supabase Broadcast-based realtime hook for collaborative event editing.
 *
 * Broadcasts:
 *  - `event-updated` — after saving, includes `{ user_id, groups }`.
 *  - `field-focus`   — when a user focuses/blurs a field, includes `{ user_id, name, field }`.
 *
 * The hook also tracks other collaborators' focus state via `collaborators`.
 */
export function useEventRealtime({
  eventId,
  userId,
  userName,
  enabled,
  onRemoteChange,
}: UseEventRealtimeOptions) {
  const channelRef = useRef<RealtimeChannel | null>(null);
  const onRemoteChangeRef = useRef(onRemoteChange);
  const [collaborators, setCollaborators] = useState<
    Map<string, CollaboratorPresence>
  >(new Map());

  useEffect(() => {
    onRemoteChangeRef.current = onRemoteChange;
  }, [onRemoteChange]);

  // Subscribe
  useEffect(() => {
    if (!eventId || !userId || !enabled) return;

    const supabase = createClient();
    const channel = supabase.channel(`event-edit:${eventId}`, {
      config: { broadcast: { self: false } },
    });

    channel
      .on(
        "broadcast",
        { event: "event-updated" },
        (msg: { payload: { user_id: string; groups: FieldGroup[] } }) => {
          onRemoteChangeRef.current(msg.payload.groups ?? []);
        },
      )
      .on(
        "broadcast",
        { event: "field-focus" },
        (msg: {
          payload: {
            user_id: string;
            name: string;
            field: FieldGroup | null;
          };
        }) => {
          const { user_id, name, field } = msg.payload;
          if (user_id === userId) return;
          setCollaborators((prev) => {
            const next = new Map(prev);
            if (field === null) {
              next.delete(user_id);
            } else {
              next.set(user_id, { userId: user_id, name, focusField: field });
            }
            return next;
          });
        },
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
      channelRef.current = null;
      setCollaborators(new Map());
    };
  }, [eventId, userId, enabled]);

  /** Notify others that we saved specific field groups. */
  const broadcast = useCallback(
    (groups: FieldGroup[]) => {
      if (!channelRef.current || !userId) return;
      channelRef.current.send({
        type: "broadcast",
        event: "event-updated",
        payload: { user_id: userId, groups },
      });
    },
    [userId],
  );

  /** Tell others which field we're currently editing (null = blur). */
  const broadcastFocus = useCallback(
    (field: FieldGroup | null) => {
      if (!channelRef.current || !userId) return;
      channelRef.current.send({
        type: "broadcast",
        event: "field-focus",
        payload: { user_id: userId, name: userName ?? "Someone", field },
      });
    },
    [userId, userName],
  );

  return { broadcast, broadcastFocus, collaborators };
}
