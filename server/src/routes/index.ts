import { Router } from 'express';
import authRoutes from '../modules/auth/routes/auth.routes';
import categoryRoutes from '../modules/category/routes/category.routes'; // 👈 add this

const router = Router();

// API routes
router.use('/auth', authRoutes);
router.use('/category', categoryRoutes); // 👈 now valid

export default router;
