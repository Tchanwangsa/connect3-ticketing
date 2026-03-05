import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

/* ================================================================
   PATCH /api/invites/[id]
   Accept or decline a collaboration invite.
   Body: { action: "accept" | "decline" }
================================================================ */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: inviteId } = await params;

    /* Auth check */
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    /* Parse body */
    const body = await request.json();
    const action: string = body.action;

    if (!["accept", "decline"].includes(action)) {
      return NextResponse.json(
        { error: 'action must be "accept" or "decline"' },
        { status: 400 },
      );
    }

    /* Fetch the invite and verify the current user is the invitee */
    const { data: invite, error: fetchErr } = await supabaseAdmin
      .from("event_invites")
      .select("id, event_id, invitee_id, status")
      .eq("id", inviteId)
      .single();

    if (fetchErr || !invite) {
      return NextResponse.json({ error: "Invite not found" }, { status: 404 });
    }

    if (invite.invitee_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (invite.status !== "pending") {
      return NextResponse.json(
        { error: `Invite already ${invite.status}` },
        { status: 409 },
      );
    }

    const newStatus = action === "accept" ? "accepted" : "declined";

    /* Update the invite status */
    const { error: updateErr } = await supabaseAdmin
      .from("event_invites")
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq("id", inviteId);

    if (updateErr) {
      console.error("Failed to update invite:", updateErr);
      return NextResponse.json(
        { error: "Failed to update invite" },
        { status: 500 },
      );
    }

    /* If accepted, add user to the event's collaborators array */
    if (action === "accept") {
      const { data: event } = await supabaseAdmin
        .from("events")
        .select("collaborators")
        .eq("id", invite.event_id)
        .single();

      const existing: string[] = event?.collaborators ?? [];
      if (!existing.includes(user.id)) {
        const { error: colErr } = await supabaseAdmin
          .from("events")
          .update({ collaborators: [...existing, user.id] })
          .eq("id", invite.event_id);

        if (colErr) {
          console.error("Failed to add collaborator:", colErr);
          // Don't fail the whole request — invite status is already updated
        }
      }
    }

    return NextResponse.json({ data: { id: inviteId, status: newStatus } });
  } catch (error) {
    console.error("PATCH /api/invites/[id] error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
