import express from 'express';
import { authenticate } from '../middlewares/authMiddleware';
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

router.get('/', authenticate, getAllQuotations);
router.get('/:id', authenticate, getQuotationById);
router.post('/', authenticate, createQuotation);
router.put('/:id', authenticate, updateQuotation);
router.delete('/:id', authenticate, deleteQuotation);
router.post('/:id/convert-to-invoice', authenticate, convertToInvoice);
router.post('/:id/signature', authenticate, addSignature);  // เพิ่มบรรทัดนี้

export default router;