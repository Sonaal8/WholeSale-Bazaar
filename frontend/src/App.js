import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { I18nProvider } from "@/i18n";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import Header from "@/components/mera/Header";
import Footer from "@/components/mera/Footer";
import Home from "@/pages/Home";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import ProductDetail from "@/pages/ProductDetail";
import SellerDashboard from "@/pages/SellerDashboard";
import VerifyWizard from "@/pages/VerifyWizard";
import CreateListing from "@/pages/CreateListing";

function Protected({ children, roles }) {
  const { user, ready } = useAuth();
  const loc = useLocation();
  if (!ready) {
    return (
      <div className="max-w-[1500px] mx-auto px-4 py-16 text-center text-[color:var(--mb-text-muted)]">
        Loading MeraBazaar…
      </div>
    );
  }
  if (!user) return <Navigate to="/login" state={{ from: loc.pathname }} replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />;
  return children;
}

function Shell() {
  return (
    <div className="App">
      <div id="top" />
      <Header />
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/product/:id" element={<ProductDetail />} />
          <Route path="/seller" element={
            <Protected roles={["seller", "admin"]}><SellerDashboard /></Protected>
          } />
          <Route path="/seller/verify" element={
            <Protected roles={["seller", "admin"]}><VerifyWizard /></Protected>
          } />
          <Route path="/seller/create" element={
            <Protected roles={["seller", "admin"]}><CreateListing /></Protected>
          } />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <I18nProvider>
        <AuthProvider>
          <Shell />
        </AuthProvider>
      </I18nProvider>
    </BrowserRouter>
  );
}
