import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { HelpCircle } from "lucide-react";
import type { SectionData } from "../sections";

interface FAQCardProps {
  data: SectionData & { type: "faq" };
}

/** Read-only FAQ section card for event preview. */
export function FAQCard({ data }: FAQCardProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <HelpCircle className="h-5 w-5 text-muted-foreground" />
          <CardTitle className="text-lg">FAQ</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {data.items
          .filter((q) => q.question || q.answer)
          .map((q, i) => (
            <div key={i}>
              <p className="font-medium">{q.question || "Untitled question"}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {q.answer || "No answer yet"}
              </p>
            </div>
          ))}
        {data.items.every((q) => !q.question && !q.answer) && (
          <p className="text-sm italic text-muted-foreground">
            No questions added yet.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
