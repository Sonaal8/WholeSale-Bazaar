import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { api } from "@/context/AuthContext";
import { ProductCard } from "@/components/mera/ProductCard";
import { TrustRibbon } from "@/components/mera/TrustRibbon";
import { useI18n } from "@/i18n";
import { TID } from "@/constants/testIds";
import { ShieldCheck, Award, BadgeCheck } from "lucide-react";

const BANNERS = [
  {
    tag: "handloom",
    color: "#232F3E",
    heading: { en: "Handloom, handmade, hand-verified.", hi: "हैंडलूम, हस्तनिर्मित, हस्त-सत्यापित।" },
    sub:     { en: "Every seller Aadhaar & GSTIN checked.", hi: "हर विक्रेता आधार व GSTIN सत्यापित।" },
    img: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=1600&auto=format",
  },
  {
    tag: "kirana",
    color: "#131921",
    heading: { en: "Fresh kirana, near your pincode.", hi: "ताज़ा किराना, आपके पिनकोड के पास।" },
    sub:     { en: "FSSAI verified sellers only.", hi: "केवल FSSAI सत्यापित विक्रेता।" },
    img: "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=1600&auto=format",
  },
  {
    tag: "handicrafts",
    color: "#4A2C0D",
    heading: { en: "Handicrafts you can trust.", hi: "भरोसे की हस्तशिल्प।" },
    sub:     { en: "Direct from India's artisans.", hi: "सीधे भारत के कारीगरों से।" },
    img: "https://images.unsplash.com/photo-1604608672516-f1b9b1d0f4b8?w=1600&auto=format",
  },
];

function HeroCarousel() {
  const { lang, t } = useI18n();
  const [i, setI] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setI((v) => (v + 1) % BANNERS.length), 5000);
    return () => clearInterval(id);
  }, []);
  const b = BANNERS[i];
  return (
    <section className="relative overflow-hidden" style={{ background: b.color }}>
      <div className="absolute inset-0 opacity-40" style={{
        backgroundImage: `linear-gradient(to top, ${b.color} 0%, transparent 40%), url(${b.img})`,
        backgroundSize: "cover", backgroundPosition: "center",
      }} />
      <div className="relative max-w-[1500px] mx-auto px-6 py-14 md:py-20 text-white mb-fadeup">
        <div className="text-[13px] text-[#FF9900] font-semibold tracking-wider uppercase">
          MeraBazaar · {t("tagline")}
        </div>
        <h1 className="mt-3 text-3xl md:text-5xl font-bold max-w-2xl leading-tight">
          {b.heading[lang]}
        </h1>
        <p className="mt-3 text-[15px] md:text-lg text-[#DDD] max-w-xl">{b.sub[lang]}</p>
        <a href="#grid" data-testid={TID.homeHeroCta}
           className="mb-btn mb-btn-primary mt-6 !px-5 !py-2.5 !text-[14px] font-medium">
          {t("verified_sellers")} →
        </a>
        <div className="mt-4 flex gap-2">
          {BANNERS.map((_, k) => (
            <span key={k} className={`h-1 w-8 rounded ${k === i ? "bg-[#FF9900]" : "bg-white/30"}`} />
          ))}
        </div>
      </div>
    </section>
  );
}

function VerifiedRibbonRow() {
  const { t } = useI18n();
  const items = [
    { icon: ShieldCheck, label: t("identity_verified") },
    { icon: BadgeCheck,  label: t("gov_verified") },
    { icon: Award,       label: t("verified_by_mb") },
  ];
  return (
    <div className="max-w-[1500px] mx-auto px-4 -mt-6 relative z-10">
      <div className="mb-card px-4 py-3 flex flex-wrap items-center gap-3 md:gap-6 shadow-sm">
        <span className="text-[12px] font-bold tracking-widest text-[color:var(--mb-text-muted)]">
          MERABAZAAR VERIFIED
        </span>
        <div className="flex flex-wrap gap-3 items-center">
          {items.map(({ icon: Icon, label }) => (
            <div key={label} className="flex items-center gap-2 text-[13px] text-[color:var(--mb-text)]">
              <Icon size={16} className="text-[color:var(--mb-success)]" />
              {label}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const { t } = useI18n();
  const [sp, setSp] = useSearchParams();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pincode, setPincode] = useState(sp.get("pincode") || localStorage.getItem("mb.pincode") || "");
  const category = sp.get("category") || "All";
  const q = sp.get("q") || "";

  const params = useMemo(() => {
    const p = {};
    if (pincode) p.pincode = pincode;
    if (category && category !== "All") p.category = category;
    if (q) p.q = q;
    return p;
  }, [pincode, category, q]);

  useEffect(() => {
    let ok = true;
    setLoading(true);
    api.get("/listings", { params }).then((r) => { if (ok) setItems(r.data); })
      .finally(() => ok && setLoading(false));
    return () => { ok = false; };
  }, [params]);

  const apply = () => {
    const next = new URLSearchParams(sp);
    if (pincode) next.set("pincode", pincode); else next.delete("pincode");
    localStorage.setItem("mb.pincode", pincode || "");
    setSp(next);
  };

  return (
    <>
      <HeroCarousel />
      <VerifiedRibbonRow />

      <section id="grid" className="max-w-[1500px] mx-auto px-4 mt-8">
        <div className="mb-card p-4 flex flex-wrap items-end gap-3">
          <div>
            <label className="text-[12px] text-[color:var(--mb-text-muted)] block mb-1">
              {t("near_pincode")}
            </label>
            <input
              value={pincode}
              onChange={(e) => setPincode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="110001"
              className="border border-[#D5D9D9] rounded px-3 py-2 text-[14px] w-32 bg-white"
              data-testid={TID.homePincodeInput}
            />
          </div>
          <button className="mb-btn mb-btn-primary" onClick={apply} data-testid={TID.homePincodeApply}>
            {t("apply")}
          </button>
          <div className="ml-auto text-[13px] text-[color:var(--mb-text-muted)]">
            {loading ? "Loading…" : `${items.length} ${category === "All" ? "results" : category}`}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
          {items.map((p) => <ProductCard key={p.id} p={p} />)}
        </div>

        {!loading && items.length === 0 && (
          <div className="mb-card p-8 text-center text-[color:var(--mb-text-muted)] mt-4">
            No listings found near this pincode. Try clearing filters.
          </div>
        )}
      </section>
    </>
  );
}
