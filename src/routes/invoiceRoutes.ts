import express from 'express';
import { authenticate } from '../middlewares/authMiddleware';
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

const router = express.Router();

router.get('/', authenticate, getAllInvoices);
router.get('/:id', authenticate, getInvoiceById);
router.post('/', authenticate, createInvoice);
router.put('/:id', authenticate, updateInvoice);           // เพิ่มบรรทัดนี้
router.patch('/:id/status', authenticate, updateInvoiceStatus);
router.post('/:id/payments', authenticate, recordPayment); // เพิ่ม authenticate
router.delete('/:id', authenticate, deleteInvoice);
router.post('/:id/signature', authenticate, addSignature);  // เพิ่มบรรทัดนี้

export default router;