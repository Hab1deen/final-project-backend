import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import path from 'path';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes';
import adminRoutes from './routes/adminRoutes';
import productRoutes from './routes/productRoutes';
import customerRoutes from './routes/customerRoutes';
import quotationRoutes from './routes/quotationRoutes';
import invoiceRoutes from './routes/invoiceRoutes';
import receiptRoutes from './routes/receiptRoutes';
import uploadRoutes from './routes/uploadRoutes';
import appointmentRoutes from './routes/appointmentRoutes';
import signatureTemplateRoutes from './routes/signatureTemplateRoutes';
import approvalRoutes from './routes/approval.routes';
import emailRoutes from './routes/email.routes';
import emailVerificationRoutes from './routes/emailVerificationRoutes';
import passwordResetRoutes from './routes/passwordResetRoutes';
import loginHistoryRoutes from './routes/loginHistoryRoutes';
import { errorHandler } from './middlewares/errorHandler';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: '50mb' })); // เพิ่ม limit สำหรับ base64 images
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// static files สำหรับ serve รูปภาพ
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.get('/', (req: Request, res: Response) => {
  console.log('🚀 BACKEND VERSION: v1.0.1 - STABLE (Resend API)'); // Version Verification Log
  res.json({
    message: 'ระบบจัดการเอกสารธุรกิจ API',
    status: 'Running',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      auth: '/api/auth',
      admin: '/api/admin',
      products: '/api/products',
      customers: '/api/customers',
      quotations: '/api/quotations',
      invoices: '/api/invoices',
      receipts: '/api/receipts',
      upload: '/api/upload',
      appointments: '/api/appointments'
    }
  });
});

app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    emailConfig: {
      smtpUser: process.env.SMTP_USER ? `✅ Set (${process.env.SMTP_USER})` : '❌ Missing',
      smtpPass: process.env.SMTP_PASS ? '✅ Set' : '❌ Missing',
      smtpFromName: process.env.SMTP_FROM_NAME || '❌ Missing',
      smtpFromEmail: process.env.SMTP_FROM_EMAIL || '❌ Missing',
      frontendUrl: process.env.FRONTEND_URL || '❌ Missing',
    }
  });
});

app.use('/api/products', productRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/quotations', quotationRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/receipts', receiptRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/signature-templates', signatureTemplateRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/public', approvalRoutes); // Public routes - ไม่ต้อง auth
app.use('/api/email', emailRoutes); // Email test route

// New Auth Enhancement Routes
app.use('/api/email-verification', emailVerificationRoutes); // Email verification
app.use('/api/password-reset', passwordResetRoutes); // Password reset
app.use('/api/login-history', loginHistoryRoutes); // Login history

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`🚀 Server: http://localhost:${PORT}`);
  console.log(`🔐 Auth: http://localhost:${PORT}/api/auth`);
  console.log(`📦 Products: http://localhost:${PORT}/api/products`);
  console.log(`👥 Customers: http://localhost:${PORT}/api/customers`);
  console.log(`📋 Quotations: http://localhost:${PORT}/api/quotations`);
  console.log(`🧾 Invoices: http://localhost:${PORT}/api/invoices`);
  console.log(`🧾 Receipts: http://localhost:${PORT}/api/receipts`);
  console.log(`📸 Upload: http://localhost:${PORT}/api/upload`);
  console.log(`📅 Appointments: http://localhost:${PORT}/api/appointments`);
});

export default app;