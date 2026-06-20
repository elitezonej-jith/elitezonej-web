"use client";

type FilterDef = {
  name: string;
  field_key: string;
  options: string[];
};

export default function FilterAttributes({
  filters,
  initialFit,
  initialFabric,
  initialOccasion,
}: {
  filters: FilterDef[];
  initialFit?: string;
  initialFabric?: string;
  initialOccasion?: string;
}) {
  // Map field_key to initial value
  const initials: Record<string, string> = {
    fit: initialFit || "",
    fabric: initialFabric || "",
    occasion: initialOccasion || "",
  };

  if (filters.length === 0) {
    // Fallback: free text inputs (category has no filters configured)
    return (
      <section className="stu-card">
        <header className="stu-card__head"><h3>Filter attributes</h3></header>
        <div className="stu-card__body">
          <p className="stu-hint">These help customers find this product using filters on the store.</p>
          <div className="stu-row" style={{ marginTop: 12 }}>
            <label className="stu-field">
              <span className="stu-field__label">Fit</span>
              <input name="fit" defaultValue={initialFit || ""} className="stu-input" placeholder="Slim · Tailored · Regular" />
            </label>
            <label className="stu-field">
              <span className="stu-field__label">Fabric</span>
              <input name="fabric" defaultValue={initialFabric || ""} className="stu-input" placeholder="Wool · Cotton · Silk" />
            </label>
            <label className="stu-field">
              <span className="stu-field__label">Occasion</span>
              <input name="occasion" defaultValue={initialOccasion || ""} className="stu-input" placeholder="Wedding · Business" />
            </label>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="stu-card">
      <header className="stu-card__head"><h3>Filter attributes</h3></header>
      <div className="stu-card__body">
        <p className="stu-hint">These help customers find this product using filters on the store.</p>
        <div className="stu-row" style={{ marginTop: 12, flexWrap: "wrap" }}>
          {filters.map(f => (
            <label key={f.field_key} className="stu-field">
              <span className="stu-field__label">{f.name}</span>
              <select name={f.field_key} defaultValue={initials[f.field_key] || ""} className="stu-select">
                <option value="">— Not set —</option>
                {f.options.map(o => (
                  <option key={o} value={o}>{o}</option>
                ))}
              </select>
            </label>
          ))}
        </div>
      </div>
    </section>
  );
}
