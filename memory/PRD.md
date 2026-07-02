# MeraBazaar — Product Requirements Document

## Origin
Originally requested as a **rebrand of "Bazaarly" → MeraBazaar** (Amazon-inspired re-skin), but `/app` contained only the Emergent scaffold. User approved **Option A: full build from scratch** with mocked third-party integrations.

## Product
**MeraBazaar** — मेरा भरोसेमंद बाज़ार · My Trusted Bazaar
An Amazon-inspired verified-seller marketplace for Indian kirana, food, handicrafts, handloom, and services.

## Personas
1. **Buyer** — browses by pincode/category, contacts sellers via WhatsApp / pays via UPI.
2. **Verified seller** — completes Aadhaar OKYC + FSSAI/GSTIN, lists products, earns trust ribbons.
3. **Admin** — reviews activity, oversees the platform.

## Core Requirements (implemented)
- Amazon-style shell: dark navy top header (#131921) with wordmark + smile arrow, delivery-pincode pill, full-width search with orange search button, category strip (#232F3E), 4-column dark navy footer, back-to-top bar.
- Home page: auto-rotating 3-slide hero, "MeraBazaar Verified" ribbon row, product grid with Amazon-style white cards (image, 2-line title, star row, price in red, FREE delivery line, orange "Add to enquiry" button that opens WhatsApp).
- Product detail: left image gallery, center title + trust ribbons + price + "Buy on WhatsApp" (orange) + "Pay via UPI" (yellow) + pincode delivery check, right seller trust profile sidebar.
- Auth: JWT-based custom auth (bcrypt + httpOnly cookies + Bearer fallback), brute-force protection, idempotent admin/seller seed.
- Verification wizard: 3-step (Aadhaar OKYC MOCKED, FSSAI 14-digit MOCKED, GSTIN 15-char MOCKED) — earns trust ribbons.
- Seller dashboard: my listings, activity log, quick-links to create + verify.
- Create listing: bilingual title/description, category, price, unit, pincode, stock, image URLs.
- Bilingual EN/हिन्दी toggle (persisted, updates all UI copy).
- Big-text accessibility toggle (persisted, `body.mb-bigtext`).
- Pincode-near filter (first-3-digits regex match).
- Amazon's-Choice-style trust ribbons: navy body + orange left triangle notch.
- Palette: #131921, #232F3E, #FF9900/#E88B00, #EAEDED, #007185, #007600, #B12704.
- Typography: "Amazon Ember", Helvetica Neue, Arial, sans-serif — weights 400/500/700.
- All routes: `/`, `/login`, `/register`, `/product/:id`, `/seller`, `/seller/verify`, `/seller/create`.
- All interactive elements have `data-testid`.

## MOCKED Integrations
- **Aadhaar OKYC** — format-check only, static OTP `123456`.
- **FSSAI 14-digit check** — regex validate → mark `gov_verified`.
- **GSTIN 15-char check** — regex validate → mark `gov_verified`.
- **Supabase mirror** — writes to local `mirror_events` MongoDB collection instead of real Supabase.
- **Emergent object storage** — replaced with plain image URLs.

## Backlog / Next Actions
- P1: Wire real Aadhaar OKYC (Digio / SurePass) — needs vendor API key.
- P1: Wire real FSSAI + GSTIN checks (public GSTIN API + FSSAI portal / KYC provider).
- P1: Real Supabase mirror (URL + service-role key).
- P1: File upload to Emergent object storage (or S3-compatible) for listing images.
- P2: Buyer order tracking, review/rating with photo, seller badges evolution.
- P2: Admin console pages (moderate listings, users, seed data).
- P2: WhatsApp Cloud API for outbound seller enquiries (currently uses `wa.me` deep-link).

## Test Credentials
- Admin: `admin@bazaarly.in / Admin@1234`
- Seller: `seller@bazaarly.in / Seller@1234`

## Timeline
- 2026-01-XX — MVP shipped: full Amazon-style shell + auth + listings + verification wizard + bilingual + a11y.

## 2026-01 · Redesign to "Organic & Earthy" archetype
Dropped the Amazon-clone aesthetic per user feedback ("make it more generic, self-made — not a whole copy of Amazon"). Redesigned end-to-end:
- Palette: terracotta primary #C2533A + saffron #D97925 + sage #5C7E6A + bone #FAFAF5 + deep earth green footer #29362D (removed all navy #131921 / #232F3E)
- Typography: **Cormorant Garamond** (headings, wordmark) + **Manrope** (body) + **Noto Sans/Serif Devanagari** (Hindi) — loaded via Google Fonts
- Wordmark: elegant serif "Mera•Bazaar" with sage bullet + saffron "Bazaar" accent (replaces Amazon smile-arrow)
- Trust ribbons: rotated wax-seal / stamp shape with dashed inset border (rounded 4/20/4/20 px asymmetric radius) — terracotta for identity, sage for government (replaces Amazon's-Choice triangle notch)
- Header: light sticky bar with pill-shaped search + inline terracotta CTA + rounded pincode chip + text-underline category strip (no navy bars)
- Home hero: asymmetric 3-tile Tetris grid (main spice image + Handloom side + Handicrafts side) with italic serif headline and gradient overlays
- Product card: rounded-2xl white with elevated hover lift + terracotta shadow + saffron star row
- Seller Dashboard: gradient greeting card + 3 stat tiles + terracotta-hover listing thumbnails + sage dot activity feed
- Verify Wizard: warm gradient hero + circled step numbers turning sage when done + wax-seal ribbons on verified state
