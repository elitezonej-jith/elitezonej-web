"use client";
import { useActionState, useState } from "react";
import AddressForm from "./AddressForm";
import {
  deleteAddressAction,
  setDefaultAddressAction,
  type AddressActionState,
} from "./address-actions";
import type { Address } from "../../lib/admin/repos/addresses";

const initial: AddressActionState = {};

function AddressCard({ a }: { a: Address }) {
  const [delState, delAction, delPending] = useActionState(
    deleteAddressAction,
    initial,
  );
  const [defState, defAction, defPending] = useActionState(
    setDefaultAddressAction,
    initial,
  );
  const [confirming, setConfirming] = useState(false);

  return (
    <div className="addr-card">
      <div className="addr-card-body">
        {a.label && <span className="addr-card-label">{a.label}</span>}
        {a.is_default === 1 && (
          <span className="addr-card-badge">Default</span>
        )}
        <p className="addr-card-name">
          {a.first_name} {a.last_name}
        </p>
        <p className="addr-card-lines">
          {a.line1}
          {a.line2 ? `, ${a.line2}` : ""}
          <br />
          {a.city}, {a.state} {a.pincode}
          <br />
          {a.country}
        </p>
      </div>

      <div className="addr-card-actions">
        {a.is_default !== 1 && (
          <form action={defAction}>
            <input type="hidden" name="address_id" value={a.id} />
            <button
              type="submit"
              className="addr-link-btn"
              disabled={defPending}
            >
              {defPending ? "Setting…" : "Set as default"}
            </button>
          </form>
        )}
        {!confirming ? (
          <button
            type="button"
            className="addr-link-btn addr-link-danger"
            onClick={() => setConfirming(true)}
          >
            Delete
          </button>
        ) : (
          <form action={delAction} className="addr-confirm">
            <input type="hidden" name="address_id" value={a.id} />
            <span className="addr-confirm-q">Delete this address?</span>
            <button
              type="submit"
              className="addr-link-btn addr-link-danger"
              disabled={delPending}
            >
              {delPending ? "Deleting…" : "Yes, delete"}
            </button>
            <button
              type="button"
              className="addr-link-btn"
              onClick={() => setConfirming(false)}
            >
              Keep
            </button>
          </form>
        )}
      </div>

      {(delState.error || defState.error) && (
        <p role="alert" className="addr-form-err">
          {delState.error ?? defState.error}
        </p>
      )}
    </div>
  );
}

export default function AddressBook({ addresses }: { addresses: Address[] }) {
  // null = list view; "new" = add form; number = editing that address id.
  const [mode, setMode] = useState<"list" | "new" | number>("list");
  const editing =
    typeof mode === "number" ? addresses.find((a) => a.id === mode) : undefined;

  if (mode === "new" || editing) {
    return (
      <AddressForm
        address={editing}
        onDone={() => setMode("list")}
        onCancel={() => setMode("list")}
      />
    );
  }

  return (
    <div className="addr-book">
      {addresses.length === 0 ? (
        <p className="addr-empty">
          No saved addresses yet. Add one for faster checkout.
        </p>
      ) : (
        <ul className="addr-list">
          {addresses.map((a) => (
            <li key={a.id} className="addr-card-wrap">
              <AddressCard a={a} />
              <button
                type="button"
                className="addr-link-btn"
                onClick={() => setMode(a.id)}
              >
                Edit
              </button>
            </li>
          ))}
        </ul>
      )}
      <button
        type="button"
        className="btn btn-secondary btn-block"
        onClick={() => setMode("new")}
        style={{ marginTop: addresses.length ? 16 : 12 }}
      >
        Add a new address
      </button>
    </div>
  );
}
