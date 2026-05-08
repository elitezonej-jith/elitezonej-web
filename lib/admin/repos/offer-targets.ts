import "server-only";
import { getDb } from "../db";

export type OfferTargetType = "all" | "category" | "product";

export type OfferTarget = {
  id: number;
  promo_code: string;
  target_type: OfferTargetType;
  target_id: string;
};

export function listTargets(promoCode: string): OfferTarget[] {
  return getDb()
    .prepare("SELECT * FROM offer_targets WHERE promo_code = ?")
    .all(promoCode) as OfferTarget[];
}

export function setTargets(
  promoCode: string,
  targets: Array<{ target_type: OfferTargetType; target_id: string }>,
): void {
  const db = getDb();
  const tx = db.transaction(() => {
    db.prepare("DELETE FROM offer_targets WHERE promo_code = ?").run(promoCode);
    const stmt = db.prepare(
      "INSERT INTO offer_targets (promo_code, target_type, target_id) VALUES (?, ?, ?)",
    );
    if (!targets.length) {
      stmt.run(promoCode, "all", "");
    } else {
      for (const t of targets) stmt.run(promoCode, t.target_type, t.target_id || "");
    }
  });
  tx();
}
