"use client";

import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { RefundPolicySectionData } from "./types";

interface RefundPolicySectionCardProps {
  data: RefundPolicySectionData;
  onChange: (data: RefundPolicySectionData) => void;
  isDark?: boolean;
}

export function RefundPolicySectionCard({
  data,
  onChange,
  isDark,
}: RefundPolicySectionCardProps) {
  return (
    <Textarea
      placeholder="Describe your refund policy…"
      value={data.text}
      onChange={(e) => onChange({ ...data, text: e.target.value })}
      rows={4}
      className={cn(
        "resize-none",
        isDark &&
          "border-neutral-600 bg-neutral-700 text-neutral-100 placeholder:text-neutral-400",
      )}
    />
  );
}
