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
    <footer className="mt-16">
      {/* Back to top */}
      <a href="#top" className="block text-center py-3 text-white text-[13px] font-medium hover:brightness-110"
         style={{ background: "#37475A" }}>
        Back to top
      </a>

      <div style={{ background: "#232F3E" }} className="text-white">
        <div className="max-w-[1500px] mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 px-6 py-10">
          {cols(t).map((col) => (
            <div key={col.title}>
              <h4 className="font-bold text-[15px] mb-3 text-white">{col.title}</h4>
              <ul className="space-y-2 text-[13px] text-[#DDD]">
                {col.links.map((l) => (
                  <li key={l.label}>
                    <Link to={l.href} className="text-[#DDD] hover:underline hover:text-white">{l.label}</Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
      <div style={{ background: "#131A22" }} className="text-white">
        <div className="max-w-[1500px] mx-auto px-6 py-6 flex flex-col items-center gap-3">
          <span className="mb-logo text-[22px]">
            Mera<span style={{ color: "#FF9900" }}>Bazaar</span>
            <span className="smile" />
          </span>
          <div className="text-[12px] text-[#CFD6DC]">{t("tagline")}</div>
          <div className="text-[12px] text-[#8B96A2]">{t("copyright")}</div>
        </div>
      </div>
    </footer>
  );
}
