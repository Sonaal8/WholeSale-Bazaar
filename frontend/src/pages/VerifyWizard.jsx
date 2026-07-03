import { useState } from "react";
import { api, useAuth, formatApiErrorDetail } from "@/context/AuthContext";
import { useI18n } from "@/i18n";
import { TID } from "@/constants/testIds";
import { TrustRibbon } from "@/components/mera/TrustRibbon";
import { ShieldCheck, BadgeCheck, CheckCircle2, FileText } from "lucide-react";

function Step({ n, title, done, current, children }) {
  return (
    <div className={`mb-card p-6 transition-all ${current ? "ring-2 ring-[color:var(--mb-primary)] ring-offset-2 ring-offset-[color:var(--mb-bg)]" : ""}`}>
      <div className="flex items-center gap-3 mb-4">
        <div className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-[14px]"
             style={{ background: done ? "var(--mb-accent)" : "var(--mb-fg)" }}>
          {done ? <CheckCircle2 size={16} strokeWidth={1.75} /> : n}
        </div>
        <h3 className="mb-serif text-[22px] font-semibold">{title}</h3>
        {done && <span className="ml-auto text-[11px] uppercase tracking-wider font-bold text-[color:var(--mb-accent)]">
          Verified
        </span>}
      </div>
      {children}
    </div>
  );
}

