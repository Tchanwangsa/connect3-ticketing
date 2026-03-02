import { Separator } from "@/components/ui/separator";
import { CategoryPill, TagPill } from "../shared/EventPills";

interface CategoryTagsDisplayProps {
  category: string;
  tags: string[];
}

/**
 * Read-only display of category + separator + tags row.
 * Used in event preview layouts.
 */
export function CategoryTagsDisplay({
  category,
  tags,
}: CategoryTagsDisplayProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <CategoryPill value={category} />
      <Separator className="h-5!" orientation="vertical" />
      {tags.length > 0 ? (
        tags.map((tag) => <TagPill key={tag} tag={tag} />)
      ) : (
        <span className="text-sm text-muted-foreground">No tags selected</span>
      )}
    </div>
  );
}
