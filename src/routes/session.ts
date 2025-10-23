import { Router } from 'express';
import { insertData, getSessionsByUserId, getThisWeekData, getSessionsByDate, getTodayData } from '../controllers/sessionController';
import { protect } from '../middleware/authMiddleware';

const router = Router();

router.post('/add', protect, insertData);
router.get('/:userId', protect, getSessionsByUserId);
router.post('/week', protect, getThisWeekData);
router.post('/date', protect, getSessionsByDate);
router.post('/today', protect, getTodayData);

export default router;
