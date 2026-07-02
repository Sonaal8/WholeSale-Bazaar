import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, formatApiErrorDetail } from "@/context/AuthContext";
import { useI18n } from "@/i18n";
import { TID } from "@/constants/testIds";
import { Plus, X } from "lucide-react";

const CATS = ["Food", "Kirana", "Handicrafts", "Handloom", "Services"];

export default function CreateListing() {
  const { t } = useI18n();
  const nav = useNavigate();
  const [form, setForm] = useState({
    title: "", title_hi: "", description: "", description_hi: "",
    category: "Kirana", price: "", unit: "each", pincode: "", stock: 0,
    images: [],
  });
  const [imgUrl, setImgUrl] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const set = (k, v) => setForm({ ...form, [k]: v });

  const submit = async (e) => {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      const payload = { ...form, price: Number(form.price), stock: Number(form.stock),
        images: form.images.filter(Boolean) };
      const { data } = await api.post("/listings", payload);
      nav(`/product/${data.id}`);
    } catch (err) {
      setError(formatApiErrorDetail(err.response?.data?.detail) || err.message);
    } finally { setLoading(false); }
  };

  const cls = "w-full border border-[color:var(--mb-border)] rounded-xl px-4 py-3 bg-[color:var(--mb-bg)] focus:bg-white transition-colors";
  const lbl = "block text-[12px] font-semibold uppercase tracking-wider text-[color:var(--mb-muted-fg)] mb-1.5";

  return (
    <div className="max-w-[820px] mx-auto px-4 py-8">
      <div className="mb-card p-6 md:p-8">
        <div className="text-[11px] uppercase tracking-[0.2em] font-bold text-[color:var(--mb-primary)]">
          Seller
        </div>
        <h1 className="mb-serif text-[36px] font-semibold leading-none mt-1 mb-6">{t("create_listing")}</h1>
        <form onSubmit={submit} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={lbl}>Title (English)</label>
              <input required value={form.title} onChange={(e) => set("title", e.target.value)}
                     className={cls} data-testid={TID.listingTitle} />
            </div>
            <div>
              <label className={lbl}>शीर्षक (Hindi)</label>
              <input value={form.title_hi} onChange={(e) => set("title_hi", e.target.value)}
                     className={cls} />
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className={lbl}>Category</label>
              <select value={form.category} onChange={(e) => set("category", e.target.value)}
                      className={cls} data-testid={TID.listingCategory}>
                {CATS.map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className={lbl}>Unit</label>
              <input value={form.unit} onChange={(e) => set("unit", e.target.value)}
                     className={cls} data-testid={TID.listingUnit} />
            </div>
            <div>
              <label className={lbl}>Price (₹)</label>
              <input required type="number" min="1" step="0.01" value={form.price}
                     onChange={(e) => set("price", e.target.value)}
                     className={cls} data-testid={TID.listingPrice} />
            </div>
            <div>
              <label className={lbl}>Stock</label>
              <input type="number" min="0" value={form.stock}
                     onChange={(e) => set("stock", e.target.value)}
                     className={cls} data-testid={TID.listingStock} />
            </div>
          </div>

          <div>
            <label className={lbl}>Pincode</label>
            <input required pattern="\d{6}" value={form.pincode}
                   onChange={(e) => set("pincode", e.target.value.replace(/\D/g, "").slice(0, 6))}
                   className={cls} data-testid={TID.listingPincode} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={lbl}>Description</label>
              <textarea rows={4} value={form.description} onChange={(e) => set("description", e.target.value)}
                        className={cls} />
            </div>
            <div>
              <label className={lbl}>विवरण (Hindi)</label>
              <textarea rows={4} value={form.description_hi} onChange={(e) => set("description_hi", e.target.value)}
                        className={cls} />
            </div>
          </div>

          <div>
            <label className={lbl}>Image URL(s)</label>
            <div className="flex gap-2">
              <input value={imgUrl} onChange={(e) => setImgUrl(e.target.value)}
                     placeholder="https://…" className={cls} data-testid={TID.listingImage} />
              <button type="button" className="mb-btn mb-btn-outline shrink-0"
                      onClick={() => { if (imgUrl) { set("images", [...form.images, imgUrl]); setImgUrl(""); } }}>
                <Plus size={16} strokeWidth={1.75} /> Add
              </button>
            </div>
            {form.images.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {form.images.map((u, i) => (
                  <div key={i} className="flex items-center gap-2 bg-[color:var(--mb-muted)] rounded-full pl-2 pr-1 py-1">
                    <img src={u} alt="" className="w-6 h-6 rounded-full object-cover" />
                    <span className="text-[11px] max-w-[180px] truncate">{u}</span>
                    <button type="button" className="p-1 hover:bg-white rounded-full"
                            onClick={() => set("images", form.images.filter((_, j) => j !== i))}>
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {error && (
            <div className="text-[13px] text-[color:var(--mb-danger)] bg-[color:var(--mb-danger)]/10 border border-[color:var(--mb-danger)]/25 px-3 py-2 rounded-lg">
              {error}
            </div>
          )}
          <button type="submit" disabled={loading}
                  className="mb-btn mb-btn-primary w-full !py-3.5 text-[15px]"
                  data-testid={TID.listingSubmit}>
            {loading ? "…" : t("create_listing")}
          </button>
        </form>
      </div>
    </div>
  );
}
