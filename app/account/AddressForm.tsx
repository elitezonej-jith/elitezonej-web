"use client";
import { useActionState, useEffect, useRef, type InputHTMLAttributes } from "react";
import {
  createAddressAction,
  updateAddressAction,
  type AddressActionState,
} from "./address-actions";
import type { Address } from "../../lib/admin/repos/addresses";

const initial: AddressActionState = {};

/** Input with an always-rendered, screen-reader-associated error line so the
 *  layout never shifts when an error appears. Mirrors the checkout Field. */
function Field({
  err,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { err?: string }) {
  const errId = props.name ? `addr-err-${props.name}` : undefined;
  return (
    <div className="addr-field">
      <input
        {...props}
        className="addr-input"
        aria-invalid={err ? true : undefined}
        aria-describedby={err ? errId : props["aria-describedby"]}
      />
      <span id={errId} role="alert" className="addr-field-err">
        {err ?? ""}
      </span>
    </div>
  );
}

type Props = {
  /** Present → edit that address; absent → create a new one. */
  address?: Address;
  onDone: () => void;
  onCancel: () => void;
};

export default function AddressForm({ address, onDone, onCancel }: Props) {
  const editing = !!address;
  const [state, action, pending] = useActionState(
    editing ? updateAddressAction : createAddressAction,
    initial,
  );
  const doneRef = useRef(onDone);
  doneRef.current = onDone;

  useEffect(() => {
    if (state.ok) doneRef.current();
  }, [state.ok]);

  return (
    <form action={action} className="addr-form" noValidate>
      {editing && <input type="hidden" name="address_id" value={address.id} />}
      <Field
        name="label"
        placeholder="Label (e.g. Home, Office) — optional"
        aria-label="Address label"
        defaultValue={address?.label ?? ""}
        err={state.fieldErrors?.label}
      />
      <div className="addr-row-2">
        <Field
          name="first_name"
          placeholder="First name"
          required
          aria-label="First name"
          defaultValue={address?.first_name ?? ""}
          err={state.fieldErrors?.first_name}
        />
        <Field
          name="last_name"
          placeholder="Last name"
          required
          aria-label="Last name"
          defaultValue={address?.last_name ?? ""}
          err={state.fieldErrors?.last_name}
        />
      </div>
      <Field
        name="line1"
        placeholder="Address line 1"
        required
        aria-label="Address line 1"
        defaultValue={address?.line1 ?? ""}
        err={state.fieldErrors?.line1}
      />
      <Field
        name="line2"
        placeholder="Address line 2 (optional)"
        aria-label="Address line 2"
        defaultValue={address?.line2 ?? ""}
        err={state.fieldErrors?.line2}
      />
      <div className="addr-row-2">
        <Field
          name="city"
          placeholder="City"
          required
          aria-label="City"
          defaultValue={address?.city ?? ""}
          err={state.fieldErrors?.city}
        />
        <Field
          name="state"
          placeholder="State"
          required
          aria-label="State"
          defaultValue={address?.state ?? ""}
          err={state.fieldErrors?.state}
        />
      </div>
      <Field
        name="pincode"
        placeholder="Pincode"
        inputMode="numeric"
        required
        aria-label="Pincode"
        defaultValue={address?.pincode ?? ""}
        err={state.fieldErrors?.pincode}
      />
      {!editing && (
        <label className="addr-default-check">
          <input type="checkbox" name="set_default" value="1" />
          <span>Make this my default address</span>
        </label>
      )}

      {state.error && !state.fieldErrors && (
        <p role="alert" className="addr-form-err">
          {state.error}
        </p>
      )}

      <div className="addr-form-actions">
        <button type="submit" className="btn btn-primary" disabled={pending}>
          {pending ? "Saving…" : editing ? "Save changes" : "Add address"}
        </button>
        <button
          type="button"
          className="btn btn-tertiary"
          onClick={onCancel}
          disabled={pending}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
