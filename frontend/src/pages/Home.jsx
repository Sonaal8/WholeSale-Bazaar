import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { api } from "@/context/AuthContext";
import { ProductCard } from "@/components/mera/ProductCard";
import { TrustRibbon } from "@/components/mera/TrustRibbon";
import { useI18n } from "@/i18n";
import { TID } from "@/constants/testIds";
import { ShieldCheck, BadgeCheck, Sparkles, ArrowRight, MapPin } from "lucide-react";

const HERO_IMG = "https://images.pexels.com/photos/5504609/pexels-photo-5504609.jpeg?auto=compress&cs=tinysrgb&w=1600";
const SIDE_1 = "https://images.unsplash.com/photo-1640292343595-889db1c8262e?w=800&auto=format";
const SIDE_2 = "https://images.unsplash.com/photo-1678296728930-775d299daaca?w=800&auto=format";

function Hero() {
  const { t, lang } = useI18n();
  const enTitle = "Every seller,";
  const enTitle2 = "hand-verified.";
  const hiTitle = "हर विक्रेता,";
  const hiTitle2 = "हस्त-सत्यापित।";
  return (
    <section className="max-w-[1400px] mx-auto px-4 lg:px-8 pt-8 md:pt-12">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-5">
        {/* Main hero tile */}
        <div className="md:col-span-8 relative rounded-3xl overflow-hidden mb-fadeup"
             style={{ minHeight: 440 }}>
          <img src={HERO_IMG} alt="Colorful spices" className="absolute inset-0 w-full h-full object-cover" />
          <div className="absolute inset-0"
               style={{ background: "linear-gradient(100deg, rgba(44,36,32,0.78) 0%, rgba(44,36,32,0.45) 50%, transparent 100%)" }} />
          <div className="relative h-full p-8 md:p-12 flex flex-col justify-between text-white">
            <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] font-semibold"
                 style={{ color: "#F3EFEA" }}>
              <Sparkles size={14} strokeWidth={1.5} style={{ color: "#D97925" }} />
              MeraBazaar · {t("tagline")}
            </div>
            <div>
              <h1 className="mb-serif text-[42px] md:text-[64px] leading-[0.95] font-semibold max-w-[600px]"
                  style={{ fontFamily: lang === "hi" ? "'Noto Serif Devanagari', 'Cormorant Garamond', serif" : undefined }}>
                {lang === "hi" ? hiTitle : enTitle}
                <br />
                <em className="italic font-medium" style={{ color: "#F0B87D" }}>
                  {lang === "hi" ? hiTitle2 : enTitle2}
                </em>
              </h1>
              <p className="mt-4 text-[15px] md:text-[17px] max-w-[520px]" style={{ color: "rgba(255,255,255,0.85)" }}>
                {lang === "hi"
                  ? "आधार OKYC · FSSAI · GSTIN — केवल भरोसे के विक्रेता, आपके पिनकोड के पास।"
                  : "Aadhaar OKYC · FSSAI · GSTIN — only trusted sellers, near your pincode."}
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <a href="#grid" className="mb-btn mb-btn-primary" data-testid={TID.homeHeroCta}>
                  {t("verified_sellers")} <ArrowRight size={16} strokeWidth={1.75} />
                </a>
                <Link to="/register" className="mb-btn mb-btn-ghost" style={{ background: "rgba(255,255,255,0.15)", borderColor: "rgba(255,255,255,0.35)", color: "#fff" }}>
                  {t("footer_start")}
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Side tiles */}
        <div className="md:col-span-4 flex flex-col gap-4 md:gap-5 mb-fadeup" style={{ animationDelay: "120ms" }}>
          <Link to="/?category=Handloom" className="group relative rounded-3xl overflow-hidden flex-1 min-h-[212px] hover:no-underline"
                data-testid={TID.catLink("handloom-hero")}>
            <img src={SIDE_1} alt="Handloom weaver" className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
            <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, transparent 40%, rgba(44,36,32,0.85))" }} />
            <div className="relative h-full p-6 flex flex-col justify-end text-white">
              <div className="text-[10px] uppercase tracking-[0.18em] font-semibold" style={{ color: "#F0B87D" }}>Featured</div>
              <div className="mb-serif text-[26px] font-semibold mt-1">{t("handloom")}</div>
              <div className="text-[13px] opacity-80">{lang === "hi" ? "बुनकरों से सीधे" : "Direct from weavers"}</div>
            </div>
          </Link>
          <Link to="/?category=Handicrafts" className="group relative rounded-3xl overflow-hidden flex-1 min-h-[212px] hover:no-underline"
                data-testid={TID.catLink("handicrafts-hero")}>
            <img src={SIDE_2} alt="Potter's hands" className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
            <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, transparent 40%, rgba(44,36,32,0.85))" }} />
            <div className="relative h-full p-6 flex flex-col justify-end text-white">
              <div className="text-[10px] uppercase tracking-[0.18em] font-semibold" style={{ color: "#F0B87D" }}>Featured</div>
              <div className="mb-serif text-[26px] font-semibold mt-1">{t("handicrafts")}</div>
              <div className="text-[13px] opacity-80">{lang === "hi" ? "कारीगरों के हाथ का हुनर" : "Made by hand, made to last"}</div>
            </div>
          </Link>
        </div>
      </div>
    </section>
  );
}

