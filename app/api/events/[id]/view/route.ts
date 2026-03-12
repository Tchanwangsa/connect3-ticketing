import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

/**
 * POST /api/events/[id]/view
 *
 * Records that the current user opened/edited this event.
 * Upserts into recent_event_edits so only one row per (user, event).
 */
export async function POST(
  _request: NextRequest,
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

    /* Upsert — update edited_at if the row already exists */
    const { error } = await supabaseAdmin.from("recent_event_edits").upsert(
      {
        user_id: user.id,
        event_id: eventId,
        edited_at: new Date().toISOString(),
      },
      { onConflict: "user_id,event_id" },
    );

    if (error) {
      console.error("Failed to record event view:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("POST /api/events/[id]/view error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
