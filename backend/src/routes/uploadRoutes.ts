import express from 'express';
import { upload } from '../middlewares/upload';
import { 
  uploadImage, 
  uploadMultipleImages, 
  deleteImage 
} from '../controllers/uploadController';

const router = express.Router();

// Upload single image
router.post('/single', upload.single('image'), uploadImage);

// Upload multiple images (max 10)
router.post('/multiple', upload.array('images', 10), uploadMultipleImages);

// Delete image
router.delete('/:filename', deleteImage);

export default router;