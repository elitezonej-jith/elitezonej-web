"use client";
import Link from "next/link";
import { useState } from "react";
import {
  DndContext, closestCenter, PointerSensor, useSensor, useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove, SortableContext, useSortable, verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { reorderBlocksAction, toggleBlockAction } from "../actions/homepage";
import { IconDrag, IconEdit, IconEye, IconEyeOff } from "../components/Icons";
import StatusTag from "../components/StatusTag";
import { useToast } from "../components/Toast";
import type { HomepageBlockResolved } from "../../../lib/admin/repos/homepage";

const TYPE_LABELS: Record<string, string> = {
  hero_grid: "Hero grid (3 tiles)",
  hero_banner: "Hero banner",
  banner_carousel: "Banner carousel",
  product_carousel: "Product carousel",
  editorial_split: "Editorial split (image + text)",
  service_cards: "Service cards",
  process_strip: "Process strip",
  full_banner: "Full-width banner",
  trust_strip: "Trust strip",
  wedding_editorial: "Wedding editorial",
  bespoke_teaser: "Bespoke teaser",
  category_grid: "Category grid",
  custom_html: "Custom HTML",
};

export default function HomepageList({ blocks }: { blocks: HomepageBlockResolved[] }) {
  const [list, setList] = useState(blocks);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));
  const { show } = useToast();

  const onDragEnd = async (e: DragEndEvent) => {
    if (!e.over || e.active.id === e.over.id) return;
    const oldIdx = list.findIndex((b) => String(b.id) === String(e.active.id));
    const newIdx = list.findIndex((b) => String(b.id) === String(e.over!.id));
    const next = arrayMove(list, oldIdx, newIdx);
    setList(next);
    const fd = new FormData();
    fd.append("ordered", next.map((b) => b.id).join(","));
    await reorderBlocksAction(fd);
    show("Order saved", "success");
  };

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
      <SortableContext items={list.map((b) => b.id)} strategy={verticalListSortingStrategy}>
        <div className="stu-sort-list">
          {list.map((b) => <Row key={b.id} b={b} />)}
        </div>
      </SortableContext>
    </DndContext>
  );
}

function Row({ b }: { b: HomepageBlockResolved }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: b.id });
  const style = { transform: CSS.Transform.toString(transform), transition };
  return (
    <div ref={setNodeRef} style={style} className={`stu-sort-item${isDragging ? " is-dragging" : ""}`}>
      <span className="stu-sort-item__handle" {...attributes} {...listeners}><IconDrag /></span>
      <div className="stu-sort-item__main">
        <div className="stu-sort-item__title">{b.title || TYPE_LABELS[b.type] || b.type}</div>
        <div className="stu-sort-item__sub">{TYPE_LABELS[b.type] ?? b.type}{b.kicker ? ` · ${b.kicker}` : ""}</div>
      </div>
      <div className="stu-sort-item__actions">
        <StatusTag status={b.enabled ? "published" : "disabled"} />
        <form action={toggleBlockAction}>
          <input type="hidden" name="id" value={b.id} />
          <input type="hidden" name="enabled" value={b.enabled ? "0" : "1"} />
          <button type="submit" className="stu-btn stu-btn--ghost stu-btn--icon" title={b.enabled ? "Hide" : "Show"}>
            {b.enabled ? <IconEye width={16} height={16}/> : <IconEyeOff width={16} height={16}/>}
          </button>
        </form>
        <Link href={`/studio/homepage/${b.id}`} className="stu-btn stu-btn--ghost stu-btn--sm">
          <IconEdit width={14} height={14}/> Edit
        </Link>
      </div>
    </div>
  );
}
