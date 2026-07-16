import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { AppError } from '../lib/errors.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { successResponse } from '../lib/response.js';

const router = Router();

router.use(authenticate, authorize('ADMIN'));

// --- Validation Schemas ---

const updateBookingStatusSchema = z.object({
  status: z.enum(['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'NO_SHOW']),
});

const createServiceSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  description: z.string().min(1, 'Description is required'),
  price: z.number().int().positive('Price must be a positive integer'),
  duration: z.number().int().positive('Duration must be a positive integer'),
  category: z.enum(['HAIRCUTS', 'BEARD_AND_SHAVE', 'SPA_AND_FACIALS', 'PREMIUM']),
  icon: z.string().optional(),
  image: z.string().optional(),
  featured: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
});

const updateServiceSchema = z.object({
  name: z.string().min(2).optional(),
  description: z.string().min(1).optional(),
  price: z.number().int().positive().optional(),
  duration: z.number().int().positive().optional(),
  category: z.enum(['HAIRCUTS', 'BEARD_AND_SHAVE', 'SPA_AND_FACIALS', 'PREMIUM']).optional(),
  icon: z.string().optional(),
  image: z.string().optional(),
  featured: z.boolean().optional(),
  active: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
});

const createBarberSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  title: z.string().min(2, 'Title must be at least 2 characters'),
  specialties: z.array(z.string()).optional(),
  bio: z.string().optional(),
  image: z.string().optional(),
  sortOrder: z.number().int().optional(),
});

const updateBarberSchema = z.object({
  name: z.string().min(2).optional(),
  title: z.string().min(2).optional(),
  specialties: z.array(z.string()).optional(),
  bio: z.string().optional(),
  image: z.string().optional(),
  active: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
});

const updateSettingSchema = z.object({
  value: z.string().min(1, 'Value is required'),
});

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

// GET /dashboard
router.get('/dashboard', asyncHandler(async (_req: Request, res: Response) => {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  const [
    totalUsers,
    totalBookingsToday,
    revenueAgg,
    pendingBookings,
    activeBarbers,
    availableServices,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.booking.count({
      where: { date: { gte: todayStart, lte: todayEnd } },
    }),
    prisma.booking.aggregate({
      _sum: { total: true },
      where: { status: 'COMPLETED' },
    }),
    prisma.booking.count({ where: { status: 'PENDING' } }),
    prisma.barber.count({ where: { active: true } }),
    prisma.service.count({ where: { active: true } }),
  ]);

  res.json(successResponse({
    totalUsers,
    totalBookingsToday,
    totalRevenue: revenueAgg._sum.total ?? 0,
    pendingBookings,
    activeBarbers,
    availableServices,
  }));
}));

// GET /bookings
router.get('/bookings', asyncHandler(async (req: Request, res: Response) => {
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 10));
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = {};

  if (req.query.status) {
    where.status = req.query.status;
  }

  if (req.query.barberId) {
    where.barberId = req.query.barberId;
  }

  if (req.query.from || req.query.to) {
    const dateFilter: Record<string, Date> = {};
    if (req.query.from) dateFilter.gte = new Date(req.query.from as string);
    if (req.query.to) dateFilter.lte = new Date(req.query.to as string);
    where.date = dateFilter;
  }

  const [bookings, total] = await Promise.all([
    prisma.booking.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, email: true, phone: true, avatar: true } },
        service: { select: { id: true, name: true, slug: true, price: true, duration: true, category: true } },
        barber: { select: { id: true, name: true, title: true, image: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.booking.count({ where }),
  ]);

  res.json(successResponse(bookings, undefined, {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  }));
}));

// PATCH /bookings/:id
router.patch('/bookings/:id', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { status } = updateBookingStatusSchema.parse(req.body);

  const booking = await prisma.booking.findUnique({ where: { id } });
  if (!booking) {
    throw new AppError('Booking not found', 404, 'BOOKING_NOT_FOUND');
  }

  const updated = await prisma.booking.update({
    where: { id },
    data: {
      status,
      ...(status === 'CANCELLED' ? { cancelledAt: new Date() } : {}),
    },
    include: {
      user: { select: { id: true, name: true, email: true, phone: true } },
      service: { select: { id: true, name: true, price: true, duration: true } },
      barber: { select: { id: true, name: true, title: true } },
    },
  });

  res.json(successResponse(updated, 'Booking status updated'));
}));

