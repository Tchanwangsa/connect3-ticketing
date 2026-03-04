import type { SectionData } from "../sections";

interface RefundPolicyCardProps {
  data: SectionData & { type: "refund-policy" };
}

/** Read-only Refund Policy content for event preview. */
export function RefundPolicyCard({ data }: RefundPolicyCardProps) {
  return (
    <p
      className={`whitespace-pre-wrap text-sm leading-relaxed ${
        data.text ? "text-foreground/90" : "italic text-muted-foreground"
      }`}
    >
      {data.text || "No refund policy provided"}
    </p>
  );
}
