import { Router } from 'express';
import {
  getAllInvoices,
  getInvoiceById,
  createInvoice,
  updateInvoiceStatus,
  recordPayment,
  deleteInvoice
} from '../controllers/invoiceController';

const router = Router();

router.get('/', getAllInvoices);
router.get('/:id', getInvoiceById);
router.post('/', createInvoice);
router.patch('/:id/status', updateInvoiceStatus);
router.post('/:id/payments', recordPayment);
router.delete('/:id', deleteInvoice);

export default router;