"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";
import { useAdminClubSelector } from "@/lib/hooks/useAdminClubSelector";
import { AdminClubSelector } from "@/components/dashboard/AdminClubSelector";
import { Button } from "@/components/ui/button";
import { CreateEventModal } from "@/components/events/CreateEventModal";
import { ArrowLeft, Loader2, Plus } from "lucide-react";
import { EventsListContent } from "@/components/dashboard/EventsListContent";

/* ─────────────────────────────────────────────────────────────────────────────
 * DashboardEventsContent — page content that uses search params.
 * ────────────────────────────────────────────────────────────────────────── */

function DashboardEventsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialClubId = searchParams.get("club_id");
  const { user, loading: authLoading, isOrganisation } = useAuthStore();
  const isOrg = isOrganisation();
  const [createModalOpen, setCreateModalOpen] = useState(false);

  /* Shared club selector hook (non-org only) */
  const {
    clubs,
    loading: clubsLoading,
    selectedClubId,
    setSelectedClubId,
  } = useAdminClubSelector(initialClubId);

  /* Effective club ID: org → own ID; non-org → selected club */
  const effectiveClubId = isOrg ? (user?.id ?? null) : selectedClubId;

  /* Redirect unauthenticated users */
  if (!authLoading && !user) {
    router.replace("/");
    return null;
  }

  return (
    <div className="mx-auto max-w-5xl px-6 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => router.push("/")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">All Events</h1>
            <p className="text-muted-foreground text-sm">
              View and manage all your events.
            </p>
          </div>
        </div>
        <Button className="gap-2" onClick={() => setCreateModalOpen(true)}>
          <Plus className="h-4 w-4" />
          Create Event
        </Button>
      </div>

      <CreateEventModal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        {...(effectiveClubId ? { clubId: effectiveClubId } : {})}
      />

      {/* Club selector (non-org users) */}
      {!isOrg && (
        <AdminClubSelector
          clubs={clubs}
          selectedClubId={selectedClubId}
          onSelect={setSelectedClubId}
        />
      )}

      {/* Events content */}
      {effectiveClubId ? (
        <EventsListContent clubId={effectiveClubId} />
      ) : clubsLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : null}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
 * DashboardEventsPage — page shell with Suspense wrapping.
 * ────────────────────────────────────────────────────────────────────────── */

export default function DashboardEventsPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-5xl px-6 py-8">
          <div className="flex justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </div>
      }
    >
      <DashboardEventsContent />
    </Suspense>
  );
}
