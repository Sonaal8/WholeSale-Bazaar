import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { api } from "@/context/AuthContext";
import { TrustRibbon } from "@/components/mera/TrustRibbon";
import { useI18n } from "@/i18n";
import { TID } from "@/constants/testIds";
import { ShieldCheck, Truck, MapPin } from "lucide-react";

export default function ProductDetail() {
  const { id } = useParams();
  const { t, lang } = useI18n();
  const [p, setP] = useState(null);
  const [pin, setPin] = useState(localStorage.getItem("mb.pincode") || "110001");
  const [err, setErr] = useState("");

  useEffect(() => {
    api.get(`/listings/${id}`).then((r) => setP(r.data)).catch((e) => setErr(e.response?.data?.detail || "Not found"));
  }, [id]);

  if (err) return <div className="max-w-[1500px] mx-auto px-4 py-10 text-[color:var(--mb-danger)]">{err}</div>;
  if (!p) return <div className="max-w-[1500px] mx-auto px-4 py-10 text-[color:var(--mb-text-muted)]">Loading…</div>;

  const title = lang === "hi" && p.title_hi ? p.title_hi : p.title;
  const desc = lang === "hi" && p.description_hi ? p.description_hi : p.description;
  const img = p.images?.[0] || "https://placehold.co/600x600/EAEDED/565959?text=MB";

  const whatsappHref = () => {
    const msg = encodeURIComponent(`Order request: ${p.title} (₹${p.price}) — pincode ${pin}`);
    return `https://wa.me/${(p.whatsapp || "919999900001").replace(/\D/g, "")}?text=${msg}`;
  };
  const upiHref = () =>
    `upi://pay?pa=${p.upi_id || "merabazaar@upi"}&pn=MeraBazaar&am=${p.price}&cu=INR&tn=${encodeURIComponent(p.title)}`;

  return (
    <div className="max-w-[1500px] mx-auto px-4 py-4 grid grid-cols-1 lg:grid-cols-12 gap-4">
      {/* Left gallery */}
      <div className="lg:col-span-5">
        <div className="mb-card p-3 sticky top-4">
          <div className="aspect-square bg-white flex items-center justify-center rounded overflow-hidden">
            <img src={img} alt={title} className="w-full h-full object-cover" />
          </div>
          <div className="mt-3 grid grid-cols-4 gap-2">
            {(p.images && p.images.length ? p.images : [img]).slice(0, 4).map((s, i) => (
              <div key={i} className="aspect-square rounded overflow-hidden border border-[#D5D9D9]">
                <img src={s} alt="thumb" className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Center */}
      <div className="lg:col-span-5">
        <div className="mb-card p-4">
          <h1 className="text-[22px] md:text-[26px] leading-tight font-medium text-[color:var(--mb-text)]"
              data-testid={TID.productTitle}>
            {title}
          </h1>
          <div className="mt-2 flex flex-wrap gap-2">
            {p.seller_verified && <TrustRibbon kind="identity" />}
            {p.gov_verified && <TrustRibbon kind="gov" />}
          </div>

          <div className="mt-3 mb-stars text-[16px]">
            {"★★★★★".slice(0, Math.round(p.trust_score || 4.5))}
            <span className="ml-2 text-[color:var(--mb-link)] text-[14px] hover:underline">
              {t("trust_score")}: {(p.trust_score || 4.5).toFixed(1)}
            </span>
          </div>

          <hr className="my-3 border-[#E7E9EC]" />

          <div className="mb-price text-[28px]" data-testid={TID.productPrice}>
            <span className="rupee">₹</span>{Number(p.price).toLocaleString("en-IN")}
            <span className="text-[12px] text-[color:var(--mb-text-muted)] font-normal ml-2">/ {p.unit}</span>
          </div>
          <div className="text-[13px] text-[color:var(--mb-text-muted)]">{t("price_unit")}: ₹{p.price} · {p.unit}</div>

          <div className="mt-4 flex flex-col sm:flex-row gap-2">
            <a href={whatsappHref()} target="_blank" rel="noreferrer"
               className="mb-btn mb-btn-primary flex-1" data-testid={TID.productBuyWhatsapp}>
              {t("buy_on_whatsapp")}
            </a>
            <a href={upiHref()}
               className="mb-btn mb-btn-yellow flex-1" data-testid={TID.productPayUpi}>
              {t("pay_via_upi")}
            </a>
          </div>

          <div className="mt-4 flex items-center gap-2 text-[13px]">
            <MapPin size={14} className="text-[color:var(--mb-link)]" />
            <span className="text-[color:var(--mb-text)]">{t("delivery_by")}</span>
            <input value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
                   className="border border-[#D5D9D9] rounded px-2 py-1 w-24 text-[13px] bg-white"
                   data-testid={TID.productPincodeInput} />
          </div>

          <div className="mt-3 flex items-center gap-2 text-[13px] text-[color:var(--mb-success)]">
            <Truck size={14} /> {t("free_delivery")} · {p.pincode}
          </div>
          <div className="mt-1 text-[13px] font-medium"
               style={{ color: p.stock > 0 ? "var(--mb-success)" : "var(--mb-danger)" }}>
            {p.stock > 0 ? `${t("stock")} (${p.stock})` : t("out_of_stock")}
          </div>

          <hr className="my-4 border-[#E7E9EC]" />
          <p className="text-[14px] leading-relaxed text-[color:var(--mb-text)]">{desc}</p>
        </div>
      </div>

      {/* Right sidebar — Seller Trust */}
      <div className="lg:col-span-2">
        <div className="mb-card p-4 sticky top-4">
          <h3 className="font-bold text-[14px] text-[color:var(--mb-text)]">{t("seller_trust")}</h3>
          <div className="mt-2 text-[14px] text-[color:var(--mb-link)] hover:underline cursor-pointer">
            {p.seller_name}
          </div>
          <div className="mt-1 text-[12px] text-[color:var(--mb-text-muted)]">
            {t("trust_score")}: <span className="text-[color:var(--mb-text)] font-medium">{(p.trust_score || 4.5).toFixed(1)}/5</span>
          </div>
          <div className="mt-3 flex flex-col gap-2">
            {p.seller_verified && <TrustRibbon kind="identity" />}
            {p.gov_verified && <TrustRibbon kind="gov" />}
          </div>
          <div className="mt-3 flex items-center gap-2 text-[12px] text-[color:var(--mb-success)]">
            <ShieldCheck size={14} /> {t("verified_by_mb")}
          </div>
        </div>
      </div>
    </div>
  );
}
