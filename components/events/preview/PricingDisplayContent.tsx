import type { TicketTier } from "../shared/types";

interface PricingDisplayContentProps {
  tiers: TicketTier[];
}

/** Reusable content for displaying pricing tiers */
export function PricingDisplayContent({ tiers }: PricingDisplayContentProps) {
  return (
    <div>
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Ticket Tiers
      </p>
      <div className="space-y-2">
        {tiers.map((tier) => (
          <div
            key={tier.id}
            className="flex items-center justify-between text-sm"
          >
            <span className="font-medium">{tier.label}</span>
            <span className="text-muted-foreground">
              {tier.price === 0
                ? "Free"
                : `$${tier.price % 1 === 0 ? tier.price : tier.price.toFixed(2)}`}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
