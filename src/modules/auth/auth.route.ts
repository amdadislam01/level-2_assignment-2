import { Router } from 'express';
import { login, signUp } from './auth.controller.js';

const router = Router();

router.post('/signup', signUp);
router.post('/login', login);

export default router;