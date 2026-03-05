import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

/**
 * POST /api/media/cleanup
 *
 * Finds and deletes orphaned event images — files that live under
 * `{userId}/events/{eventId}/images/` in storage but are NOT referenced
 * by any row in the `event_images` table.
 *
 * Also cleans up files for events that no longer exist.
 *
 * Intended to be called by a cron job (e.g. Supabase pg_cron or external).
 * Protected by a secret bearer token in the Authorization header.
 */
export async function POST(request: NextRequest) {
  /* ── Auth: require CRON_SECRET ── */
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    /* ── Step 1: Get all referenced image URLs from event_images ── */
    const { data: rows, error: fetchErr } = await supabaseAdmin
      .from("event_images")
      .select("url");

    if (fetchErr) throw new Error(`event_images fetch: ${fetchErr.message}`);

    const referencedUrls = new Set((rows ?? []).map((r) => r.url));

    /* ── Step 2: List all user folders in the bucket ── */
    const { data: userFolders, error: userErr } = await supabaseAdmin.storage
      .from("media")
      .list("", { limit: 1000 });

    if (userErr) throw new Error(`bucket list: ${userErr.message}`);

    let deletedCount = 0;
    let scannedCount = 0;

    for (const userFolder of userFolders ?? []) {
      // Each user folder: {userId}/
      if (!userFolder.id) continue; // skip files, only process folders

      const userId = userFolder.name;
      const eventsPrefix = `${userId}/events`;

      // List event folders
      const { data: eventFolders } = await supabaseAdmin.storage
        .from("media")
        .list(eventsPrefix, { limit: 1000 });

      for (const eventFolder of eventFolders ?? []) {
        if (!eventFolder.id) continue;

        const eventId = eventFolder.name;
        const imagesPrefix = `${eventsPrefix}/${eventId}/images`;

        // List image files in this event
        const { data: imageFiles } = await supabaseAdmin.storage
          .from("media")
          .list(imagesPrefix, { limit: 1000 });

        for (const file of imageFiles ?? []) {
          if (!file.name || file.name === ".emptyFolderPlaceholder") continue;

          scannedCount++;
          const path = `${imagesPrefix}/${file.name}`;
          const { data: urlData } = supabaseAdmin.storage
            .from("media")
            .getPublicUrl(path);

          if (!referencedUrls.has(urlData.publicUrl)) {
            // Check if the file is older than 1 hour (grace period for in-progress uploads)
            const createdAt = new Date(file.created_at);
            const ageMs = Date.now() - createdAt.getTime();
            const ONE_HOUR = 60 * 60 * 1000;

            if (ageMs > ONE_HOUR) {
              const { error: delErr } = await supabaseAdmin.storage
                .from("media")
                .remove([path]);
              if (!delErr) deletedCount++;
              else console.error(`[cleanup] failed to delete ${path}:`, delErr);
            }
          }
        }
      }
    }

    return NextResponse.json({
      message: "Cleanup complete",
      scanned: scannedCount,
      deleted: deletedCount,
    });
  } catch (error) {
    console.error("POST /api/media/cleanup error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 },
    );
  }
}
