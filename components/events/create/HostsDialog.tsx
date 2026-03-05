"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ResponsiveModal } from "@/components/ui/responsive-modal";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Search,
  Loader2,
  X,
  UserPlus,
  Check,
  Mail,
  Clock,
  CheckCircle2,
  XCircle,
  MoreHorizontal,
  MailX,
  RefreshCw,
  UserMinus,
} from "lucide-react";
import { HostAvatarStack } from "../shared/HostAvatarStack";
import type { ClubProfile, HostsValue } from "../shared/types";
import { toast } from "sonner";

const PAGE_SIZE = 20;

/** An invite record from the API */
interface InviteRecord {
  id: string;
  invitee_id: string;
  status: "pending" | "accepted" | "declined";
  profiles: ClubProfile | null;
}

interface HostsDialogProps {
  /** The creator's own profile — always displayed, cannot be removed */
  creatorProfile: ClubProfile;
  /** Current hosts value (ids + data) — controls the display list */
  value: HostsValue;
  /** Callback when hosts list changes (for display purposes) */
  onChange: (value: HostsValue) => void;
  /** Event ID — required for fetching/sending invites */
  eventId?: string;
  /** Whether the event has been saved to DB yet */
  eventSaved: boolean;
  /** Callback after invites are sent (e.g. to trigger auto-save) */
  onInvitesSent?: () => void;
}

