"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { HelpCircle, Plus, Trash2, GripVertical } from "lucide-react";
import type { FAQSectionData, FAQItem, DragHandleProps } from "./types";
import { SectionDragHandle } from "./SectionDragHandle";
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
import { useMemo } from "react";

interface FAQSectionCardProps {
  data: FAQSectionData;
  onChange: (data: FAQSectionData) => void;
  onRemove: () => void;
  dragHandleProps?: DragHandleProps;
  /** Show a pinging blue dot on the Add Question button */
  showAttentionBadge?: boolean;
}

/* ── Sortable FAQ row ── */
function SortableFAQItem({
  id,
  item,
  index,
  canRemove,
  onUpdate,
  onRemove,
}: {
  id: string;
  item: FAQItem;
  index: number;
  canRemove: boolean;
  onUpdate: (index: number, partial: Partial<FAQItem>) => void;
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
      className="group relative flex items-start gap-2 py-2"
    >
      <button
        type="button"
        ref={setActivatorNodeRef}
        {...listeners}
        {...attributes}
        className="mt-2.5 cursor-grab touch-none active:cursor-grabbing"
      >
        <GripVertical className="h-4 w-4 shrink-0 text-muted-foreground/40" />
      </button>
      <div className="flex-1 space-y-1.5">
        <Input
          placeholder="Question"
          value={item.question}
          onChange={(e) => onUpdate(index, { question: e.target.value })}
          className="h-9 font-medium"
        />
        <Textarea
          placeholder="Answer"
          value={item.answer}
          onChange={(e) => onUpdate(index, { answer: e.target.value })}
          rows={2}
          className="resize-none text-sm"
        />
      </div>
      {canRemove && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onRemove(index)}
          className="mt-1.5 h-7 w-7 shrink-0 p-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 hover:text-destructive"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      )}
    </div>
  );
}

export function FAQSectionCard({
  data,
  onChange,
  onRemove,
  dragHandleProps,
  showAttentionBadge,
}: FAQSectionCardProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const itemIds = useMemo(
    () => data.items.map((_, i) => `faq-${i}`),
    [data.items],
  );

  const updateItem = (index: number, partial: Partial<FAQItem>) => {
    const items = [...data.items];
    items[index] = { ...items[index], ...partial };
    onChange({ ...data, items });
  };

  const addItem = () => {
    onChange({ ...data, items: [...data.items, { question: "", answer: "" }] });
  };

  const removeItem = (index: number) => {
    if (data.items.length <= 1) return;
    onChange({ ...data, items: data.items.filter((_, i) => i !== index) });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = itemIds.indexOf(active.id as string);
    const newIndex = itemIds.indexOf(over.id as string);
    onChange({ ...data, items: arrayMove(data.items, oldIndex, newIndex) });
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex items-center gap-2">
          {dragHandleProps && (
            <SectionDragHandle dragHandleProps={dragHandleProps} />
          )}
          <HelpCircle className="h-5 w-5 text-muted-foreground" />
          <CardTitle className="text-lg">FAQ</CardTitle>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onRemove}
          className="h-8 text-muted-foreground hover:text-destructive"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-0">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={itemIds}
            strategy={verticalListSortingStrategy}
          >
            <div className="divide-y">
              {data.items.map((item, i) => (
                <SortableFAQItem
                  key={itemIds[i]}
                  id={itemIds[i]}
                  item={item}
                  index={i}
                  canRemove={data.items.length > 1}
                  onUpdate={updateItem}
                  onRemove={removeItem}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
        <div className="relative">
          {showAttentionBadge && (
            <span className="absolute -right-1 -top-1 z-10 flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-400 opacity-75" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-blue-500" />
            </span>
          )}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addItem}
            className="w-full gap-1"
          >
            <Plus className="h-4 w-4" />
            Add Question
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
