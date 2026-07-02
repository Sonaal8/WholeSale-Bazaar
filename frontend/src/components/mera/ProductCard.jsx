import { Link } from "react-router-dom";
import { useI18n } from "@/i18n";
import { TID } from "@/constants/testIds";
import { TrustRibbon } from "./TrustRibbon";
import { MessageCircle, MapPin } from "lucide-react";

function Stars({ score = 4.5 }) {
  return (
    <span className="mb-stars flex items-center gap-1" aria-label={`${score} out of 5`}>
      <span>★★★★★</span>
      <span className="text-[12px] text-[color:var(--mb-muted-fg)] font-medium ml-1">
        {score.toFixed(1)}
      </span>
    </span>
  );
}

export function ProductCard({ p }) {
  const { t, lang } = useI18n();
  const title = lang === "hi" && p.title_hi ? p.title_hi : p.title;
  const img = p.images?.[0] || "https://images.unsplash.com/photo-1717585679395-bbe39b5fb6bc?w=600&auto=format";
  return (
    <div className="mb-product-card" data-testid={TID.productCard(p.id)}>
      <Link to={`/product/${p.id}`} className="block hover:no-underline">
        <div className="mb-product-media">
          <img src={img} alt={title} loading="lazy" />
          <div className="absolute top-3 left-3 flex flex-col gap-1.5">
            {p.seller_verified && <TrustRibbon kind="identity" />}
          </div>
        </div>
        <div className="p-4 flex flex-col gap-2">
          <div className="text-[11px] uppercase tracking-[0.12em] font-semibold text-[color:var(--mb-accent)]">
            {p.category}
          </div>
          <h3 className="mb-product-title" style={{ fontFamily: lang === "hi" ? "'Noto Sans Devanagari', Manrope" : undefined }}>
            {title}
          </h3>
          <Stars score={p.trust_score || 4.5} />
          <div className="mt-1 mb-price">
            <span className="rupee">₹</span>{Number(p.price).toLocaleString("en-IN")}
            <span className="text-[12px] text-[color:var(--mb-muted-fg)] font-medium ml-1">/ {p.unit}</span>
          </div>
          <div className="text-[12px] text-[color:var(--mb-muted-fg)] flex items-center gap-1.5">
            <MapPin size={12} strokeWidth={1.5} />
            <span>{t("free_delivery")}</span>
            <span className="text-[color:var(--mb-border)]">·</span>
            <span>{p.pincode}</span>
          </div>
        </div>
      </Link>
      <div className="p-4 pt-0">
        <button
          className="mb-btn mb-btn-primary w-full"
          data-testid={TID.productAddEnquiry(p.id)}
          onClick={(e) => {
            e.preventDefault();
            const msg = encodeURIComponent(`Enquiry: ${p.title} (₹${p.price}) — pincode ${p.pincode}`);
            window.open(`https://wa.me/${(p.whatsapp || "919999900001").replace(/\D/g, "")}?text=${msg}`, "_blank");
          }}
        >
          <MessageCircle size={16} strokeWidth={1.75} />
          {t("add_to_enquiry")}
        </button>
      </div>
    </div>
  );
}
