import type { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import { sendError, sendSuccess } from '../../utils/response.js';
import * as authService from './auth.service.js';

export const signUp = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await authService.registerUser(req.body);
    return sendSuccess(res, StatusCodes.CREATED, 'User registered successfully', user);
  } catch (error: any) {
    if (error.code === '23505') {
      return sendError(res, StatusCodes.BAD_REQUEST, 'User already exists');
    }
    next(error);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const session = await authService.loginUser(req.body);
    if (!session) {
      return sendError(res, StatusCodes.BAD_REQUEST, 'Invalid email or password');
    }

    return sendSuccess(res, StatusCodes.OK, 'User logged in successfully', session);
  } catch (error) {
    next(error);
  }
};