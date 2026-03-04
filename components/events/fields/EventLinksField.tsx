"use client";

import type { EventLink } from "../shared/types";
import { LinksPicker } from "../create/LinksPicker";
import { LinksDisplay } from "../preview/LinksDisplay";

interface EventLinksFieldProps {
  mode: "edit" | "preview";
  value: EventLink[];
  onChange?: (value: EventLink[]) => void;
}

export function EventLinksField({
  mode,
  value,
  onChange,
}: EventLinksFieldProps) {
  if (mode === "preview") return <LinksDisplay value={value} />;
  return <LinksPicker value={value} onChange={onChange ?? (() => {})} />;
}
