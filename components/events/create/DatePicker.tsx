"use client";

import { useState } from "react";
import { ResponsivePopover } from "@/components/ui/responsive-popover";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CalendarDays, Globe } from "lucide-react";
import type { DateTimeData, EditInputProps } from "../shared/types";

const POPULAR_TIMEZONES = [
  "Australia/Sydney",
  "Australia/Melbourne",
  "Australia/Brisbane",
  "Australia/Perth",
  "Australia/Adelaide",
  "Pacific/Auckland",
  "Asia/Singapore",
  "Asia/Tokyo",
  "Asia/Shanghai",
  "Asia/Kolkata",
  "Europe/London",
  "Europe/Paris",
  "Europe/Berlin",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "Pacific/Honolulu",
] as const;

function tzLabel(tz: string): string {
  try {
    const now = new Date();
    const short = now.toLocaleString("en-AU", {
      timeZone: tz,
      timeZoneName: "short",
    });
    // Extract the abbreviation (e.g. "AEDT", "GMT", "UTC+5")
    const parts = short.split(/\s/);
    const abbrev = parts[parts.length - 1] ?? "";
    const city = tz.split("/").pop()?.replace(/_/g, " ") ?? tz;
    return `${city} (${abbrev})`;
  } catch {
    return tz;
  }
}

function formatDisplayDate(date: string, time: string): string {
  if (!date) return "";
  const d = new Date(`${date}T${time || "00:00"}`);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  let str = `${dd}/${mm}`;
  if (time) {
    str += ` ${d.toLocaleTimeString("en-AU", { hour: "numeric", minute: "2-digit", hour12: true }).toUpperCase()}`;
  }
  return str;
}

type DatePickerProps = EditInputProps<DateTimeData>;

export function DatePicker({ value, onChange }: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<DateTimeData>(value);
  const [tab, setTab] = useState<"start" | "end" | "tz">("start");

  const hasStart = !!value.startDate;
  const hasEnd = !!value.endDate;

  const handleOpen = (isOpen: boolean) => {
    if (isOpen) {
      setDraft(value);
      setTab("start");
    }
    setOpen(isOpen);
  };

  const handleApply = () => {
    onChange(draft);
    setOpen(false);
  };

  const handleClear = () => {
    const empty: DateTimeData = {
      startDate: "",
      startTime: "",
      endDate: "",
      endTime: "",
      timezone: draft.timezone,
    };
    onChange(empty);
    setDraft(empty);
    setOpen(false);
  };

  // Build display string
  let displayText = "TBA";
  if (hasStart) {
    displayText = formatDisplayDate(value.startDate, value.startTime);
    if (hasEnd) {
      displayText += `  →  ${formatDisplayDate(value.endDate, value.endTime)}`;
    }
  }

  const tzAbbrev = value.timezone
    ? (() => {
      try {
        const parts = new Date()
          .toLocaleString("en-AU", {
            timeZone: value.timezone,
            timeZoneName: "short",
          })
          .split(/\s/);
        return parts[parts.length - 1] ?? "";
      } catch {
        return "";
      }
    })()
    : "";

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
      <CalendarDays className="h-5 w-5 shrink-0 text-muted-foreground" />
      <ResponsivePopover
        open={open}
        onOpenChange={handleOpen}
        trigger={
          <button
            type="button"
            className={`text-left text-sm transition-colors hover:text-foreground sm:text-base ${hasStart ? "font-medium text-foreground" : "text-muted-foreground"
              }`}
          >
            {displayText}
          </button>
        }
        contentClassName="w-auto p-0"
        align="start"
        sideOffset={8}
      >
        {/* Tabs */}
        <div className="flex border-b">
          <button
            type="button"
            onClick={() => setTab("start")}
            className={`flex-1 px-4 py-2.5 text-sm font-medium transition-colors ${tab === "start"
                ? "border-b-2 border-primary text-foreground"
                : "text-muted-foreground hover:text-foreground"
              }`}
          >
            Start *
          </button>
          <button
            type="button"
            onClick={() => draft.startDate && setTab("end")}
            disabled={!draft.startDate}
            className={`flex-1 px-4 py-2.5 text-sm font-medium transition-colors ${tab === "end"
                ? "border-b-2 border-primary text-foreground"
                : !draft.startDate
                  ? "cursor-not-allowed text-muted-foreground/40"
                  : "text-muted-foreground hover:text-foreground"
              }`}
          >
            End
          </button>
          <button
            type="button"
            onClick={() => setTab("tz")}
            className={`flex-1 px-4 py-2.5 text-sm font-medium transition-colors ${tab === "tz"
                ? "border-b-2 border-primary text-foreground"
                : "text-muted-foreground hover:text-foreground"
              }`}
          >
            <Globe className="mr-1 inline h-3.5 w-3.5" />
            TZ
          </button>
        </div>

        {/* Start tab */}
        {tab === "start" && (
          <div className="w-72 space-y-3 p-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground">
                Start date *
              </Label>
              <Input
                type="date"
                value={draft.startDate}
                onChange={(e) => {
                  const str = e.target.value;
                  setDraft((d) => {
                    const newEnd =
                      d.endDate && d.endDate < str ? "" : d.endDate;
                    const newEndTime =
                      d.endDate && d.endDate < str ? "" : d.endTime;
                    return {
                      ...d,
                      startDate: str,
                      endDate: newEnd,
                      endTime: newEndTime,
                    };
                  });
                }}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground">
                Start time
              </Label>
              <Input
                type="time"
                value={draft.startTime}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, startTime: e.target.value }))
                }
              />
            </div>
          </div>
        )}

        {/* End tab */}
        {tab === "end" && (
          <div className="w-72 space-y-3 p-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground">
                End date
              </Label>
              <Input
                type="date"
                value={draft.endDate}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, endDate: e.target.value }))
                }
                min={draft.startDate}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground">
                End time
              </Label>
              <Input
                type="time"
                value={draft.endTime}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, endTime: e.target.value }))
                }
              />
            </div>
            {draft.endDate && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="w-full text-xs text-muted-foreground"
                onClick={() =>
                  setDraft((d) => ({ ...d, endDate: "", endTime: "" }))
                }
              >
                Remove end date
              </Button>
            )}
          </div>
        )}

        {/* Timezone tab */}
        {tab === "tz" && (
          <div className="w-72 space-y-3 p-3">
            <Label className="text-xs font-medium text-muted-foreground">
              Time zone
            </Label>
            <Select
              value={draft.timezone}
              onValueChange={(tz) => setDraft((d) => ({ ...d, timezone: tz }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select timezone" />
              </SelectTrigger>
              <SelectContent>
                {POPULAR_TIMEZONES.map((tz) => (
                  <SelectItem key={tz} value={tz}>
                    {tzLabel(tz)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Footer — pinned to bottom on mobile sheet */}
        <div className="mt-auto flex items-center justify-between border-t px-3 py-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleClear}
            className="text-xs text-muted-foreground"
          >
            Clear
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={handleApply}
            disabled={!draft.startDate}
          >
            Apply
          </Button>
        </div>
      </ResponsivePopover>

      {/* Inline timezone badge — only show when date is set */}
      {hasStart && tzAbbrev && (
        <span className="text-xs text-muted-foreground">{tzAbbrev}</span>
      )}
    </div>
  );
}
