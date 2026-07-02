# Bespoke Section Customisation from Studio — Architectural Plan

## Context

The public `/bespoke` page is currently **hardcoded** — services, pricing, descriptions, process steps, testimonials, and booking form options are all static JSX. The client wants operators to customise the entire bespoke section from `/studio` without touching code.

---

## Current State (What's Hardcoded)

| Section | Current State | What's Editable Today |
|---|---|---|
| **Hero** — headline, subtitle, CTAs | Hardcoded JSX | Only `leadTimeDays` (via settings) |
| **Services** (3 cards) — name, price, timeline, features, CTA | All hardcoded | Nothing |
| **Process** (4 steps) — title, description, images | All hardcoded | Nothing |
| **Booking form** — service dropdown options | Hardcoded array: `["Bespoke Suit", "Custom Sherwani", ...]` | Nothing |
| **Testimonials** (2 quotes) — quote text, author | All hardcoded | Nothing |
| **Lead time** — "Delivered in X days" | Dynamic via settings | `lead_time_days` in settings table |

**What Studio CAN manage today:**
- Bespoke *leads/bookings* (inquiries that come through the form) — `/studio/bespoke`
- That's it. No content management for the bespoke page itself.

---

## Proposed Design

### New Studio Page: `/studio/bespoke/content`

A dedicated content editor for the public bespoke page, structured as:

```
┌─────────────────────────────────────────────────────────────────┐
│ Bespoke Page Content                                            │
│ Edit the public /bespoke page — services, process, testimonials │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ ┌─ Hero Section ────────────────────────────────────────────┐   │
│ │ Eyebrow: [Bespoke · Made-to-Measure · Alterations_____]   │   │
│ │ Headline: [A suit cut to your figure.__________________]  │   │
│ │ Subtitle: [Twelve in-house designers and...____________]  │   │
│ │ Lead time (days): [14]                                    │   │
│ └───────────────────────────────────────────────────────────┘   │
│                                                                 │
│ ┌─ Services (drag to reorder) ──────────────────────────────┐   │
│ │                                                           │   │
│ │ ┌─ Service 1 ─────────────────────────────────────────┐   │   │
│ │ │ Title: [The Bespoke Suit]                           │   │   │
│ │ │ Category: [Bespoke]                                 │   │   │
│ │ │ Price: [From ₹45,000 · 4 to 6 weeks]               │   │   │
│ │ │ Features (one per line):                            │   │   │
│ │ │ [Drafted to a paper pattern unique to your figure]  │   │   │
│ │ │ [Three fittings — basted, forward, finish]          │   │   │
│ │ │ [Hand-padded canvas, hand-stitched buttonholes]     │   │   │
│ │ │ [Lifetime mending]                                  │   │   │
│ │ │ CTA text: [Begin your suit]                         │   │   │
│ │ │                                         [Remove]    │   │   │
│ │ └─────────────────────────────────────────────────────┘   │   │
│ │                                                           │   │
│ │ ┌─ Service 2 ─────────────────────────────────────────┐   │   │
│ │ │ ...                                                 │   │   │
│ │ └─────────────────────────────────────────────────────┘   │   │
│ │                                                           │   │
│ │ [+ Add service]                                           │   │
│ └───────────────────────────────────────────────────────────┘   │
│                                                                 │
│ ┌─ Process Steps (drag to reorder) ─────────────────────────┐   │
│ │ ┌─ Step 1 ───────────────────────────────────────────────┐│   │
│ │ │ Title: [Choose your cloth]                             ││   │
│ │ │ Description: [Browse our cloth library — wools from...]││   │
│ │ └────────────────────────────────────────────────────────┘│   │
│ │ [+ Add step]                                              │   │
│ └───────────────────────────────────────────────────────────┘   │
│                                                                 │
│ ┌─ Testimonials ────────────────────────────────────────────┐   │
│ │ ┌─ Quote 1 ──────────────────────────────────────────────┐│   │
│ │ │ Quote: [I've worn one of Aman's three-piece suits...]  ││   │
│ │ │ Author: [Rohan Mehra]                                  ││   │
│ │ │ Title: [Investment Manager]                            ││   │
│ │ └────────────────────────────────────────────────────────┘│   │
│ │ [+ Add testimonial]                                       │   │
│ └───────────────────────────────────────────────────────────┘   │
│                                                                 │
│ ┌─ Booking Form Options ────────────────────────────────────┐   │
│ │ Service options (one per line):                           │   │
│ │ [Bespoke Suit]                                            │   │
│ │ [Custom Sherwani]                                         │   │
│ │ [Tailored Shirts]                                         │   │
│ │ [Alterations]                                             │   │
│ │ [Just exploring]                                          │   │
│ └───────────────────────────────────────────────────────────┘   │
│                                                                 │
│                              [Save changes]                     │
└─────────────────────────────────────────────────────────────────┘
```

