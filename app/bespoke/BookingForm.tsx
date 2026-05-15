"use client";
import { useActionState } from "react";
import { submitBespokeBooking, type PublicBookingState } from "../admin/actions/bookings";
import { WHATSAPP_LINK, WHATSAPP_DISPLAY } from "@/lib/contact";

type Field = {
  name: "first_name" | "last_name" | "phone";
  label: string;
  type: string;
  placeholder: string;
  pattern?: string;
  autoComplete?: string;
};

const TEXT_FIELDS: Field[] = [
  { name: "first_name", label: "First name", type: "text", placeholder: "Your first name", autoComplete: "given-name" },
  { name: "last_name",  label: "Last name",  type: "text", placeholder: "Your last name", autoComplete: "family-name" },
  { name: "phone",      label: "Phone",      type: "tel",  placeholder: "+91 98765 43210", pattern: "^\\+?[0-9 \\-]{8,15}$", autoComplete: "tel" },
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
        <p className="booking-confirm__sub">A note from the atelier is on its way to your phone. If you don&apos;t see it, WhatsApp us at <a href={WHATSAPP_LINK} target="_blank" rel="noopener noreferrer">{WHATSAPP_DISPLAY}</a>.</p>
        <span className="booking-confirm__signed">— By the bespoke desk · Delhi</span>
      </div>
    );
  }

  return (
    <form className="booking-form" action={action}>
      <div className="booking-form__row two">
        {TEXT_FIELDS.slice(0, 2).map(f => (
          <BookingField key={f.name} field={f} invalid={!!state.error} />
        ))}
      </div>
      <BookingField field={TEXT_FIELDS[2]} invalid={!!state.error} />
      <BookingSelect
        name="city"
        label="City"
        placeholder="Select a city"
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
        placeholder="Select a service"
        options={[
          "Bespoke Suit",
          "Custom Sherwani",
          "Tailored Shirts",
          "Alterations",
          "Just exploring",
        ]}
      />
      {state.error && (
        <p id="booking-error" style={{ margin: 0, color: "var(--accent)", fontStyle: "italic" }} role="alert">
          {state.error}
        </p>
      )}
      <button className="btn btn-primary btn-lg btn-block" type="submit" disabled={pending}>
        {pending ? "Sending…" : "Request appointment"}
      </button>
    </form>
  );
}

function BookingField({ field, invalid }: { field: Field; invalid: boolean }) {
  const id = `bf-${field.name}`;
  return (
    <label className="booking-field" htmlFor={id}>
      <span className="booking-field__label">{field.label}</span>
      <input
        id={id}
        name={field.name}
        type={field.type}
        placeholder={field.placeholder}
        pattern={field.pattern}
        autoComplete={field.autoComplete}
        aria-invalid={invalid || undefined}
        aria-describedby={invalid ? "booking-error" : undefined}
        required
      />
      <span className="booking-field__rule" aria-hidden="true" />
    </label>
  );
}

function BookingSelect({
  name, label, options, placeholder,
}: { name: string; label: string; options: string[]; placeholder: string }) {
  const id = `bf-${name}`;
  return (
    <label className="booking-field booking-field--select" htmlFor={id}>
      <span className="booking-field__label">{label}</span>
      <select id={id} name={name} required defaultValue="">
        <option value="" disabled>{placeholder}</option>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
      <span className="booking-field__rule" aria-hidden="true" />
      <span className="booking-field__chevron" aria-hidden="true">▾</span>
    </label>
  );
}
