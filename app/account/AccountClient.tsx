"use client";
import { useState } from "react";
import Link from "next/link";
import ProfileForm from "./ProfileForm";
import AddressBook from "./AddressBook";
import { signOutAction } from "./actions";
import { fmtINR } from "@/lib/format";
import type { Address } from "../../lib/admin/repos/addresses";

type Order = { id: string; status: string; total: number; created_at: string };
type Customer = { firstName: string; lastName: string; email: string; phone: string; city: string };

const TABS = [
  { key: "profile", label: "Profile" },
  { key: "orders", label: "Orders" },
  { key: "addresses", label: "Addresses" },
] as const;
type Tab = (typeof TABS)[number]["key"];

function statusLabel(status: string): string {
  if (status === "new") return "Awaiting payment";
  if (status === "in_atelier") return "In atelier";
  return status.charAt(0).toUpperCase() + status.slice(1);
}

function statusClass(status: string): string {
  if (status === "fulfilled") return "acc-status--done";
  if (status === "shipped") return "acc-status--ship";
  if (status === "cancelled") return "acc-status--cancel";
  if (status === "new") return "acc-status--pending";
  return "";
}

function orderDate(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "" : d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export default function AccountClient({ customer, orders, addresses }: {
  customer: Customer;
  orders: Order[];
  addresses: Address[];
}) {
  const [tab, setTab] = useState<Tab>("profile");
  const [editing, setEditing] = useState(false);

  return (
    <>
      <div className="acc-header">
        <h1 className="acc-title">Hello, {customer.firstName || "there"}</h1>
        <form action={signOutAction}>
          <button type="submit" className="acc-signout">Sign out</button>
        </form>
      </div>

      <nav className="acc-tabs" role="tablist">
        {TABS.map(t => (
          <button
            key={t.key}
            role="tab"
            aria-selected={tab === t.key}
            className={`acc-tab ${tab === t.key ? "acc-tab--active" : ""}`}
            onClick={() => { setTab(t.key); setEditing(false); }}
          >
            {t.label}
            {t.key === "orders" && orders.length > 0 && (
              <span className="acc-tab__count">{orders.length}</span>
            )}
          </button>
        ))}
      </nav>

      <div className="acc-panel">
        {tab === "profile" && (
          <ProfileTab customer={customer} editing={editing} setEditing={setEditing} />
        )}
        {tab === "orders" && <OrdersTab orders={orders} />}
        {tab === "addresses" && <AddressesTab addresses={addresses} />}
      </div>
    </>
  );
}

function ProfileTab({ customer, editing, setEditing }: {
  customer: Customer;
  editing: boolean;
  setEditing: (v: boolean) => void;
}) {
  if (editing) {
    return (
      <div className="acc-section">
        <div className="acc-section__head">
          <h2 className="acc-section__title">Edit profile</h2>
          <button type="button" className="acc-link-btn" onClick={() => setEditing(false)}>Cancel</button>
        </div>
        <ProfileForm
          firstName={customer.firstName}
          lastName={customer.lastName}
          phone={customer.phone}
          city={customer.city}
          onSaved={() => setEditing(false)}
        />
      </div>
    );
  }

  return (
    <div className="acc-section">
      <div className="acc-section__head">
        <h2 className="acc-section__title">Your details</h2>
        <button type="button" className="acc-link-btn" onClick={() => setEditing(true)}>Edit</button>
      </div>
      <dl className="acc-details">
        <div className="acc-detail">
          <dt>Name</dt>
          <dd>{customer.firstName} {customer.lastName}</dd>
        </div>
        <div className="acc-detail">
          <dt>Email</dt>
          <dd>{customer.email}</dd>
        </div>
        {customer.phone && (
          <div className="acc-detail">
            <dt>Phone</dt>
            <dd>{customer.phone}</dd>
          </div>
        )}
        {customer.city && (
          <div className="acc-detail">
            <dt>City</dt>
            <dd>{customer.city}</dd>
          </div>
        )}
      </dl>
    </div>
  );
}

function OrdersTab({ orders }: { orders: Order[] }) {
  if (orders.length === 0) {
    return (
      <div className="acc-section acc-empty">
        <p>No orders yet.</p>
        <Link href="/collection?c=men" className="btn btn-secondary">Start shopping</Link>
      </div>
    );
  }

  return (
    <div className="acc-section">
      <div className="acc-orders">
        {orders.map(o => (
          <Link key={o.id} href={`/account/orders/${o.id}`} className="acc-order">
            <div className="acc-order__top">
              <span className="acc-order__id">{o.id}</span>
              <span className={`acc-order__status ${statusClass(o.status)}`}>{statusLabel(o.status)}</span>
            </div>
            <div className="acc-order__bottom">
              <span className="acc-order__date">{orderDate(o.created_at)}</span>
              <span className="acc-order__total">{fmtINR(o.total)}</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

function AddressesTab({ addresses }: { addresses: Address[] }) {
  return (
    <div className="acc-section">
      <AddressBook addresses={addresses} />
    </div>
  );
}
