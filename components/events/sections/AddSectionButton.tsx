"use client";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import {
  Plus,
  HelpCircle,
  Backpack,
  Mic,
  Building2,
  Check,
} from "lucide-react";
import { useState } from "react";
import { SECTION_TYPES, SECTION_META, type SectionType } from "./types";

const ICON_MAP: Record<SectionType, React.ElementType> = {
  faq: HelpCircle,
  "what-to-bring": Backpack,
  panelists: Mic,
  companies: Building2,
};

interface AddSectionButtonProps {
  /** Section types already added (greyed out / disabled) */
  activeSections: SectionType[];
  onAdd: (type: SectionType) => void;
  /** Show a pinging blue dot on the button */
  showAttentionBadge?: boolean;
}

export function AddSectionButton({
  activeSections,
  onAdd,
  showAttentionBadge,
}: AddSectionButtonProps) {
  const [open, setOpen] = useState(false);

  const availableTypes = SECTION_TYPES.filter(
    (t) => !activeSections.includes(t),
  );

  // Nothing left to add
  if (availableTypes.length === 0) return null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div className="relative">
          {showAttentionBadge && (
            <span className="absolute -right-1 -top-1 z-10 flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-400 opacity-75" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-blue-500" />
            </span>
          )}
          <Button variant="outline" className="w-full gap-2">
            <Plus className="h-4 w-4" />
            Add Section
          </Button>
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-1" align="center">
        {SECTION_TYPES.map((type) => {
          const meta = SECTION_META[type];
          const Icon = ICON_MAP[type];
          const alreadyAdded = activeSections.includes(type);

          return (
            <button
              key={type}
              type="button"
              disabled={alreadyAdded}
              onClick={() => {
                onAdd(type);
                setOpen(false);
              }}
              className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left text-sm transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
              <div className="flex-1">
                <div className="font-medium">{meta.label}</div>
                <div className="text-xs text-muted-foreground">
                  {meta.description}
                </div>
              </div>
              {alreadyAdded && (
                <Check className="h-4 w-4 shrink-0 text-muted-foreground" />
              )}
            </button>
          );
        })}
      </PopoverContent>
    </Popover>
  );
}
