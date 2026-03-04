"use client";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface EventNameFieldProps {
  mode: "edit" | "preview";
  value: string;
  onChange?: (value: string) => void;
  className?: string;
}

export function EventNameField({
  mode,
  value,
  onChange,
  className,
}: EventNameFieldProps) {
  if (mode === "preview") {
    return (
      <h1
        className={cn(
          "text-2xl font-bold tracking-tight sm:text-4xl",
          className,
        )}
      >
        {value || "Untitled Event"}
      </h1>
    );
  }

  return (
    <Input
      placeholder="Event Name"
      value={value}
      onChange={(e) => onChange?.(e.target.value)}
      className={cn(
        "h-auto border-0 bg-transparent px-0 text-2xl! font-bold tracking-tight placeholder:text-muted-foreground/40 focus-visible:ring-0 sm:text-4xl!",
        className,
      )}
    />
  );
}
