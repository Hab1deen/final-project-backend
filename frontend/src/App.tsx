import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/layout/Layout';
import DashboardPage from './pages/dashboard/DashboardPage';
import ProductsPage from './components/products/ProductsPage';
import CustomersPage from './pages/customers/CustomersPage';
import QuotationsPage from './pages/quotations/QuotationsPage';
import CreateQuotationPage from './pages/quotations/CreateQuotationPage';
import InvoicesPage from './pages/invoices/InvoicesPage';
import QuotationDetailPage from './pages/quotations/QuotationDetailPage';
import InvoiceDetailPage from './pages/invoices/InvoiceDetailPage';

function App() {
  return (
    <BrowserRouter>
      <Layout>
       <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/products" element={<ProductsPage />} />
          <Route path="/customers" element={<CustomersPage/>} />
          <Route path="/quotations" element={<QuotationsPage />} />
          <Route path="/quotations/create" element={<CreateQuotationPage />} />
          <Route path="/quotations/:id" element={<QuotationDetailPage />} />
          <Route path="/invoices" element={<InvoicesPage/>} />
          <Route path="/invoices/:id" element={<InvoiceDetailPage />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

export default App;