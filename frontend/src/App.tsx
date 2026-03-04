import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute from "./pages/auth/ProtectedRoute";
import AdminRoute from "./pages/auth/AdminRoute";

// Auth Pages
import LoginPage from "./pages/auth/LoginPage";
import RegisterPage from "./pages/auth/RegisterPage";
import VerifyEmailPage from "./pages/auth/VerifyEmailPage";
import ResendVerificationPage from "./pages/auth/ResendVerificationPage";
import ForgotPasswordPage from "./pages/auth/ForgotPasswordPage";
import ResetPasswordPage from "./pages/auth/ResetPasswordPage";

// Layout
import Layout from "./components/layout/Layout";

// Protected Pages
import DashboardPage from "./pages/dashboard/DashboardPage";
import QuotationsPage from "./pages/quotations/QuotationsPage";
import QuotationDetailPage from "./pages/quotations/QuotationDetailPage";
import CreateQuotationPage from "./pages/quotations/CreateQuotationPage";
import InvoicesPage from "./pages/invoices/InvoicesPage";
import InvoiceDetailPage from "./pages/invoices/InvoiceDetailPage";
import PaymentPage from "./pages/invoices/PaymentPage";
import ProductsPage from "./pages/products/ProductsPage";
import CustomersPage from "./pages/customers/CustomersPage";
import SettingsPage from "./pages/setting/SettingsPage";
import LoginHistoryPage from "./pages/settings/LoginHistoryPage";

// Admin Pages
import AdminUsersPage from "./pages/admin/AdminUsersPage";
import ReceiptsPage from "./pages/receipts/ReceiptsPage";
import ReceiptDetailPage from "./pages/receipts/ReceiptDetailPage";

// Public Pages (no auth required)
import QuotationApprovalPage from "./pages/public/QuotationApprovalPage";

import { FontSizeProvider } from "./contexts/FontSizeContext";

function App() {
  return (
    <AuthProvider>
      <FontSizeProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/verify-email/:token" element={<VerifyEmailPage />} />
            <Route path="/resend-verification" element={<ResendVerificationPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
            <Route path="/public/quotations/:token" element={<QuotationApprovalPage />} />

            {/* Protected Routes */}
            <Route
              path="/*"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Routes>
                      <Route path="/" element={<DashboardPage />} />

                      {/* Quotations */}
                      <Route path="/quotations" element={<QuotationsPage />} />
                      <Route path="/quotations/create" element={<CreateQuotationPage />} />
                      <Route path="/quotations/:id" element={<QuotationDetailPage />} />

                      {/* Invoices */}
                      <Route path="/invoices" element={<InvoicesPage />} />
                      <Route path="/invoices/:id" element={<InvoiceDetailPage />} />
                      <Route path="/invoices/:id/payment" element={<PaymentPage />} />

                      {/* Receipts */}
                      <Route path="/receipts" element={<ReceiptsPage />} />
                      <Route path="/receipts/:id" element={<ReceiptDetailPage />} />

                      {/* Other Pages */}
                      <Route path="/products" element={<ProductsPage />} />
                      <Route path="/customers" element={<CustomersPage />} />

                      <Route path="/settings" element={<SettingsPage />} />
                      <Route path="/settings/login-history" element={<LoginHistoryPage />} />

                      {/* Admin Only Routes - เพิ่ม AdminRoute Protection */}
                      <Route
                        path="/admin/users"
                        element={
                          <AdminRoute>
                            <AdminUsersPage />
                          </AdminRoute>
                        }
                      />

                      {/* 404 */}
                      <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                  </Layout>
                </ProtectedRoute>
              }
            />
          </Routes>
        </BrowserRouter>
      </FontSizeProvider>
    </AuthProvider>
  );
}

export default App;