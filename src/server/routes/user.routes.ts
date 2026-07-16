import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { AppError } from '../lib/errors.js';
import { authenticate, AuthenticatedRequest, authorize } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { successResponse } from '../lib/response.js';

const router = Router();

// --- Schemas ---

const updateProfileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').optional(),
  phone: z.string().optional(),
  avatar: z.string().url('Invalid avatar URL').optional(),
});

const adminUpdateUserSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').optional(),
  phone: z.string().optional(),
  avatar: z.string().url('Invalid avatar URL').optional(),
  role: z.enum(['USER', 'ADMIN']).optional(),
});

// --- Helpers ---

const userSelect = {
  id: true,
  email: true,
  name: true,
  role: true,
  avatar: true,
  phone: true,
  emailVerified: true,
  createdAt: true,
  lastLoginAt: true,
} as const;

function sanitizeUser(user: any) {
  const { passwordHash, emailVerifyToken, emailVerifyExpires, resetToken, resetExpires, refreshTokens, ...sanitized } = user;
  return sanitized;
}

// --- Authenticated User Routes ---

// GET /api/users/me - Get current user profile
router.get('/me', authenticate, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.userId },
    select: userSelect,
  });

  if (!user) {
    throw new AppError('User not found', 404, 'USER_NOT_FOUND');
  }

  res.json(successResponse({ user }));
}));

// PATCH /api/users/me - Update own profile
router.patch('/me', authenticate, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const data = updateProfileSchema.parse(req.body);

  const user = await prisma.user.update({
    where: { id: req.user!.userId },
    data: {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.phone !== undefined && { phone: data.phone }),
      ...(data.avatar !== undefined && { avatar: data.avatar }),
    },
    select: userSelect,
  });

  res.json(successResponse({ user }, 'Profile updated successfully'));
}));

// GET /api/users/bookings - Get current user's bookings
router.get('/bookings', authenticate, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const bookings = await prisma.booking.findMany({
    where: { userId: req.user!.userId },
    include: {
      service: { select: { id: true, name: true, price: true, duration: true } },
      barber: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  res.json(successResponse({ bookings }));
}));

// DELETE /api/users/me - Delete own account
router.delete('/me', authenticate, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.userId },
  });

  if (!user) {
    throw new AppError('User not found', 404, 'USER_NOT_FOUND');
  }

  await prisma.user.delete({
    where: { id: req.user!.userId },
  });

  res.clearCookie('refreshToken', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
  });

  res.json(successResponse(null, 'Account deleted successfully'));
}));

// --- Admin Routes ---

// GET /api/users - List all users with pagination
router.get('/', authenticate, authorize('ADMIN'), asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 10));
  const skip = (page - 1) * limit;

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      skip,
      take: limit,
      select: userSelect,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.user.count(),
  ]);

  res.json(successResponse(
    { users },
    undefined,
    {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    }
  ));
}));

// GET /api/users/:id - Get specific user with bookings
router.get('/:id', authenticate, authorize('ADMIN'), asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;

  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      ...userSelect,
      bookings: {
        include: {
          service: { select: { id: true, name: true, price: true } },
          barber: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  if (!user) {
    throw new AppError('User not found', 404, 'USER_NOT_FOUND');
  }

  res.json(successResponse({ user }));
}));

// PATCH /api/users/:id - Update any user (admin only)
router.patch('/:id', authenticate, authorize('ADMIN'), asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const data = adminUpdateUserSchema.parse(req.body);

  const existingUser = await prisma.user.findUnique({
    where: { id },
  });

  if (!existingUser) {
    throw new AppError('User not found', 404, 'USER_NOT_FOUND');
  }

  const user = await prisma.user.update({
    where: { id },
    data: {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.phone !== undefined && { phone: data.phone }),
      ...(data.avatar !== undefined && { avatar: data.avatar }),
      ...(data.role !== undefined && { role: data.role }),
    },
    select: userSelect,
  });

  res.json(successResponse({ user }, 'User updated successfully'));
}));

export default router;
