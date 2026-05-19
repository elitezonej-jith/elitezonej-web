import "server-only";
import { sql } from "../db";

export type OfferTargetType = "all" | "category" | "product";

export type OfferTarget = {
  id: number;
  promo_code: string;
  target_type: OfferTargetType;
  target_id: string;
};

export async function listTargets(promoCode: string): Promise<OfferTarget[]> {
  return sql.all<OfferTarget>(
    "SELECT * FROM offer_targets WHERE promo_code = ?",
    [promoCode],
  );
}

export async function setTargets(
  promoCode: string,
  targets: Array<{ target_type: OfferTargetType; target_id: string }>,
): Promise<void> {
  await sql.tx(async (t) => {
    await t.run("DELETE FROM offer_targets WHERE promo_code = ?", [promoCode]);
    if (!targets.length) {
      await t.run(
        "INSERT INTO offer_targets (promo_code, target_type, target_id) VALUES (?, ?, ?)",
        [promoCode, "all", ""],
      );
    } else {
      for (const tg of targets) {
        await t.run(
          "INSERT INTO offer_targets (promo_code, target_type, target_id) VALUES (?, ?, ?)",
          [promoCode, tg.target_type, tg.target_id || ""],
        );
      }
    }
  });
}
