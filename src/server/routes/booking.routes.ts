import { Router, Request, Response } from 'express';
import { z } from 'zod';
import crypto from 'crypto';
import { prisma } from '../lib/prisma.js';
import { authenticate, AuthenticatedRequest, optionalAuth } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { successResponse } from '../lib/response.js';
import { AppError } from '../lib/errors.js';

const router = Router();

const createBookingSchema = z.object({
  serviceId: z.string().min(1, 'Service is required'),
  barberId: z.string().min(1, 'Barber is required'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  time: z.string().regex(/^\d{1,2}:\d{2}\s?(?:AM|PM)$/i, 'Time must be like 10:30 AM'),
  notes: z.string().optional(),
});

const updateStatusSchema = z.object({
  status: z.enum(['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'NO_SHOW']),
});

const checkAvailabilitySchema = z.object({
  barberId: z.string().min(1, 'Barber ID is required'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  time: z.string().regex(/^\d{1,2}:\d{2}\s?(?:AM|PM)$/i, 'Time must be like 10:30 AM'),
});

function generateBookingId(): string {
  const suffix = crypto.randomBytes(4).toString('hex').toUpperCase();
  return `SHL-${suffix}`;
}

function parseTimeToMinutes(timeStr: string): number {
  const normalized = timeStr.toUpperCase().replace(/\s+/g, ' ');
  const match = normalized.match(/^(\d{1,2}):(\d{2})\s?(AM|PM)$/);
  if (!match) return -1;
  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const meridian = match[3];
  if (meridian === 'PM' && hours !== 12) hours += 12;
  if (meridian === 'AM' && hours === 12) hours = 0;
  return hours * 60 + minutes;
}

router.post('/', authenticate, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const data = createBookingSchema.parse(req.body);

  const service = await prisma.service.findUnique({ where: { id: data.serviceId } });
  if (!service || !service.active) {
    throw new AppError('Service not found or unavailable', 404, 'SERVICE_NOT_FOUND');
  }

  const barber = await prisma.barber.findUnique({ where: { id: data.barberId } });
  if (!barber || !barber.active) {
    throw new AppError('Barber not found or unavailable', 404, 'BARBER_NOT_FOUND');
  }

  const bookingDate = new Date(data.date + 'T00:00:00.000Z');
  const dayOfWeek = bookingDate.getUTCDay();

  const availability = await prisma.availability.findUnique({
    where: {
      barberId_dayOfWeek: {
        barberId: data.barberId,
        dayOfWeek,
      },
    },
  });
  if (!availability || !availability.active) {
    throw new AppError('Barber is not available on this day', 400, 'BARBER_UNAVAILABLE');
  }

  const requestedMinutes = parseTimeToMinutes(data.time);
  const startMinutes = parseTimeToMinutes(availability.startTime);
  const endMinutes = parseTimeToMinutes(availability.endTime);
  if (requestedMinutes < startMinutes || requestedMinutes + service.duration > endMinutes) {
    throw new AppError('Requested time is outside barber availability hours', 400, 'TIME_UNAVAILABLE');
  }

  const existingBooking = await prisma.booking.findFirst({
    where: {
      barberId: data.barberId,
      date: bookingDate,
      time: data.time,
      status: { notIn: ['CANCELLED', 'NO_SHOW'] },
    },
  });
  if (existingBooking) {
    throw new AppError('This time slot is already booked', 409, 'SLOT_TAKEN');
  }

  let bookingId = generateBookingId();
  while (await prisma.booking.findUnique({ where: { bookingId } })) {
    bookingId = generateBookingId();
  }

  const booking = await prisma.booking.create({
    data: {
      bookingId,
      userId: req.user!.userId,
      serviceId: data.serviceId,
      barberId: data.barberId,
      date: bookingDate,
      time: data.time,
      total: service.price,
      notes: data.notes || null,
    },
    include: {
      service: true,
      barber: true,
    },
  });

  res.status(201).json(successResponse({ booking }, 'Booking created successfully'));
}));

router.get('/', authenticate, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 10));
  const status = req.query.status as string | undefined;

  const where: Record<string, unknown> = { userId: req.user!.userId };
  if (status) {
    where.status = status;
  }

  const [bookings, total] = await Promise.all([
    prisma.booking.findMany({
      where,
      include: { service: true, barber: true },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.booking.count({ where }),
  ]);

  res.json(successResponse(
    { bookings },
    undefined,
    { page, limit, total, totalPages: Math.ceil(total / limit) },
  ));
}));

