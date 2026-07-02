import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, useAuth } from "@/context/AuthContext";
import { TrustRibbon } from "@/components/mera/TrustRibbon";
import { useI18n } from "@/i18n";
import { TID } from "@/constants/testIds";
import { PlusCircle, ShieldCheck } from "lucide-react";

export default function SellerDashboard() {
  const { t } = useI18n();
  const { user } = useAuth();
  const [listings, setListings] = useState([]);
  const [activity, setActivity] = useState([]);

  useEffect(() => {
    api.get("/seller/listings").then((r) => setListings(r.data)).catch(() => {});
    api.get("/activity").then((r) => setActivity(r.data)).catch(() => {});
  }, []);

  if (!user) return null;

  return (
    <div className="max-w-[1500px] mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-3 gap-4">
      <div className="lg:col-span-2 space-y-4">
        <div className="mb-card p-5">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <div className="text-[13px] text-[color:var(--mb-text-muted)]">{t("seller_dashboard")}</div>
              <h1 className="text-[22px] font-medium">Hello, {user.name}</h1>
            </div>
            <div className="flex gap-2">
              <Link to="/seller/create" className="mb-btn mb-btn-primary"
                    data-testid={TID.sellerCreateLink}>
                <PlusCircle size={16} className="mr-1" /> {t("create_listing")}
              </Link>
              <Link to="/seller/verify" className="mb-btn mb-btn-ghost"
                    data-testid={TID.sellerVerifyLink}>
                <ShieldCheck size={16} className="mr-1" /> {t("verify_wizard")}
              </Link>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {user.identity_verified && <TrustRibbon kind="identity" />}
            {user.gov_verified && <TrustRibbon kind="gov" />}
          </div>
        </div>

        <div className="mb-card p-5">
          <h2 className="text-[16px] font-bold mb-3">{t("my_listings")}</h2>
          {listings.length === 0 && (
            <div className="text-[13px] text-[color:var(--mb-text-muted)]">
              No listings yet. <Link to="/seller/create" className="text-[color:var(--mb-link)] hover:underline">
                {t("create_listing")}
              </Link>
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {listings.map((l) => (
              <Link key={l.id} to={`/product/${l.id}`}
                    className="border border-[#E7E9EC] rounded p-3 hover:shadow-md transition-shadow bg-white hover:no-underline">
                <div className="flex gap-3">
                  <img src={l.images?.[0] || "https://placehold.co/80x80/EAEDED/565959?text=MB"}
                       alt={l.title} className="w-16 h-16 rounded object-cover" />
                  <div className="flex-1 min-w-0">
                    <div className="text-[14px] font-medium truncate text-[color:var(--mb-text)]">{l.title}</div>
                    <div className="mb-price text-[16px] mt-1"><span className="rupee">₹</span>{l.price}</div>
                    <div className="text-[12px] text-[color:var(--mb-text-muted)]">{l.category} · {l.pincode}</div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className="mb-card p-5 h-fit">
        <h3 className="text-[14px] font-bold mb-3">Activity log</h3>
        <ul className="space-y-2 text-[13px]">
          {activity.length === 0 && <li className="text-[color:var(--mb-text-muted)]">No activity yet.</li>}
          {activity.map((a) => (
            <li key={a.id} className="border-b border-[#E7E9EC] pb-2 last:border-0">
              <div className="font-medium text-[color:var(--mb-text)]">{a.action}</div>
              <div className="text-[11px] text-[color:var(--mb-text-muted)]">{a.created_at}</div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
