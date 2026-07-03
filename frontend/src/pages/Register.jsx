import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth, formatApiErrorDetail } from "@/context/AuthContext";
import { useI18n } from "@/i18n";
import { TID } from "@/constants/testIds";

export default function Register() {
  const { t } = useI18n();
  const { register } = useAuth();
  const nav = useNavigate();
  const [form, setForm] = useState({ email: "", password: "", name: "", phone: "", role: "seller" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      const u = await register(form);
      nav(u.role === "seller" ? "/seller/verify" : "/", { replace: true });
    } catch (err) {
      setError(formatApiErrorDetail(err.response?.data?.detail) || err.message);
    } finally { setLoading(false); }
  };
  const bind = (k) => ({ value: form[k], onChange: (e) => setForm({ ...form, [k]: e.target.value }) });
  const cls = "w-full border border-[color:var(--mb-border)] rounded-xl px-4 py-3 bg-[color:var(--mb-bg)] focus:bg-white transition-colors";
  const lbl = "block text-[12px] font-semibold uppercase tracking-wider text-[color:var(--mb-muted-fg)] mb-1.5";

  return (
    <div className="max-w-[460px] mx-auto px-4 py-12">
      <div className="text-center mb-6">
        <div className="mb-wordmark mb-serif" style={{ fontSize: 40 }}>
          Mera<span className="dot" /><span className="accent">Bazaar</span>
        </div>
        <div className="text-[12px] mt-1 uppercase tracking-[0.2em] text-[color:var(--mb-muted-fg)]">
          {t("tagline")}
        </div>
      </div>
      <div className="mb-card p-8">
        <h1 className="mb-serif text-[30px] font-semibold mb-1">{t("create_account")}</h1>
        <p className="text-[13px] text-[color:var(--mb-muted-fg)] mb-6">
          {t("new_to_mera")}
        </p>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className={lbl}>{t("name")}</label>
            <input required {...bind("name")} className={cls} data-testid={TID.registerName} />
          </div>
          <div>
            <label className={lbl}>{t("email")}</label>
            <input type="email" required {...bind("email")} className={cls} data-testid={TID.registerEmail} />
          </div>
          <div>
            <label className={lbl}>{t("phone")}</label>
            <input {...bind("phone")} placeholder="+91…" className={cls} data-testid={TID.registerPhone} />
          </div>
          <div>
            <label className={lbl}>{t("password")}</label>
            <input type="password" required minLength={6} {...bind("password")} className={cls}
                   data-testid={TID.registerPassword} />
            <div className="text-[11px] text-[color:var(--mb-muted-fg)] mt-1">Passwords must be at least 6 characters.</div>
          </div>
          <div>
            <label className={lbl}>Register as</label>
            <select {...bind("role")} className={cls} data-testid={TID.registerRole}>
              <option value="seller">Seller</option>
              <option value="buyer">Buyer</option>
            </select>
          </div>
          {error && (
            <div className="text-[13px] text-[color:var(--mb-danger)] bg-[color:var(--mb-danger)]/10 border border-[color:var(--mb-danger)]/25 px-3 py-2 rounded-lg">
              {error}
            </div>
          )}
          <button type="submit" disabled={loading}
                  className="mb-btn mb-btn-primary w-full !py-3" data-testid={TID.registerSubmit}>
            {loading ? "…" : t("create_account")}
          </button>
        </form>
      </div>
      <div className="mt-4 text-center text-[13px]">
        <Link to="/login" className="text-[color:var(--mb-primary)] hover:underline">{t("already_customer")}</Link>
      </div>
    </div>
  );
}
