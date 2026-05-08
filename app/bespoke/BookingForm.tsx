"use client";
import { useActionState } from "react";
import { submitBespokeBooking, type PublicBookingState } from "../admin/actions/bookings";

type Field = {
  name: "first_name" | "last_name" | "phone";
  label: string;
  type: string;
  placeholder: string;
};

const TEXT_FIELDS: Field[] = [
  { name: "first_name", label: "First name", type: "text", placeholder: "Your first name" },
  { name: "last_name",  label: "Last name",  type: "text", placeholder: "Your last name" },
  { name: "phone",      label: "Phone",      type: "tel",  placeholder: "+91 …" },
];

const initial: PublicBookingState = {};

export default function BookingForm() {
  const [state, action, pending] = useActionState(submitBespokeBooking, initial);

  if (state.ok) {
    return (
      <div className="booking-confirm" role="status" aria-live="polite">
        <span className="booking-confirm__check" aria-hidden="true">✓</span>
        <span className="booking-confirm__eyebrow t-mono-xs">Appointment requested</span>
        <h4 className="booking-confirm__title"><em>Thank you.</em><br />We&apos;ll confirm within four hours.</h4>
        <p className="booking-confirm__sub">A note from the atelier is on its way to your phone. If you don&apos;t see it, WhatsApp us at <a href="https://wa.me/919800000000">+91 98XXX XXXXX</a>.</p>
        <span className="booking-confirm__signed">— By the bespoke desk · Delhi</span>
      </div>
    );
  }

  return (
    <form className="booking-form" action={action}>
      <div className="booking-form__row two">
        {TEXT_FIELDS.slice(0, 2).map(f => (
          <BookingField key={f.name} field={f} />
        ))}
      </div>
      <BookingField field={TEXT_FIELDS[2]} />
      <BookingSelect
        name="city"
        label="City"
        options={[
          "Delhi NCR — Visit atelier",
          "Delhi NCR — Home fitting",
          "Mumbai — Home fitting",
          "Bangalore — Home fitting",
          "Other (we'll arrange)",
        ]}
      />
      <BookingSelect
        name="service"
        label="Service"
        options={[
          "Bespoke Suit",
          "Custom Sherwani",
          "Tailored Shirts",
          "Alterations",
          "Just exploring",
        ]}
      />
      {state.error && (
        <p style={{ margin: 0, color: "var(--accent)", fontStyle: "italic" }} role="alert">
          {state.error}
        </p>
      )}
      <button className="btn btn-primary btn-lg btn-block" type="submit" disabled={pending}>
        {pending ? "Sending…" : "Request appointment"}
      </button>
    </form>
  );
}

function BookingField({ field }: { field: Field }) {
  return (
    <label className="booking-field">
      <span className="booking-field__label">{field.label}</span>
      <input
        name={field.name}
        type={field.type}
        placeholder={field.placeholder}
        required
      />
      <span className="booking-field__rule" aria-hidden="true" />
    </label>
  );
}

function BookingSelect({
  name, label, options,
}: { name: string; label: string; options: string[] }) {
  return (
    <label className="booking-field booking-field--select">
      <span className="booking-field__label">{label}</span>
      <select name={name} required defaultValue="">
        <option value="" disabled hidden></option>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
      <span className="booking-field__rule" aria-hidden="true" />
      <span className="booking-field__chevron" aria-hidden="true">▾</span>
    </label>
  );
}
