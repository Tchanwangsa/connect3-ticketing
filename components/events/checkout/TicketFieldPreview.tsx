"use client";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { TicketingFieldDraft } from "@/lib/types/ticketing";
import type { ThemeColors } from "@/components/events/shared/types";

interface TicketFieldPreviewProps {
  field: TicketingFieldDraft;
  colors: ThemeColors;
}

/**
 * Renders a single custom ticket field in "preview" (checkout) mode.
 * Inputs are interactive but don't persist — purely visual.
 */
export function TicketFieldPreview({ field, colors }: TicketFieldPreviewProps) {
  const inputClass = cn(colors.inputBg, colors.inputBorder, colors.placeholder);

  return (
    <div className="space-y-1.5">
      <Label className={cn("text-sm font-medium", colors.text)}>
        {field.label || "Untitled"}
        {field.required && <span className="ml-0.5 text-red-500">*</span>}
      </Label>

      {field.input_type === "text" && (
        <Input
          placeholder={field.placeholder || field.label}
          className={inputClass}
        />
      )}

      {field.input_type === "textarea" && (
        <Textarea
          placeholder={field.placeholder || field.label}
          rows={3}
          className={inputClass}
        />
      )}

      {field.input_type === "number" && (
        <Input
          type="number"
          placeholder={field.placeholder || "0"}
          className={inputClass}
        />
      )}

      {field.input_type === "date" && (
        <Input type="date" className={inputClass} />
      )}

      {field.input_type === "select" && (
        <Select>
          <SelectTrigger className={inputClass}>
            <SelectValue placeholder={field.placeholder || "Select…"} />
          </SelectTrigger>
          <SelectContent>
            {field.options.map((opt, i) => (
              <SelectItem key={i} value={opt || `opt-${i}`}>
                {opt}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {field.input_type === "multiselect" && (
        <div className="flex flex-wrap gap-1.5 rounded-md border p-2">
          {field.options.map((opt, i) => (
            <Badge
              key={i}
              variant="outline"
              className={cn(
                "cursor-pointer select-none transition-colors",
                colors.hoverBg,
                colors.isDark && "border-neutral-600",
              )}
            >
              {opt}
            </Badge>
          ))}
          {field.options.length === 0 && (
            <span className="text-xs text-muted-foreground">No options</span>
          )}
        </div>
      )}

      {field.input_type === "slider" && (
        <div className="flex items-center gap-3 pt-1">
          <span className="text-xs text-muted-foreground">1</span>
          <Slider
            defaultValue={[5]}
            min={1}
            max={10}
            step={1}
            className="flex-1"
          />
          <span className="text-xs text-muted-foreground">10</span>
        </div>
      )}
    </div>
  );
}
