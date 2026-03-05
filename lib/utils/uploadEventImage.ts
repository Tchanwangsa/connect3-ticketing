import { createClient } from "@/lib/supabase/client";

const BUCKET = "media";

/**
 * Upload a file (or blob) to the event-scoped storage path and return its public URL.
 *
 *   Storage path:  events/{eventId}/{category}/{unique-filename}
 *
 * Uses the Supabase browser client (direct upload with user-scoped RLS).
 */
export async function uploadEventImage(
  eventId: string,
  category: "images" | "companies" | "panelists",
  file: File | Blob,
  fileName?: string,
): Promise<string> {
  const supabase = createClient();

  // Derive extension
  const ext =
    fileName?.split(".").pop() ??
    (file instanceof File ? file.name.split(".").pop() : "jpg") ??
    "jpg";

  const uniqueName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  // Store under the user's events subfolder: {userId}/events/{eventId}/{category}/{file}
  const path = `${user.id}/events/${eventId}/${category}/${uniqueName}`;

  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    contentType: file.type || "image/png",
    upsert: false,
  });

  if (error) throw new Error(`Upload failed: ${error.message}`);

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

/**
 * Upload a cropped File to the user's media library (reusable assets)
 * then also copy/upload to event-scoped path.
 *
 * Returns the event-scoped public URL.
 */
export async function uploadToMediaAndEvent(
  eventId: string,
  category: "images" | "companies" | "panelists",
  file: File | Blob,
  fileName?: string,
): Promise<string> {
  // For now, just upload directly to the event-scoped path.
  // The media library is for reusable assets the user manually uploads.
  return uploadEventImage(eventId, category, file, fileName);
}
