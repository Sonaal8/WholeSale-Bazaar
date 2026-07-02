import { useState } from "react";
import { api, useAuth, formatApiErrorDetail } from "@/context/AuthContext";
import { useI18n } from "@/i18n";
import { TID } from "@/constants/testIds";
import { TrustRibbon } from "@/components/mera/TrustRibbon";
import { ShieldCheck, BadgeCheck, CheckCircle2 } from "lucide-react";

function Step({ n, title, done, current, children }) {
  return (
    <div className={`mb-card p-5 ${current ? "ring-2 ring-[color:var(--mb-accent)]" : ""}`}>
      <div className="flex items-center gap-2 mb-3">
        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[13px] font-bold
          ${done ? "bg-[color:var(--mb-success)] text-white" : "bg-[color:var(--mb-secondary)] text-white"}`}>
          {done ? <CheckCircle2 size={16} /> : n}
        </div>
        <h3 className="text-[15px] font-bold">{title}</h3>
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

  return (
    <div className="max-w-[720px] mx-auto px-4 py-6 space-y-4">
      <div className="mb-card p-5">
        <h1 className="text-[22px] font-medium">{t("verify_wizard")}</h1>
        <p className="text-[13px] text-[color:var(--mb-text-muted)] mt-1">
          Sellers must complete Aadhaar OKYC + a government check (FSSAI or GSTIN) to earn the ribbons below.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {user?.identity_verified ? <TrustRibbon kind="identity" /> : <span className="text-[12px] text-[color:var(--mb-text-muted)]">Identity — pending</span>}
          {user?.gov_verified ? <TrustRibbon kind="gov" /> : <span className="text-[12px] text-[color:var(--mb-text-muted)]">Government — pending</span>}
        </div>
      </div>

      <Step n={1} title="Aadhaar OKYC (MOCKED)" done={!!user?.identity_verified} current={!user?.identity_verified}>
        {!otpSent ? (
          <div className="flex flex-col sm:flex-row gap-2">
            <input value={aadhaar}
                   onChange={(e) => setAadhaar(e.target.value.replace(/\D/g, "").slice(0, 12))}
                   placeholder="12-digit Aadhaar" inputMode="numeric"
                   className="flex-1 border border-[#B7BEC5] rounded px-3 py-2 bg-white"
                   data-testid={TID.aadhaarInput} />
            <button className="mb-btn mb-btn-primary"
                    data-testid={TID.aadhaarInitBtn}
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
                   placeholder="Enter OTP (use 123456)"
                   className="flex-1 border border-[#B7BEC5] rounded px-3 py-2 bg-white"
                   data-testid={TID.aadhaarOtp} />
            <button className="mb-btn mb-btn-primary"
                    data-testid={TID.aadhaarConfirmBtn}
                    onClick={() => call("aadhaar", async () => {
                      const { data } = await api.post("/verify/aadhaar/confirm", { aadhaar_number: aadhaar, otp });
                      setOtpSent(false); setOtp(""); setAadhaar("");
                      return "Aadhaar verified successfully.";
                    })}>
              Confirm
            </button>
          </div>
        )}
        {msg.aadhaar && <div className="text-[13px] text-[color:var(--mb-success)] mt-2">{msg.aadhaar}</div>}
        {err.aadhaar && <div className="text-[13px] text-[color:var(--mb-danger)] mt-2">{err.aadhaar}</div>}
      </Step>

      <Step n={2} title="FSSAI Government Check" done={!!user?.gov_verified} current={!user?.gov_verified}>
        <div className="flex flex-col sm:flex-row gap-2">
          <input value={fssai}
                 onChange={(e) => setFssai(e.target.value.replace(/\D/g, "").slice(0, 14))}
                 placeholder="14-digit FSSAI number"
                 className="flex-1 border border-[#B7BEC5] rounded px-3 py-2 bg-white"
                 data-testid={TID.fssaiInput} />
          <button className="mb-btn mb-btn-primary"
                  data-testid={TID.fssaiSubmit}
                  onClick={() => call("fssai", async () => {
                    const { data } = await api.post("/verify/fssai", { fssai_number: fssai });
                    return `FSSAI ${data.status}`;
                  })}>
            <BadgeCheck size={16} className="mr-1" /> Verify FSSAI
          </button>
        </div>
        {msg.fssai && <div className="text-[13px] text-[color:var(--mb-success)] mt-2">{msg.fssai}</div>}
        {err.fssai && <div className="text-[13px] text-[color:var(--mb-danger)] mt-2">{err.fssai}</div>}
      </Step>

      <Step n={3} title="GSTIN Government Check" done={!!user?.gov_verified} current={!user?.gov_verified}>
        <div className="flex flex-col sm:flex-row gap-2">
          <input value={gstin}
                 onChange={(e) => setGstin(e.target.value.toUpperCase().slice(0, 15))}
                 placeholder="15-char GSTIN (e.g. 27ABCDE1234F1Z5)"
                 className="flex-1 border border-[#B7BEC5] rounded px-3 py-2 bg-white uppercase"
                 data-testid={TID.gstinInput} />
          <button className="mb-btn mb-btn-primary"
                  data-testid={TID.gstinSubmit}
                  onClick={() => call("gstin", async () => {
                    const { data } = await api.post("/verify/gstin", { gstin });
                    return `GSTIN ${data.status}`;
                  })}>
            <ShieldCheck size={16} className="mr-1" /> Verify GSTIN
          </button>
        </div>
        {msg.gstin && <div className="text-[13px] text-[color:var(--mb-success)] mt-2">{msg.gstin}</div>}
        {err.gstin && <div className="text-[13px] text-[color:var(--mb-danger)] mt-2">{err.gstin}</div>}
      </Step>
    </div>
  );
}
