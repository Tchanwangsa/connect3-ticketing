"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { ReactNode } from "react";
import type { DragHandleProps } from "./types";

interface SortableItemProps {
  id: string;
  children: (props: {
    dragHandleProps: DragHandleProps;
    style: React.CSSProperties;
    isDragging: boolean;
  }) => ReactNode;
}

export function SortableItem({ id, children }: SortableItemProps) {
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
    position: "relative" as const,
    zIndex: isDragging ? 50 : undefined,
  };

  return (
    <div ref={setNodeRef} style={style}>
      {children({
        dragHandleProps: {
          ref: setActivatorNodeRef,
          listeners,
          attributes,
        },
        style,
        isDragging,
      })}
    </div>
  );
}
