import express from 'express';
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
router.get('/', getAllReceipts);

// GET /api/receipts/invoice/:invoiceId - ดึงใบเสร็จตาม invoiceId
router.get('/invoice/:invoiceId', getReceiptsByInvoiceId);

// GET /api/receipts/:id - ดึงใบเสร็จตาม id
router.get('/:id', getReceiptById);

// POST /api/receipts - สร้างใบเสร็จใหม่
router.post('/', createReceipt);

// DELETE /api/receipts/:id - ลบใบเสร็จ
router.delete('/:id', deleteReceipt);

// POST /api/receipts/:id/signature - เพิ่มลายเซ็น
router.post('/:id/signature', addSignature);

export default router;