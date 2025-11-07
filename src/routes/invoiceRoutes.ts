import express from 'express';
import { 
  getAllInvoices, 
  getInvoiceById, 
  createInvoice, 
  updateInvoiceStatus, 
  recordPayment, 
  deleteInvoice,
  addSignature  // เพิ่มบรรทัดนี้
} from '../controllers/invoiceController';

const router = express.Router();

router.get('/', getAllInvoices);
router.get('/:id', getInvoiceById);
router.post('/', createInvoice);
router.patch('/:id/status', updateInvoiceStatus);
router.post('/:id/payments', recordPayment);
router.delete('/:id', deleteInvoice);
router.post('/:id/signature', addSignature);  // เพิ่มบรรทัดนี้

export default router;