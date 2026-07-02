import { Link, useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import { MapPin, Search, ChevronDown, ShoppingCart, User, Languages, Type } from "lucide-react";
import { useI18n } from "@/i18n";
import { useAuth } from "@/context/AuthContext";
import { TID } from "@/constants/testIds";

const CATS = ["All", "Food", "Kirana", "Handicrafts", "Handloom", "Services", "Verified Sellers"];

function Wordmark() {
  return (
    <span className="mb-logo text-[26px] leading-none select-none">
      Mera<span style={{ color: "#FF9900" }}>Bazaar</span>
      <span className="smile" />
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

  const search = (e) => {
    e?.preventDefault();
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (pincode) params.set("pincode", pincode);
    nav(`/?${params.toString()}`);
  };

  const savePincode = (v) => {
    setPincode(v);
    localStorage.setItem("mb.pincode", v);
  };

  const isCatActive = (c) => {
    const sp = new URLSearchParams(loc.search);
    const cur = sp.get("category") || "All";
    return cur === c;
  };

  return (
    <header className="w-full">
      {/* Top navy bar */}
      <div className="w-full" style={{ background: "#131921" }}>
        <div className="max-w-[1500px] mx-auto flex items-center gap-2 px-3 py-2 text-white">
          <Link to="/" className="p-1 rounded hover:outline hover:outline-1 hover:outline-white shrink-0"
                data-testid={TID.logoLink} aria-label="MeraBazaar home">
            <Wordmark />
            <div className="text-[10px] text-[#cfd6dc] mt-1 leading-none pl-1 hidden sm:block">
              {t("tagline")}
            </div>
          </Link>

          {/* Deliver-to pill */}
          <button
            className="mb-pill hidden md:inline-flex"
            data-testid={TID.headerDeliverPill}
            onClick={() => {
              const v = prompt(`${t("deliver_to")} (pincode):`, pincode);
              if (v && /^\d{6}$/.test(v)) savePincode(v);
            }}
          >
            <span className="top flex items-center gap-1"><MapPin size={12} /> {t("deliver_to")}</span>
            <span className="bot">{pincode}</span>
          </button>

          {/* Search */}
          <form onSubmit={search} className="mb-search flex-1 mx-2">
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
            <button type="submit" data-testid={TID.headerSearchSubmit} aria-label="Search">
              <Search size={20} />
            </button>
          </form>

          {/* Right pills */}
          <button className="mb-pill" onClick={toggleLang} data-testid={TID.headerLangToggle}
                  aria-label="Toggle language">
            <span className="top flex items-center gap-1"><Languages size={12} /> {lang === "en" ? "EN" : "हि"}</span>
            <span className="bot">{lang === "en" ? t("hindi") : t("english")}</span>
          </button>
          <button className="mb-pill" onClick={toggleBig} data-testid={TID.headerBigTextToggle}
                  aria-label="Toggle bigger text">
            <span className="top flex items-center gap-1"><Type size={12} /> A11y</span>
            <span className="bot">{big ? t("normal_text") : t("big_text")}</span>
          </button>

          {user ? (
            <>
              <Link to={user.role === "seller" || user.role === "admin" ? "/seller" : "/"}
                    className="mb-pill" data-testid={TID.headerAccountPill}>
                <span className="top">Hello, {user.name?.split(" ")[0]}</span>
                <span className="bot flex items-center gap-1"><User size={14} /> {t("account_lists")}</span>
              </Link>
              <button className="mb-pill" onClick={logout} data-testid={TID.headerSignoutBtn}>
                <span className="top">{t("logout")}</span>
                <span className="bot">↩</span>
              </button>
            </>
          ) : (
            <Link to="/login" className="mb-pill" data-testid={TID.headerAccountPill}>
              <span className="top">{t("hello_sign_in")}</span>
              <span className="bot flex items-center gap-1">{t("account_lists")} <ChevronDown size={12} /></span>
            </Link>
          )}
          <Link to="/" className="mb-pill" data-testid={TID.headerCartPill}>
            <span className="top">0</span>
            <span className="bot flex items-center gap-1"><ShoppingCart size={16} /> {t("cart")}</span>
          </Link>
        </div>
      </div>

      {/* Secondary nav strip */}
      <div style={{ background: "#232F3E" }}>
        <div className="max-w-[1500px] mx-auto px-3 py-1 flex items-center gap-1 overflow-x-auto">
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
                    className={`mb-cat-link ${isCatActive(c) ? "active" : ""}`}
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
