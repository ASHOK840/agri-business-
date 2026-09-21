import { PrismaClient } from '@prisma/client';

// A single shared Prisma Client instance for the whole backend.
// Prevents exhausting database connections when ts-node-dev reloads
// the app on every file save during development.

declare global {
  // eslint-disable-next-line no-var
  var __prismaClient: PrismaClient | undefined;
}

const prisma = global.__prismaClient ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  global.__prismaClient = prisma;
}

export default prisma;
