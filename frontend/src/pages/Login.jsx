import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth, formatApiErrorDetail } from "@/context/AuthContext";
import { useI18n } from "@/i18n";
import { TID } from "@/constants/testIds";
import { LogIn } from "lucide-react";

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
    <div className="max-w-[440px] mx-auto px-4 py-12">
      <div className="text-center mb-6">
        <div className="mb-wordmark mb-serif" style={{ fontSize: 40 }}>
          Mera<span className="dot" /><span className="accent">Bazaar</span>
        </div>
        <div className="text-[12px] mt-1 uppercase tracking-[0.2em] text-[color:var(--mb-muted-fg)]">
          {t("tagline")}
        </div>
      </div>
      <div className="mb-card p-8">
        <h1 className="mb-serif text-[30px] font-semibold mb-1">{t("sign_in")}</h1>
        <p className="text-[13px] text-[color:var(--mb-muted-fg)] mb-6">
          {t("hello_sign_in")}
        </p>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="block text-[12px] font-semibold uppercase tracking-wider text-[color:var(--mb-muted-fg)] mb-1.5" htmlFor="email">
              {t("email")}
            </label>
            <input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                   className="w-full border border-[color:var(--mb-border)] rounded-xl px-4 py-3 bg-[color:var(--mb-bg)] focus:bg-white transition-colors"
                   data-testid={TID.loginEmail} />
          </div>
          <div>
            <label className="block text-[12px] font-semibold uppercase tracking-wider text-[color:var(--mb-muted-fg)] mb-1.5" htmlFor="pw">
              {t("password")}
            </label>
            <input id="pw" type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
                   className="w-full border border-[color:var(--mb-border)] rounded-xl px-4 py-3 bg-[color:var(--mb-bg)] focus:bg-white transition-colors"
                   data-testid={TID.loginPassword} />
          </div>
          {error && (
            <div className="text-[13px] text-[color:var(--mb-danger)] bg-[color:var(--mb-danger)]/10 border border-[color:var(--mb-danger)]/25 px-3 py-2 rounded-lg">
              {error}
            </div>
          )}
          <button type="submit" disabled={loading}
                  className="mb-btn mb-btn-primary w-full !py-3" data-testid={TID.loginSubmit}>
            <LogIn size={16} strokeWidth={1.75} />
            {loading ? "…" : t("sign_in")}
          </button>
        </form>
        <p className="text-[12px] text-[color:var(--mb-muted-fg)] mt-5 leading-relaxed">
          By continuing, you agree to MeraBazaar&apos;s Conditions of Use and Privacy Notice.
        </p>
      </div>
      <div className="mt-6 flex items-center gap-3">
        <div className="flex-1 h-px bg-[color:var(--mb-border)]" />
        <div className="text-[12px] text-[color:var(--mb-muted-fg)] uppercase tracking-wider">{t("new_to_mera")}</div>
        <div className="flex-1 h-px bg-[color:var(--mb-border)]" />
      </div>
      <Link to="/register" className="mb-btn mb-btn-outline w-full mt-4">
        {t("create_account")}
      </Link>
    </div>
  );
}