router.get('/:id', authenticate, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const booking = await prisma.booking.findUnique({
    where: { bookingId: req.params.id },
    include: {
      service: true,
      barber: true,
      user: { select: { id: true, name: true, email: true, phone: true } },
    },
  });

  if (!booking) {
    throw new AppError('Booking not found', 404, 'BOOKING_NOT_FOUND');
  }

  if (booking.userId !== req.user!.userId && req.user!.role !== 'ADMIN') {
    throw new AppError('Access denied', 403, 'ACCESS_DENIED');
  }

  res.json(successResponse({ booking }));
}));

router.patch('/:id', authenticate, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  if (req.user!.role !== 'ADMIN') {
    throw new AppError('Admin access required', 403, 'ADMIN_REQUIRED');
  }

  const { status } = updateStatusSchema.parse(req.body);

  const booking = await prisma.booking.findUnique({
    where: { bookingId: req.params.id },
  });

  if (!booking) {
    throw new AppError('Booking not found', 404, 'BOOKING_NOT_FOUND');
  }

  const updateData: Record<string, unknown> = { status };
  if (status === 'CANCELLED') {
    updateData.cancelledAt = new Date();
  }

  const updated = await prisma.booking.update({
    where: { id: booking.id },
    data: updateData,
    include: { service: true, barber: true },
  });

  res.json(successResponse({ booking: updated }, 'Booking status updated'));
}));

router.delete('/:id', authenticate, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const booking = await prisma.booking.findUnique({
    where: { bookingId: req.params.id },
  });

  if (!booking) {
    throw new AppError('Booking not found', 404, 'BOOKING_NOT_FOUND');
  }

  if (booking.userId !== req.user!.userId && req.user!.role !== 'ADMIN') {
    throw new AppError('Access denied', 403, 'ACCESS_DENIED');
  }

  if (booking.status === 'CANCELLED') {
    throw new AppError('Booking is already cancelled', 400, 'ALREADY_CANCELLED');
  }

  const cancelled = await prisma.booking.update({
    where: { id: booking.id },
    data: {
      status: 'CANCELLED',
      cancelledAt: new Date(),
    },
    include: { service: true, barber: true },
  });

  res.json(successResponse({ booking: cancelled }, 'Booking cancelled successfully'));
}));

router.post('/check-availability', asyncHandler(async (req: Request, res: Response) => {
  const data = checkAvailabilitySchema.parse(req.body);

  const bookingDate = new Date(data.date + 'T00:00:00.000Z');
  const dayOfWeek = bookingDate.getUTCDay();

  const barber = await prisma.barber.findUnique({ where: { id: data.barberId } });
  if (!barber || !barber.active) {
    res.json(successResponse({ available: false }));
    return;
  }

  const availability = await prisma.availability.findUnique({
    where: {
      barberId_dayOfWeek: {
        barberId: data.barberId,
        dayOfWeek,
      },
    },
  });
  if (!availability || !availability.active) {
    res.json(successResponse({ available: false }));
    return;
  }

  const requestedMinutes = parseTimeToMinutes(data.time);
  const startMinutes = parseTimeToMinutes(availability.startTime);
  const endMinutes = parseTimeToMinutes(availability.endTime);
  if (requestedMinutes < startMinutes || requestedMinutes >= endMinutes) {
    res.json(successResponse({ available: false }));
    return;
  }

  const conflicting = await prisma.booking.findFirst({
    where: {
      barberId: data.barberId,
      date: bookingDate,
      time: data.time,
      status: { notIn: ['CANCELLED', 'NO_SHOW'] },
    },
  });

  res.json(successResponse({ available: !conflicting }));
}));

export default router;
