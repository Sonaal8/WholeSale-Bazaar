import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, useAuth } from "@/context/AuthContext";
import { TrustRibbon } from "@/components/mera/TrustRibbon";
import { useI18n } from "@/i18n";
import { TID } from "@/constants/testIds";
import { PlusCircle, ShieldCheck, TrendingUp, Package, Activity } from "lucide-react";

function StatCard({ icon: Icon, label, value, tone = "var(--mb-primary)" }) {
  return (
    <div className="mb-card p-5 flex items-center gap-4">
      <div className="w-11 h-11 rounded-full flex items-center justify-center" style={{ background: `${tone}18` }}>
        <Icon size={20} strokeWidth={1.5} style={{ color: tone }} />
      </div>
      <div>
        <div className="text-[11px] uppercase tracking-wider text-[color:var(--mb-muted-fg)] font-semibold">{label}</div>
        <div className="mb-serif text-[24px] font-semibold leading-tight">{value}</div>
      </div>
    </div>
  );
}

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
  const active = listings.filter(l => l.stock > 0).length;

  return (
    <div className="max-w-[1400px] mx-auto px-4 lg:px-8 py-8 space-y-6">
      {/* Header banner */}
      <div className="mb-card p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
           style={{ background: "linear-gradient(135deg, #FAFAF5 0%, #F3EFEA 100%)" }}>
        <div>
          <div className="text-[11px] uppercase tracking-[0.2em] font-bold text-[color:var(--mb-muted-fg)]">
            {t("seller_dashboard")}
          </div>
          <h1 className="mb-serif text-[36px] md:text-[44px] font-semibold leading-none mt-1">
            <span className="text-[color:var(--mb-muted-fg)] italic font-normal">Namaste,</span> {user.name}
          </h1>
          <div className="mt-3 flex flex-wrap gap-2">
            {user.identity_verified && <TrustRibbon kind="identity" />}
            {user.gov_verified && <TrustRibbon kind="gov" />}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link to="/seller/create" className="mb-btn mb-btn-primary" data-testid={TID.sellerCreateLink}>
            <PlusCircle size={16} strokeWidth={1.75} /> {t("create_listing")}
          </Link>
          <Link to="/seller/verify" className="mb-btn mb-btn-outline" data-testid={TID.sellerVerifyLink}>
            <ShieldCheck size={16} strokeWidth={1.75} /> {t("verify_wizard")}
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard icon={Package} label="Total listings" value={listings.length} tone="var(--mb-primary)" />
        <StatCard icon={TrendingUp} label="Active" value={active} tone="var(--mb-accent)" />
        <StatCard icon={ShieldCheck} label="Trust score" value={(user.trust_score || 4.5).toFixed(1)} tone="var(--mb-secondary)" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="mb-card p-6 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="mb-serif text-[24px] font-semibold">{t("my_listings")}</h2>
            <Link to="/seller/create" className="text-[13px] text-[color:var(--mb-primary)] font-semibold hover:underline">
              + {t("create_listing")}
            </Link>
          </div>
          {listings.length === 0 && (
            <div className="text-center py-10 border border-dashed border-[color:var(--mb-border)] rounded-xl text-[color:var(--mb-muted-fg)]">
              <Package size={36} strokeWidth={1.25} className="mx-auto mb-2 text-[color:var(--mb-muted-fg)]" />
              <div>No listings yet.</div>
              <Link to="/seller/create" className="text-[color:var(--mb-primary)] font-medium hover:underline text-[13px]">
                {t("create_listing")}
              </Link>
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {listings.map((l) => (
              <Link key={l.id} to={`/product/${l.id}`}
                    className="flex gap-3 p-3 rounded-xl border border-[color:var(--mb-border)] hover:border-[color:var(--mb-primary)] hover:shadow-md transition-all bg-white hover:no-underline">
                <img src={l.images?.[0] || "https://placehold.co/80x80/F3EFEA/7A7067?text=MB"}
                     alt={l.title} className="w-16 h-16 rounded-lg object-cover" />
                <div className="flex-1 min-w-0">
                  <div className="text-[14px] font-semibold truncate text-[color:var(--mb-fg)]">{l.title}</div>
                  <div className="mb-price text-[16px] mt-1"><span className="rupee">₹</span>{l.price}</div>
                  <div className="text-[11px] uppercase tracking-wider text-[color:var(--mb-accent)] font-semibold mt-1">
                    {l.category} · {l.pincode}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        <div className="mb-card p-6 h-fit">
          <div className="flex items-center gap-2 mb-4">
            <Activity size={16} strokeWidth={1.5} className="text-[color:var(--mb-primary)]" />
            <h3 className="mb-serif text-[20px] font-semibold">Activity</h3>
          </div>
          <ul className="space-y-3 text-[13px]">
            {activity.length === 0 && <li className="text-[color:var(--mb-muted-fg)]">No activity yet.</li>}
            {activity.slice(0, 12).map((a) => (
              <li key={a.id} className="flex items-start gap-2 pb-3 border-b border-[color:var(--mb-border)] last:border-0">
                <span className="w-1.5 h-1.5 rounded-full mt-2 bg-[color:var(--mb-accent)]" />
                <div>
                  <div className="font-semibold text-[color:var(--mb-fg)]">{a.action}</div>
                  <div className="text-[11px] text-[color:var(--mb-muted-fg)] mt-0.5">
                    {new Date(a.created_at).toLocaleString()}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
