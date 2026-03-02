import type { TicketTier } from "./types";

/**
 * Returns a human-readable pricing label:
 *  - No tiers → "Free"
 *  - All tiers $0 → "Free"
 *  - 1 tier → "$5"
 *  - Multiple tiers → "$5 – $10" (min – max)
 *  - Mix of free + paid → "$0 – $10"
 */
export function formatPricingLabel(tiers: TicketTier[]): string {
  if (tiers.length === 0) return "Free";

  const prices = tiers.map((t) => t.price);
  const min = Math.min(...prices);
  const max = Math.max(...prices);

  if (max === 0) return "Free";

  const fmt = (n: number) =>
    n === 0 ? "$0" : `$${n % 1 === 0 ? n : n.toFixed(2)}`;

  if (min === max) return fmt(min);

  return `${fmt(min)} – ${fmt(max)}`;
}
