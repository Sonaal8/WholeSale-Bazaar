import { Link } from "react-router-dom";
import { useI18n } from "@/i18n";
import { TID } from "@/constants/testIds";
import { TrustRibbon } from "./TrustRibbon";

function Stars({ score = 4.5 }) {
  const full = Math.floor(score);
  const half = score - full >= 0.5;
  const total = 5;
  return (
    <span className="mb-stars" aria-label={`${score} out of 5`}>
      {"★".repeat(full)}
      {half ? "☆" : ""}
      {"☆".repeat(total - full - (half ? 1 : 0))}
      <span className="text-[12px] text-[color:var(--mb-link)] ml-1">{score.toFixed(1)}</span>
    </span>
  );
}

export function ProductCard({ p }) {
  const { t, lang } = useI18n();
  const title = lang === "hi" && p.title_hi ? p.title_hi : p.title;
  const img = p.images?.[0] || "https://placehold.co/400x400/EAEDED/565959?text=MB";
  return (
    <div className="mb-product-card mb-fadeup" data-testid={TID.productCard(p.id)}>
      <Link to={`/product/${p.id}`} className="block hover:no-underline">
        <div className="aspect-square bg-white flex items-center justify-center overflow-hidden rounded">
          <img src={img} alt={title} className="w-full h-full object-cover transition-transform duration-300 hover:scale-[1.03]" />
        </div>
        <h3 className="mb-product-title mt-3">{title}</h3>
      </Link>
      <div className="mt-1"><Stars score={p.trust_score || 4.5} /></div>
      <div className="mt-1 flex flex-wrap gap-1">
        {p.seller_verified && <TrustRibbon kind="identity" />}
        {p.gov_verified && <TrustRibbon kind="gov" />}
      </div>
      <div className="mt-2 mb-price">
        <span className="rupee">₹</span>{Number(p.price).toLocaleString("en-IN")}
        <span className="text-[12px] text-[color:var(--mb-text-muted)] font-normal ml-1">/ {p.unit}</span>
      </div>
      <div className="text-[13px] text-[color:var(--mb-text)] mt-0.5">
        <span className="text-[color:var(--mb-text)]">{t("free_delivery")}</span>
        <span className="text-[color:var(--mb-text-muted)]"> · {p.pincode}</span>
      </div>
      <button
        className="mb-btn mb-btn-primary mt-3 w-full"
        data-testid={TID.productAddEnquiry(p.id)}
        onClick={(e) => {
          e.preventDefault();
          const msg = encodeURIComponent(`Enquiry: ${p.title} (₹${p.price}) — pincode ${p.pincode}`);
          window.open(`https://wa.me/${(p.whatsapp || "919999900001").replace(/\D/g, "")}?text=${msg}`, "_blank");
        }}
      >
        {t("add_to_enquiry")}
      </button>
    </div>
  );
}
