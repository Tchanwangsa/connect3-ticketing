import { X } from "lucide-react";

/* ── Shared pill components for category & tags ── */

interface CategoryPillProps {
  value: string;
  placeholder?: string;
  onClick?: () => void;
  className?: string;
}

/**
 * Renders a category pill with consistent styling.
 * When `onClick` is provided it renders as a `<button>`, otherwise a `<span>`.
 */
export function CategoryPill({
  value,
  placeholder = "None Selected",
  onClick,
  className = "",
}: CategoryPillProps) {
  const classes = `inline-flex items-center rounded-full border px-3 py-1 text-sm transition-colors ${
    value
      ? "border-foreground/20 font-medium text-foreground"
      : "border-muted-foreground/30 text-muted-foreground"
  } ${className}`;

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={`${classes} hover:bg-muted`}
      >
        {value || placeholder}
      </button>
    );
  }

  return <span className={classes}>{value || placeholder}</span>;
}

interface TagPillProps {
  tag: string;
  /** When provided, an X button is shown to remove the tag */
  onRemove?: () => void;
}

/**
 * Renders a tag pill with consistent styling.
 * Optionally shows a remove button.
 */
export function TagPill({ tag, onRemove }: TagPillProps) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-foreground/20 px-2.5 py-1 text-sm font-medium text-foreground">
      {tag}
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="ml-0.5 rounded-full p-0.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </span>
  );
}
