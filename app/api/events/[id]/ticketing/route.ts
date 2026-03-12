import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { checkEventPermission } from "@/lib/auth/clubAdmin";

/* ================================================================
   GET /api/events/[id]/ticketing
   Returns the ticketing config + custom fields for the event.
================================================================ */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    const [ticketing, fields] = await Promise.all([
      supabaseAdmin
        .from("event_ticketing")
        .select("*")
        .eq("event_id", id)
        .single(),
      supabaseAdmin
        .from("event_ticketing_fields")
        .select("*")
        .eq("event_id", id)
        .order("sort_order"),
    ]);

    return NextResponse.json({
      data: {
        ticketing: ticketing.data ?? null,
        fields: fields.data ?? [],
      },
    });
  } catch (err) {
    console.error("[GET /api/events/[id]/ticketing]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

/* ================================================================
   POST /api/events/[id]/ticketing
   Creates / enables ticketing for the event.
================================================================ */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    /* Auth */
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const allowed = await checkEventPermission(id, user.id);
    if (!allowed) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    /* Upsert ticketing row */
    const { data, error } = await supabaseAdmin
      .from("event_ticketing")
      .upsert(
        { event_id: id, enabled: true, updated_at: new Date().toISOString() },
        { onConflict: "event_id" },
      )
      .select()
      .single();

    if (error) {
      console.error("[POST ticketing] upsert error:", error);
      return NextResponse.json(
        { error: "Failed to enable ticketing" },
        { status: 500 },
      );
    }

    return NextResponse.json({ data });
  } catch (err) {
    console.error("[POST /api/events/[id]/ticketing]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

/* ================================================================
   PATCH /api/events/[id]/ticketing
   Updates ticketing config or custom fields.
================================================================ */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    /* Auth */
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const allowed = await checkEventPermission(id, user.id);
    if (!allowed) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { enabled, fields } = body as {
      enabled?: boolean;
      fields?: {
        id?: string;
        label: string;
        input_type: string;
        placeholder?: string;
        required?: boolean;
        options?: string[];
        sort_order: number;
      }[];
    };

    /* Update enabled flag */
    if (enabled !== undefined) {
      await supabaseAdmin
        .from("event_ticketing")
        .update({ enabled, updated_at: new Date().toISOString() })
        .eq("event_id", id);
    }

    /* Replace custom fields if provided */
    if (fields) {
      // Delete existing fields
      await supabaseAdmin
        .from("event_ticketing_fields")
        .delete()
        .eq("event_id", id);

      // Insert new fields
      if (fields.length > 0) {
        const rows = fields.map((f, i) => ({
          event_id: id,
          label: f.label,
          input_type: f.input_type,
          placeholder: f.placeholder ?? null,
          required: f.required ?? false,
          options: f.options ?? null,
          sort_order: f.sort_order ?? i,
        }));

        const { error } = await supabaseAdmin
          .from("event_ticketing_fields")
          .insert(rows);

        if (error) {
          console.error("[PATCH ticketing] fields insert error:", error);
          return NextResponse.json(
            { error: "Failed to update fields" },
            { status: 500 },
          );
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[PATCH /api/events/[id]/ticketing]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
