"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Info, Plus, Trash2, X } from "lucide-react";
import type { TicketTier } from "../shared/types";
import { PRESET_TICKET_TYPES } from "../shared/types";

interface PricingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  value: TicketTier[];
  onSave: (tiers: TicketTier[]) => void;
}

const CUSTOM_VALUE = "__custom__";

let nextId = 1;
function genId() {
  return `tier-${Date.now()}-${nextId++}`;
}

export function PricingModal({
  open,
  onOpenChange,
  value,
  onSave,
}: PricingModalProps) {
  // Local draft so we can cancel without saving
  const [tiers, setTiers] = useState<TicketTier[]>(value);
  // Track which tier ids are in "custom" input mode
  const [customIds, setCustomIds] = useState<Set<string>>(new Set());
  // Dismissible in-modal banner
  const [bannerDismissed, setBannerDismissed] = useState(false);

  // Reset local state when opening
  const handleOpenChange = (next: boolean) => {
    if (next) {
      setTiers(value);
      // Mark tiers that aren't presets as custom
      const presetLabels = new Set<string>(PRESET_TICKET_TYPES);
      const customs = new Set<string>();
      value.forEach((t) => {
        if (!presetLabels.has(t.label)) customs.add(t.id);
      });
      setCustomIds(customs);
      setBannerDismissed(false);
    }
    onOpenChange(next);
  };

  /* ── Tier manipulation helpers ── */
  const addTier = () => {
    const id = genId();
    setTiers((prev) => [...prev, { id, label: "", price: 0 }]);
    // New rows default to dropdown mode (not custom)
  };

  const updateTierPrice = (id: string, price: number) => {
    setTiers((prev) => prev.map((t) => (t.id === id ? { ...t, price } : t)));
  };

  const updateTierLabel = (id: string, label: string) => {
    setTiers((prev) => prev.map((t) => (t.id === id ? { ...t, label } : t)));
  };

  const removeTier = (id: string) => {
    setTiers((prev) => prev.filter((t) => t.id !== id));
    setCustomIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  /** Handle dropdown change for a tier row */
  const handleTypeSelect = (tierId: string, selectValue: string) => {
    if (selectValue === CUSTOM_VALUE) {
      // Switch to custom text-input mode, clear the label so they can type
      updateTierLabel(tierId, "");
      setCustomIds((prev) => new Set(prev).add(tierId));
    } else {
      // Preset selected — set label, leave custom mode
      updateTierLabel(tierId, selectValue);
      setCustomIds((prev) => {
        const next = new Set(prev);
        next.delete(tierId);
        return next;
      });
    }
  };

  const handleSave = () => {
    // Only save tiers that have a label
    onSave(tiers.filter((t) => t.label.trim()));
    onOpenChange(false);
  };

  const handleSetFree = () => {
    onSave([]);
    onOpenChange(false);
  };

  const showBanner = tiers.length > 0 && !bannerDismissed;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Ticket Pricing</DialogTitle>
          <DialogDescription>
            Add ticket tiers for your event, or keep it free.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* In-modal ticketing info banner */}
          {showBanner && (
            <div className="flex items-center gap-3 rounded-lg border border-yellow-200 bg-yellow-50 px-3 py-2.5 dark:border-yellow-900 dark:bg-yellow-950/40">
              <Info className="h-4 w-4 shrink-0 text-yellow-600 dark:text-yellow-400" />
              <p className="flex-1 text-xs text-yellow-800 dark:text-yellow-300">
                Remember to configure your ticketing details (capacity, sales
                dates, etc.) after creating this event.
              </p>
              <button
                type="button"
                onClick={() => setBannerDismissed(true)}
                className="shrink-0 rounded-md p-0.5 text-yellow-600 transition-colors hover:bg-yellow-100 dark:text-yellow-400 dark:hover:bg-yellow-900"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          {/* Tier rows */}
          {tiers.length === 0 && (
            <p className="text-center text-sm text-muted-foreground py-2">
              No ticket tiers yet — this event is free.
            </p>
          )}

          {tiers.map((tier) => {
            const isCustom = customIds.has(tier.id);

            return (
              <div key={tier.id} className="flex items-end gap-2">
                {/* Ticket type — dropdown or custom input */}
                <div className="flex-1 space-y-1.5">
                  <Label className="text-xs text-muted-foreground">
                    Ticket Type
                  </Label>

                  {isCustom ? (
                    <div className="flex items-center gap-1.5">
                      <Input
                        value={tier.label}
                        onChange={(e) =>
                          updateTierLabel(tier.id, e.target.value)
                        }
                        placeholder="Custom ticket name"
                        className="h-9"
                        autoFocus
                      />
                      {/* Let user switch back to presets */}
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 shrink-0 text-muted-foreground"
                        title="Switch to preset"
                        onClick={() => {
                          // Reset to first available preset or keep as custom
                          setCustomIds((prev) => {
                            const next = new Set(prev);
                            next.delete(tier.id);
                            return next;
                          });
                          if (
                            !(
                              PRESET_TICKET_TYPES as readonly string[]
                            ).includes(tier.label)
                          ) {
                            updateTierLabel(tier.id, "");
                          }
                        }}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <polyline points="6 9 12 15 18 9" />
                        </svg>
                      </Button>
                    </div>
                  ) : (
                    <Select
                      value={
                        (PRESET_TICKET_TYPES as readonly string[]).includes(
                          tier.label,
                        )
                          ? tier.label
                          : ""
                      }
                      onValueChange={(v) => handleTypeSelect(tier.id, v)}
                    >
                      <SelectTrigger className="h-9 w-full">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        {PRESET_TICKET_TYPES.map((preset) => (
                          <SelectItem key={preset} value={preset}>
                            {preset}
                          </SelectItem>
                        ))}
                        <SelectItem value={CUSTOM_VALUE}>Custom…</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                </div>

                {/* Price */}
                <div className="w-28 space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Price</Label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                      $
                    </span>
                    <Input
                      type="number"
                      min={0}
                      step={0.01}
                      value={tier.price || ""}
                      onChange={(e) =>
                        updateTierPrice(
                          tier.id,
                          Math.max(0, parseFloat(e.target.value) || 0),
                        )
                      }
                      placeholder="0"
                      className="h-9 pl-6"
                    />
                  </div>
                </div>

                {/* Remove */}
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 shrink-0 text-muted-foreground hover:text-destructive"
                  onClick={() => removeTier(tier.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            );
          })}

          {/* Add tier button */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addTier}
            className="w-full gap-1.5"
          >
            <Plus className="h-3.5 w-3.5" />
            Add Ticket Tier
          </Button>
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-between pt-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleSetFree}
          >
            Set as Free
          </Button>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="button" size="sm" onClick={handleSave}>
              Save Pricing
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
