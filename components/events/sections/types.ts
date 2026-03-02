/* ── Section-card shared types ── */

export const SECTION_TYPES = [
  "faq",
  "what-to-bring",
  "panelists",
  "companies",
] as const;

export type SectionType = (typeof SECTION_TYPES)[number];

export interface FAQItem {
  question: string;
  answer: string;
}
export interface FAQSectionData {
  type: "faq";
  items: FAQItem[];
}

export interface WhatToBringItem {
  item: string;
}
export interface WhatToBringSectionData {
  type: "what-to-bring";
  items: WhatToBringItem[];
}

export interface Panelist {
  name: string;
  title: string;
  imageUrl: string;
}
export interface PanelistsSectionData {
  type: "panelists";
  items: Panelist[];
}

export interface Company {
  name: string;
  logoUrl: string;
}
export interface CompaniesSectionData {
  type: "companies";
  items: Company[];
}

export type SectionData =
  | FAQSectionData
  | WhatToBringSectionData
  | PanelistsSectionData
  | CompaniesSectionData;

export const SECTION_META: Record<
  SectionType,
  { label: string; description: string; icon: string }
> = {
  faq: {
    label: "FAQ",
    description: "Frequently asked questions",
    icon: "HelpCircle",
  },
  "what-to-bring": {
    label: "What To Bring",
    description: "Items attendees should bring",
    icon: "Backpack",
  },
  panelists: {
    label: "Panelists / Lineup",
    description: "Speakers, performers, or panelists",
    icon: "Mic",
  },
  companies: {
    label: "Companies",
    description: "Sponsors or participating companies",
    icon: "Building2",
  },
};

/** Create a blank section for a given type */
export function createBlankSection(type: SectionType): SectionData {
  switch (type) {
    case "faq":
      return { type: "faq", items: [{ question: "", answer: "" }] };
    case "what-to-bring":
      return { type: "what-to-bring", items: [{ item: "" }] };
    case "panelists":
      return {
        type: "panelists",
        items: [{ name: "", title: "", imageUrl: "" }],
      };
    case "companies":
      return { type: "companies", items: [{ name: "", logoUrl: "" }] };
  }
}

/** Shared drag-handle prop shape used by section cards */
import type { SyntheticListenerMap } from "@dnd-kit/core/dist/hooks/utilities";
import type { DraggableAttributes } from "@dnd-kit/core";

export type { SyntheticListenerMap, DraggableAttributes };

export interface DragHandleProps {
  ref: (node: HTMLElement | null) => void;
  listeners: SyntheticListenerMap | undefined;
  attributes: DraggableAttributes;
}
