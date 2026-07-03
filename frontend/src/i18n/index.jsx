// Simple EN/HI dictionary + hook
import { createContext, useContext, useEffect, useMemo, useState } from "react";

const dict = {
  en: {
    brand: "MeraBazaar",
    tagline: "मेरा भरोसेमंद बाज़ार · My Trusted Bazaar",
    deliver_to: "Deliver to",
    search_placeholder: "Search MeraBazaar",
    hello_sign_in: "Hello, sign in",
    account_lists: "Account & Lists",
    returns_orders: "Returns & Orders",
    cart: "Cart",
    all: "All",
    food: "Food",
    kirana: "Kirana",
    handicrafts: "Handicrafts",
    handloom: "Handloom",
    services: "Services",
    verified_sellers: "Verified Sellers",
    verified_ribbon: "MeraBazaar",
    verified_ribbon_accent: "Verified",
    free_delivery: "FREE Delivery",
    add_to_enquiry: "Add to enquiry",
    buy_on_whatsapp: "Buy on WhatsApp",
    pay_via_upi: "Pay via UPI",
    trust_score: "Trust score",
    identity_verified: "Identity Verified Seller",
    gov_verified: "FSSAI/GSTIN Government Verified",
    near_pincode: "Near pincode",
    apply: "Apply",
    email: "Email",
    password: "Password",
    name: "Full name",
    phone: "Phone",
    sign_in: "Sign in",
    create_account: "Create account",
    already_customer: "Already a customer? Sign in",
    new_to_mera: "New to MeraBazaar?",
    seller_dashboard: "Seller Dashboard",
    create_listing: "Create listing",
    verify_wizard: "Verification wizard",
    my_listings: "My listings",
    logout: "Sign out",
    hindi: "हिन्दी",
    english: "English",
    big_text: "A+ Bigger text",
    normal_text: "A Normal text",
    seller_trust: "Seller Trust Profile",
    delivery_by: "Delivery to",
    verified_by_mb: "Verified by MeraBazaar",
    price_unit: "unit price",
    stock: "In stock",
    out_of_stock: "Out of stock",
    footer_know_us: "Get to Know Us",
    footer_sell: "Sell on MeraBazaar",
    footer_verification: "Verification",
    footer_help: "Help",
    footer_about: "About MeraBazaar",
    footer_careers: "Careers",
    footer_press: "Press",
    footer_start: "Start selling",
    footer_seller_hub: "Seller Hub",
    footer_fees: "Fees",
    footer_aadhaar: "Aadhaar OKYC",
    footer_fssai: "FSSAI check",
    footer_gstin: "GSTIN check",
    footer_contact: "Contact us",
    footer_returns: "Returns policy",
    footer_privacy: "Privacy notice",
    copyright: "© 2025-2026, MeraBazaar.in, Bazaarly Pvt. Ltd.",
  },
  hi: {
    brand: "MeraBazaar",
    tagline: "मेरा भरोसेमंद बाज़ार · My Trusted Bazaar",
    deliver_to: "डिलीवरी पिनकोड",
    search_placeholder: "मेराबाज़ार पर खोजें",
    hello_sign_in: "नमस्ते, साइन इन करें",
    account_lists: "अकाउंट और सूचियाँ",
    returns_orders: "रिटर्न और ऑर्डर",
    cart: "कार्ट",
    all: "सभी",
    food: "खाद्य",
    kirana: "किराना",
    handicrafts: "हस्तशिल्प",
    handloom: "हैंडलूम",
    services: "सेवाएँ",
    verified_sellers: "सत्यापित विक्रेता",
    verified_ribbon: "मेराबाज़ार",
    verified_ribbon_accent: "सत्यापित",
    free_delivery: "मुफ्त डिलीवरी",
    add_to_enquiry: "पूछताछ में जोड़ें",
    buy_on_whatsapp: "व्हाट्सएप पर खरीदें",
    pay_via_upi: "UPI से भुगतान करें",
    trust_score: "विश्वास स्कोर",
    identity_verified: "पहचान सत्यापित विक्रेता",
    gov_verified: "FSSAI/GSTIN सरकार से सत्यापित",
    near_pincode: "पिनकोड के पास",
    apply: "लागू करें",
    email: "ईमेल",
    password: "पासवर्ड",
    name: "पूरा नाम",
    phone: "फ़ोन",
    sign_in: "साइन इन",
    create_account: "खाता बनाएँ",
    already_customer: "पहले से ग्राहक हैं? साइन इन करें",
    new_to_mera: "मेराबाज़ार पर नए हैं?",
    seller_dashboard: "विक्रेता डैशबोर्ड",
    create_listing: "उत्पाद जोड़ें",
    verify_wizard: "सत्यापन विज़ार्ड",
    my_listings: "मेरे उत्पाद",
    logout: "साइन आउट",
    hindi: "हिन्दी",
    english: "English",
    big_text: "A+ बड़ा टेक्स्ट",
    normal_text: "A सामान्य टेक्स्ट",
    seller_trust: "विक्रेता विश्वास प्रोफ़ाइल",
    delivery_by: "डिलीवरी",
    verified_by_mb: "मेराबाज़ार द्वारा सत्यापित",
    price_unit: "प्रति इकाई",
    stock: "स्टॉक में",
    out_of_stock: "स्टॉक ख़त्म",
    footer_know_us: "हमें जानें",
    footer_sell: "मेराबाज़ार पर बेचें",
    footer_verification: "सत्यापन",
    footer_help: "मदद",
    footer_about: "हमारे बारे में",
    footer_careers: "करियर",
    footer_press: "प्रेस",
    footer_start: "बेचना शुरू करें",
    footer_seller_hub: "सेलर हब",
    footer_fees: "शुल्क",
    footer_aadhaar: "आधार OKYC",
    footer_fssai: "FSSAI जाँच",
    footer_gstin: "GSTIN जाँच",
    footer_contact: "संपर्क करें",
    footer_returns: "रिटर्न नीति",
    footer_privacy: "गोपनीयता",
    copyright: "© 2025-2026, MeraBazaar.in, बाज़ारली प्रा. लि.",
  },
};

const I18nCtx = createContext(null);

export function I18nProvider({ children }) {
  const [lang, setLang] = useState(() => localStorage.getItem("mb.lang") || "en");
  const [big, setBig] = useState(() => localStorage.getItem("mb.big") === "1");

  useEffect(() => {
    localStorage.setItem("mb.lang", lang);
    document.documentElement.setAttribute("lang", lang);
  }, [lang]);
  useEffect(() => {
    localStorage.setItem("mb.big", big ? "1" : "0");
    document.body.classList.toggle("mb-bigtext", big);
  }, [big]);

  const value = useMemo(() => ({
    lang, setLang,
    big, setBig,
    t: (k) => (dict[lang] && dict[lang][k]) || dict.en[k] || k,
    toggleLang: () => setLang((l) => (l === "en" ? "hi" : "en")),
    toggleBig: () => setBig((b) => !b),
  }), [lang, big]);

  return <I18nCtx.Provider value={value}>{children}</I18nCtx.Provider>;
}

export function useI18n() {
  const c = useContext(I18nCtx);
  if (!c) throw new Error("useI18n must be inside I18nProvider");
  return c;
}
