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
import { reorderBannersAction, setBannerEnabledAction } from "../actions/banners";
import StatusTag from "../components/StatusTag";
import { IconDrag, IconEdit, IconEye, IconEyeOff } from "../components/Icons";
import type { Banner } from "../../../lib/admin/repos/banners";
import { useToast } from "../components/Toast";

export default function BannersList({ banners }: { banners: Banner[] }) {
  const [list, setList] = useState(banners);
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
    await reorderBannersAction(fd);
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

function Row({ b }: { b: Banner }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: b.id });
  const style = { transform: CSS.Transform.toString(transform), transition };
  return (
    <div ref={setNodeRef} style={style} className={`stu-sort-item${isDragging ? " is-dragging" : ""}`}>
      <span className="stu-sort-item__handle" {...attributes} {...listeners}><IconDrag /></span>
      {b.image_path ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img className="stu-sort-item__thumb" src={b.image_path} alt="" />
      ) : (
        <div className="stu-sort-item__thumb" />
      )}
      <div className="stu-sort-item__main">
        <div className="stu-sort-item__title">{b.title || <span style={{ color: "var(--stu-text-3)" }}>Untitled banner</span>}</div>
        <div className="stu-sort-item__sub">
          {b.subtitle ? `${b.subtitle.slice(0, 80)}${b.subtitle.length > 80 ? "…" : ""}` : "No subtitle"}
        </div>
      </div>
      <div className="stu-sort-item__actions">
        <StatusTag status={b.status} />
        <form action={setBannerEnabledAction}>
          <input type="hidden" name="id" value={b.id} />
          <input type="hidden" name="enabled" value={b.enabled ? "0" : "1"} />
          <button type="submit" className="stu-btn stu-btn--ghost stu-btn--icon" title={b.enabled ? "Hide" : "Show"}>
            {b.enabled ? <IconEye width={16} height={16} /> : <IconEyeOff width={16} height={16} />}
          </button>
        </form>
        <Link href={`/studio/banners/${b.id}`} className="stu-btn stu-btn--ghost stu-btn--sm">
          <IconEdit width={14} height={14} /> Edit
        </Link>
      </div>
    </div>
  );
}
