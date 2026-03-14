import { Badge } from "@/components/ui/badge";
import { Clock } from "lucide-react";

interface PricingDisplayTier {
  id: string;
  name: string;
  price: number;
  type?: string;
  offerStartDate?: string;
  offerStartTime?: string;
  offerEndDate?: string;
  offerEndTime?: string;
}

interface PricingDisplayContentProps {
  tiers: PricingDisplayTier[];
}

function formatOfferDate(date: string, time?: string): string {
  const d = new Date(`${date}T${time ?? "00:00"}`);
  if (isNaN(d.getTime())) return date;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

/** Reusable content for displaying pricing tiers in hover/modal previews */
export function PricingDisplayContent({ tiers }: PricingDisplayContentProps) {
  return (
    <div>
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Ticket Tiers
      </p>
      <div className="space-y-2">
        {tiers.map((tier) => {
          const isMembersOnly = tier.type === "members";
          const hasOfferWindow = !!(tier.offerStartDate && tier.offerEndDate);

          return (
            <div key={tier.id} className="space-y-0.5">
              <div className="flex items-center justify-between gap-2 text-sm">
                <div className="flex min-w-0 items-center gap-1.5">
                  <span className="truncate font-medium">{tier.name}</span>
                  {isMembersOnly && (
                    <Badge
                      variant="secondary"
                      className="h-4 shrink-0 px-1.5 text-[10px] leading-none"
                    >
                      Members
                    </Badge>
                  )}
                </div>
                <span className="shrink-0 text-muted-foreground">
                  {tier.price === 0
                    ? "Free"
                    : `$${tier.price % 1 === 0 ? tier.price : tier.price.toFixed(2)}`}
                </span>
              </div>

              {hasOfferWindow && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3 shrink-0" />
                  <span>
                    {formatOfferDate(tier.offerStartDate!, tier.offerStartTime)}
                    {" – "}
                    {formatOfferDate(tier.offerEndDate!, tier.offerEndTime)}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