export function HostsDialog({
  creatorProfile,
  value,
  onChange,
  eventId,
  eventSaved,
  onInvitesSent,
}: HostsDialogProps) {
  const { ids: selectedHosts, data: selectedHostsData } = value;
  const [open, setOpen] = useState(false);

  /* ── Search state ── */
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [clubs, setClubs] = useState<ClubProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);
  const fetchingRef = useRef(false);

  /* ── Staged selections (local only until Confirm) ── */
  const [staged, setStaged] = useState<ClubProfile[]>([]);

  /* ── Existing invites ── */
  const [invites, setInvites] = useState<InviteRecord[]>([]);
  const [invitesLoading, setInvitesLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(0);
      setClubs([]);
      setHasMore(true);
    }, 300);
    return () => clearTimeout(t);
  }, [search]);

  // Fetch clubs
  const fetchClubs = useCallback(
    async (pageNum: number, searchTerm: string) => {
      if (fetchingRef.current) return;
      fetchingRef.current = true;
      setLoading(true);
      try {
        const params = new URLSearchParams({
          table: "profiles",
          select: "id,first_name,avatar_url",
          filter: JSON.stringify({ account_type: "organisation" }),
          limit: String(PAGE_SIZE),
          offset: String(pageNum * PAGE_SIZE),
        });
        if (searchTerm) {
          params.set("search", searchTerm);
        }

        const res = await fetch(`/api/profiles/fetch?${params}`);
        if (!res.ok) return;
        const { data } = await res.json();
        const results = (data ?? []) as ClubProfile[];

        if (pageNum === 0) {
          setClubs(results);
        } else {
          setClubs((prev) => {
            const ids = new Set(prev.map((c) => c.id));
            return [...prev, ...results.filter((c) => !ids.has(c.id))];
          });
        }
        setHasMore(results.length === PAGE_SIZE);
      } catch (err) {
        console.error("Failed to fetch clubs:", err);
      } finally {
        setLoading(false);
        fetchingRef.current = false;
      }
    },
    [],
  );

  // Fetch existing invites for this event
  const fetchInvites = useCallback(async () => {
    if (!eventId || !eventSaved) return;
    setInvitesLoading(true);
    try {
      const res = await fetch(`/api/events/${eventId}/invites`);
      if (res.ok) {
        const { data } = await res.json();
        setInvites(data ?? []);
      }
    } catch (err) {
      console.error("Failed to fetch invites:", err);
    } finally {
      setInvitesLoading(false);
    }
  }, [eventId, eventSaved]);

  useEffect(() => {
    if (open) {
      fetchClubs(page, debouncedSearch);
    }
  }, [open, page, debouncedSearch, fetchClubs]);

  useEffect(() => {
    if (open) {
      fetchInvites();
      setStaged([]);
    }
  }, [open, fetchInvites]);

  const handleScroll = () => {
    if (!listRef.current || fetchingRef.current || !hasMore) return;
    const { scrollTop, scrollHeight, clientHeight } = listRef.current;
    if (scrollHeight - scrollTop - clientHeight < 40) {
      setPage((p) => p + 1);
    }
  };

  /** IDs that are already hosts, already invited, or staged */
  const alreadyInvitedIds = new Set(invites.map((i) => i.invitee_id));
  const stagedIds = new Set(staged.map((c) => c.id));

  const toggleStaged = (club: ClubProfile) => {
    if (club.id === creatorProfile.id) return;
    if (alreadyInvitedIds.has(club.id)) return; // already invited

    setStaged((prev) => {
      const exists = prev.some((c) => c.id === club.id);
      if (exists) return prev.filter((c) => c.id !== club.id);
      return [...prev, club];
    });
  };

  const toggleHost = (club: ClubProfile) => {
    if (club.id === creatorProfile.id) return;
    const isSelected = selectedHosts.includes(club.id);
    if (isSelected) {
      onChange({
        ids: selectedHosts.filter((id) => id !== club.id),
        data: selectedHostsData.filter((c) => c.id !== club.id),
      });
    } else {
      onChange({
        ids: [...selectedHosts, club.id],
        data: [...selectedHostsData, club],
      });
    }
  };

  /* ── Send invites + update hosts ── */
  const handleConfirm = async () => {
    // Add staged as hosts (display)
    const newHostIds = staged
      .filter((c) => !selectedHosts.includes(c.id))
      .map((c) => c.id);
    const newHostData = staged.filter((c) => !selectedHosts.includes(c.id));

    if (newHostIds.length > 0) {
      onChange({
        ids: [...selectedHosts, ...newHostIds],
        data: [...selectedHostsData, ...newHostData],
      });
    }

    // Send invites if event is saved
    if (eventId && eventSaved && staged.length > 0) {
      setSending(true);
      try {
        const res = await fetch(`/api/events/${eventId}/invites`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            invitee_ids: staged.map((c) => c.id),
          }),
        });
        if (res.ok) {
          const { data } = await res.json();
          toast.success(
            `Sent ${data.sent} invite${data.sent !== 1 ? "s" : ""}`,
          );
          onInvitesSent?.();
        } else {
          const err = await res.json();
          toast.error(err.error || "Failed to send invites");
        }
      } catch (err) {
        console.error("Failed to send invites:", err);
        toast.error("Failed to send invites");
      } finally {
        setSending(false);
      }
    } else if (staged.length > 0 && !eventSaved) {
      toast.info("Save the event first to send collaboration invites.");
    }

    setOpen(false);
  };

  const getInviteStatus = (profileId: string) => {
    return invites.find((i) => i.invitee_id === profileId)?.status;
  };

  /* ── Invite actions (cancel / remove / resend) ── */
  const handleCancelInvite = async (profileId: string) => {
    if (!eventId) return;
    setActionLoading(profileId);
    try {
      const res = await fetch(`/api/events/${eventId}/invites`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile_id: profileId }),
      });
      if (res.ok) {
        setInvites((prev) => prev.filter((i) => i.invitee_id !== profileId));
        toast.success("Invite cancelled");
      } else {
        const err = await res.json();
        toast.error(err.error || "Failed to cancel invite");
      }
    } catch {
      toast.error("Failed to cancel invite");
    } finally {
      setActionLoading(null);
    }
  };

  const handleRemoveCollaborator = async (profileId: string) => {
    if (!eventId) return;
    setActionLoading(profileId);
    try {
      const res = await fetch(`/api/events/${eventId}/invites`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile_id: profileId }),
      });
      if (res.ok) {
        setInvites((prev) => prev.filter((i) => i.invitee_id !== profileId));
        // Also remove from display hosts
        onChange({
          ids: selectedHosts.filter((id) => id !== profileId),
          data: selectedHostsData.filter((c) => c.id !== profileId),
        });
        toast.success("Collaborator removed");
        onInvitesSent?.();
      } else {
        const err = await res.json();
        toast.error(err.error || "Failed to remove collaborator");
      }
    } catch {
      toast.error("Failed to remove collaborator");
    } finally {
      setActionLoading(null);
    }
  };

  const handleResendInvite = async (profileId: string) => {
    if (!eventId) return;
    setActionLoading(profileId);
    try {
      const res = await fetch(`/api/events/${eventId}/invites`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile_id: profileId }),
      });
      if (res.ok) {
        setInvites((prev) =>
          prev.map((i) =>
            i.invitee_id === profileId ? { ...i, status: "pending" } : i,
          ),
        );
        toast.success("Invite resent");
      } else {
        const err = await res.json();
        toast.error(err.error || "Failed to resend invite");
      }
    } catch {
      toast.error("Failed to resend invite");
    } finally {
      setActionLoading(null);
    }
  };

  const statusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge variant="outline" className="gap-1 text-[10px]">
            <Clock className="h-3 w-3" /> Pending
          </Badge>
        );
      case "accepted":
        return (
          <Badge variant="default" className="gap-1 text-[10px]">
            <CheckCircle2 className="h-3 w-3" /> Accepted
          </Badge>
        );
      case "declined":
        return (
          <Badge variant="destructive" className="gap-1 text-[10px]">
            <XCircle className="h-3 w-3" /> Declined
          </Badge>
        );
      default:
        return null;
    }
  };

  const othersCount = selectedHostsData.length;
  const displayLabel =
    othersCount > 0
      ? `${creatorProfile.first_name} + ${othersCount} other${othersCount > 1 ? "s" : ""}`
      : creatorProfile.first_name;

  return (
    <>
      {/* Trigger — avatar stack + label + add button */}
      <div className="flex items-center gap-2">
        <HostAvatarStack creator={creatorProfile} hosts={selectedHostsData} />
        <span className="text-sm font-medium text-foreground truncate max-w-45 sm:max-w-none">
          {displayLabel}
        </span>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex h-6 w-6 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <UserPlus className="h-4 w-4" />
        </button>
      </div>

      {/* Dialog */}
      <ResponsiveModal
        open={open}
        onOpenChange={setOpen}
        title="Manage Collaborators"
        description="Invite clubs to collaborate on this event. They'll be able to edit the event after accepting."
        className="max-w-md"
      >
        <div className="flex flex-col gap-3">
          {/* Search */}
          <div className="flex items-center gap-2 rounded-md border px-3 py-2">
            <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search clubs..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              autoFocus
            />
          </div>

          {/* Current hosts & invites */}
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider px-1">
              Current Collaborators
            </p>

            {/* Creator (always pinned) */}
            <div className="flex items-center gap-2 rounded-md px-2 py-1.5">
              <Avatar className="h-7 w-7">
                {creatorProfile.avatar_url && (
                  <AvatarImage
                    src={creatorProfile.avatar_url}
                    alt={creatorProfile.first_name}
                  />
                )}
                <AvatarFallback className="text-[10px]">
                  {creatorProfile.first_name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="flex-1 text-sm font-medium truncate">
                {creatorProfile.first_name}
              </span>
              <Badge variant="secondary" className="text-[10px]">
                Owner
              </Badge>
            </div>

            {/* Existing invited collaborators */}
            {invites.map((invite) => {
              const profile = invite.profiles;
              if (!profile) return null;
              const isActioning = actionLoading === invite.invitee_id;
              return (
                <div
                  key={invite.id}
                  className="flex items-center gap-2 rounded-md px-2 py-1.5"
                >
                  <Avatar className="h-7 w-7">
                    {profile.avatar_url && (
                      <AvatarImage
                        src={profile.avatar_url}
                        alt={profile.first_name}
                      />
                    )}
                    <AvatarFallback className="text-[10px]">
                      {profile.first_name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="flex-1 text-sm truncate">
                    {profile.first_name}
                  </span>
                  {statusBadge(invite.status)}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        type="button"
                        disabled={isActioning}
                        className="flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50"
                      >
                        {isActioning ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <MoreHorizontal className="h-3.5 w-3.5" />
                        )}
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-44">
                      {invite.status === "pending" && (
                        <DropdownMenuItem
                          onClick={() => handleCancelInvite(invite.invitee_id)}
                        >
                          <MailX className="h-4 w-4" />
                          Cancel Invite
                        </DropdownMenuItem>
                      )}
                      {invite.status === "accepted" && (
                        <DropdownMenuItem
                          variant="destructive"
                          onClick={() =>
                            handleRemoveCollaborator(invite.invitee_id)
                          }
                        >
                          <UserMinus className="h-4 w-4" />
                          Remove
                        </DropdownMenuItem>
                      )}
                      {invite.status === "declined" && (
                        <DropdownMenuItem
                          onClick={() => handleResendInvite(invite.invitee_id)}
                        >
                          <RefreshCw className="h-4 w-4" />
                          Resend Invite
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              );
            })}

            {invitesLoading && (
              <div className="flex justify-center py-2">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              </div>
            )}
          </div>

          {/* Staged (new selections to invite) */}
          {staged.length > 0 && (
            <>
              <Separator />
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider px-1">
                  New Invites ({staged.length})
                </p>
                {staged.map((club) => (
                  <div
                    key={club.id}
                    className="flex items-center gap-2 rounded-md px-2 py-1.5 bg-primary/5"
                  >
                    <Avatar className="h-7 w-7">
                      {club.avatar_url && (
                        <AvatarImage
                          src={club.avatar_url}
                          alt={club.first_name}
                        />
                      )}
                      <AvatarFallback className="text-[10px]">
                        {club.first_name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="flex-1 text-sm truncate">
                      {club.first_name}
                    </span>
                    <Badge variant="outline" className="gap-1 text-[10px]">
                      <Mail className="h-3 w-3" />
                    </Badge>
                    <button
                      type="button"
                      onClick={() => toggleStaged(club)}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </>
          )}

          <Separator />

          {/* Search results */}
          <div
            ref={listRef}
            onScroll={handleScroll}
            className="max-h-[35vh] overflow-y-auto space-y-0.5"
          >
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider px-1 pb-1">
              Search Results
            </p>

            {clubs
              .filter((c) => c.id !== creatorProfile.id)
              .map((club) => {
                const inviteStatus = getInviteStatus(club.id);
                const isStaged = stagedIds.has(club.id);
                const isHost = selectedHosts.includes(club.id);
                const isDisabled = !!inviteStatus;

                return (
                  <button
                    key={club.id}
                    type="button"
                    onClick={() => !isDisabled && toggleStaged(club)}
                    disabled={isDisabled}
                    className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <div
                      className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-sm border ${
                        isStaged
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-muted-foreground/30"
                      }`}
                    >
                      {isStaged && <Check className="h-3 w-3" />}
                    </div>
                    <Avatar className="h-6 w-6">
                      {club.avatar_url && (
                        <AvatarImage
                          src={club.avatar_url}
                          alt={club.first_name}
                        />
                      )}
                      <AvatarFallback className="text-[9px]">
                        {club.first_name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="flex-1 truncate">{club.first_name}</span>
                    {inviteStatus && statusBadge(inviteStatus)}
                    {isHost && !inviteStatus && (
                      <Badge variant="secondary" className="text-[10px]">
                        Host
                      </Badge>
                    )}
                  </button>
                );
              })}

            {/* Custom host creation */}
            {search.trim().length > 0 &&
              !loading &&
              (() => {
                const trimmed = search.trim();
                const alreadyExists =
                  clubs.some(
                    (c) => c.first_name.toLowerCase() === trimmed.toLowerCase(),
                  ) ||
                  selectedHostsData.some(
                    (c) => c.first_name.toLowerCase() === trimmed.toLowerCase(),
                  ) ||
                  creatorProfile.first_name.toLowerCase() ===
                    trimmed.toLowerCase();
                if (alreadyExists) return null;
                return (
                  <button
                    type="button"
                    onClick={() => {
                      const customClub: ClubProfile = {
                        id: `custom-${Date.now()}`,
                        first_name: trimmed,
                        avatar_url: null,
                      };
                      // Custom hosts are added directly (no invite — they're display-only)
                      toggleHost(customClub);
                      setSearch("");
                    }}
                    className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors hover:bg-muted"
                  >
                    <UserPlus className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <span className="truncate">
                      Add &ldquo;<span className="font-medium">{trimmed}</span>
                      &rdquo; as display host
                    </span>
                  </button>
                );
              })()}

            {loading && (
              <div className="flex justify-center py-3">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              </div>
            )}

            {!loading && clubs.length === 0 && !search && (
              <div className="text-center text-sm text-muted-foreground py-6">
                No clubs found
              </div>
            )}
          </div>

          {/* Footer */}
          <Separator />
          <div className="flex items-center justify-between gap-2">
            <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              className="gap-1.5"
              onClick={handleConfirm}
              disabled={sending}
            >
              {sending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Mail className="h-3.5 w-3.5" />
              )}
              {staged.length > 0
                ? `Confirm & Invite (${staged.length})`
                : "Done"}
            </Button>
          </div>
        </div>
      </ResponsiveModal>
    </>
  );
}
