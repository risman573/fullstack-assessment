import { Hono } from 'hono';
import { authMiddleware } from '../middleware/auth.js';
import { signUp, signIn, signOut, getProfile } from '../controllers/authController.js';

const authRoutes = new Hono();

authRoutes.post('/signup', signUp);
authRoutes.post('/signin', signIn);
authRoutes.post('/signout', authMiddleware, signOut);
authRoutes.get('/profile', authMiddleware, getProfile);

export default authRoutes;