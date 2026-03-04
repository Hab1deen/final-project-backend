import express from 'express';
import {
    getAllTemplates,
    getDefaultTemplate,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    setDefault,
} from '../controllers/signatureTemplateController';
import { authenticate } from '../middlewares/authMiddleware';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// GET routes
router.get('/', getAllTemplates);
router.get('/default', getDefaultTemplate);

// POST routes
router.post('/', createTemplate);
router.post('/:id/set-default', setDefault);

// PUT routes
router.put('/:id', updateTemplate);

// DELETE routes
router.delete('/:id', deleteTemplate);

export default router;
