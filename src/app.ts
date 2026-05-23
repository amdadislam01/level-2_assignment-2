import express, { type Request, type Response } from 'express';
import cors from 'cors';
import authRoutes from './modules/auth/auth.route.js';
import issueRoutes from './modules/issues/issues.router.js';
import { errorHandler } from './middleware/error.middleware.js';

const app = express();

app.use(cors());
app.use(express.json());

app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'OK',
    message: 'Server is healthy',
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/issues', issueRoutes);

app.use(errorHandler);

export default app;