import express from 'express';
import {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  resetUserPassword,
  getStatistics
} from '../controllers/adminController';
import { authenticate, adminOnly } from '../middlewares/authMiddleware';

const router = express.Router();

// All routes require authentication and admin role
router.use(authenticate);
router.use(adminOnly);

// Statistics
router.get('/statistics', getStatistics);

// User management
router.get('/users', getAllUsers);
router.get('/users/:id', getUserById);
router.post('/users', createUser);
router.put('/users/:id', updateUser);
router.delete('/users/:id', deleteUser);
router.put('/users/:id/reset-password', resetUserPassword);

export default router;