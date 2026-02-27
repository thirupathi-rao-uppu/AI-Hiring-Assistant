import { Router } from 'express';
import { register, login } from '../controllers/authController';

const router = Router();

router.post('/register', (req, res) => register(req, res));
router.post('/login', (req, res) => login(req, res));

export default router;
