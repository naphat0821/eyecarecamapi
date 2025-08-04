import { Router } from 'express';
import { insertData } from '../controllers/sessionController';

const router = Router();

router.post('/add', insertData);

export default router;
