import express from 'express';
import {
  getAllInvoices,
  getInvoiceById,
  createInvoice,
  updateInvoice,     // เพิ่มบรรทัดนี้
  updateInvoiceStatus,
  recordPayment,
  deleteInvoice,
  addSignature  // เพิ่มบรรทัดนี้
} from '../controllers/invoiceController';
import { authenticate } from '../middlewares/authMiddleware';

const router = express.Router();

router.get('/', getAllInvoices);
router.get('/:id', getInvoiceById);
router.post('/', createInvoice);
router.put('/:id', updateInvoice);           // เพิ่มบรรทัดนี้
router.patch('/:id/status', updateInvoiceStatus);
router.post('/:id/payments', authenticate, recordPayment); // เพิ่ม authenticate
router.delete('/:id', deleteInvoice);
router.post('/:id/signature', addSignature);  // เพิ่มบรรทัดนี้

export default router;