---

## Data Model

### Option A: Use the existing `settings` table (key-value JSON)

Store all bespoke content as a single JSON blob in the settings table:

```sql
INSERT INTO settings (key, value) VALUES ('bespoke_content', '{...JSON...}');
```

**Pros:** No schema migration. Dead simple. Settings already have cache invalidation via `bustSettings()`.
**Cons:** Single large JSON blob — but the bespoke content is small (<5KB), so this is fine.

### Data Shape

```typescript
type BespokeContent = {
  hero: {
    eyebrow: string;
    headline: string;
    subtitle: string;
    lead_time_days: number;
  };
  services: Array<{
    id: string; // for stable React keys
    category: string; // e.g. "Bespoke", "Made-to-Measure", "Alterations"
    title: string;
    price: string; // e.g. "From ₹45,000 · 4 to 6 weeks"
    features: string[]; // bullet points
    cta_text: string;
  }>;
  process_steps: Array<{
    id: string;
    title: string;
    description: string;
  }>;
  testimonials: Array<{
    id: string;
    quote: string;
    author: string;
    title: string; // e.g. "Investment Manager"
  }>;
  booking_services: string[]; // dropdown options in the booking form
};
```

---

## File-Level Implementation Plan

### 1. New page: `app/studio/bespoke/content/page.tsx`

Server component that reads `bespoke_content` from settings, passes to the editor form.

### 2. New component: `app/studio/bespoke/content/BespokeContentEditor.tsx`

Client component (~400 lines). The main editor form with:
- Hero section fields
- Services list (add/remove/reorder)
- Process steps list (add/remove/reorder)
- Testimonials list (add/remove)
- Booking form service options (textarea, one per line)
- Serializes all to JSON and submits

### 3. New server action: `app/studio/actions/bespoke-content.ts`

```ts
"use server";
export async function saveBespokeContentAction(fd: FormData): Promise<{ error?: string }> {
  // 1. Parse JSON payload
  // 2. Validate with Zod
  // 3. Save to settings table: key = 'bespoke_content'
  // 4. Also update 'lead_time_days' setting (for backward compat)
  // 5. bustSettings() to invalidate storefront cache
  // 6. Return success
}
```

### 4. New data reader: `lib/storefront/bespoke-content.ts`

```ts
export async function getBespokeContent(): Promise<BespokeContent> {
  // Read from settings table (key = 'bespoke_content')
  // Parse JSON
  // Return with fallback to default hardcoded content if empty/missing
}
```

Wrapped in `unstable_cache` with `CACHE_TAGS.settings` tag (same as site settings).

### 5. Modify: `app/bespoke/page.tsx`

Replace all hardcoded content with dynamic reads from `getBespokeContent()`:
- Hero: use `content.hero.*`
- Services: map over `content.services`
- Process: map over `content.process_steps`
- Testimonials: map over `content.testimonials`
- Booking form: pass `content.booking_services` as prop

### 6. Modify: `app/bespoke/BookingForm.tsx`

Accept `services` prop (string array) instead of hardcoded options.

### 7. Styles: add to `studio.css`

`.stu-bespoke-*` namespace for the editor form (reuses existing card/field patterns).

---

## Edge Cases & Decisions

