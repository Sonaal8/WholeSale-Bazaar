import { useI18n } from "@/i18n";
import { TID } from "@/constants/testIds";

export function TrustRibbon({ kind = "identity", label, size = "sm" }) {
  const { t } = useI18n();
  const isGov = kind === "gov";
  const text = label || (isGov ? t("gov_verified") : t("identity_verified"));
  const cls = `mb-seal ${isGov ? "mb-seal-gov" : "mb-seal-identity"}`;
  return (
    <span
      className={cls}
      data-testid={isGov ? TID.ribbonGov : TID.ribbonIdentity}
      aria-label={text}
      style={{ fontSize: size === "lg" ? 12 : 11 }}
    >
      <span className="dot" aria-hidden="true"></span>
      <span>{text}</span>
    </span>
  );
}
