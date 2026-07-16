import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { AppError } from '../lib/errors.js';
import { authenticate, authorize, AuthenticatedRequest } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { successResponse } from '../lib/response.js';
import { ServiceCategory } from '@prisma/client';

const router = Router();

const createServiceSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  slug: z.string().min(1, 'Slug is required'),
  description: z.string().min(1, 'Description is required'),
  price: z.number().int().positive('Price must be a positive integer'),
  duration: z.number().int().positive('Duration must be a positive integer'),
  category: z.nativeEnum(ServiceCategory),
  icon: z.string().optional(),
  image: z.string().optional(),
  featured: z.boolean().optional(),
  active: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
});

const updateServiceSchema = z.object({
  name: z.string().min(1).optional(),
  slug: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
  price: z.number().int().positive().optional(),
  duration: z.number().int().positive().optional(),
  category: z.nativeEnum(ServiceCategory).optional(),
  icon: z.string().optional(),
  image: z.string().optional(),
  featured: z.boolean().optional(),
  active: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
});

router.get('/', asyncHandler(async (req: Request, res: Response) => {
  const { category, featured } = req.query;

  const where: Record<string, unknown> = { active: true };

  if (category && typeof category === 'string') {
    where.category = category;
  }

  if (featured === 'true') {
    where.featured = true;
  }

  const services = await prisma.service.findMany({
    where,
    orderBy: { sortOrder: 'asc' },
  });

  res.json(successResponse({ services }));
}));

router.get('/:slug', asyncHandler(async (req: Request, res: Response) => {
  const { slug } = req.params;

  const service = await prisma.service.findUnique({
    where: { slug },
  });

  if (!service) {
    throw new AppError('Service not found', 404, 'SERVICE_NOT_FOUND');
  }

  res.json(successResponse({ service }));
}));

router.post('/', authenticate, authorize('ADMIN'), asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const data = createServiceSchema.parse(req.body);

  const existing = await prisma.service.findUnique({
    where: { slug: data.slug },
  });

  if (existing) {
    throw new AppError('A service with this slug already exists', 409, 'SLUG_EXISTS');
  }

  const service = await prisma.service.create({ data });

  res.status(201).json(successResponse({ service }, 'Service created successfully'));
}));

router.patch('/:id', authenticate, authorize('ADMIN'), asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const data = updateServiceSchema.parse(req.body);

  const service = await prisma.service.findUnique({
    where: { id },
  });

  if (!service) {
    throw new AppError('Service not found', 404, 'SERVICE_NOT_FOUND');
  }

  if (data.slug && data.slug !== service.slug) {
    const existing = await prisma.service.findUnique({
      where: { slug: data.slug },
    });

    if (existing) {
      throw new AppError('A service with this slug already exists', 409, 'SLUG_EXISTS');
    }
  }

  const updated = await prisma.service.update({
    where: { id },
    data,
  });

  res.json(successResponse({ service: updated }, 'Service updated successfully'));
}));

router.delete('/:id', authenticate, authorize('ADMIN'), asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;

  const service = await prisma.service.findUnique({
    where: { id },
  });

  if (!service) {
    throw new AppError('Service not found', 404, 'SERVICE_NOT_FOUND');
  }

  await prisma.service.delete({
    where: { id },
  });

  res.json(successResponse(null, 'Service deleted successfully'));
}));

export default router;
