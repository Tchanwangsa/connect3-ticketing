"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Building2, Plus, Trash2, ImagePlus, GripVertical } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { CompaniesSectionData, Company, DragHandleProps } from "./types";
import { SectionDragHandle } from "./SectionDragHandle";
import { useRef, useMemo } from "react";
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

interface CompaniesSectionCardProps {
  data: CompaniesSectionData;
  onChange: (data: CompaniesSectionData) => void;
  onRemove: () => void;
  dragHandleProps?: DragHandleProps;
}

/* ── Sortable Company row ── */
function SortableCompanyItem({
  id,
  item,
  index,
  canRemove,
  onUpdate,
  onRemove,
  onLogoUpload,
}: {
  id: string;
  item: Company;
  index: number;
  canRemove: boolean;
  onUpdate: (index: number, partial: Partial<Company>) => void;
  onRemove: (index: number) => void;
  onLogoUpload: (index: number, file: File) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
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
      className="group relative flex items-center gap-3 rounded-lg border p-3"
    >
      <button
        type="button"
        ref={setActivatorNodeRef}
        {...listeners}
        {...attributes}
        className="cursor-grab touch-none active:cursor-grabbing"
      >
        <GripVertical className="h-4 w-4 shrink-0 text-muted-foreground/40" />
      </button>

      {/* Logo */}
      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        className="shrink-0"
      >
        <Avatar className="h-12 w-12 cursor-pointer rounded-lg transition-opacity hover:opacity-80">
          {item.logoUrl ? (
            <AvatarImage
              src={item.logoUrl}
              alt={item.name}
              className="rounded-lg"
            />
          ) : null}
          <AvatarFallback className="rounded-lg bg-muted">
            <ImagePlus className="h-5 w-5 text-muted-foreground" />
          </AvatarFallback>
        </Avatar>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) onLogoUpload(index, f);
          }}
        />
      </button>

      <Input
        placeholder="Company name"
        value={item.name}
        onChange={(e) => onUpdate(index, { name: e.target.value })}
        className="h-8 flex-1 text-sm"
      />

      {canRemove && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onRemove(index)}
          className="h-8 w-8 shrink-0 p-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 hover:text-destructive"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      )}
    </div>
  );
}

export function CompaniesSectionCard({
  data,
  onChange,
  onRemove,
  dragHandleProps,
}: CompaniesSectionCardProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const itemIds = useMemo(
    () => data.items.map((_, i) => `company-${i}`),
    [data.items],
  );

  const updateItem = (index: number, partial: Partial<Company>) => {
    const items = [...data.items];
    items[index] = { ...items[index], ...partial };
    onChange({ ...data, items });
  };

  const addItem = () => {
    onChange({
      ...data,
      items: [...data.items, { name: "", logoUrl: "" }],
    });
  };

  const removeItem = (index: number) => {
    if (data.items.length <= 1) return;
    onChange({ ...data, items: data.items.filter((_, i) => i !== index) });
  };

  const handleLogoUpload = (index: number, file: File) => {
    const url = URL.createObjectURL(file);
    updateItem(index, { logoUrl: url });
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
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div className="flex items-center gap-2">
          {dragHandleProps && (
            <SectionDragHandle dragHandleProps={dragHandleProps} />
          )}
          <Building2 className="h-5 w-5 text-muted-foreground" />
          <CardTitle className="text-lg">Companies</CardTitle>
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
      <CardContent className="space-y-3">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={itemIds}
            strategy={verticalListSortingStrategy}
          >
            {data.items.map((item, i) => (
              <SortableCompanyItem
                key={itemIds[i]}
                id={itemIds[i]}
                item={item}
                index={i}
                canRemove={data.items.length > 1}
                onUpdate={updateItem}
                onRemove={removeItem}
                onLogoUpload={handleLogoUpload}
              />
            ))}
          </SortableContext>
        </DndContext>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addItem}
          className="mt-3 w-full gap-1"
        >
          <Plus className="h-4 w-4" />
          Add Company
        </Button>
      </CardContent>
    </Card>
  );
}
