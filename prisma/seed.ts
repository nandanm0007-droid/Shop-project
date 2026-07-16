import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const services = [
  {
    name: 'The Signature Cut',
    slug: 'signature-cut',
    description: 'A precision haircut tailored to your face shape and style preferences, finished with a hot towel and light hold product.',
    price: 150,
    duration: 45,
    category: 'HAIRCUTS' as const,
    icon: 'content_cut',
    sortOrder: 1,
  },
  {
    name: 'The Executive Fade',
    slug: 'executive-fade',
    description: 'Crisp, clean fade with scissor-over-comb texturing on top. Perfect for the modern professional.',
    price: 200,
    duration: 45,
    category: 'HAIRCUTS' as const,
    icon: 'face',
    sortOrder: 2,
  },
  {
    name: 'Long Form Grooming',
    slug: 'long-form',
    description: 'Comprehensive grooming for longer hair including layered cutting, thinning, and styling consultation.',
    price: 150,
    duration: 60,
    category: 'HAIRCUTS' as const,
    icon: 'straighten',
    sortOrder: 3,
  },
  {
    name: 'Hot Towel Shave',
    slug: 'hot-towel-shave',
    description: 'A traditional straight-razor shave with steamed towel prep, pre-shave oil, and soothing aftershave balm.',
    price: 100,
    duration: 40,
    category: 'BEARD_AND_SHAVE' as const,
    icon: 'water_drop',
    sortOrder: 4,
  },
  {
    name: 'Atelier Beard Sculpt',
    slug: 'beard-sculpt',
    description: 'Expert beard shaping, trimming, and conditioning to keep your beard looking its best.',
    price: 100,
    duration: 30,
    category: 'BEARD_AND_SHAVE' as const,
    icon: 'spa',
    sortOrder: 5,
  },
  {
    name: 'The Atelier Experience',
    slug: 'atelier-exp',
    description: 'Our flagship service — a premium haircut, hot towel shave, and scalp massage in one luxurious session.',
    price: 450,
    duration: 90,
    category: 'PREMIUM' as const,
    featured: true,
    icon: 'star',
    sortOrder: 6,
  },
  {
    name: 'Revitalizing Facial',
    slug: 'revitalizing',
    description: 'Deep-cleansing facial with exfoliation, steam, mask, and moisturizer to refresh and rejuvenate your skin.',
    price: 350,
    duration: 45,
    category: 'SPA_AND_FACIALS' as const,
    icon: 'self_improvement',
    sortOrder: 7,
  },
  {
    name: 'Scalp Detox Treatment',
    slug: 'scalp-detox',
    description: 'Clarifying scalp treatment with essential oils and massage to remove buildup and promote healthy hair growth.',
    price: 200,
    duration: 25,
    category: 'SPA_AND_FACIALS' as const,
    icon: 'air',
    sortOrder: 8,
  },
];

const barbers = [
  {
    name: 'Julian Vance',
    title: 'Master Stylist',
    specialties: ['Beards', 'Classic'],
    sortOrder: 1,
  },
  {
    name: 'Elias Thorne',
    title: 'Texture Specialist',
    specialties: ['Modern', 'Fade'],
    sortOrder: 2,
  },
  {
    name: 'Marcus Reed',
    title: 'Creative Director',
    specialties: ['Executive', 'Consult'],
    sortOrder: 3,
  },
];

async function main() {
  // Upsert services
  for (const svc of services) {
    await prisma.service.upsert({
      where: { slug: svc.slug },
      update: {
        name: svc.name,
        description: svc.description,
        price: svc.price,
        duration: svc.duration,
        category: svc.category,
        icon: svc.icon,
        featured: svc.featured ?? false,
        sortOrder: svc.sortOrder,
      },
      create: {
        name: svc.name,
        slug: svc.slug,
        description: svc.description,
        price: svc.price,
        duration: svc.duration,
        category: svc.category,
        icon: svc.icon,
        featured: svc.featured ?? false,
        sortOrder: svc.sortOrder,
      },
    });
  }

  // Upsert barbers
  for (const b of barbers) {
    await prisma.barber.upsert({
      where: { id: b.name.toLowerCase().replace(/\s+/g, '-') },
      update: {
        name: b.name,
        title: b.title,
        specialties: b.specialties,
        sortOrder: b.sortOrder,
      },
      create: {
        id: b.name.toLowerCase().replace(/\s+/g, '-'),
        name: b.name,
        title: b.title,
        specialties: b.specialties,
        sortOrder: b.sortOrder,
      },
    });
  }

  // Upsert availability for each barber (Mon–Sat, 09:00–19:00)
  for (const b of barbers) {
    const barberId = b.name.toLowerCase().replace(/\s+/g, '-');
    for (let dayOfWeek = 1; dayOfWeek <= 6; dayOfWeek++) {
      await prisma.availability.upsert({
        where: { barberId_dayOfWeek: { barberId, dayOfWeek } },
        update: {
          startTime: '09:00',
          endTime: '19:00',
        },
        create: {
          barberId,
          dayOfWeek,
          startTime: '09:00',
          endTime: '19:00',
        },
      });
    }
  }

  // Upsert admin user
  const passwordHash = await bcrypt.hash('admin123!', 12);
  await prisma.user.upsert({
    where: { email: 'admin@shalimar.com' },
    update: {
      name: 'Admin',
      passwordHash,
      role: 'ADMIN',
    },
    create: {
      email: 'admin@shalimar.com',
      name: 'Admin',
      passwordHash,
      role: 'ADMIN',
      emailVerified: true,
    },
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
