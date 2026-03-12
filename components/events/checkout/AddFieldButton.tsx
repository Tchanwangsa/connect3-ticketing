"use client";

import {
  Type,
  AlignLeft,
  ChevronDown,
  ListChecks,
  Hash,
  Calendar,
  SlidersHorizontal,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import type { TicketingFieldType } from "@/lib/types/ticketing";
import { FIELD_TYPE_META } from "@/lib/types/ticketing";
import type { ThemeColors } from "@/components/events/shared/types";

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Type,
  AlignLeft,
  ChevronDown,
  ListChecks,
  Hash,
  Calendar,
  SlidersHorizontal,
};

interface AddFieldButtonProps {
  onAdd: (type: TicketingFieldType) => void;
  colors: ThemeColors;
}

export function AddFieldButton({ onAdd, colors }: AddFieldButtonProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full gap-2 border-dashed",
            colors.isDark && "border-neutral-600",
            colors.hoverBg,
          )}
        >
          <Plus className="h-4 w-4" />
          Add Field
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-1.5" align="center">
        <div className="space-y-0.5">
          {FIELD_TYPE_META.map((meta) => {
            const Icon = ICON_MAP[meta.icon];
            return (
              <button
                key={meta.type}
                type="button"
                className={cn(
                  "flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left text-sm transition-colors",
                  colors.hoverBg,
                )}
                onClick={() => onAdd(meta.type)}
              >
                {Icon && (
                  <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                )}
                <div>
                  <p className="font-medium text-sm leading-tight">
                    {meta.label}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {meta.description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}
