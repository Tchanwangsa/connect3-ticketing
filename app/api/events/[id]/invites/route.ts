import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

/* ================================================================
   POST /api/events/[id]/invites
   Send collaboration invites for an event.
   Body: { invitee_ids: string[] }
   Only the event creator can send invites.
================================================================ */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: eventId } = await params;

    /* Auth check */
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    /* Verify the user is the event creator */
    const { data: event } = await supabaseAdmin
      .from("events")
      .select("creator_profile_id")
      .eq("id", eventId)
      .single();

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }
    if (event.creator_profile_id !== user.id) {
      return NextResponse.json(
        { error: "Only the event creator can send invites" },
        { status: 403 },
      );
    }

    /* Parse body */
    const body = await request.json();
    const inviteeIds: string[] = body.invitee_ids ?? [];

    if (inviteeIds.length === 0) {
      return NextResponse.json(
        { error: "No invitees specified" },
        { status: 400 },
      );
    }

    /* Filter out the creator themselves and any already-invited users */
    const validIds = inviteeIds.filter((id) => id !== user.id);

    if (validIds.length === 0) {
      return NextResponse.json({ data: { sent: 0 } });
    }

    /* Upsert invites (re-send pending if already exists, skip accepted) */
    const rows = validIds.map((inviteeId) => ({
      event_id: eventId,
      inviter_id: user.id,
      invitee_id: inviteeId,
      status: "pending",
      updated_at: new Date().toISOString(),
    }));

    const { data: invites, error } = await supabaseAdmin
      .from("event_invites")
      .upsert(rows, { onConflict: "event_id,invitee_id" })
      .select("id, invitee_id, status");

    if (error) {
      console.error("Failed to create invites:", error);
      return NextResponse.json(
        { error: "Failed to send invites" },
        { status: 500 },
      );
    }

    return NextResponse.json({ data: { sent: invites?.length ?? 0, invites } });
  } catch (error) {
    console.error("POST /api/events/[id]/invites error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

/* ================================================================
   GET /api/events/[id]/invites
   Get all invites for an event (creator only).
================================================================ */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: eventId } = await params;

    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    /* Verify creator */
    const { data: event } = await supabaseAdmin
      .from("events")
      .select("creator_profile_id")
      .eq("id", eventId)
      .single();

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }
    if (event.creator_profile_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { data, error } = await supabaseAdmin
      .from("event_invites")
      .select(
        "id, invitee_id, status, created_at, updated_at, profiles:invitee_id(id, first_name, avatar_url)",
      )
      .eq("event_id", eventId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Failed to fetch invites:", error);
      return NextResponse.json(
        { error: "Failed to fetch invites" },
        { status: 500 },
      );
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error("GET /api/events/[id]/invites error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
