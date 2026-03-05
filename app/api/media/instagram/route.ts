import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/media/instagram
 *
 * Returns all Instagram image URLs accessible to the authenticated user,
 * queried via the `instagram_club_images` view (which uses the admin key
 * since there are no RLS policies on the Instagram tables).
 */
export async function GET() {
  try {
    /* ── Auth check ── */
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    /* ── Fetch images from the view ── */
    const { data, error } = await supabaseAdmin
      .from("instagram_club_images")
      .select(
        "post_id, posted_by, caption, post_timestamp, location, image_url, fetched_at",
      )
      .eq("profile_id", user.id)
      .order("post_timestamp", { ascending: false });

    if (error) {
      console.error("Instagram images fetch error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data: data ?? [] });
  } catch (error) {
    console.error("GET /api/media/instagram error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
