import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, formatApiErrorDetail } from "@/context/AuthContext";
import { useI18n } from "@/i18n";
import { TID } from "@/constants/testIds";

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
      const payload = {
        ...form,
        price: Number(form.price),
        stock: Number(form.stock),
        images: form.images.filter(Boolean),
      };
      const { data } = await api.post("/listings", payload);
      nav(`/product/${data.id}`);
    } catch (err) {
      setError(formatApiErrorDetail(err.response?.data?.detail) || err.message);
    } finally { setLoading(false); }
  };

  return (
    <div className="max-w-[720px] mx-auto px-4 py-6">
      <div className="mb-card p-6">
        <h1 className="text-[22px] font-medium mb-4">{t("create_listing")}</h1>
        <form onSubmit={submit} className="space-y-3">
          <div>
            <label className="block text-[13px] font-bold mb-1">Title (English)</label>
            <input required value={form.title} onChange={(e) => set("title", e.target.value)}
                   className="w-full border border-[#B7BEC5] rounded px-3 py-2 bg-white"
                   data-testid={TID.listingTitle} />
          </div>
          <div>
            <label className="block text-[13px] font-bold mb-1">शीर्षक (Hindi)</label>
            <input value={form.title_hi} onChange={(e) => set("title_hi", e.target.value)}
                   className="w-full border border-[#B7BEC5] rounded px-3 py-2 bg-white" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[13px] font-bold mb-1">Category</label>
              <select value={form.category} onChange={(e) => set("category", e.target.value)}
                      className="w-full border border-[#B7BEC5] rounded px-3 py-2 bg-white"
                      data-testid={TID.listingCategory}>
                {CATS.map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[13px] font-bold mb-1">Unit</label>
              <input value={form.unit} onChange={(e) => set("unit", e.target.value)}
                     className="w-full border border-[#B7BEC5] rounded px-3 py-2 bg-white"
                     data-testid={TID.listingUnit} />
            </div>
            <div>
              <label className="block text-[13px] font-bold mb-1">Price (₹)</label>
              <input required type="number" min="1" step="0.01" value={form.price}
                     onChange={(e) => set("price", e.target.value)}
                     className="w-full border border-[#B7BEC5] rounded px-3 py-2 bg-white"
                     data-testid={TID.listingPrice} />
            </div>
            <div>
              <label className="block text-[13px] font-bold mb-1">Stock</label>
              <input type="number" min="0" value={form.stock}
                     onChange={(e) => set("stock", e.target.value)}
                     className="w-full border border-[#B7BEC5] rounded px-3 py-2 bg-white"
                     data-testid={TID.listingStock} />
            </div>
            <div className="col-span-2">
              <label className="block text-[13px] font-bold mb-1">Pincode</label>
              <input required pattern="\d{6}" value={form.pincode}
                     onChange={(e) => set("pincode", e.target.value.replace(/\D/g, "").slice(0, 6))}
                     className="w-full border border-[#B7BEC5] rounded px-3 py-2 bg-white"
                     data-testid={TID.listingPincode} />
            </div>
          </div>

          <div>
            <label className="block text-[13px] font-bold mb-1">Description</label>
            <textarea rows={3} value={form.description} onChange={(e) => set("description", e.target.value)}
                      className="w-full border border-[#B7BEC5] rounded px-3 py-2 bg-white" />
          </div>
          <div>
            <label className="block text-[13px] font-bold mb-1">विवरण (Hindi)</label>
            <textarea rows={3} value={form.description_hi} onChange={(e) => set("description_hi", e.target.value)}
                      className="w-full border border-[#B7BEC5] rounded px-3 py-2 bg-white" />
          </div>

          <div>
            <label className="block text-[13px] font-bold mb-1">Image URL(s)</label>
            <div className="flex gap-2">
              <input value={imgUrl} onChange={(e) => setImgUrl(e.target.value)}
                     placeholder="https://…"
                     className="flex-1 border border-[#B7BEC5] rounded px-3 py-2 bg-white"
                     data-testid={TID.listingImage} />
              <button type="button" className="mb-btn mb-btn-ghost"
                      onClick={() => { if (imgUrl) { set("images", [...form.images, imgUrl]); setImgUrl(""); } }}>
                Add
              </button>
            </div>
            <ul className="text-[12px] text-[color:var(--mb-text-muted)] mt-2 list-disc pl-5">
              {form.images.map((u, i) => <li key={i} className="truncate">{u}</li>)}
            </ul>
          </div>

          {error && <div className="text-[13px] text-[color:var(--mb-danger)]">{error}</div>}
          <button type="submit" disabled={loading}
                  className="mb-btn mb-btn-primary w-full" data-testid={TID.listingSubmit}>
            {loading ? "…" : t("create_listing")}
          </button>
        </form>
      </div>
    </div>
  );
}
