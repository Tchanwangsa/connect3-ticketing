"use client";

import { useState, useRef } from "react";
import {
  GripVertical,
  Trash2,
  Type,
  AlignLeft,
  ChevronDown,
  ListChecks,
  Hash,
  Calendar,
  SlidersHorizontal,
  Plus,
  X,
  Settings2,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ResponsivePopover } from "@/components/ui/responsive-popover";
import { cn } from "@/lib/utils";
import type {
  TicketingFieldDraft,
  TicketingFieldType,
} from "@/lib/types/ticketing";
import { FIELD_TYPE_META } from "@/lib/types/ticketing";
import type { ThemeColors } from "@/components/events/shared/types";

/* ── Icon mapping ── */
const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Type,
  AlignLeft,
  ChevronDown,
  ListChecks,
  Hash,
  Calendar,
  SlidersHorizontal,
};

function FieldIcon({
  type,
  className,
}: {
  type: TicketingFieldType;
  className?: string;
}) {
  const meta = FIELD_TYPE_META.find((m) => m.type === type);
  const Icon = meta ? ICON_MAP[meta.icon] : Type;
  return Icon ? <Icon className={className} /> : null;
}

/* ── Props ── */

interface TicketFieldCardProps {
  field: TicketingFieldDraft;
  index: number;
  colors: ThemeColors;
  onChange: (updated: TicketingFieldDraft) => void;
  onRemove: () => void;
  dragHandleProps?: Record<string, unknown>;
}

