"use client";
import {
  DndContext, closestCenter, PointerSensor, useSensor, useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove, SortableContext, useSortable, rectSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useEffect, useState } from "react";
import ImageUploader from "../../components/ImageUploader";
import { useToast } from "../../components/Toast";
import { IconStar, IconStarFill, IconTrash } from "../../components/Icons";
import {
  attachImageAction, deleteImageAction, reorderImagesAction,
  setHoverAction, setThumbnailAction,
} from "../../actions/products";
import type { ProductImage } from "../../../../lib/admin/repos/product-images";

type Tile = ProductImage & { _from?: "fallback" };

export default function ProductImageManager({
  slug, images, fallback,
}: {
  slug: string;
  images: ProductImage[];
  fallback: string[];
}) {
  const [tiles, setTiles] = useState<Tile[]>(images);
  const { show } = useToast();
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  // If there are no DB rows yet, show the fallback file-system images so the
  // operator sees images for already-seeded products. Importing them is one click.
  useEffect(() => { setTiles(images); }, [images]);

  const importFallback = async (path: string) => {
    const fd = new FormData();
    fd.append("slug", slug);
    fd.append("image_path", path);
    fd.append("alt", "");
    await attachImageAction(fd);
    show("Image attached", "success");
  };

  const addPath = async (path: string) => {
    const fd = new FormData();
    fd.append("slug", slug);
    fd.append("image_path", path);
    fd.append("alt", "");
    await attachImageAction(fd);
  };

  const onDragEnd = async (e: DragEndEvent) => {
    if (!e.over || e.active.id === e.over.id) return;
    const oldIdx = tiles.findIndex((t) => String(t.id) === String(e.active.id));
    const newIdx = tiles.findIndex((t) => String(t.id) === String(e.over!.id));
    const next = arrayMove(tiles, oldIdx, newIdx);
    setTiles(next);
    const fd = new FormData();
    fd.append("slug", slug);
    fd.append("ordered", next.map((t) => t.id).join(","));
    await reorderImagesAction(fd);
    show("Order updated", "success");
  };

  return (
    <section className="stu-card">
      <header className="stu-card__head">
        <h3>Photos</h3>
        <span className="stu-card__head__sub">
          Drag to reorder · Star sets the cover · Eye sets the hover-image
        </span>
      </header>
      <div className="stu-card__body">
        <ImageUploader
          folder={`products/${slug}`}
          multiple
          onUploaded={async ({ path }) => {
            await addPath(path);
            // optimistic update — server revalidates page on next nav
            setTiles((prev) => [
              ...prev,
              { id: -Date.now(), product_slug: slug, image_path: path, alt: "", sort_order: 0, is_thumbnail: 0, is_hover: 0 } as Tile,
            ]);
          }}
        />

        {tiles.length === 0 && fallback.length > 0 && (
          <div style={{ marginTop: 18 }}>
            <p style={{ fontSize: 13, color: "var(--stu-text-3)", marginBottom: 8 }}>
              We found {fallback.length} existing image{fallback.length === 1 ? "" : "s"} for this product. Click to attach:
            </p>
            <div className="stu-image-grid">
              {fallback.map((p) => (
                <button key={p} type="button" onClick={() => importFallback(p)} className="stu-image-tile" style={{ border: "1px dashed var(--stu-border-strong)" }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img className="stu-image-tile__img" src={p} alt="" />
                  <div className="stu-image-tile__bar" style={{ justifyContent: "center" }}>
                    <span style={{ fontSize: 11, color: "var(--stu-text-3)" }}>Click to attach</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {tiles.length > 0 && (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
            <SortableContext items={tiles.map((t) => t.id)} strategy={rectSortingStrategy}>
              <div className="stu-image-grid" style={{ marginTop: 18 }}>
                {tiles.map((t) => (
                  <Tile key={t.id} t={t} slug={slug} />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </div>
    </section>
  );
}

function Tile({ t, slug }: { t: Tile; slug: string }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: t.id });
  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <div ref={setNodeRef} style={style}
         className={`stu-image-tile${isDragging ? " is-dragging" : ""}`}
         {...attributes} {...listeners}>
      {t.is_thumbnail ? <span className="stu-image-tile__star">Cover</span> : null}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="stu-image-tile__img" src={t.image_path} alt={t.alt} />
      <div className="stu-image-tile__bar">
        <form action={setThumbnailAction} onClick={(e) => e.stopPropagation()} onPointerDown={(e) => e.stopPropagation()}>
          <input type="hidden" name="slug" value={slug} /><input type="hidden" name="id" value={t.id} />
          <button type="submit" className={`stu-image-tile__btn${t.is_thumbnail ? " active" : ""}`} title="Use as cover">
            {t.is_thumbnail ? <IconStarFill width={12} height={12} /> : <IconStar width={12} height={12} />}
          </button>
        </form>
        <form action={setHoverAction} onClick={(e) => e.stopPropagation()} onPointerDown={(e) => e.stopPropagation()}>
          <input type="hidden" name="slug" value={slug} /><input type="hidden" name="id" value={t.id} />
          <button type="submit" className={`stu-image-tile__btn${t.is_hover ? " active" : ""}`} title="Use on hover">H</button>
        </form>
        <form action={deleteImageAction} onClick={(e) => e.stopPropagation()} onPointerDown={(e) => e.stopPropagation()} style={{ marginLeft: "auto" }}>
          <input type="hidden" name="slug" value={slug} /><input type="hidden" name="id" value={t.id} />
          <button type="submit" className="stu-image-tile__btn stu-image-tile__btn--danger" title="Remove">
            <IconTrash width={12} height={12} />
          </button>
        </form>
      </div>
    </div>
  );
}
