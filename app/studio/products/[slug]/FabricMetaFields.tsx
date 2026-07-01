"use client";

type FabricMeta = {
  width_inches: number;
  gsm: number;
  composition: string;
  care: string;
  origin: string;
};

type Props = {
  meta: FabricMeta | null;
};

export default function FabricMetaFields({ meta }: Props) {
  return (
    <section className="stu-card">
      <header className="stu-card__head">
        <h3>Fabric specifications</h3>
      </header>
      <div className="stu-card__body">
        <div className="stu-row--3">
          <label className="stu-field">
            <span className="stu-field__label">Width (inches)</span>
            <input
              name="fabric_meta_width"
              type="number"
              min={0}
              max={120}
              defaultValue={meta?.width_inches ?? 58}
              className="stu-input"
            />
          </label>
          <label className="stu-field">
            <span className="stu-field__label">GSM</span>
            <input
              name="fabric_meta_gsm"
              type="number"
              min={0}
              max={2000}
              defaultValue={meta?.gsm ?? 0}
              className="stu-input"
              placeholder="180"
            />
          </label>
          <label className="stu-field">
            <span className="stu-field__label">Origin / mill</span>
            <input
              name="fabric_meta_origin"
              defaultValue={meta?.origin ?? ""}
              className="stu-input"
              placeholder="Vitale Barberis Canonico, Biella"
            />
          </label>
        </div>
        <div className="stu-row" style={{ marginTop: 16 }}>
          <label className="stu-field">
            <span className="stu-field__label">Composition</span>
            <input
              name="fabric_meta_composition"
              defaultValue={meta?.composition ?? ""}
              className="stu-input"
              placeholder="100% Super 120s Wool"
            />
          </label>
          <label className="stu-field">
            <span className="stu-field__label">Care instructions</span>
            <input
              name="fabric_meta_care"
              defaultValue={meta?.care ?? ""}
              className="stu-input"
              placeholder="Dry clean only · Steam between wears"
            />
          </label>
        </div>
      </div>
    </section>
  );
}