// GET /users
router.get('/users', asyncHandler(async (_req: Request, res: Response) => {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      avatar: true,
      phone: true,
      emailVerified: true,
      createdAt: true,
      lastLoginAt: true,
      _count: { select: { bookings: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  res.json(successResponse(users));
}));

// POST /services
router.post('/services', asyncHandler(async (req: Request, res: Response) => {
  const data = createServiceSchema.parse(req.body);
  const slug = slugify(data.name);

  const existing = await prisma.service.findUnique({ where: { slug } });
  if (existing) {
    throw new AppError('A service with this name already exists', 409, 'SLUG_CONFLICT');
  }

  const service = await prisma.service.create({ data: { ...data, slug } });
  res.status(201).json(successResponse(service, 'Service created'));
}));

// PATCH /services/:id
router.patch('/services/:id', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const data = updateServiceSchema.parse(req.body);

  const service = await prisma.service.findUnique({ where: { id } });
  if (!service) {
    throw new AppError('Service not found', 404, 'SERVICE_NOT_FOUND');
  }

  const updateData: Record<string, unknown> = { ...data };
  if (data.name && data.name !== service.name) {
    updateData.slug = slugify(data.name);
    const existing = await prisma.service.findUnique({ where: { slug: updateData.slug as string } });
    if (existing && existing.id !== id) {
      throw new AppError('A service with this name already exists', 409, 'SLUG_CONFLICT');
    }
  }

  const updated = await prisma.service.update({ where: { id }, data: updateData });
  res.json(successResponse(updated, 'Service updated'));
}));

// DELETE /services/:id
router.delete('/services/:id', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const service = await prisma.service.findUnique({ where: { id } });
  if (!service) {
    throw new AppError('Service not found', 404, 'SERVICE_NOT_FOUND');
  }

  const bookingCount = await prisma.booking.count({ where: { serviceId: id } });
  if (bookingCount > 0) {
    throw new AppError('Cannot delete service with existing bookings. Deactivate it instead.', 400, 'HAS_BOOKINGS');
  }

  await prisma.service.delete({ where: { id } });
  res.json(successResponse(null, 'Service deleted'));
}));

// POST /barbers
router.post('/barbers', asyncHandler(async (req: Request, res: Response) => {
  const data = createBarberSchema.parse(req.body);
  const barber = await prisma.barber.create({ data });
  res.status(201).json(successResponse(barber, 'Barber created'));
}));

// PATCH /barbers/:id
router.patch('/barbers/:id', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const data = updateBarberSchema.parse(req.body);

  const barber = await prisma.barber.findUnique({ where: { id } });
  if (!barber) {
    throw new AppError('Barber not found', 404, 'BARBER_NOT_FOUND');
  }

  const updated = await prisma.barber.update({ where: { id }, data });
  res.json(successResponse(updated, 'Barber updated'));
}));

// DELETE /barbers/:id
router.delete('/barbers/:id', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const barber = await prisma.barber.findUnique({ where: { id } });
  if (!barber) {
    throw new AppError('Barber not found', 404, 'BARBER_NOT_FOUND');
  }

  const bookingCount = await prisma.booking.count({ where: { barberId: id } });
  if (bookingCount > 0) {
    throw new AppError('Cannot delete barber with existing bookings. Deactivate them instead.', 400, 'HAS_BOOKINGS');
  }

  await prisma.barber.delete({ where: { id } });
  res.json(successResponse(null, 'Barber deleted'));
}));

// GET /settings
router.get('/settings', asyncHandler(async (_req: Request, res: Response) => {
  const settings = await prisma.setting.findMany({ orderBy: { key: 'asc' } });
  res.json(successResponse(settings));
}));

// PATCH /settings/:key
router.patch('/settings/:key', asyncHandler(async (req: Request, res: Response) => {
  const { key } = req.params;
  const { value } = updateSettingSchema.parse(req.body);

  const setting = await prisma.setting.upsert({
    where: { key },
    update: { value },
    create: { key, value },
  });

  res.json(successResponse(setting, 'Setting updated'));
}));

export default router;
