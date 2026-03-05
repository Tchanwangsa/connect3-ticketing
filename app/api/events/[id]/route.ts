import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

/* ── Types ── */
interface TicketTierPayload {
  label: string;
  price: number;
}
interface EventLinkPayload {
  url: string;
  title: string;
}
interface ThemePayload {
  mode: string;
  layout: string;
  accent: string;
  accentCustom?: string;
  bgColor?: string;
}
interface LocationPayload {
  displayName: string;
  address: string;
  lat?: number;
  lon?: number;
}
interface SectionPayload {
  type: string;
  data: unknown;
}

/* ================================================================
   GET /api/events/[id]
   Fetches a single event with all related data.
================================================================ */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    /* Event row + location + pricing */
    const { data: event, error } = await supabaseAdmin
      .from("events")
      .select(
        `
        *,
        event_locations (*),
        event_pricings (*)
      `,
      )
      .eq("id", id)
      .single();

    if (error || !event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    /* Related tables in parallel */
    const [images, hosts, tiers, links, theme, sections] = await Promise.all([
      supabaseAdmin
        .from("event_images")
        .select("*")
        .eq("event_id", id)
        .order("sort_order"),
      supabaseAdmin
        .from("event_hosts")
        .select(
          "profile_id, sort_order, status, inviter_id, profiles:profile_id(id, first_name, avatar_url)",
        )
        .eq("event_id", id)
        .order("sort_order"),
      supabaseAdmin
        .from("event_ticket_tiers")
        .select("*")
        .eq("event_id", id)
        .order("sort_order"),
      supabaseAdmin
        .from("event_links")
        .select("*")
        .eq("event_id", id)
        .order("sort_order"),
      supabaseAdmin
        .from("event_themes")
        .select("*")
        .eq("event_id", id)
        .single(),
      supabaseAdmin
        .from("event_sections")
        .select("*")
        .eq("event_id", id)
        .order("sort_order"),
    ]);

    return NextResponse.json({
      data: {
        ...event,
        images: images.data ?? [],
        hosts: hosts.data ?? [],
        ticket_tiers: tiers.data ?? [],
        links: links.data ?? [],
        theme: theme.data ?? null,
        sections: sections.data ?? [],
      },
    });
  } catch (error) {
    console.error("GET /api/events/[id] error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

/* ================================================================
   PUT /api/events/[id]
   Updates an existing event and all associated records.
   Accepts JSON body. All images are already uploaded as URLs.
================================================================ */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: eventId } = await params;

    /* ── Auth check ── */
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    /* ── Verify ownership or accepted collaborator ── */
    const { data: existing } = await supabaseAdmin
      .from("events")
      .select("creator_profile_id")
      .eq("id", eventId)
      .single();

    if (!existing) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }
    const isCreator = existing.creator_profile_id === user.id;
    let isCollaborator = false;
    if (!isCreator) {
      const { data: hostRow } = await supabaseAdmin
        .from("event_hosts")
        .select("status")
        .eq("event_id", eventId)
        .eq("profile_id", user.id)
        .eq("status", "accepted")
        .maybeSingle();
      isCollaborator = !!hostRow;
    }
    if (!isCreator && !isCollaborator) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    /* ── Parse JSON body ── */
    const body = await request.json();

    const name: string = body.name ?? "";
    const description: string | null = body.description || null;
    const startDate: string = body.startDate;
    const startTime: string = body.startTime;
    const endDate: string | null = body.endDate || null;
    const endTime: string | null = body.endTime || null;
    const timezone: string | null = body.timezone || null;
    const isOnline: boolean = body.isOnline ?? false;
    const category: string | null = body.category || null;
    const tags: string[] = body.tags ?? [];
    const hostIds: string[] = body.hostIds ?? [];
    const pricing: TicketTierPayload[] = body.pricing ?? [];
    const links: EventLinkPayload[] = body.links ?? [];
    const theme: ThemePayload | null = body.theme ?? null;
    const location: LocationPayload | null = body.location ?? null;
    const imageUrls: string[] = body.imageUrls ?? [];
    const sections: SectionPayload[] = body.sections ?? [];
    const eventStatus: string | undefined = body.status;

    /* Name is required only when publishing */
    if (eventStatus === "published" && !name) {
      return NextResponse.json(
        { error: "Event name is required" },
        { status: 400 },
      );
    }

    /* ── Build timestamps ── */
    const startTs =
      startDate && startTime
        ? new Date(`${startDate}T${startTime}`).toISOString()
        : null;
    const endTs =
      endDate && endTime
        ? new Date(`${endDate}T${endTime}`).toISOString()
        : null;

    /* ── Clean up removed carousel images from storage ── */
    const { data: oldImages } = await supabaseAdmin
      .from("event_images")
      .select("url")
      .eq("event_id", eventId);

    const oldUrls = (oldImages ?? []).map((i) => i.url);
    const removedUrls = oldUrls.filter((u) => !imageUrls.includes(u));

    for (const url of removedUrls) {
      try {
        const match = url.match(/\/media\/(.+)$/);
        if (match) {
          await supabaseAdmin.storage.from("media").remove([match[1]]);
        }
      } catch {
        // Best effort
      }
    }

    /* ── Upsert location ── */
    let locationId: string | null = null;
    if (location?.displayName && !isOnline) {
      const { data: oldEvent } = await supabaseAdmin
        .from("events")
        .select("location_id")
        .eq("id", eventId)
        .single();

      if (oldEvent?.location_id) {
        const { error: locErr } = await supabaseAdmin
          .from("event_locations")
          .update({
            venue: location.displayName,
            address: location.address || null,
            latitude: location.lat ?? null,
            longitude: location.lon ?? null,
          })
          .eq("id", oldEvent.location_id);
        if (!locErr) locationId = oldEvent.location_id;
      }

      if (!locationId) {
        const { data: loc, error: locErr } = await supabaseAdmin
          .from("event_locations")
          .insert({
            venue: location.displayName,
            address: location.address || null,
            latitude: location.lat ?? null,
            longitude: location.lon ?? null,
          })
          .select("id")
          .single();
        if (locErr)
          throw new Error(`Location insert failed: ${locErr.message}`);
        locationId = loc.id;
      }
    }

    /* ── Update event row ── */
    const thumbnail = imageUrls[0] ?? null;
    const updatePayload: Record<string, unknown> = {
      name,
      description,
      start: startTs,
      end: endTs,
      is_online: isOnline,
      thumbnail,
      location_id: locationId,
      category,
      tags,
      timezone,
    };
    if (eventStatus) {
      updatePayload.status = eventStatus;
      if (eventStatus === "published") {
        updatePayload.published_at = new Date().toISOString();
      }
    }
    const { error: eventErr } = await supabaseAdmin
      .from("events")
      .update(updatePayload)
      .eq("id", eventId);
    if (eventErr) throw new Error(`Event update failed: ${eventErr.message}`);

    /* ── Replace carousel images ── */
    await supabaseAdmin.from("event_images").delete().eq("event_id", eventId);
    if (imageUrls.length > 0) {
      const rows = imageUrls.map((url, i) => ({
        event_id: eventId,
        url,
        sort_order: i,
      }));
      await supabaseAdmin.from("event_images").insert(rows);
    }

    /* ── Replace display-only (confirmed) hosts, preserve invite-status hosts ── */
    await supabaseAdmin
      .from("event_hosts")
      .delete()
      .eq("event_id", eventId)
      .eq("status", "confirmed");
    const displayHostIds = hostIds.filter(
      (hid) => hid !== existing.creator_profile_id,
    );
    if (displayHostIds.length > 0) {
      const rows = displayHostIds.map((pid, i) => ({
        event_id: eventId,
        profile_id: pid,
        sort_order: i,
        status: "confirmed",
      }));
      await supabaseAdmin
        .from("event_hosts")
        .upsert(rows, {
          onConflict: "event_id,profile_id",
          ignoreDuplicates: true,
        });
    }

    /* ── Replace ticket tiers ── */
    await supabaseAdmin
      .from("event_ticket_tiers")
      .delete()
      .eq("event_id", eventId);
    if (pricing.length > 0) {
      const rows = pricing.map((t, i) => ({
        event_id: eventId,
        label: t.label,
        price: t.price,
        sort_order: i,
      }));
      await supabaseAdmin.from("event_ticket_tiers").insert(rows);
    }

    /* ── Replace links ── */
    await supabaseAdmin.from("event_links").delete().eq("event_id", eventId);
    if (links.length > 0) {
      const rows = links.map((l, i) => ({
        event_id: eventId,
        url: l.url,
        title: l.title || null,
        sort_order: i,
      }));
      await supabaseAdmin.from("event_links").insert(rows);
    }

    /* ── Upsert theme ── */
    if (theme) {
      await supabaseAdmin.from("event_themes").delete().eq("event_id", eventId);
      await supabaseAdmin.from("event_themes").insert({
        event_id: eventId,
        mode: theme.mode,
        layout: theme.layout,
        accent: theme.accent,
        accent_custom: theme.accentCustom || null,
        bg_color: theme.bgColor || null,
      });
    }

    /* ── Replace sections ── */
    await supabaseAdmin.from("event_sections").delete().eq("event_id", eventId);
    if (sections.length > 0) {
      const rows = sections.map((s, i) => ({
        event_id: eventId,
        type: s.type,
        data: s.data,
        sort_order: i,
      }));
      await supabaseAdmin.from("event_sections").insert(rows);
    }

    return NextResponse.json({ id: eventId, message: "Event updated" });
  } catch (error) {
    console.error("PUT /api/events/[id] error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 },
    );
  }
}