| Scenario | Handling |
|---|---|
| No bespoke_content in settings (fresh install) | Reader returns hardcoded defaults (current content). Page renders identically to today. |
| Empty services array | Show at least one empty service card in the editor. Public page shows "No services listed" or falls back to defaults. |
| Empty process steps | Public page hides the process section entirely. |
| Empty testimonials | Public page hides the testimonials section. |
| Very long feature list (10+ items) | No limit — renders all. CSS handles overflow. |
| HTML in text fields | Sanitize — render as plain text (no dangerouslySetInnerHTML). Use `\n` for line breaks if needed. |
| Lead time change | Updates both `bespoke_content.hero.lead_time_days` AND the top-level `lead_time_days` setting for backward compat. |
| Concurrent edits | Last writer wins (same as all settings). Single operator use case. |
| Large JSON payload | Bespoke content is <10KB. Settings table supports TEXT columns. No issue. |
| Service reordering | Array order = display order. Editor supports drag or move-up/move-down buttons. |
| Booking form options vs service cards | They're independent: booking_services is the dropdown list, services is the cards. Operator controls both separately. |
| Cache invalidation | `bustSettings()` called on save → `unstable_cache` with tag `settings` is invalidated → public page shows new content immediately. |

---

## Implementation Order

| Step | File | Effort |
|---|---|---|
| 1 | `lib/storefront/bespoke-content.ts` — reader with defaults | 1h |
| 2 | `app/studio/actions/bespoke-content.ts` — save action | 1h |
| 3 | `app/studio/bespoke/content/BespokeContentEditor.tsx` — editor UI | 4h |
| 4 | `app/studio/bespoke/content/page.tsx` — wiring page | 30min |
| 5 | `app/bespoke/page.tsx` — make dynamic from reader | 2h |
| 6 | `app/bespoke/BookingForm.tsx` — accept services prop | 30min |
| 7 | Styles | 1h |

**Total: ~10 hours**

---

## Architecture Summary

```
┌────────────────────────────────────────────────────────────────────┐
│ Studio Editor                                                      │
│ /studio/bespoke/content                                            │
│                                                                    │
│ BespokeContentEditor (client form)                                 │
│        │                                                           │
│        ▼ (submit)                                                  │
│ saveBespokeContentAction                                           │
│   → settings table: key='bespoke_content', value=JSON              │
│   → bustSettings()                                                 │
└────────────────────────────────────────────────────────────────────┘
                              │
                              ▼ (cache invalidated)
┌────────────────────────────────────────────────────────────────────┐
│ Public Bespoke Page                                                │
│ /bespoke                                                           │
│                                                                    │
│ getBespokeContent() → reads settings → parses JSON → returns data  │
│ (with unstable_cache + CACHE_TAGS.settings)                        │
│                                                                    │
│ page.tsx renders dynamically from content:                         │
│   hero.headline → <h1>                                             │
│   services[] → service cards                                       │
│   process_steps[] → process timeline                               │
│   testimonials[] → quote cards                                     │
│   booking_services[] → <select> options in BookingForm             │
└────────────────────────────────────────────────────────────────────┘
```

---

## What Operators Can Customise (After Implementation)

| Element | Editable? |
|---|---|
| Hero eyebrow text | ✅ |
| Hero headline | ✅ |
| Hero subtitle | ✅ |
| Lead time (days) | ✅ |
| Number of services | ✅ (add/remove) |
| Service category label | ✅ |
| Service title | ✅ |
| Service pricing text | ✅ |
| Service bullet points | ✅ |
| Service CTA button text | ✅ |
| Service order | ✅ (reorder) |
| Number of process steps | ✅ (add/remove) |
| Step title | ✅ |
| Step description | ✅ |
| Step order | ✅ |
| Number of testimonials | ✅ (add/remove) |
| Testimonial quote text | ✅ |
| Testimonial author + title | ✅ |
| Booking form service options | ✅ |
| Hero/service/step images | ❌ Phase 2 (requires media upload integration) |
| WhatsApp contact number | ❌ (hardcoded in lib/contact.ts — separate settings task) |
