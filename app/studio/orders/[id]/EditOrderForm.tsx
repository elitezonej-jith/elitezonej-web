"use client";
import { useActionState, useState, useMemo, useEffect } from "react";
import { updateWalkInOrderAction, type UpdateWalkInState } from "../../actions/walk-in";
import ProductSearch from "../new/ProductSearch";

type Product = {
  slug: string;
  name: string;
  price: number;
  sale_price: number | null;
  kind: string;
  sizes_json: string;
};

type ExistingItem = {
  id: number;
  product_slug: string;
  product_name: string | null;
  size: string | null;
  colour: string | null;
  qty: number;
  unit_price: number;
  is_fabric: number;
};

type OrderData = {
  id: string;
  customer: string;
  email: string;
  phone: string | null;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  payment_status: string;
  notes: string | null;
};

type FormItem = {
  localId: number;
  product_slug: string;
  product_name: string;
  size: string | null;
  colour: string | null;
  qty: number;
  unit_price: number;
  is_fabric: boolean;
};

type Props = {
  order: OrderData;
  items: ExistingItem[];
  products: Product[];
  onCancel: () => void;
  onSaved: () => void;
};

const initial: UpdateWalkInState = {};
let nextLocalId = 1000;

export default function EditOrderForm({ order, items, products, onCancel, onSaved }: Props) {
  const [state, action, pending] = useActionState(updateWalkInOrderAction, initial);

  // On success, notify parent
  useEffect(() => {
    if (state.success) {
      onSaved();
    }
  }, [state.success, onSaved]);

  // Customer
  const [name, setName] = useState(order.customer);
  const [phone, setPhone] = useState(order.phone ?? "");
  const [email, setEmail] = useState(
    order.email.includes("@placeholder.local") ? "" : order.email,
  );

  // Items — convert existing items to local format
  const [formItems, setFormItems] = useState<FormItem[]>(() =>
    items.map((it) => ({
      localId: nextLocalId++,
      product_slug: it.product_slug,
      product_name: it.product_name ?? it.product_slug,
      size: it.size,
      colour: it.colour,
      qty: it.qty,
      unit_price: it.unit_price,
      is_fabric: it.is_fabric === 1,
    })),
  );

  // Pricing — reverse-engineer discount type from existing values
  const [discountType, setDiscountType] = useState<"flat" | "percent">("flat");
  const [discountValue, setDiscountValue] = useState(order.discount);
  // Reverse-engineer tax percent from existing data
  const [taxPercent, setTaxPercent] = useState(() => {
    const taxable = order.subtotal - order.discount;
    if (taxable <= 0) return 0;
    return Math.round((order.tax / taxable) * 100);
  });

  // Payment
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "card" | "upi" | "pending">(() => {
    // Try to extract from notes
    const notesLower = (order.notes ?? "").toLowerCase();
    if (notesLower.includes("cash")) return "cash";
    if (notesLower.includes("card")) return "card";
    if (notesLower.includes("upi")) return "upi";
    if (order.payment_status === "pending") return "pending";
    return "cash";
  });
  const [notes, setNotes] = useState(() => {
    // Strip the "Walk-in · METHOD" prefix from notes for editing
    const raw = order.notes ?? "";
    const prefixMatch = raw.match(/^Walk-in\s*·\s*(?:CASH|CARD|UPI|PENDING)\s*(?:·\s*)?/i);
    return prefixMatch ? raw.slice(prefixMatch[0].length) : raw;
  });

  // Computed totals
  const subtotal = useMemo(() => formItems.reduce((sum, it) => sum + it.unit_price * it.qty, 0), [formItems]);
  const discount = useMemo(() => {
    if (discountType === "percent") return Math.round(subtotal * discountValue / 100);
    return discountValue;
  }, [subtotal, discountType, discountValue]);
  const taxable = subtotal - discount;
  const tax = Math.round(taxable * taxPercent / 100);
  const total = taxable + tax;

  function handleProductSelect(product: Product) {
    const sizes: string[] = (() => {
      try { return JSON.parse(product.sizes_json); } catch { return []; }
    })();
    const unitPrice = product.sale_price ?? product.price;
    const isFabric = product.kind === "fabric";

    setFormItems(prev => [
      ...prev,
      {
        localId: nextLocalId++,
        product_slug: product.slug,
        product_name: product.name,
        size: isFabric ? null : (sizes[0]?.replace(/-oos$/, "") || null),
        colour: null,
        qty: 1,
        unit_price: unitPrice,
        is_fabric: isFabric,
      },
    ]);
  }

  function addCustomItem() {
    setFormItems(prev => [
      ...prev,
      {
        localId: nextLocalId++,
        product_slug: "custom",
        product_name: "",
        size: null,
        colour: null,
        qty: 1,
        unit_price: 0,
        is_fabric: false,
      },
    ]);
  }

  function updateItem(localId: number, patch: Partial<FormItem>) {
    setFormItems(prev => prev.map(it => it.localId === localId ? { ...it, ...patch } : it));
  }

  function removeItem(localId: number) {
    setFormItems(prev => prev.filter(it => it.localId !== localId));
  }

  // Build payload
  const payload = JSON.stringify({
    order_id: order.id,
    customer_name: name,
    customer_phone: phone,
    customer_email: email || undefined,
    items: formItems.map(it => ({
      product_slug: it.product_slug === "custom"
        ? `custom:${it.product_name}`
        : it.product_slug,
      product_name: it.product_name,
      size: it.size,
      colour: it.colour,
      qty: it.qty,
      unit_price: it.unit_price,
      is_fabric: it.is_fabric,
    })),
    subtotal,
    discount,
    tax,
    total,
    payment_method: paymentMethod,
    notes: notes || undefined,
  });

  const canSubmit = name.trim() && phone.trim() && formItems.length > 0;

  return (
    <form action={action} className="pos-form">
      <input type="hidden" name="payload" value={payload} />

      <div className="stu-cols">
        <div className="stu-stack">
          {/* Customer */}
          <section className="stu-card">
            <header className="stu-card__head"><h3>Customer</h3></header>
            <div className="stu-card__body">
              <div className="stu-row">
                <label className="stu-field">
                  <span className="stu-field__label">Name *</span>
                  <input value={name} onChange={e => setName(e.target.value)} className="stu-input" placeholder="Rajesh Kumar" required />
                </label>
                <label className="stu-field">
                  <span className="stu-field__label">Phone *</span>
                  <input value={phone} onChange={e => setPhone(e.target.value)} className="stu-input" placeholder="+91 98765 43210" required />
                </label>
                <label className="stu-field">
                  <span className="stu-field__label">Email <span className="stu-field__hint">(optional)</span></span>
                  <input value={email} onChange={e => setEmail(e.target.value)} className="stu-input" placeholder="customer@email.com" type="email" />
                </label>
              </div>
            </div>
          </section>

          {/* Items */}
          <section className="stu-card">
            <header className="stu-card__head"><h3>Items</h3></header>
            <div className="stu-card__body">
              <ProductSearch products={products} onSelect={handleProductSelect} />

              {formItems.length > 0 && (
                <table className="pos-items-table">
                  <thead>
                    <tr>
                      <th>Product / Service</th>
                      <th>Variant</th>
                      <th className="pos-items-table__num">Qty</th>
                      <th className="pos-items-table__num">Price</th>
                      <th className="pos-items-table__num">Total</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {formItems.map(item => (
                      <tr key={item.localId} className={item.product_slug === "custom" ? "pos-items-table__custom" : ""}>
                        <td className="pos-items-table__name">
                          {item.product_slug === "custom" || item.product_slug.startsWith("custom:") ? (
                            <input
                              value={item.product_name}
                              onChange={e => updateItem(item.localId, { product_name: e.target.value })}
                              className="stu-input pos-items-table__custom-name"
                              placeholder="Bespoke suit tailoring, Alterations, etc."
                            />
                          ) : (
                            item.product_name
                          )}
                        </td>
                        <td>
                          <input
                            value={item.size ?? item.colour ?? ""}
                            onChange={e => updateItem(item.localId, item.is_fabric ? { colour: e.target.value } : { size: e.target.value })}
                            className="stu-input pos-items-table__variant"
                            placeholder={item.product_slug === "custom" ? "Details" : (item.is_fabric ? "Colour" : "Size")}
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            min={item.is_fabric ? 0.5 : 1}
                            step={item.is_fabric ? 0.5 : 1}
                            value={item.qty}
                            onChange={e => updateItem(item.localId, { qty: Math.max(item.is_fabric ? 0.5 : 1, Number(e.target.value) || 1) })}
                            className="stu-input pos-items-table__qty"
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            min={0}
                            value={item.unit_price}
                            onChange={e => updateItem(item.localId, { unit_price: Math.max(0, Number(e.target.value) || 0) })}
                            className="stu-input pos-items-table__price"
                          />
                        </td>
                        <td className="pos-items-table__num pos-items-table__line">
                          ₹{(item.unit_price * item.qty).toLocaleString()}
                        </td>
                        <td>
                          <button type="button" className="pos-items-table__remove" onClick={() => removeItem(item.localId)} aria-label="Remove item">×</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              <div className="pos-add-buttons">
                <button type="button" className="stu-btn stu-btn--ghost stu-btn--sm" onClick={addCustomItem}>
                  + Custom item / Bespoke service
                </button>
              </div>
            </div>
          </section>
        </div>

        {/* Sidebar: Summary + Payment */}
        <div className="stu-stack">
          <section className="stu-card">
            <header className="stu-card__head"><h3>Summary</h3></header>
            <div className="stu-card__body pos-summary">
              <div className="pos-summary__row">
                <span>Subtotal</span>
                <span>₹{subtotal.toLocaleString()}</span>
              </div>
              <div className="pos-summary__row">
                <span>Discount</span>
                <div className="pos-summary__discount">
                  <input type="number" min={0} value={discountValue} onChange={e => setDiscountValue(Math.max(0, Number(e.target.value) || 0))} className="stu-input pos-summary__discount-input" />
                  <select value={discountType} onChange={e => setDiscountType(e.target.value as "flat" | "percent")} className="stu-select pos-summary__discount-type">
                    <option value="flat">₹</option>
                    <option value="percent">%</option>
                  </select>
                  {discount > 0 && <span className="pos-summary__discount-calc">−₹{discount.toLocaleString()}</span>}
                </div>
              </div>
              <div className="pos-summary__row">
                <span>Tax (GST)</span>
                <div className="pos-summary__tax">
                  <input type="number" min={0} max={100} value={taxPercent} onChange={e => setTaxPercent(Math.max(0, Number(e.target.value) || 0))} className="stu-input pos-summary__tax-input" />
                  <span>%</span>
                  {tax > 0 && <span className="pos-summary__tax-calc">₹{tax.toLocaleString()}</span>}
                </div>
              </div>
              <div className="pos-summary__total">
                <span>Total</span>
                <span>₹{total.toLocaleString()}</span>
              </div>
            </div>
          </section>

          <section className="stu-card">
            <header className="stu-card__head"><h3>Payment</h3></header>
            <div className="stu-card__body">
              <div className="pos-payment">
                {(["cash", "card", "upi", "pending"] as const).map(method => (
                  <label key={method} className={`pos-payment__option ${paymentMethod === method ? "pos-payment__option--on" : ""}`}>
                    <input type="radio" name="payment_method_ui" value={method} checked={paymentMethod === method} onChange={() => setPaymentMethod(method)} className="pos-payment__radio" />
                    <span className="pos-payment__label">{method === "upi" ? "UPI" : method.charAt(0).toUpperCase() + method.slice(1)}</span>
                  </label>
                ))}
              </div>
              <label className="stu-field" style={{ marginTop: 16 }}>
                <span className="stu-field__label">Notes <span className="stu-field__hint">(optional)</span></span>
                <textarea value={notes} onChange={e => setNotes(e.target.value)} className="stu-textarea" rows={2} placeholder="Any special instructions or notes" />
              </label>
            </div>
          </section>

          {state.error && <p className="stu-form__error" role="alert">{state.error}</p>}

          <div className="pos-actions" style={{ display: "flex", gap: 12 }}>
            <button type="submit" className="stu-btn stu-btn--primary stu-btn--lg" disabled={!canSubmit || pending}>
              {pending ? "Saving…" : "Save Changes"}
            </button>
            <button type="button" className="stu-btn stu-btn--ghost stu-btn--lg" onClick={onCancel} disabled={pending}>
              Cancel
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}
