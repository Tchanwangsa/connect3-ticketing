"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  CalendarDays,
  Loader2,
  Settings,
  Shield,
  Users,
} from "lucide-react";
import { EventCardDetails } from "@/lib/types/events";
import { EventDisplayCard } from "@/components/dashboard/EventDisplayCard";

/* ── Types ── */

interface ClubProfile {
  id: string;
  first_name: string;
  last_name: string | null;
  avatar_url: string | null;
}

interface ClubAdminRow {
  id: string;
  club_id: string;
  role: string;
  status: string;
  created_at: string;
  club: ClubProfile | null;
}

interface AdminRow {
  id: string;
  user_id: string;
  role: string;
  status: string;
  created_at: string;
  profiles: {
    id: string;
    first_name: string;
    last_name: string | null;
    avatar_url: string | null;
  } | null;
}

const ADMIN_PREVIEW = 3;
const EVENT_PREVIEW = 3;

export default function DashboardManagePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialClubId = searchParams.get("club_id");
  const { user, loading: authLoading } = useAuthStore();

  /* ── Clubs state ── */
  const [clubs, setClubs] = useState<ClubAdminRow[]>([]);
  const [clubsLoading, setClubsLoading] = useState(true);
  const [selectedClubId, setSelectedClubId] = useState<string | null>(
    initialClubId,
  );
  const hasFetchedClubs = useRef(false);

  /* ── Admins for selected club ── */
  const [admins, setAdmins] = useState<AdminRow[]>([]);
  const [adminsLoading, setAdminsLoading] = useState(false);
  const [adminCount, setAdminCount] = useState(0);
  const hasFetchedAdmins = useRef(false);

  /* ── Events for selected club ── */
  const [events, setEvents] = useState<EventCardDetails[]>([]);
  const [eventsLoading, setEventsLoading] = useState(false);
  const hasFetchedEvents = useRef(false);

  /* ── Fetch clubs ── */
  const fetchClubs = useCallback(async () => {
    if (!user) return;
    if (!hasFetchedClubs.current) setClubsLoading(true);
    try {
      const res = await fetch("/api/clubs/my-clubs");
      if (res.ok) {
        const { data } = await res.json();
        const rows: ClubAdminRow[] = data ?? [];
        setClubs(rows);
        if (rows.length > 0 && !selectedClubId) {
          /* Validate initialClubId belongs to user's clubs */
          if (initialClubId && rows.some((r) => r.club_id === initialClubId)) {
            setSelectedClubId(initialClubId);
          } else {
            setSelectedClubId(rows[0].club_id);
          }
        }
      }
    } catch (err) {
      console.error("Failed to fetch clubs:", err);
    } finally {
      hasFetchedClubs.current = true;
      setClubsLoading(false);
    }
  }, [user, selectedClubId, initialClubId]);

  useEffect(() => {
    fetchClubs();
  }, [fetchClubs]);

  /* ── Fetch admins for selected club ── */
  const fetchAdmins = useCallback(async () => {
    if (!selectedClubId) {
      setAdmins([]);
      setAdminCount(0);
      return;
    }
    if (!hasFetchedAdmins.current) setAdminsLoading(true);
    try {
      const res = await fetch(`/api/clubs/${selectedClubId}/admins`);
      if (res.ok) {
        const { data } = await res.json();
        const active = (data ?? []).filter(
          (a: AdminRow) => a.status === "accepted" || a.status === "pending",
        );
        setAdminCount(active.length);
        setAdmins(active.slice(0, ADMIN_PREVIEW));
      }
    } catch (err) {
      console.error("Failed to fetch admins:", err);
    } finally {
      hasFetchedAdmins.current = true;
      setAdminsLoading(false);
    }
  }, [selectedClubId]);

  useEffect(() => {
    hasFetchedAdmins.current = false;
    fetchAdmins();
  }, [fetchAdmins]);

  /* ── Fetch events for selected club ── */
  const fetchEvents = useCallback(async () => {
    if (!selectedClubId) {
      setEvents([]);
      return;
    }
    if (!hasFetchedEvents.current) setEventsLoading(true);
    try {
      const params = new URLSearchParams({
        club_id: selectedClubId,
        limit: String(EVENT_PREVIEW),
      });
      const res = await fetch(`/api/events?${params}`);
      if (res.ok) {
        const { data } = await res.json();
        setEvents(data ?? []);
      }
    } catch (err) {
      console.error("Failed to fetch events:", err);
    } finally {
      hasFetchedEvents.current = true;
      setEventsLoading(false);
    }
  }, [selectedClubId]);

  useEffect(() => {
    hasFetchedEvents.current = false;
    fetchEvents();
  }, [fetchEvents]);

  /* Re-fetch silently on window focus */
  useEffect(() => {
    const onFocus = () => {
      fetchClubs();
      fetchAdmins();
      fetchEvents();
    };
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [fetchClubs, fetchAdmins, fetchEvents]);

  const selectedClub = clubs.find((c) => c.club_id === selectedClubId);

  /* Redirect unauthenticated */
  if (!authLoading && !user) {
    router.replace("/");
    return null;
  }

  /* Loading state */
  if (clubsLoading && !hasFetchedClubs.current) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  /* Not admin of any clubs */
  if (!clubsLoading && clubs.length === 0) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        <div className="mb-6 flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0"
            onClick={() => router.push("/")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-xl font-bold tracking-tight">Manage Clubs</h1>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-16 text-center">
            <Building2 className="h-12 w-12 text-muted-foreground/50" />
            <div>
              <p className="font-medium">
                You&apos;re not an admin of any clubs
              </p>
              <p className="text-sm text-muted-foreground">
                You need to be invited as a club admin to manage clubs.
              </p>
            </div>
            <Button variant="outline" onClick={() => router.push("/")}>
              Go Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0"
            onClick={() => router.push("/")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Manage Clubs</h1>
            <p className="text-sm text-muted-foreground">
              View admins, members, and events for your clubs.
            </p>
          </div>
        </div>
        {selectedClubId && (
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={() =>
              router.push(`/dashboard/club?club_id=${selectedClubId}`)
            }
          >
            <Settings className="h-3.5 w-3.5" />
            Manage
          </Button>
        )}
      </div>

      {/* Club selector */}
      {clubs.length > 1 ? (
        <div className="flex items-center gap-3">
          <Building2 className="h-4 w-4 text-muted-foreground" />
          <Select
            value={selectedClubId ?? undefined}
            onValueChange={(val) => setSelectedClubId(val)}
          >
            <SelectTrigger className="w-72">
              <SelectValue placeholder="Select a club" />
            </SelectTrigger>
            <SelectContent>
              {clubs.map((c) => {
                const p = c.club;
                return (
                  <SelectItem key={c.club_id} value={c.club_id}>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-5 w-5">
                        {p?.avatar_url && (
                          <AvatarImage src={p.avatar_url} alt={p.first_name} />
                        )}
                        <AvatarFallback className="text-[8px]">
                          {p?.first_name?.charAt(0).toUpperCase() ?? "?"}
                        </AvatarFallback>
                      </Avatar>
                      <span className="truncate">{p?.first_name}</span>
                    </div>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>
      ) : selectedClub?.club ? (
        <div className="flex items-center gap-2.5">
          <Avatar className="h-7 w-7">
            {selectedClub.club.avatar_url && (
              <AvatarImage
                src={selectedClub.club.avatar_url}
                alt={selectedClub.club.first_name}
              />
            )}
            <AvatarFallback className="text-[10px]">
              {selectedClub.club.first_name?.charAt(0).toUpperCase() ?? "?"}
            </AvatarFallback>
          </Avatar>
          <span className="text-sm font-medium truncate">
            {selectedClub.club.first_name}
          </span>
          <Badge variant="secondary" className="text-[10px]">
            {selectedClub.role}
          </Badge>
        </div>
      ) : null}

      {/* ── Section 1: Club Admin ── */}
      <div className="space-y-3">
        {adminsLoading && !hasFetchedAdmins.current ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {/* Left column: admin list */}
            <Card>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-semibold">Club Admins</h2>
                </div>
                {admins.length === 0 ? (
                  <p className="py-4 text-center text-sm text-muted-foreground">
                    No admins yet
                  </p>
                ) : (
                  admins.map((admin) => {
                    const p = admin.profiles;
                    return (
                      <div key={admin.id} className="flex items-center gap-3">
                        <Avatar className="h-8 w-8 shrink-0">
                          {p?.avatar_url && (
                            <AvatarImage
                              src={p.avatar_url}
                              alt={p.first_name}
                            />
                          )}
                          <AvatarFallback className="text-[10px]">
                            {p?.first_name?.charAt(0).toUpperCase() ?? "?"}
                          </AvatarFallback>
                        </Avatar>
                        <span className="truncate text-sm font-medium">
                          {p?.first_name ?? "Unknown"}
                          {p?.last_name ? ` ${p.last_name}` : ""}
                        </span>
                      </div>
                    );
                  })
                )}
                {adminCount > ADMIN_PREVIEW && (
                  <p className="text-xs text-muted-foreground">
                    +{adminCount - ADMIN_PREVIEW} more
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Right column: stats */}
            <Card>
              <CardContent className="p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      Club Admins
                    </span>
                  </div>
                  <span className="text-sm font-semibold">{adminCount}</span>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      Club Members
                    </span>
                  </div>
                  <Badge variant="outline" className="text-[10px]">
                    Coming Soon
                  </Badge>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CalendarDays className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      Members Updated
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground">Never</span>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* ── Section 2: Events ── */}
      <Separator />
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold">Events</h2>
          </div>
          {events.length > 0 && selectedClubId && (
            <Button
              variant="ghost"
              size="sm"
              className="gap-1 text-muted-foreground"
              onClick={() =>
                router.push(`/dashboard/events?club_id=${selectedClubId}`)
              }
            >
              View all
              <ArrowRight className="h-4 w-4" />
            </Button>
          )}
        </div>

        {eventsLoading && !hasFetchedEvents.current ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : events.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
              <CalendarDays className="h-10 w-10 text-muted-foreground/50" />
              <div>
                <p className="text-sm font-medium">No events yet</p>
                <p className="text-xs text-muted-foreground">
                  Events for this club will appear here.
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-3">
            {events.map((event) => (
              <EventDisplayCard key={event.id} event={event} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
