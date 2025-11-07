import express from 'express';
import { 
  getAllQuotations, 
  getQuotationById, 
  createQuotation, 
  updateQuotation, 
  deleteQuotation,
  convertToInvoice,
  addSignature  // เพิ่มบรรทัดนี้
} from '../controllers/quotationController';

const router = express.Router();

router.get('/', getAllQuotations);
router.get('/:id', getQuotationById);
router.post('/', createQuotation);
router.put('/:id', updateQuotation);
router.delete('/:id', deleteQuotation);
router.post('/:id/convert-to-invoice', convertToInvoice);
router.post('/:id/signature', addSignature);  // เพิ่มบรรทัดนี้

export default router;