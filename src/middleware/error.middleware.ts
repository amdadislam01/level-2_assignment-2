import type { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import { sendError } from '../utils/response.js';

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const statusCode = err.statusCode || StatusCodes.INTERNAL_SERVER_ERROR;
  const message = err.message || 'Something went wrong';

  console.error(`[Error] ${req.method} ${req.url}:`, err);

  const errorDetail = process.env.NODE_ENV === 'development' ? err.stack : (err.error || null);

  return sendError(res, statusCode, message, errorDetail);
};