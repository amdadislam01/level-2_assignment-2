import type { Request, Response, NextFunction } from 'express';
import * as issuesService from './issues.service.js';
import { sendError, sendSuccess } from '../../utils/response.js';
import { StatusCodes } from 'http-status-codes';

export const createIssue = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const issue = await issuesService.createIssue(req.body, req.user!.id);
    return sendSuccess(res, StatusCodes.CREATED, 'Issue created successfully', issue);
  } catch (error) {
    next(error);
  }
};

export const getAllIssues = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const issues = await issuesService.getAllIssues(req.query);
    return res.status(StatusCodes.OK).json({ success: true, data: issues });
  } catch (error) {
    next(error);
  }
};

export const getSingleIssue = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const issue = await issuesService.getIssueById(Number(req.params.id));
    if (!issue) return sendError(res, StatusCodes.NOT_FOUND, 'Issue not found');
    return res.status(StatusCodes.OK).json({ success: true, data: issue });
  } catch (error) {
    next(error);
  }
};

export const updateIssue = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const issueId = Number(req.params.id);
    const existingIssue = await issuesService.getIssueById(issueId);

    if (!existingIssue) {
      return sendError(res, StatusCodes.NOT_FOUND, 'Issue not found');
    }

    if (req.user!.role !== 'maintainer') {
      if (existingIssue.reporter.id !== req.user!.id) {
        return sendError(res, StatusCodes.FORBIDDEN, 'You can only update your own issues');
      }
      if (existingIssue.status !== 'open') {
        return sendError(res, StatusCodes.CONFLICT, 'Cannot modify issue once it changes from open status');
      }
    }

    const updated = await issuesService.updateIssue(issueId, req.body);
    return sendSuccess(res, StatusCodes.OK, 'Issue updated successfully', updated);
  } catch (error) {
    next(error);
  }
};

export const deleteIssue = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const success = await issuesService.deleteIssue(Number(req.params.id));
    if (!success) return sendError(res, StatusCodes.NOT_FOUND, 'Issue not found');
    return sendSuccess(res, StatusCodes.OK, 'Issue deleted successfully');
  } catch (error) {
    next(error);
  }
};