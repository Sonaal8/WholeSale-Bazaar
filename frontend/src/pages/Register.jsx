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

  return (
    <div className="max-w-[440px] mx-auto px-4 py-8">
      <div className="text-center mb-4">
        <span className="mb-logo text-[26px]" style={{ color: "#0F1111" }}>
          Mera<span style={{ color: "#FF9900" }}>Bazaar</span>
          <span className="smile" />
        </span>
      </div>
      <div className="mb-card p-6">
        <h1 className="text-[24px] font-medium mb-4">{t("create_account")}</h1>
        <form onSubmit={submit} className="space-y-3">
          <div>
            <label className="block text-[13px] font-bold mb-1">{t("name")}</label>
            <input required {...bind("name")} className="w-full border border-[#B7BEC5] rounded px-3 py-2 bg-white"
                   data-testid={TID.registerName} />
          </div>
          <div>
            <label className="block text-[13px] font-bold mb-1">{t("email")}</label>
            <input type="email" required {...bind("email")}
                   className="w-full border border-[#B7BEC5] rounded px-3 py-2 bg-white"
                   data-testid={TID.registerEmail} />
          </div>
          <div>
            <label className="block text-[13px] font-bold mb-1">{t("phone")}</label>
            <input {...bind("phone")} placeholder="+91…"
                   className="w-full border border-[#B7BEC5] rounded px-3 py-2 bg-white"
                   data-testid={TID.registerPhone} />
          </div>
          <div>
            <label className="block text-[13px] font-bold mb-1">{t("password")}</label>
            <input type="password" required minLength={6} {...bind("password")}
                   className="w-full border border-[#B7BEC5] rounded px-3 py-2 bg-white"
                   data-testid={TID.registerPassword} />
            <div className="text-[11px] text-[color:var(--mb-text-muted)] mt-1">Passwords must be at least 6 characters.</div>
          </div>
          <div>
            <label className="block text-[13px] font-bold mb-1">Register as</label>
            <select {...bind("role")}
                    className="w-full border border-[#B7BEC5] rounded px-3 py-2 bg-white"
                    data-testid={TID.registerRole}>
              <option value="seller">Seller</option>
              <option value="buyer">Buyer</option>
            </select>
          </div>
          {error && <div className="text-[13px] text-[color:var(--mb-danger)]">{error}</div>}
          <button type="submit" disabled={loading}
                  className="mb-btn mb-btn-primary w-full" data-testid={TID.registerSubmit}>
            {loading ? "…" : t("create_account")}
          </button>
        </form>
      </div>
      <div className="mt-3 text-center text-[13px]">
        <Link to="/login" className="text-[color:var(--mb-link)] hover:underline">{t("already_customer")}</Link>
      </div>
    </div>
  );
}
