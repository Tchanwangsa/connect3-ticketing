"use client";

import { useState, useMemo, useCallback } from "react";
import { ResponsiveModal } from "@/components/ui/responsive-modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GripVertical, Plus, Trash2 } from "lucide-react";
import type { EventLink } from "../shared/types";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

/* ── helpers ── */
let _seq = 0;
const genId = () => `link-${Date.now()}-${_seq++}`;

/* ── Sortable row ── */
function SortableLinkRow({
  id,
  link,
  index,
  canRemove,
  onUpdate,
  onRemove,
}: {
  id: string;
  link: EventLink;
  index: number;
  canRemove: boolean;
  onUpdate: (index: number, partial: Partial<EventLink>) => void;
  onRemove: (index: number) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 50 : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="group relative flex flex-col gap-2 rounded-lg border bg-muted/30 p-3"
    >
      <div className="flex items-center gap-2">
        <button
          type="button"
          ref={setActivatorNodeRef}
          {...listeners}
          {...attributes}
          className="cursor-grab touch-none active:cursor-grabbing"
        >
          <GripVertical className="h-4 w-4 shrink-0 text-muted-foreground/40" />
        </button>

        <div className="flex-1 space-y-2">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">URL</Label>
            <Input
              placeholder="https://example.com"
              value={link.url}
              onChange={(e) => onUpdate(index, { url: e.target.value })}
              className="h-9"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">
              Title <span className="text-muted-foreground/60">(optional)</span>
            </Label>
            <Input
              placeholder="e.g. Official Website"
              value={link.title}
              onChange={(e) => onUpdate(index, { title: e.target.value })}
              className="h-9"
            />
          </div>
        </div>

        {canRemove && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0 self-start text-muted-foreground hover:text-destructive"
            onClick={() => onRemove(index)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}

/* ── Modal ── */
interface LinksModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  value: EventLink[];
  onSave: (links: EventLink[]) => void;
}

export function LinksModal({
  open,
  onOpenChange,
  value,
  onSave,
}: LinksModalProps) {
  const [links, setLinks] = useState<EventLink[]>(value);

  const handleOpenChange = (next: boolean) => {
    if (next) setLinks(value);
    onOpenChange(next);
  };

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const sortableIds = useMemo(() => links.map((l) => l.id), [links]);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setLinks((prev) => {
      const oldIdx = prev.findIndex((l) => l.id === active.id);
      const newIdx = prev.findIndex((l) => l.id === over.id);
      return arrayMove(prev, oldIdx, newIdx);
    });
  }, []);

  const addLink = () => {
    setLinks((prev) => [...prev, { id: genId(), url: "", title: "" }]);
  };

  const updateLink = (index: number, partial: Partial<EventLink>) => {
    setLinks((prev) =>
      prev.map((l, i) => (i === index ? { ...l, ...partial } : l)),
    );
  };

  const removeLink = (index: number) => {
    setLinks((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    // Only save links that have a URL
    onSave(links.filter((l) => l.url.trim()));
    onOpenChange(false);
  };

  return (
    <ResponsiveModal
      open={open}
      onOpenChange={handleOpenChange}
      title="Event Links"
      description="Add links to your event (website, socials, etc.)."
      className="sm:max-w-md"
    >
      <div className="flex flex-col gap-4">
        {/* Scrollable content */}
        <div className="max-h-75 overflow-y-auto space-y-3 pr-1">
          {links.length === 0 && (
            <p className="text-center text-sm text-muted-foreground py-4">
              No links added yet.
            </p>
          )}

          {links.length > 0 && (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={sortableIds}
                strategy={verticalListSortingStrategy}
              >
                {links.map((link, i) => (
                  <SortableLinkRow
                    key={link.id}
                    id={link.id}
                    link={link}
                    index={i}
                    canRemove={true}
                    onUpdate={updateLink}
                    onRemove={removeLink}
                  />
                ))}
              </SortableContext>
            </DndContext>
          )}
        </div>

        {/* Footer */}
        <div className="flex flex-col gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addLink}
            className="w-full gap-1.5"
          >
            <Plus className="h-3.5 w-3.5" />
            Add Link
          </Button>
          <div className="flex items-center justify-end gap-2 pt-1">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="button" size="sm" onClick={handleSave}>
              Save Links
            </Button>
          </div>
        </div>
      </div>
    </ResponsiveModal>
  );
}
