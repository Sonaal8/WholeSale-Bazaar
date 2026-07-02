import { useI18n } from "@/i18n";
import { TID } from "@/constants/testIds";

export function TrustRibbon({ kind = "identity", label }) {
  const { t } = useI18n();
  const isGov = kind === "gov";
  const text = label || (isGov ? t("gov_verified") : t("identity_verified"));
  return (
    <span
      className="mb-ribbon"
      data-testid={isGov ? TID.ribbonGov : TID.ribbonIdentity}
      aria-label={text}
    >
      <span className="notch" aria-hidden="true"></span>
      <span className="body">
        <span className="accent">MB</span>
        <span>·</span>
        <span>{text}</span>
      </span>
    </span>
  );
}
