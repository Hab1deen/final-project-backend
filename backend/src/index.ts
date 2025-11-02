import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import type { Request, Response } from 'express';
import { errorHandler } from './middlewares/errorHandler';
import productRoutes from './routes/productRoutes';
import customerRoutes from './routes/customerRoutes';
import quotationRoutes from './routes/quotationRoutes';
import invoiceRoutes from './routes/invoiceRoutes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', (req: Request, res: Response) => {
  res.json({ 
    message: '🎉 ระบบจัดการเอกสารธุรกิจ API',
    status: 'Running',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      products: '/api/products',
      customers: '/api/customers',
      quotations: '/api/quotations',
      invoices: '/api/invoices'
    }
  });
});

app.get('/api/health', (req: Request, res: Response) => {
  res.json({ 
    status: 'OK',
    timestamp: new Date().toISOString()
  });
});

app.use('/api/products', productRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/quotations', quotationRoutes);
app.use('/api/invoices', invoiceRoutes);

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`🚀 Server: http://localhost:${PORT}`);
  console.log(`📦 Products: http://localhost:${PORT}/api/products`);
  console.log(`👥 Customers: http://localhost:${PORT}/api/customers`);
  console.log(`📋 Quotations: http://localhost:${PORT}/api/quotations`);
  console.log(`🧾 Invoices: http://localhost:${PORT}/api/invoices`);
});

export default app;