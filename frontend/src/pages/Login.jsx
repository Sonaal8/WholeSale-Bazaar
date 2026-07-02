import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth, formatApiErrorDetail } from "@/context/AuthContext";
import { useI18n } from "@/i18n";
import { TID } from "@/constants/testIds";

export default function Login() {
  const { t } = useI18n();
  const { login } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      const u = await login(email, password);
      const next = loc.state?.from || (u.role === "admin" || u.role === "seller" ? "/seller" : "/");
      nav(next, { replace: true });
    } catch (err) {
      setError(formatApiErrorDetail(err.response?.data?.detail) || err.message);
    } finally { setLoading(false); }
  };

  return (
    <div className="max-w-[420px] mx-auto px-4 py-8">
      <div className="text-center mb-4">
        <span className="mb-logo text-[26px]" style={{ color: "#0F1111" }}>
          Mera<span style={{ color: "#FF9900" }}>Bazaar</span>
          <span className="smile" />
        </span>
      </div>
      <div className="mb-card p-6">
        <h1 className="text-[24px] font-medium mb-4">{t("sign_in")}</h1>
        <form onSubmit={submit} className="space-y-3">
          <div>
            <label className="block text-[13px] font-bold mb-1" htmlFor="email">{t("email")}</label>
            <input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                   className="w-full border border-[#B7BEC5] rounded px-3 py-2 bg-white"
                   data-testid={TID.loginEmail} />
          </div>
          <div>
            <label className="block text-[13px] font-bold mb-1" htmlFor="pw">{t("password")}</label>
            <input id="pw" type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
                   className="w-full border border-[#B7BEC5] rounded px-3 py-2 bg-white"
                   data-testid={TID.loginPassword} />
          </div>
          {error && <div className="text-[13px] text-[color:var(--mb-danger)]">{error}</div>}
          <button type="submit" disabled={loading}
                  className="mb-btn mb-btn-primary w-full" data-testid={TID.loginSubmit}>
            {loading ? "…" : t("sign_in")}
          </button>
        </form>
        <p className="text-[12px] text-[color:var(--mb-text-muted)] mt-4 leading-relaxed">
          By continuing, you agree to MeraBazaar&apos;s Conditions of Use and Privacy Notice.
        </p>
      </div>
      <div className="mt-4 flex items-center gap-3">
        <div className="flex-1 h-px bg-[#D5D9D9]" />
        <div className="text-[12px] text-[color:var(--mb-text-muted)]">{t("new_to_mera")}</div>
        <div className="flex-1 h-px bg-[#D5D9D9]" />
      </div>
      <Link to="/register" className="mb-btn mb-btn-ghost w-full mt-3 block text-center">
        {t("create_account")}
      </Link>
    </div>
  );
}