export default function VerifyWizard() {
  const { t } = useI18n();
  const { user, refresh } = useAuth();
  const [aadhaar, setAadhaar] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [fssai, setFssai] = useState("");
  const [gstin, setGstin] = useState("");
  const [msg, setMsg] = useState({});
  const [err, setErr] = useState({});

  const call = async (key, fn) => {
    setErr({ ...err, [key]: "" }); setMsg({ ...msg, [key]: "" });
    try {
      const r = await fn();
      setMsg({ ...msg, [key]: r });
      await refresh();
    } catch (e) {
      setErr({ ...err, [key]: formatApiErrorDetail(e.response?.data?.detail) || e.message });
    }
  };

  const inputCls = "flex-1 border border-[color:var(--mb-border)] rounded-xl px-4 py-3 bg-[color:var(--mb-bg)] focus:bg-white transition-colors";

  return (
    <div className="max-w-[820px] mx-auto px-4 py-8 space-y-4">
      <div className="mb-card p-6 md:p-8" style={{ background: "linear-gradient(135deg, #FAFAF5, #F3EFEA)" }}>
        <div className="text-[11px] uppercase tracking-[0.2em] font-bold text-[color:var(--mb-primary)]">
          {t("verify_wizard")}
        </div>
        <h1 className="mb-serif text-[38px] font-semibold leading-tight mt-1">
          Earn your trust seals
        </h1>
        <p className="text-[14px] text-[color:var(--mb-muted-fg)] mt-2 max-w-lg">
          Sellers must complete Aadhaar OKYC plus a government check (FSSAI or GSTIN) to earn the ribbons that buyers look for.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {user?.identity_verified ? <TrustRibbon kind="identity" /> :
            <span className="text-[12px] px-3 py-1.5 rounded-full bg-white border border-[color:var(--mb-border)] text-[color:var(--mb-muted-fg)] uppercase tracking-wider font-semibold">Identity — pending</span>}
          {user?.gov_verified ? <TrustRibbon kind="gov" /> :
            <span className="text-[12px] px-3 py-1.5 rounded-full bg-white border border-[color:var(--mb-border)] text-[color:var(--mb-muted-fg)] uppercase tracking-wider font-semibold">Government — pending</span>}
        </div>
      </div>

      <Step n={1} title="Aadhaar OKYC" done={!!user?.identity_verified} current={!user?.identity_verified}>
        <p className="text-[12px] text-[color:var(--mb-muted-fg)] mb-3">
          Format-only verification. OTP is <span className="font-semibold text-[color:var(--mb-fg)]">123456</span> for this preview.
        </p>
        {!otpSent ? (
          <div className="flex flex-col sm:flex-row gap-2">
            <input value={aadhaar}
                   onChange={(e) => setAadhaar(e.target.value.replace(/\D/g, "").slice(0, 12))}
                   placeholder="12-digit Aadhaar" inputMode="numeric"
                   className={inputCls} data-testid={TID.aadhaarInput} />
            <button className="mb-btn mb-btn-primary" data-testid={TID.aadhaarInitBtn}
                    onClick={() => call("aadhaar", async () => {
                      const { data } = await api.post("/verify/aadhaar/init", { aadhaar_number: aadhaar });
                      setOtpSent(true);
                      return data.message;
                    })}>
              Send OTP
            </button>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row gap-2">
            <input value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                   placeholder="Enter OTP (123456)" className={inputCls} data-testid={TID.aadhaarOtp} />
            <button className="mb-btn mb-btn-primary" data-testid={TID.aadhaarConfirmBtn}
                    onClick={() => call("aadhaar", async () => {
                      await api.post("/verify/aadhaar/confirm", { aadhaar_number: aadhaar, otp });
                      setOtpSent(false); setOtp(""); setAadhaar("");
                      return "Aadhaar verified successfully.";
                    })}>
              Confirm
            </button>
          </div>
        )}
        {msg.aadhaar && <div className="text-[13px] text-[color:var(--mb-accent)] mt-3 font-medium">✓ {msg.aadhaar}</div>}
        {err.aadhaar && <div className="text-[13px] text-[color:var(--mb-danger)] mt-3 font-medium">✗ {err.aadhaar}</div>}
      </Step>

      <Step n={2} title="FSSAI Government Check" done={!!user?.gov_verified} current={!user?.gov_verified}>
        <p className="text-[12px] text-[color:var(--mb-muted-fg)] mb-3">14-digit FSSAI licence for food & kirana sellers.</p>
        <div className="flex flex-col sm:flex-row gap-2">
          <input value={fssai}
                 onChange={(e) => setFssai(e.target.value.replace(/\D/g, "").slice(0, 14))}
                 placeholder="14-digit FSSAI number" className={inputCls} data-testid={TID.fssaiInput} />
          <button className="mb-btn mb-btn-accent" data-testid={TID.fssaiSubmit}
                  onClick={() => call("fssai", async () => {
                    const { data } = await api.post("/verify/fssai", { fssai_number: fssai });
                    return `FSSAI ${data.status}`;
                  })}>
            <BadgeCheck size={16} strokeWidth={1.75} /> Verify FSSAI
          </button>
        </div>
        {msg.fssai && <div className="text-[13px] text-[color:var(--mb-accent)] mt-3 font-medium">✓ {msg.fssai}</div>}
        {err.fssai && <div className="text-[13px] text-[color:var(--mb-danger)] mt-3 font-medium">✗ {err.fssai}</div>}
      </Step>

      <Step n={3} title="GSTIN Government Check" done={!!user?.gov_verified} current={!user?.gov_verified}>
        <p className="text-[12px] text-[color:var(--mb-muted-fg)] mb-3">15-character GSTIN — for all registered businesses.</p>
        <div className="flex flex-col sm:flex-row gap-2">
          <input value={gstin}
                 onChange={(e) => setGstin(e.target.value.toUpperCase().slice(0, 15))}
                 placeholder="e.g. 27ABCDE1234F1Z5"
                 className={inputCls + " uppercase"} data-testid={TID.gstinInput} />
          <button className="mb-btn mb-btn-accent" data-testid={TID.gstinSubmit}
                  onClick={() => call("gstin", async () => {
                    const { data } = await api.post("/verify/gstin", { gstin });
                    return `GSTIN ${data.status}`;
                  })}>
            <ShieldCheck size={16} strokeWidth={1.75} /> Verify GSTIN
          </button>
        </div>
        {msg.gstin && <div className="text-[13px] text-[color:var(--mb-accent)] mt-3 font-medium">✓ {msg.gstin}</div>}
        {err.gstin && <div className="text-[13px] text-[color:var(--mb-danger)] mt-3 font-medium">✗ {err.gstin}</div>}
      </Step>
    </div>
  );
}
