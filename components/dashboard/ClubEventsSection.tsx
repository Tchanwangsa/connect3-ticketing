"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CreateEventModal } from "@/components/events/CreateEventModal";
import { Plus } from "lucide-react";
import { EventsListContent } from "@/components/dashboard/EventsListContent";

interface ClubEventsSectionProps {
  /** The club's profile ID — events will be fetched for this club */
  clubId: string;
  /** The club name for display */
  clubName: string;
}

export function ClubEventsSection({
  clubId,
  clubName,
}: ClubEventsSectionProps) {
  const [createModalOpen, setCreateModalOpen] = useState(false);

  return (
    <>
      <CreateEventModal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        clubId={clubId}
      />
      <EventsListContent
        clubId={clubId}
        clubName={clubName}
        headerAction={
          <Button
            size="sm"
            className="gap-1.5"
            onClick={() => setCreateModalOpen(true)}
          >
            <Plus className="h-3.5 w-3.5" />
            Create Event
          </Button>
        }
      />
    </>
  );
}
