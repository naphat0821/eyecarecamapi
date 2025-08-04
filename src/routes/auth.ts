import { Router } from 'express';
import { register, login, logout } from '../controllers/authController';
import { protect } from '../middleware/authMiddleware';
import { getMe } from '../controllers/authController';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);
router.get('/me', protect, getMe);

export default router;
