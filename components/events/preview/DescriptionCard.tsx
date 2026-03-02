import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface DescriptionCardProps {
  description: string;
}

/** Read-only event description card with "No description provided" fallback. */
export function DescriptionCard({ description }: DescriptionCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Event Description</CardTitle>
      </CardHeader>
      <CardContent>
        <p
          className={`whitespace-pre-wrap text-sm leading-relaxed ${
            description ? "text-foreground/90" : "italic text-muted-foreground"
          }`}
        >
          {description || "No description provided"}
        </p>
      </CardContent>
    </Card>
  );
}
