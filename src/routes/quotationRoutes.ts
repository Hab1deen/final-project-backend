import { Router } from 'express';
import {
  getAllQuotations,
  getQuotationById,
  createQuotation,
  updateQuotation,
  deleteQuotation,
  convertToInvoice
} from '../controllers/quotationController';

const router = Router();

router.get('/', getAllQuotations);
router.get('/:id', getQuotationById);
router.post('/', createQuotation);
router.put('/:id', updateQuotation);
router.delete('/:id', deleteQuotation);
router.post('/:id/convert-to-invoice', convertToInvoice);

export default router;