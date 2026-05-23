import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { StatusCodes } from 'http-status-codes';
import { env } from '../config/envConfig.js';
import { sendError } from '../utils/response.js';

export interface UserPayload {
  id: number;
  name: string;
  role: 'contributor' | 'maintainer';
}

declare global {
  namespace Express {
    interface Request {
      user?: UserPayload;
    }
  }
}

export const authenticate = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return sendError(res, StatusCodes.UNAUTHORIZED, 'Authentication token missing');
  }

  const token = authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : authHeader;

  if (!token) {
    return sendError(res, StatusCodes.UNAUTHORIZED, 'Authentication token missing');
  }

  try {
    const decoded = jwt.verify(token, env.jwtSecret) as UserPayload;
    req.user = decoded;
    next();
  } catch (error) {
    return sendError(res, StatusCodes.UNAUTHORIZED, 'Invalid or expired token');
  }
};

export const authorize = (roles: ('contributor' | 'maintainer')[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return sendError(res, StatusCodes.FORBIDDEN, 'Insufficient role permissions to access this resource');
    }
    next();
  };
};