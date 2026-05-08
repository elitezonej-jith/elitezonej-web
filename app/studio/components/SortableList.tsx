"use client";
import {
  DndContext, closestCenter, PointerSensor, KeyboardSensor,
  useSensor, useSensors, type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove, SortableContext, sortableKeyboardCoordinates,
  useSortable, verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useState, type ReactNode } from "react";
import { IconDrag } from "./Icons";

export type SortableItem<T> = T & { id: number };

export default function SortableList<T>({
  items,
  onReorder,
  render,
}: {
  items: SortableItem<T>[];
  onReorder: (orderedIds: number[]) => void | Promise<void>;
  render: (item: SortableItem<T>) => ReactNode;
}) {
  const [list, setList] = useState(items);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const onDragEnd = async (e: DragEndEvent) => {
    if (!e.over || e.active.id === e.over.id) return;
    const oldIdx = list.findIndex((i) => String(i.id) === String(e.active.id));
    const newIdx = list.findIndex((i) => String(i.id) === String(e.over!.id));
    const next = arrayMove(list, oldIdx, newIdx);
    setList(next);
    await onReorder(next.map((i) => i.id));
  };

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
      <SortableContext items={list.map((i) => i.id)} strategy={verticalListSortingStrategy}>
        <div className="stu-sort-list">
          {list.map((item) => (
            <Row key={item.id} id={item.id}>{render(item)}</Row>
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}

function Row({ id, children }: { id: number; children: ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style = { transform: CSS.Transform.toString(transform), transition };
  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`stu-sort-item${isDragging ? " is-dragging" : ""}`}
    >
      <span className="stu-sort-item__handle" {...attributes} {...listeners} aria-label="Drag to reorder">
        <IconDrag />
      </span>
      {children}
    </div>
  );
}
