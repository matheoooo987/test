import { Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Analytics from './pages/Analytics';
import Invoices from './pages/Invoices';
import InvoiceForm from './pages/InvoiceForm';
import InvoiceDetail from './pages/InvoiceDetail';
import Quotes from './pages/Quotes';
import QuoteForm from './pages/QuoteForm';
import TimeTracker from './pages/TimeTracker';
import Expenses from './pages/Expenses';
import Clients from './pages/Clients';
import Settings from './pages/Settings';
import PublicInvoice from './pages/PublicInvoice';

function Layout({ children }) {
  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-950">
      <Sidebar />
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <Routes>
        {/* Page publique (sans sidebar) */}
        <Route path="/public/invoice/:token" element={<PublicInvoice />} />

        {/* App principale */}
        <Route path="/*" element={
          <Layout>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/analytics" element={<Analytics />} />
              <Route path="/invoices" element={<Invoices />} />
              <Route path="/invoices/new" element={<InvoiceForm />} />
              <Route path="/invoices/:id" element={<InvoiceDetail />} />
              <Route path="/invoices/:id/edit" element={<InvoiceForm />} />
              <Route path="/quotes" element={<Quotes />} />
              <Route path="/quotes/new" element={<QuoteForm />} />
              <Route path="/quotes/:id" element={<QuoteForm />} />
              <Route path="/quotes/:id/edit" element={<QuoteForm />} />
              <Route path="/time" element={<TimeTracker />} />
              <Route path="/expenses" element={<Expenses />} />
              <Route path="/clients" element={<Clients />} />
              <Route path="/settings" element={<Settings />} />
            </Routes>
          </Layout>
        } />
      </Routes>
    </ThemeProvider>
  );
}
