import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { api } from "@/context/AuthContext";
import { TrustRibbon } from "@/components/mera/TrustRibbon";
import { useI18n } from "@/i18n";
import { TID } from "@/constants/testIds";
import { ShieldCheck, Truck, MapPin, MessageCircle, Zap, Star } from "lucide-react";

export default function ProductDetail() {
  const { id } = useParams();
  const { t, lang } = useI18n();
  const [p, setP] = useState(null);
  const [pin, setPin] = useState(localStorage.getItem("mb.pincode") || "110001");
  const [err, setErr] = useState("");
  const [active, setActive] = useState(0);

  useEffect(() => {
    api.get(`/listings/${id}`).then((r) => setP(r.data))
      .catch((e) => setErr(e.response?.data?.detail || "Not found"));
  }, [id]);

  if (err) return <div className="max-w-[1400px] mx-auto px-4 lg:px-8 py-14 text-[color:var(--mb-danger)]">{err}</div>;
  if (!p) return <div className="max-w-[1400px] mx-auto px-4 lg:px-8 py-14 text-[color:var(--mb-muted-fg)]">Loading…</div>;

  const title = lang === "hi" && p.title_hi ? p.title_hi : p.title;
  const desc = lang === "hi" && p.description_hi ? p.description_hi : p.description;
  const imgs = (p.images && p.images.length ? p.images : [
    "https://images.unsplash.com/photo-1717585679395-bbe39b5fb6bc?w=800&auto=format"
  ]);
  const img = imgs[active] || imgs[0];

  const whatsappHref = () => {
    const msg = encodeURIComponent(`Order request: ${p.title} (₹${p.price}) — pincode ${pin}`);
    return `https://wa.me/${(p.whatsapp || "919999900001").replace(/\D/g, "")}?text=${msg}`;
  };
  const upiHref = () =>
    `upi://pay?pa=${p.upi_id || "merabazaar@upi"}&pn=MeraBazaar&am=${p.price}&cu=INR&tn=${encodeURIComponent(p.title)}`;

  return (
    <div className="max-w-[1400px] mx-auto px-4 lg:px-8 py-8 grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Left gallery */}
      <div className="lg:col-span-5">
        <div className="sticky top-28 space-y-3">
          <div className="mb-card p-3 overflow-hidden">
            <div className="aspect-square bg-[color:var(--mb-muted)] rounded-xl overflow-hidden">
              <img src={img} alt={title} className="w-full h-full object-cover" />
            </div>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {imgs.slice(0, 4).map((s, i) => (
              <button key={i}
                      onClick={() => setActive(i)}
                      className={`aspect-square rounded-xl overflow-hidden border-2 transition-all ${
                        i === active ? "border-[color:var(--mb-primary)]" : "border-[color:var(--mb-border)] opacity-70 hover:opacity-100"
                      }`}>
                <img src={s} alt="thumb" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Center */}
      <div className="lg:col-span-5">
        <div className="mb-card p-6 md:p-8">
          <div className="text-[11px] uppercase tracking-[0.2em] font-bold text-[color:var(--mb-accent)]">
            {p.category}
          </div>
          <h1 className="mb-serif text-[30px] md:text-[38px] font-semibold leading-tight mt-2"
              data-testid={TID.productTitle}
              style={{ fontFamily: lang === "hi" ? "'Noto Serif Devanagari','Cormorant Garamond',serif" : undefined }}>
            {title}
          </h1>

          <div className="mt-3 flex flex-wrap gap-2">
            {p.seller_verified && <TrustRibbon kind="identity" />}
            {p.gov_verified && <TrustRibbon kind="gov" />}
          </div>

          <div className="mt-4 flex items-center gap-2">
            <div className="mb-stars flex items-center gap-0.5">
              {[1,2,3,4,5].map(n => (
                <Star key={n} size={16} strokeWidth={0}
                      fill={n <= Math.round(p.trust_score || 4.5) ? "#D97925" : "#E8E2D9"} />
              ))}
            </div>
            <span className="text-[13px] text-[color:var(--mb-muted-fg)]">
              {t("trust_score")}: <span className="text-[color:var(--mb-fg)] font-semibold">{(p.trust_score || 4.5).toFixed(1)}</span>
            </span>
          </div>

          <hr className="my-6 border-[color:var(--mb-border)]" />

          <div className="flex items-baseline gap-3">
            <div className="mb-price text-[38px]" data-testid={TID.productPrice}
                 style={{ color: "var(--mb-fg)" }}>
              <span className="rupee">₹</span>{Number(p.price).toLocaleString("en-IN")}
            </div>
            <span className="text-[14px] text-[color:var(--mb-muted-fg)]">/ {p.unit}</span>
          </div>
          <div className="text-[12px] text-[color:var(--mb-muted-fg)] mt-1">
            {t("price_unit")}: ₹{p.price} · {p.unit}
          </div>

          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <a href={whatsappHref()} target="_blank" rel="noreferrer"
               className="mb-btn mb-btn-primary" data-testid={TID.productBuyWhatsapp}>
              <MessageCircle size={16} strokeWidth={1.75} /> {t("buy_on_whatsapp")}
            </a>
            <a href={upiHref()}
               className="mb-btn mb-btn-secondary" data-testid={TID.productPayUpi}>
              <Zap size={16} strokeWidth={1.75} /> {t("pay_via_upi")}
            </a>
          </div>

          <div className="mt-6 p-4 rounded-2xl border border-[color:var(--mb-border)] bg-[color:var(--mb-muted)]/50">
            <div className="flex items-center gap-2 text-[13px] font-medium">
              <MapPin size={14} strokeWidth={1.5} className="text-[color:var(--mb-primary)]" />
              <span>{t("delivery_by")}</span>
              <input value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
                     className="border border-[color:var(--mb-border)] rounded-lg px-3 py-1 w-24 text-[13px] bg-white"
                     data-testid={TID.productPincodeInput} />
            </div>
            <div className="mt-2 flex items-center gap-2 text-[13px] text-[color:var(--mb-accent)] font-medium">
              <Truck size={14} strokeWidth={1.5} /> {t("free_delivery")} · {p.pincode}
            </div>
            <div className="mt-1 text-[13px] font-semibold"
                 style={{ color: p.stock > 0 ? "var(--mb-accent)" : "var(--mb-danger)" }}>
              {p.stock > 0 ? `${t("stock")} (${p.stock})` : t("out_of_stock")}
            </div>
          </div>

          <hr className="my-6 border-[color:var(--mb-border)]" />
          <p className="text-[15px] leading-relaxed text-[color:var(--mb-fg)]"
             style={{ fontFamily: lang === "hi" ? "'Noto Sans Devanagari',Manrope,sans-serif" : undefined }}>
            {desc}
          </p>
        </div>
      </div>

      {/* Right sidebar — Seller Trust */}
      <div className="lg:col-span-2">
        <div className="mb-card p-5 sticky top-28">
          <div className="text-[11px] uppercase tracking-[0.18em] font-bold text-[color:var(--mb-muted-fg)]">
            {t("seller_trust")}
          </div>
          <div className="mt-3 flex items-center gap-3">
            <div className="w-11 h-11 rounded-full flex items-center justify-center text-white font-bold"
                 style={{ background: "linear-gradient(135deg,#C2533A,#D97925)" }}>
              {(p.seller_name || "M")[0]}
            </div>
            <div>
              <div className="mb-serif text-[18px] font-semibold leading-tight">{p.seller_name}</div>
              <div className="text-[12px] text-[color:var(--mb-muted-fg)]">
                {(p.trust_score || 4.5).toFixed(1)}/5 · {t("verified_by_mb")}
              </div>
            </div>
          </div>
          <div className="mt-4 flex flex-col gap-2">
            {p.seller_verified && <TrustRibbon kind="identity" />}
            {p.gov_verified && <TrustRibbon kind="gov" />}
          </div>
          <div className="mt-4 pt-4 border-t border-[color:var(--mb-border)] text-[12px] text-[color:var(--mb-muted-fg)] flex items-center gap-2">
            <ShieldCheck size={14} strokeWidth={1.5} className="text-[color:var(--mb-accent)]" />
            {t("verified_by_mb")}
          </div>
        </div>
      </div>
    </div>
  );
}
