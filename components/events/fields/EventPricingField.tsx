"use client";

import type { TicketTier } from "../shared/types";
import { PricingPicker } from "../create/PricingPicker";
import { PricingDisplay } from "../preview/PricingDisplay";

interface EventPricingFieldProps {
  mode: "edit" | "preview";
  value: TicketTier[];
  onChange?: (value: TicketTier[]) => void;
  eventCapacity?: number | null;
  onEventCapacityChange?: (cap: number | null) => void;
  eventStartDate?: string;
  eventStartTime?: string;
  onAfterSave?: () => void;
}

export function EventPricingField({
  mode,
  value,
  onChange,
  eventCapacity,
  onEventCapacityChange,
  eventStartDate,
  eventStartTime,
  onAfterSave,
}: EventPricingFieldProps) {
  if (mode === "preview") return <PricingDisplay value={value} />;
  return (
    <PricingPicker
      value={value}
      onChange={onChange ?? (() => { })}
      eventCapacity={eventCapacity}
      onEventCapacityChange={onEventCapacityChange}
      eventStartDate={eventStartDate}
      eventStartTime={eventStartTime}
      onAfterSave={onAfterSave}
    />
  );
}
