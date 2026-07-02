"use client";
import { useActionState, useState } from "react";
import { saveBespokeContentAction, type BespokeContentState } from "../../actions/bespoke-content";
import type { BespokeContent, BespokeService, ProcessStep, Testimonial } from "../../../../lib/storefront/bespoke-content";
import ImageUploader from "../../components/ImageUploader";

type Props = { initial: BespokeContent };
const initialState: BespokeContentState = {};
let nextId = Date.now();
function genId() { return `id-${nextId++}`; }

export default function BespokeContentEditor({ initial }: Props) {
  const [state, action, pending] = useActionState(saveBespokeContentAction, initialState);

  // ─── Hero state ─────────────────────────────────────────────────────
  const [eyebrow, setEyebrow] = useState(initial.hero.eyebrow);
  const [headline, setHeadline] = useState(initial.hero.headline);
  const [subtitle, setSubtitle] = useState(initial.hero.subtitle);
  const [leadTime, setLeadTime] = useState(initial.hero.lead_time_days);
  const [heroImage, setHeroImage] = useState(initial.hero.image_path);

  // ─── Services state ─────────────────────────────────────────────────
  const [services, setServices] = useState<BespokeService[]>(initial.services);

  // ─── Process steps state ────────────────────────────────────────────
  const [steps, setSteps] = useState<ProcessStep[]>(initial.process_steps);

  // ─── Testimonials state ─────────────────────────────────────────────
  const [testimonials, setTestimonials] = useState<Testimonial[]>(initial.testimonials);

  // ─── Booking services state ─────────────────────────────────────────
  const [bookingServices, setBookingServices] = useState(initial.booking_services.join("\n"));

  // ─── Payload ────────────────────────────────────────────────────────
  const payload = JSON.stringify({
    hero: { eyebrow, headline, subtitle, lead_time_days: leadTime, image_path: heroImage },
    services,
    process_steps: steps,
    testimonials,
    booking_services: bookingServices.split("\n").map(s => s.trim()).filter(Boolean),
  });

  // ─── Service helpers ────────────────────────────────────────────────
  function updateService(id: string, patch: Partial<BespokeService>) {
    setServices(prev => prev.map(s => s.id === id ? { ...s, ...patch } : s));
  }
  function removeService(id: string) { setServices(prev => prev.filter(s => s.id !== id)); }
  function addService() {
    setServices(prev => [...prev, { id: genId(), category: "", title: "", price: "", features: [""], cta_text: "Learn more", image_path: "" }]);
  }

  // ─── Step helpers ───────────────────────────────────────────────────
  function updateStep(id: string, patch: Partial<ProcessStep>) {
    setSteps(prev => prev.map(s => s.id === id ? { ...s, ...patch } : s));
  }
  function removeStep(id: string) { setSteps(prev => prev.filter(s => s.id !== id)); }
  function addStep() { setSteps(prev => [...prev, { id: genId(), title: "", description: "", image_path: "" }]); }

  // ─── Testimonial helpers ────────────────────────────────────────────
  function updateTestimonial(id: string, patch: Partial<Testimonial>) {
    setTestimonials(prev => prev.map(t => t.id === id ? { ...t, ...patch } : t));
  }
  function removeTestimonial(id: string) { setTestimonials(prev => prev.filter(t => t.id !== id)); }
  function addTestimonial() { setTestimonials(prev => [...prev, { id: genId(), quote: "", author: "", title: "" }]); }

  return (
    <form action={action}>
      <input type="hidden" name="payload" value={payload} />

      {state.saved && <div className="stu-toast stu-toast--success">✓ Bespoke content saved. Changes are live.</div>}
      {state.error && <p className="stu-form__error" role="alert">{state.error}</p>}

      {/* ─── Hero ──────────────────────────────────────────────── */}
      <section className="stu-card">
        <header className="stu-card__head"><h3>Hero section</h3></header>
        <div className="stu-card__body">
          <label className="stu-field">
            <span className="stu-field__label">Eyebrow</span>
            <input value={eyebrow} onChange={e => setEyebrow(e.target.value)} className="stu-input" />
          </label>
          <label className="stu-field" style={{ marginTop: 12 }}>
            <span className="stu-field__label">Headline <span className="stu-field__hint">(use {"\\n"} for line break, {"{leadTime}"} for lead time)</span></span>
            <textarea value={headline} onChange={e => setHeadline(e.target.value)} className="stu-textarea" rows={2} />
          </label>
          <label className="stu-field" style={{ marginTop: 12 }}>
            <span className="stu-field__label">Subtitle</span>
            <textarea value={subtitle} onChange={e => setSubtitle(e.target.value)} className="stu-textarea" rows={3} />
          </label>
          <label className="stu-field" style={{ marginTop: 12 }}>
            <span className="stu-field__label">Lead time (days)</span>
            <input type="number" min={1} max={365} value={leadTime} onChange={e => setLeadTime(Math.max(1, Number(e.target.value) || 14))} className="stu-input" style={{ width: 100 }} />
          </label>
          <div className="stu-field" style={{ marginTop: 12 }}>
            <span className="stu-field__label">Hero image</span>
            {heroImage && (
              <div className="bce-img-preview">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={heroImage} alt="" className="bce-img-preview__img" />
                <span className="bce-img-preview__path">{heroImage}</span>
              </div>
            )}
            <ImageUploader folder="bespoke" multiple={false} onUploaded={({ path }) => setHeroImage(path)} hint="Hero background image (landscape, 1600×900 ideal)" />
          </div>
        </div>
      </section>

      {/* ─── Services ──────────────────────────────────────────── */}
      <section className="stu-card" style={{ marginTop: 20 }}>
        <header className="stu-card__head">
          <h3>Services</h3>
          <span className="stu-card__count">{services.length}</span>
        </header>
        <div className="stu-card__body">
          {services.map((svc, i) => (
            <div key={svc.id} className="bce-service">
              <div className="bce-service__head">
                <span className="bce-service__num">{i + 1}</span>
                <button type="button" className="stu-btn stu-btn--ghost stu-btn--sm" onClick={() => removeService(svc.id)}>Remove</button>
              </div>
              <div className="stu-row">
                <label className="stu-field">
                  <span className="stu-field__label">Category</span>
                  <input value={svc.category} onChange={e => updateService(svc.id, { category: e.target.value })} className="stu-input" placeholder="Bespoke" />
                </label>
                <label className="stu-field">
                  <span className="stu-field__label">Title</span>
                  <input value={svc.title} onChange={e => updateService(svc.id, { title: e.target.value })} className="stu-input" placeholder="The Bespoke Suit" />
                </label>
              </div>
              <label className="stu-field" style={{ marginTop: 8 }}>
                <span className="stu-field__label">Price &amp; timeline</span>
                <input value={svc.price} onChange={e => updateService(svc.id, { price: e.target.value })} className="stu-input" placeholder="From ₹45,000 · 4 to 6 weeks" />
              </label>
              <label className="stu-field" style={{ marginTop: 8 }}>
                <span className="stu-field__label">Features <span className="stu-field__hint">(one per line)</span></span>
                <textarea value={svc.features.join("\n")} onChange={e => updateService(svc.id, { features: e.target.value.split("\n") })} className="stu-textarea" rows={4} />
              </label>
              <label className="stu-field" style={{ marginTop: 8 }}>
                <span className="stu-field__label">CTA button text</span>
                <input value={svc.cta_text} onChange={e => updateService(svc.id, { cta_text: e.target.value })} className="stu-input" placeholder="Begin your suit" style={{ width: 200 }} />
              </label>
              <div className="stu-field" style={{ marginTop: 8 }}>
                <span className="stu-field__label">Service image</span>
                {svc.image_path && (
                  <div className="bce-img-preview bce-img-preview--sm">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={svc.image_path} alt="" className="bce-img-preview__img" />
                  </div>
                )}
                <ImageUploader folder="bespoke" multiple={false} onUploaded={({ path }) => updateService(svc.id, { image_path: path })} hint="4:3 ratio, 800×600 ideal" />
              </div>
            </div>
          ))}
          <button type="button" className="stu-btn stu-btn--ghost stu-btn--sm" onClick={addService}>+ Add service</button>
        </div>
      </section>

      {/* ─── Process Steps ─────────────────────────────────────── */}
      <section className="stu-card" style={{ marginTop: 20 }}>
        <header className="stu-card__head">
          <h3>Process steps</h3>
          <span className="stu-card__count">{steps.length}</span>
        </header>
        <div className="stu-card__body">
          {steps.map((step, i) => (
            <div key={step.id} className="bce-step">
              <div className="bce-step__head">
                <span className="bce-step__num">Step {i + 1}</span>
                <button type="button" className="stu-btn stu-btn--ghost stu-btn--sm" onClick={() => removeStep(step.id)}>Remove</button>
              </div>
              <label className="stu-field">
                <span className="stu-field__label">Title</span>
                <input value={step.title} onChange={e => updateStep(step.id, { title: e.target.value })} className="stu-input" placeholder="Choose your cloth" />
              </label>
              <label className="stu-field" style={{ marginTop: 8 }}>
                <span className="stu-field__label">Description</span>
                <textarea value={step.description} onChange={e => updateStep(step.id, { description: e.target.value })} className="stu-textarea" rows={3} />
              </label>
              <div className="stu-field" style={{ marginTop: 8 }}>
                <span className="stu-field__label">Step image</span>
                {step.image_path && (
                  <div className="bce-img-preview bce-img-preview--sm">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={step.image_path} alt="" className="bce-img-preview__img" />
                  </div>
                )}
                <ImageUploader folder="bespoke" multiple={false} onUploaded={({ path }) => updateStep(step.id, { image_path: path })} hint="Square or landscape, 600×400 ideal" />
              </div>
            </div>
          ))}
          <button type="button" className="stu-btn stu-btn--ghost stu-btn--sm" onClick={addStep}>+ Add step</button>
        </div>
      </section>

      {/* ─── Testimonials ──────────────────────────────────────── */}
      <section className="stu-card" style={{ marginTop: 20 }}>
        <header className="stu-card__head">
          <h3>Testimonials</h3>
          <span className="stu-card__count">{testimonials.length}</span>
        </header>
        <div className="stu-card__body">
          {testimonials.map((t) => (
            <div key={t.id} className="bce-testimonial">
              <label className="stu-field">
                <span className="stu-field__label">Quote</span>
                <textarea value={t.quote} onChange={e => updateTestimonial(t.id, { quote: e.target.value })} className="stu-textarea" rows={3} />
              </label>
              <div className="stu-row" style={{ marginTop: 8 }}>
                <label className="stu-field">
                  <span className="stu-field__label">Author name</span>
                  <input value={t.author} onChange={e => updateTestimonial(t.id, { author: e.target.value })} className="stu-input" />
                </label>
                <label className="stu-field">
                  <span className="stu-field__label">Author title</span>
                  <input value={t.title} onChange={e => updateTestimonial(t.id, { title: e.target.value })} className="stu-input" placeholder="Investment Manager" />
                </label>
              </div>
              <button type="button" className="stu-btn stu-btn--ghost stu-btn--sm" onClick={() => removeTestimonial(t.id)} style={{ marginTop: 8 }}>Remove</button>
            </div>
          ))}
          <button type="button" className="stu-btn stu-btn--ghost stu-btn--sm" onClick={addTestimonial}>+ Add testimonial</button>
        </div>
      </section>

      {/* ─── Booking form options ──────────────────────────────── */}
      <section className="stu-card" style={{ marginTop: 20 }}>
        <header className="stu-card__head"><h3>Booking form — service options</h3></header>
        <div className="stu-card__body">
          <label className="stu-field">
            <span className="stu-field__label">Service options <span className="stu-field__hint">(one per line — these appear in the booking form dropdown)</span></span>
            <textarea value={bookingServices} onChange={e => setBookingServices(e.target.value)} className="stu-textarea" rows={6} />
          </label>
        </div>
      </section>

      {/* ─── Submit ────────────────────────────────────────────── */}
      <div className="stu-btn-row" style={{ marginTop: 24, justifyContent: "flex-end" }}>
        <button type="submit" className="stu-btn stu-btn--primary stu-btn--lg" disabled={pending}>
          {pending ? "Saving…" : "Save changes"}
        </button>
      </div>
    </form>
  );
}
