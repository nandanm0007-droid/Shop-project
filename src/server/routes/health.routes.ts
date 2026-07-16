import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { successResponse } from '../lib/response.js';

const router = Router();

// GET /api/health
router.get('/health', asyncHandler(async (_req: Request, res: Response) => {
  let dbStatus = 'healthy';

  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch {
    dbStatus = 'unhealthy';
  }

  res.json(successResponse({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    db: dbStatus,
  }));
}));

// GET /api/health/ping
router.get('/health/ping', asyncHandler(async (_req: Request, res: Response) => {
  res.json(successResponse({ message: 'pong' }));
}));

export default router;
