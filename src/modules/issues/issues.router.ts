import { Router } from 'express';
import { authenticate, authorize } from '../../middleware/auth.middleware.js';
import { createIssue, deleteIssue, getAllIssues, getSingleIssue, updateIssue } from './issues.controller.js';

const router = Router();

router.post('/', authenticate, createIssue);
router.get('/', getAllIssues);
router.get('/:id', getSingleIssue);
router.patch('/:id', authenticate, updateIssue);
router.delete('/:id', authenticate, authorize(['maintainer']), deleteIssue);

export default router;