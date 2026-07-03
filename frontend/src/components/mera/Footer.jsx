import { Link } from "react-router-dom";
import { useI18n } from "@/i18n";

const cols = (t) => [
  { title: t("footer_know_us"), links: [
    { label: t("footer_about"), href: "/" },
    { label: t("footer_careers"), href: "/" },
    { label: t("footer_press"), href: "/" },
  ]},
  { title: t("footer_sell"), links: [
    { label: t("footer_start"), href: "/register" },
    { label: t("footer_seller_hub"), href: "/seller" },
    { label: t("footer_fees"), href: "/" },
  ]},
  { title: t("footer_verification"), links: [
    { label: t("footer_aadhaar"), href: "/seller/verify" },
    { label: t("footer_fssai"), href: "/seller/verify" },
    { label: t("footer_gstin"), href: "/seller/verify" },
  ]},
  { title: t("footer_help"), links: [
    { label: t("footer_contact"), href: "/" },
    { label: t("footer_returns"), href: "/" },
    { label: t("footer_privacy"), href: "/" },
  ]},
];

export default function Footer() {
  const { t } = useI18n();
  return (
    <footer className="mt-24">
      <div style={{ background: "var(--mb-accent-deep)" }} className="text-white">
        <div className="max-w-[1400px] mx-auto grid grid-cols-2 md:grid-cols-4 gap-10 px-6 lg:px-8 py-14">
          {cols(t).map((col) => (
            <div key={col.title}>
              <h4 className="mb-serif text-[20px] mb-4 text-white">{col.title}</h4>
              <ul className="space-y-2.5 text-[14px]" style={{ color: "rgba(243,239,234,0.8)" }}>
                {col.links.map((l) => (
                  <li key={l.label}>
                    <Link to={l.href} className="hover:text-white hover:underline transition-colors"
                          style={{ color: "rgba(243,239,234,0.85)" }}>
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t px-6 lg:px-8" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
          <div className="max-w-[1400px] mx-auto py-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex flex-col items-start gap-1">
              <span className="mb-wordmark mb-serif text-[28px]" style={{ color: "#F3EFEA" }}>
                Mera<span className="dot" style={{ background: "#D97925" }}></span>
                <span style={{ color: "#D97925" }}>Bazaar</span>
              </span>
              <span className="text-[12px] mb-hindi" style={{ color: "rgba(243,239,234,0.6)" }}>{t("tagline")}</span>
            </div>
            <div className="text-[12px]" style={{ color: "rgba(243,239,234,0.55)" }}>{t("copyright")}</div>
          </div>
        </div>
      </div>
    </footer>
  );
}
