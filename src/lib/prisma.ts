import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient(): PrismaClient {
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });
}

let client = globalForPrisma.prisma;
if (!client || (client as any).telegramConfig === undefined || (client as any).telegramGlobalConfig === undefined) {
  client = createPrismaClient();
  if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = client;
  }
}

export const prisma = client;

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

