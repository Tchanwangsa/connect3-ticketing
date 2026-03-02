import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { Tags } from "lucide-react";
import type { TicketTier, PreviewInputProps } from "../shared/types";
import { formatPricingLabel } from "../shared/pricingUtils";

type PricingDisplayProps = PreviewInputProps<TicketTier[]>;

/** Read-only pricing display — shows "Free", "$5", or "$5 – $10" with hover card for details. */
export function PricingDisplay({ value }: PricingDisplayProps) {
  const hasTiers = value.length > 0;

  return (
    <div className="flex items-center gap-3">
      <Tags className="h-5 w-5 shrink-0 text-muted-foreground" />
      {hasTiers ? (
        <HoverCard openDelay={200} closeDelay={100}>
          <HoverCardTrigger asChild>
            <span className="cursor-pointer text-base font-medium transition-colors hover:text-foreground">
              {formatPricingLabel(value)}
            </span>
          </HoverCardTrigger>
          <HoverCardContent className="w-56 p-3" align="start">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Ticket Tiers
            </p>
            <div className="space-y-2">
              {value.map((tier) => (
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
          </HoverCardContent>
        </HoverCard>
      ) : (
        <span className="text-base font-medium">
          {formatPricingLabel(value)}
        </span>
      )}
    </div>
  );
}
