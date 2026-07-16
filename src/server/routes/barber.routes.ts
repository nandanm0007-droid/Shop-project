import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { successResponse } from '../lib/response.js';
import { AppError } from '../lib/errors.js';

const router = Router();

router.get('/', asyncHandler(async (_req: Request, res: Response) => {
  const barbers = await prisma.barber.findMany({
    where: { active: true },
    include: {
      availability: {
        where: { active: true },
        select: { dayOfWeek: true, startTime: true, endTime: true },
      },
    },
    orderBy: { sortOrder: 'asc' },
  });

  res.json(successResponse({ barbers }));
}));

router.get('/:id', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const barber = await prisma.barber.findUnique({
    where: { id },
    include: {
      availability: {
        where: { active: true },
        select: { dayOfWeek: true, startTime: true, endTime: true },
      },
    },
  });

  if (!barber) {
    throw new AppError('Barber not found', 404, 'BARBER_NOT_FOUND');
  }

  res.json(successResponse({ barber }));
}));

export default router;
