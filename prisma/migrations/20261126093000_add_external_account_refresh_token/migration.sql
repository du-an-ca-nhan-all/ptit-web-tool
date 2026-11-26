-- AlterTable
ALTER TABLE "ExternalAccount" ALTER COLUMN "extPassword" SET DEFAULT '';
ALTER TABLE "ExternalAccount" ADD COLUMN "refreshToken" TEXT;
ALTER TABLE "ExternalAccount" ADD COLUMN "tokenExpiresAt" TIMESTAMP(3);
ALTER TABLE "ExternalAccount" ADD COLUMN "refreshTokenExpiresAt" TIMESTAMP(3);
ALTER TABLE "ExternalAccount" ADD COLUMN "lastTokenRefreshedAt" TIMESTAMP(3);
