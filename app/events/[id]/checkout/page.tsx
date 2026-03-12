import { notFound } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { fetchEventServer } from "@/lib/api/fetchEventServer";
import CheckoutForm from "@/components/events/checkout/CheckoutForm";

export default async function CheckoutPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  /* ── Verify the event exists and is published ── */
  const event = await fetchEventServer(id);
  if (!event) notFound();

  /* ── Verify ticketing is enabled ── */
  const { data: ticketing } = await supabaseAdmin
    .from("event_ticketing")
    .select("enabled")
    .eq("event_id", id)
    .single();

  if (!ticketing?.enabled) {
    notFound();
  }

  return <CheckoutForm eventId={id} mode="preview" />;
}
