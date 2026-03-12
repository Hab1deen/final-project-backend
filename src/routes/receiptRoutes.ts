import express from 'express';
import { authenticate } from '../middlewares/authMiddleware';
import { 
  getAllReceipts, 
  getReceiptById, 
  getReceiptsByInvoiceId,
  createReceipt, 
  deleteReceipt,
  addSignature
} from '../controllers/receiptController';

const router = express.Router();

// GET /api/receipts - ดึงใบเสร็จทั้งหมด
router.get('/', authenticate, getAllReceipts);

// GET /api/receipts/invoice/:invoiceId - ดึงใบเสร็จตาม invoiceId
router.get('/invoice/:invoiceId', authenticate, getReceiptsByInvoiceId);

// GET /api/receipts/:id - ดึงใบเสร็จตาม id
router.get('/:id', authenticate, getReceiptById);

// POST /api/receipts - สร้างใบเสร็จใหม่
router.post('/', authenticate, createReceipt);

// DELETE /api/receipts/:id - ลบใบเสร็จ
router.delete('/:id', authenticate, deleteReceipt);

// POST /api/receipts/:id/signature - เพิ่มลายเซ็น
router.post('/:id/signature', authenticate, addSignature);

export default router;