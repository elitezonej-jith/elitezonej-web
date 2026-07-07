"use client";
import { saveSettingsAction } from "../../admin/actions/settings";
import { useToast } from "../components/Toast";

export default function SettingsForm({ initial }: { initial: Record<string, string> }) {
  const { show } = useToast();
  return (
    <form action={async (fd) => { await saveSettingsAction(fd); show("Settings saved", "success"); }} className="stu-form">
      <div className="stu-row">
        <label className="stu-field"><span className="stu-field__label">Brand name</span>
          <input name="brand_name" defaultValue={initial.brand_name ?? ""} className="stu-input" /></label>
        <label className="stu-field"><span className="stu-field__label">Tagline</span>
          <input name="brand_tagline" defaultValue={initial.brand_tagline ?? ""} className="stu-input" /></label>
      </div>
      <div className="stu-row--3">
        <label className="stu-field"><span className="stu-field__label">Currency code</span>
          <input name="currency" defaultValue={initial.currency ?? "INR"} className="stu-input" /></label>
        <label className="stu-field"><span className="stu-field__label">Currency symbol</span>
          <input name="currency_symbol" defaultValue={initial.currency_symbol ?? "₹"} className="stu-input" /></label>
        <label className="stu-field"><span className="stu-field__label">Lead time (days)</span>
          <input name="lead_time_days" type="number" min={1} defaultValue={initial.lead_time_days ?? "7"} className="stu-input" /></label>
      </div>
      <div className="stu-row">
        <label className="stu-field"><span className="stu-field__label">Atelier email</span>
          <input name="contact_email" type="email" defaultValue={initial.contact_email ?? ""} className="stu-input" /></label>
        <label className="stu-field"><span className="stu-field__label">Atelier phone</span>
          <input name="contact_phone" defaultValue={initial.contact_phone ?? ""} className="stu-input" /></label>
      </div>
      <div className="stu-row">
        <label className="stu-field"><span className="stu-field__label">Address</span>
          <input name="atelier_address" defaultValue={initial.atelier_address ?? ""} className="stu-input" /></label>
        <label className="stu-field"><span className="stu-field__label">Instagram URL</span>
          <input name="instagram" defaultValue={initial.instagram ?? ""} className="stu-input" /></label>
      </div>
      <label className="stu-field">
        <span className="stu-field__label">Low-stock threshold</span>
        <input name="low_stock_threshold" type="number" min={0} max={20}
               defaultValue={initial.low_stock_threshold ?? "3"} className="stu-input" style={{ maxWidth: 120 }} />
      </label>

      {/* Tax Invoice / Business Details */}
      <hr style={{ border: "none", borderTop: "1px solid var(--stu-border)", margin: "24px 0 16px" }} />
      <h4 style={{ fontSize: 14, fontWeight: 600, margin: "0 0 12px", color: "var(--stu-text-2)" }}>Tax Invoice details</h4>
      <div className="stu-row">
        <label className="stu-field"><span className="stu-field__label">Business legal name</span>
          <input name="business_legal_name" defaultValue={initial.business_legal_name ?? ""} className="stu-input" placeholder="ZONE J" /></label>
        <label className="stu-field"><span className="stu-field__label">GSTIN</span>
          <input name="business_gstin" defaultValue={initial.business_gstin ?? ""} className="stu-input" placeholder="33BQSPN8858E1Z7" /></label>
      </div>
      <div className="stu-row--3">
        <label className="stu-field"><span className="stu-field__label">State code</span>
          <input name="business_state_code" defaultValue={initial.business_state_code ?? ""} className="stu-input" placeholder="33" style={{ maxWidth: 80 }} /></label>
        <label className="stu-field"><span className="stu-field__label">Phone 1</span>
          <input name="business_phone" defaultValue={initial.business_phone ?? ""} className="stu-input" placeholder="8939888593" /></label>
        <label className="stu-field"><span className="stu-field__label">Phone 2</span>
          <input name="business_phone2" defaultValue={initial.business_phone2 ?? ""} className="stu-input" placeholder="(optional)" /></label>
      </div>
      <label className="stu-field"><span className="stu-field__label">Business email (shown on invoice)</span>
        <input name="business_email" type="email" defaultValue={initial.business_email ?? ""} className="stu-input" placeholder="elitezonej@gmail.com" /></label>
      <label className="stu-field"><span className="stu-field__label">Business address (shown on invoice)</span>
        <textarea name="business_address" defaultValue={initial.business_address ?? ""} className="stu-textarea" rows={3}
                  placeholder={"1/1334, 4TH CROSS STREET\nTHIRUVALLUVAR SALAI, BETHAL NAGAR,\nINJAMBAKKAM, CHENNAI- 60015"} /></label>

      <div style={{ marginTop: 4 }}>
        <button type="submit" className="stu-btn stu-btn--primary">Save settings</button>
      </div>
    </form>
  );
}