export function TicketFieldCard({
  field,
  index,
  colors,
  onChange,
  onRemove,
  dragHandleProps,
}: TicketFieldCardProps) {
  const labelRef = useRef<HTMLInputElement>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState(false);
  const [typePickerOpen, setTypePickerOpen] = useState(false);

  const update = (patch: Partial<TicketingFieldDraft>) =>
    onChange({ ...field, ...patch });

  const hasOptions =
    field.input_type === "select" || field.input_type === "multiselect";

  const fieldIsEmpty =
    !field.label.trim() &&
    !field.placeholder.trim() &&
    field.options.every((o) => !o.trim());

  const addOption = () =>
    update({
      options: [...field.options, `Option ${field.options.length + 1}`],
    });

  const removeOption = (idx: number) =>
    update({ options: field.options.filter((_, i) => i !== idx) });

  const updateOption = (idx: number, value: string) =>
    update({
      options: field.options.map((o, i) => (i === idx ? value : o)),
    });

  const handleChangeType = (type: TicketingFieldType) => {
    update({
      input_type: type,
      options:
        type === "select" || type === "multiselect"
          ? field.options.length > 0
            ? field.options
            : ["Option 1"]
          : [],
    });
    setTypePickerOpen(false);
  };

  const handleDelete = () => {
    if (fieldIsEmpty) {
      onRemove();
    } else {
      setConfirmRemove(true);
    }
  };

  const currentMeta = FIELD_TYPE_META.find((m) => m.type === field.input_type);
  const isDark = colors.isDark;

  return (
    <>
      {/* Delete confirmation */}
      <AlertDialog open={confirmRemove} onOpenChange={setConfirmRemove}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove this field?</AlertDialogTitle>
            <AlertDialogDescription>
              This will delete &ldquo;{field.label || `Question ${index + 1}`}
              &rdquo; and all its configuration. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={onRemove}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div
        className={cn(
          "group relative rounded-lg border px-3 py-3 transition-colors",
          isDark
            ? "border-neutral-700/60 hover:border-neutral-600"
            : "border-border/60 hover:border-border",
          colors.cardBg,
        )}
      >
        <div className="flex items-start gap-2">
          {/* Drag handle */}
          <div
            {...dragHandleProps}
            className="mt-2 cursor-grab touch-none text-muted-foreground/50 hover:text-muted-foreground transition-colors"
          >
            <GripVertical className="h-4 w-4" />
          </div>

          <div className="flex-1 min-w-0 space-y-2.5">
            {/* Row 1: Type dropdown label + field name + actions */}
            <div className="flex items-center justify-between gap-2">
              {/* Type picker dropdown on the label */}
              <ResponsivePopover
                open={typePickerOpen}
                onOpenChange={setTypePickerOpen}
                trigger={
                  <button
                    type="button"
                    className={cn(
                      "flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium transition-colors shrink-0",
                      isDark
                        ? "bg-neutral-700/60 hover:bg-neutral-700 text-neutral-300"
                        : "bg-muted/60 hover:bg-muted text-muted-foreground",
                    )}
                  >
                    <FieldIcon
                      type={field.input_type}
                      className="h-3.5 w-3.5"
                    />
                    {currentMeta?.label}
                    <ChevronDown className="h-3 w-3 opacity-50" />
                  </button>
                }
                contentClassName="w-56 p-1"
                align="start"
                sideOffset={4}
              >
                <div className="space-y-0.5">
                  {FIELD_TYPE_META.map((m) => {
                    const Icon = ICON_MAP[m.icon];
                    const isActive = m.type === field.input_type;
                    return (
                      <button
                        key={m.type}
                        type="button"
                        onClick={() => handleChangeType(m.type)}
                        className={cn(
                          "flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left text-sm transition-colors",
                          isActive
                            ? isDark
                              ? "bg-neutral-700 text-white"
                              : "bg-accent text-accent-foreground"
                            : isDark
                              ? "hover:bg-neutral-700/50 text-neutral-300"
                              : "hover:bg-muted",
                        )}
                      >
                        {Icon && (
                          <Icon
                            className={cn(
                              "h-4 w-4 shrink-0",
                              isActive
                                ? "text-foreground"
                                : "text-muted-foreground",
                            )}
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm">{m.label}</p>
                          <p
                            className={cn(
                              "text-xs truncate",
                              isDark
                                ? "text-neutral-500"
                                : "text-muted-foreground",
                            )}
                          >
                            {m.description}
                          </p>
                        </div>
                        {isActive && (
                          <Check className="h-3.5 w-3.5 shrink-0 text-foreground" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </ResponsivePopover>

              <div className="flex gap-2">
                {/* Settings button */}
                <ResponsivePopover
                  open={settingsOpen}
                  onOpenChange={setSettingsOpen}
                  trigger={
                    <Button
                      variant="ghost"
                      size="icon"
                      className={cn(
                        "h-7 w-7 shrink-0",
                        isDark
                          ? "text-neutral-500 hover:text-neutral-300"
                          : "text-muted-foreground hover:text-foreground",
                      )}
                    >
                      <Settings2 className="h-3.5 w-3.5" />
                    </Button>
                  }
                  contentClassName="w-72 p-3"
                  align="end"
                  sideOffset={4}
                >
                  <div className="space-y-3">
                    <p className="text-sm font-medium">Field Settings</p>
                    <Separator />

                    {/* Required toggle */}
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-sm">Required</Label>
                        <p
                          className={cn(
                            "text-xs",
                            isDark
                              ? "text-neutral-500"
                              : "text-muted-foreground",
                          )}
                        >
                          Must be filled before submitting
                        </p>
                      </div>
                      <Switch
                        checked={field.required}
                        onCheckedChange={(v: boolean) =>
                          update({ required: v })
                        }
                      />
                    </div>

                    <Separator />

                    {/* Placeholder */}
                    <div className="space-y-1.5">
                      <Label className="text-sm">Placeholder</Label>
                      <Input
                        value={field.placeholder}
                        onChange={(e) =>
                          update({ placeholder: e.target.value })
                        }
                        placeholder="Hint text shown when empty"
                        className={cn(
                          "h-8 text-xs",
                          colors.inputBg,
                          colors.inputBorder,
                        )}
                      />
                    </div>
                  </div>
                </ResponsivePopover>

                {/* Delete button */}
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    "h-7 w-7 shrink-0",
                    isDark
                      ? "text-neutral-500 hover:text-red-400"
                      : "text-muted-foreground hover:text-destructive",
                  )}
                  onClick={handleDelete}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>

            {/* Label input */}
            <div className="flex gap-2">
              <Input
                ref={labelRef}
                value={field.label}
                onChange={(e) => update({ label: e.target.value })}
                placeholder={`Question ${index + 1}`}
                className={cn(
                  "h-8 flex-1 min-w-0 text-sm font-medium border-0 bg-transparent shadow-none px-1 focus-visible:ring-0 focus-visible:ring-offset-0",
                  isDark
                    ? "placeholder:text-neutral-500"
                    : "placeholder:text-muted-foreground/50",
                )}
              />

              {/* Indicators */}
              <div className="flex items-center gap-0.5 shrink-0">
                {field.required && (
                  <span className="text-red-500 text-xs font-medium mr-0.5">
                    *
                  </span>
                )}
                {field.placeholder && (
                  <span
                    className={cn(
                      "text-[10px] px-1 rounded",
                      isDark ? "text-neutral-500" : "text-muted-foreground/60",
                    )}
                    title={`Placeholder: ${field.placeholder}`}
                  >
                    Aa
                  </span>
                )}
              </div>
            </div>

            {/* Options editor (select / multiselect only) */}
            {hasOptions && (
              <div className="space-y-1.5 pl-0.5">
                <div className="space-y-1">
                  {field.options.map((opt, i) => (
                    <div key={i} className="flex items-center gap-1.5">
                      <span
                        className={cn(
                          "text-xs w-4 text-center shrink-0",
                          isDark ? "text-neutral-500" : "text-muted-foreground",
                        )}
                      >
                        {i + 1}
                      </span>
                      <Input
                        value={opt}
                        onChange={(e) => updateOption(i, e.target.value)}
                        className={cn(
                          "h-7 flex-1 text-xs",
                          colors.inputBg,
                          colors.inputBorder,
                        )}
                      />
                      {field.options.length > 1 && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className={cn(
                            "h-6 w-6 shrink-0",
                            isDark
                              ? "text-neutral-500 hover:text-red-400"
                              : "text-muted-foreground hover:text-destructive",
                          )}
                          onClick={() => removeOption(i)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "h-7 gap-1 text-xs",
                    isDark
                      ? "text-neutral-400 hover:text-neutral-300"
                      : "text-muted-foreground",
                  )}
                  onClick={addOption}
                >
                  <Plus className="h-3 w-3" />
                  Add option
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
