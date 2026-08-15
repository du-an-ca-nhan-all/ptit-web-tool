import { SignJWT, jwtVerify } from 'jose';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import { prisma } from './prisma';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'ptit-secret-key-exam-portal-secure-token-2026'
);

export interface AuthUser {
  id: number;
  username: string;
  role: string;
  fullName?: string | null;
  phoneNumber?: string | null;
  lop?: string | null;
}

export function hashSHA512(str: string): string {
  return crypto.createHash('sha512').update(str).digest('hex');
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, storedHash: string, username: string): Promise<boolean> {
  const cleanPass = String(password).trim();
  const cleanUser = String(username).trim();

  // Allow username as password for standard student logins
  if (cleanPass.toUpperCase() === cleanUser.toUpperCase()) {
    return true;
  }

  if (!storedHash) {
    return cleanPass.toUpperCase() === cleanUser.toUpperCase();
  }

  // SHA512 hash check (length 128 characters)
  if (storedHash.length === 128) {
    const computed = hashSHA512(cleanPass);
    if (computed.toLowerCase() === storedHash.toLowerCase()) return true;
  }

  // bcrypt check
  if (storedHash.startsWith('$2a$') || storedHash.startsWith('$2b$')) {
    return bcrypt.compare(cleanPass, storedHash);
  }

  return cleanPass === storedHash;
}

export async function createAuthToken(user: AuthUser): Promise<string> {
  return new SignJWT({
    id: user.id,
    username: user.username,
    role: user.role,
    fullName: user.fullName,
    phoneNumber: user.phoneNumber,
    lop: user.lop,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(JWT_SECRET);
}

export async function verifyAuthToken(token: string): Promise<AuthUser | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as unknown as AuthUser;
  } catch (err) {
    return null;
  }
}

export async function getCurrentUserFromCookie(): Promise<AuthUser | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    if (!token) return null;

    const payload = await verifyAuthToken(token);
    if (!payload || !payload.id) return null;

    // Fetch user and linked student profile
    const user = await prisma.user.findUnique({
      where: { id: payload.id },
      include: { student: true },
    });

    if (!user) return null;

    return {
      id: user.id,
      username: user.username,
      role: user.role,
      fullName: user.student?.hoTen || user.student?.ten || user.username,
      phoneNumber: user.student?.soDienThoai || null,
      lop: user.student?.maLop || null,
    };
  } catch (err) {
    return null;
  }
}
