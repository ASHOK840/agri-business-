import { Router } from 'express';
import { postLogin, getMe, postLogout } from '../controllers/auth.controller';
import { validateBody } from '../middleware/validateRequest.middleware';
import { loginSchema } from '../validators/auth.validator';
import { authenticate } from '../middleware/authenticate.middleware';
import { loginRateLimiter } from '../middleware/rateLimit.middleware';

const router = Router();

router.post('/login', loginRateLimiter, validateBody(loginSchema), postLogin);
router.get('/me', authenticate, getMe);
router.post('/logout', authenticate, postLogout);

export default router;
