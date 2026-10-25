import { Router } from 'express';
import { register, login, getMe } from '../controllers/auth.controller';
import { authenticateInvestor } from '../middlewares/auth.middleware';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', authenticateInvestor, getMe);

export default router;