function VerifiedStrip() {
  const { t } = useI18n();
  const items = [
    { icon: ShieldCheck, label: t("identity_verified"), tone: "var(--mb-primary)" },
    { icon: BadgeCheck,  label: t("gov_verified"),      tone: "var(--mb-accent)" },
    { icon: Sparkles,    label: t("verified_by_mb"),    tone: "var(--mb-secondary)" },
  ];
  return (
    <div className="max-w-[1400px] mx-auto px-4 lg:px-8 mt-6">
      <div className="mb-card px-5 md:px-8 py-4 flex flex-wrap items-center gap-4 md:gap-8">
        <span className="text-[11px] uppercase tracking-[0.2em] font-bold text-[color:var(--mb-primary)]">
          MeraBazaar Verified
        </span>
        <span className="h-4 w-px bg-[color:var(--mb-border)] hidden md:block" />
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
          {items.map(({ icon: Icon, label, tone }) => (
            <div key={label} className="flex items-center gap-2 text-[13px] text-[color:var(--mb-fg)]">
              <Icon size={16} strokeWidth={1.5} style={{ color: tone }} />
              {label}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const { t, lang } = useI18n();
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
      <Hero />
      <VerifiedStrip />

      <section id="grid" className="max-w-[1400px] mx-auto px-4 lg:px-8 mt-10">
        <div className="flex flex-wrap items-end justify-between gap-4 mb-5">
          <div>
            <div className="text-[11px] uppercase tracking-[0.2em] font-bold text-[color:var(--mb-muted-fg)]">
              {lang === "hi" ? "आज का बाज़ार" : "Today's bazaar"}
            </div>
            <h2 className="mb-serif text-[32px] md:text-[40px] font-semibold leading-none mt-1">
              {category === "All" ? (lang === "hi" ? "सभी सत्यापित उत्पाद" : "Everything, verified") : category}
            </h2>
          </div>
          <div className="mb-card p-1.5 pl-4 flex items-center gap-2">
            <MapPin size={14} strokeWidth={1.5} className="text-[color:var(--mb-muted-fg)]" />
            <span className="text-[11px] uppercase tracking-widest text-[color:var(--mb-muted-fg)]">
              {t("near_pincode")}
            </span>
            <input
              value={pincode}
              onChange={(e) => setPincode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="110001"
              className="border-0 outline-none text-[14px] w-24 bg-transparent font-medium"
              data-testid={TID.homePincodeInput}
            />
            <button className="mb-btn mb-btn-primary !min-h-[34px] !py-1.5" onClick={apply}
                    data-testid={TID.homePincodeApply}>
              {t("apply")}
            </button>
          </div>
        </div>

        <div className="text-[13px] text-[color:var(--mb-muted-fg)] mb-4">
          {loading ? (lang === "hi" ? "लोड हो रहा है…" : "Loading…") : `${items.length} ${lang === "hi" ? "परिणाम" : "results"}`}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-fadeup-stagger">
          {items.map((p) => <ProductCard key={p.id} p={p} />)}
        </div>

        {!loading && items.length === 0 && (
          <div className="mb-card p-10 text-center text-[color:var(--mb-muted-fg)] mt-4">
            <div className="mb-serif text-[22px] text-[color:var(--mb-fg)]">
              {lang === "hi" ? "इस पिनकोड के पास कुछ नहीं मिला" : "Nothing found near this pincode"}
            </div>
            <div className="text-[13px] mt-2">{lang === "hi" ? "फ़िल्टर हटाकर पुनः प्रयास करें।" : "Try clearing filters."}</div>
          </div>
        )}
      </section>
    </>
  );
}
