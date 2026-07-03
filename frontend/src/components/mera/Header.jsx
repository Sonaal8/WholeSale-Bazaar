import { Link, useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import { MapPin, Search, ShoppingBag, User, Languages, Type, Menu } from "lucide-react";
import { useI18n } from "@/i18n";
import { useAuth } from "@/context/AuthContext";
import { TID } from "@/constants/testIds";

const CATS = ["All", "Food", "Kirana", "Handicrafts", "Handloom", "Services", "Verified Sellers"];

function Wordmark({ size = 26 }) {
  return (
    <span className="mb-wordmark mb-serif select-none" style={{ fontSize: size }}>
      Mera<span className="dot" />
      <span className="accent">Bazaar</span>
    </span>
  );
}

export default function Header() {
  const { t, lang, toggleLang, big, toggleBig } = useI18n();
  const { user, logout } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();
  const [pincode, setPincode] = useState(localStorage.getItem("mb.pincode") || "110001");
  const [q, setQ] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);

  const search = (e) => {
    e?.preventDefault();
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (pincode) params.set("pincode", pincode);
    nav(`/?${params.toString()}`);
  };
  const savePincode = (v) => { setPincode(v); localStorage.setItem("mb.pincode", v); };
  const isCatActive = (c) => {
    const sp = new URLSearchParams(loc.search);
    const cur = sp.get("category") || "All";
    return cur === c;
  };

  return (
    <header className="w-full sticky top-0 z-40 backdrop-blur-md"
            style={{ background: "rgba(250,250,245,0.92)", borderBottom: "1px solid var(--mb-border)" }}>
      <div className="max-w-[1400px] mx-auto flex items-center gap-3 px-4 lg:px-8 py-3">
        <Link to="/" className="flex flex-col items-start shrink-0" data-testid={TID.logoLink}
              aria-label="MeraBazaar home">
          <Wordmark size={30} />
          <span className="text-[10px] tracking-[0.15em] uppercase text-[color:var(--mb-muted-fg)] mt-0.5 hidden sm:inline">
            My Trusted Bazaar
          </span>
        </Link>

        <button
          className="mb-chip ml-1 hidden md:inline-flex"
          data-testid={TID.headerDeliverPill}
          onClick={() => {
            const v = prompt(`${t("deliver_to")} (pincode):`, pincode);
            if (v && /^\d{6}$/.test(v)) savePincode(v);
          }}
        >
          <MapPin size={14} strokeWidth={1.75} />
          <span className="flex flex-col leading-tight text-left">
            <span className="lbl">{t("deliver_to")}</span>
            <span className="val">{pincode}</span>
          </span>
        </button>

        <form onSubmit={search} className="mb-search flex-1 max-w-2xl mx-1">
          <select aria-label="Category" defaultValue="All">
            {CATS.map((c) => <option key={c}>{c}</option>)}
          </select>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t("search_placeholder")}
            aria-label={t("search_placeholder")}
            data-testid={TID.headerSearchInput}
          />
          <button type="submit" data-testid={TID.headerSearchSubmit}
                  aria-label="Search"
                  className="mb-btn mb-btn-primary !min-h-[36px] !py-2 !px-4">
            <Search size={16} strokeWidth={2} />
          </button>
        </form>

        <div className="hidden lg:flex items-center gap-1">
          <button className="mb-hpill" onClick={toggleLang}
                  data-testid={TID.headerLangToggle} aria-label="Toggle language">
            <span className="top flex items-center gap-1"><Languages size={12} strokeWidth={1.75} /> {lang === "en" ? "EN" : "हि"}</span>
            <span className="bot">{lang === "en" ? t("hindi") : t("english")}</span>
          </button>
          <button className="mb-hpill" onClick={toggleBig}
                  data-testid={TID.headerBigTextToggle} aria-label="Toggle bigger text">
            <span className="top flex items-center gap-1"><Type size={12} strokeWidth={1.75} /> A11y</span>
            <span className="bot">{big ? t("normal_text") : t("big_text")}</span>
          </button>
        </div>

        {user ? (
          <div className="flex items-center gap-1">
            <Link to={user.role === "seller" || user.role === "admin" ? "/seller" : "/"}
                  className="mb-hpill" data-testid={TID.headerAccountPill}>
              <span className="top">Hello, {user.name?.split(" ")[0]}</span>
              <span className="bot flex items-center gap-1"><User size={13} strokeWidth={1.75} /> {t("account_lists")}</span>
            </Link>
            <button className="mb-hpill" onClick={logout} data-testid={TID.headerSignoutBtn}>
              <span className="top">{t("logout")}</span>
              <span className="bot">↩</span>
            </button>
          </div>
        ) : (
          <Link to="/login" className="mb-btn mb-btn-outline hidden sm:inline-flex" data-testid={TID.headerAccountPill}>
            <User size={14} strokeWidth={1.75} /> {t("sign_in")}
          </Link>
        )}
        <Link to="/" className="mb-hpill" data-testid={TID.headerCartPill}>
          <span className="top">0</span>
          <span className="bot flex items-center gap-1"><ShoppingBag size={14} strokeWidth={1.75} /> {t("cart")}</span>
        </Link>
      </div>

      {/* Category strip */}
      <div className="border-t border-[color:var(--mb-border)] bg-[color:var(--mb-bg)]">
        <div className="max-w-[1400px] mx-auto px-4 lg:px-8 flex items-center gap-6 overflow-x-auto">
          {CATS.map((c) => {
            const key = c.toLowerCase().replace(/\s+/g, "-");
            const label =
              c === "All" ? t("all") :
              c === "Food" ? t("food") :
              c === "Kirana" ? t("kirana") :
              c === "Handicrafts" ? t("handicrafts") :
              c === "Handloom" ? t("handloom") :
              c === "Services" ? t("services") :
              t("verified_sellers");
            const params = new URLSearchParams(loc.search);
            if (c === "All") params.delete("category"); else params.set("category", c);
            if (pincode) params.set("pincode", pincode);
            const href = `/?${params.toString()}`;
            return (
              <Link key={c} to={href}
                    className={`mb-cat ${isCatActive(c) ? "active" : ""}`}
                    data-testid={TID.catLink(key)}>
                {label}
              </Link>
            );
          })}
        </div>
      </div>
    </header>
  );
}
