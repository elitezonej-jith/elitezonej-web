"use client";
import { useActionState, useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createWalkInOrderAction, type WalkInState } from "../../actions/walk-in";
import ProductSearch from "./ProductSearch";

type Product = {
  slug: string;
  name: string;
  price: number;
  sale_price: number | null;
  kind: string;
  sizes_json: string;
};

type OrderItem = {
  id: number;
  product_slug: string;
  product_name: string;
  size: string | null;
  colour: string | null;
  qty: number;
  unit_price: number;
  is_fabric: boolean;
};

type Props = {
  products: Product[];
};

const initial: WalkInState = {};
let nextItemId = 1;

export default function WalkInOrderForm({ products }: Props) {
  const [state, action, pending] = useActionState(createWalkInOrderAction, initial);
  const router = useRouter();

  // Navigate to invoice when order is created successfully
  useEffect(() => {
    if (state.orderId) {
      router.push(`/studio/orders/${state.orderId}/invoice?print=1`);
    }
  }, [state.orderId, router]);

  // Customer
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");

  // Items
  const [items, setItems] = useState<OrderItem[]>([]);

  // Pricing
  const [discountType, setDiscountType] = useState<"flat" | "percent">("flat");
  const [discountValue, setDiscountValue] = useState(0);
  const [taxPercent, setTaxPercent] = useState(0);

  // Payment
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "card" | "upi" | "pending">("cash");
  const [notes, setNotes] = useState("");

  // Computed totals
  const subtotal = useMemo(() => items.reduce((sum, it) => sum + it.unit_price * it.qty, 0), [items]);
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

    setItems(prev => [
      ...prev,
      {
        id: nextItemId++,
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
    setItems(prev => [
      ...prev,
      {
        id: nextItemId++,
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

  function updateItem(id: number, patch: Partial<OrderItem>) {
    setItems(prev => prev.map(it => it.id === id ? { ...it, ...patch } : it));
  }

  function removeItem(id: number) {
    setItems(prev => prev.filter(it => it.id !== id));
  }

  // Build the payload for the server action
  const payload = JSON.stringify({
    customer_name: name,
    customer_phone: phone,
    customer_email: email || undefined,
    items: items.map(it => ({
      product_slug: it.product_slug === "custom"
        ? `custom:${it.product_name}` // encode name in slug for invoice display
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

  const canSubmit = name.trim() && phone.trim() && items.length > 0;

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

              {items.length > 0 && (
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
                    {items.map(item => (
                      <tr key={item.id} className={item.product_slug === "custom" ? "pos-items-table__custom" : ""}>
                        <td className="pos-items-table__name">
                          {item.product_slug === "custom" ? (
                            <input
                              value={item.product_name}
                              onChange={e => updateItem(item.id, { product_name: e.target.value })}
                              className="stu-input pos-items-table__custom-name"
                              placeholder="Bespoke suit tailoring, Alterations, etc."
                              autoFocus
                            />
                          ) : (
                            item.product_name
                          )}
                        </td>
                        <td>
                          <input
                            value={item.size ?? item.colour ?? ""}
                            onChange={e => updateItem(item.id, item.is_fabric ? { colour: e.target.value } : { size: e.target.value })}
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
                            onChange={e => updateItem(item.id, { qty: Math.max(item.is_fabric ? 0.5 : 1, Number(e.target.value) || 1) })}
                            className="stu-input pos-items-table__qty"
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            min={0}
                            value={item.unit_price}
                            onChange={e => updateItem(item.id, { unit_price: Math.max(0, Number(e.target.value) || 0) })}
                            className="stu-input pos-items-table__price"
                          />
                        </td>
                        <td className="pos-items-table__num pos-items-table__line">
                          ₹{(item.unit_price * item.qty).toLocaleString()}
                        </td>
                        <td>
                          <button type="button" className="pos-items-table__remove" onClick={() => removeItem(item.id)} aria-label="Remove item">×</button>
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

              {items.length === 0 && (
                <p className="pos-empty-hint">Search products above or add a custom item for bespoke services.</p>
              )}
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

          <div className="pos-actions">
            <button type="submit" className="stu-btn stu-btn--primary stu-btn--lg" disabled={!canSubmit || pending}>
              {pending ? "Creating…" : "Create & Print Invoice"}
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}
