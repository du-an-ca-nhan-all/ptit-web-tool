import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient(): PrismaClient {
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });
}

export function getPrismaClient(): PrismaClient {
  let client = globalForPrisma.prisma;
  if (
    !client ||
    (client as any).telegramConfig === undefined ||
    (client as any).telegramGlobalConfig === undefined ||
    (client as any).examReminderLog === undefined ||
    (client as any).qldtAnnouncementLog === undefined
  ) {
    client = createPrismaClient();
    if (process.env.NODE_ENV !== 'production') {
      globalForPrisma.prisma = client;
    }
  }
  return client;
}

export const prisma: PrismaClient = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    const client = getPrismaClient();
    const value = (client as any)[prop];
    if (typeof value === 'function') {
      return value.bind(client);
    }
    return value;
  },
});
