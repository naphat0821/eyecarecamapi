import { Router } from 'express';
import { insertData, getSessionsByUserId, getThisWeekData, getSessionsByDate } from '../controllers/sessionController';
import { protect } from '../middleware/authMiddleware';

const router = Router();

router.post('/add', protect, insertData);
router.get('/:userId', protect, getSessionsByUserId);
router.post('/week', getThisWeekData);
router.post('/date', getSessionsByDate);

export default router;
