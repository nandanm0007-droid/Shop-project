import { Request, Response, NextFunction } from 'express';
import { AppError, ValidationError, AuthenticationError } from '../lib/errors.js';
import { errorResponse } from '../lib/response.js';
import { ZodError } from 'zod';
import jwt from 'jsonwebtoken';
const { JsonWebTokenError, TokenExpiredError } = jwt;

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  console.error('Error:', err);

  // Zod validation errors
  if (err instanceof ZodError) {
    return res.status(400).json(
      errorResponse(
        'Validation failed',
        'VALIDATION_ERROR',
        err.errors.map(e => ({
          field: e.path.join('.'),
          message: e.message,
        }))
      )
    );
  }

  // JWT errors
  if (err instanceof TokenExpiredError) {
    return res.status(401).json(
      errorResponse('Token expired', 'TOKEN_EXPIRED')
    );
  }

  if (err instanceof JsonWebTokenError) {
    return res.status(401).json(
      errorResponse('Invalid token', 'INVALID_TOKEN')
    );
  }

  // Operational errors
  if (err instanceof AppError) {
    return res.status(err.statusCode).json(
      errorResponse(err.message, err.code, err.details)
    );
  }

  // Unknown errors
  if (process.env.NODE_ENV === 'development') {
    return res.status(500).json(
      errorResponse(err.message, 'INTERNAL_ERROR', err.stack)
    );
  }

  return res.status(500).json(
    errorResponse('Internal server error', 'INTERNAL_ERROR')
  );
}

export function notFoundHandler(_req: Request, res: Response) {
  res.status(404).json(
    errorResponse('Route not found', 'NOT_FOUND')
  );
}

export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}