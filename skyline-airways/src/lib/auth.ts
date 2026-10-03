import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";
import { prisma } from "./db";

const SESSION_COOKIE = "skyline_session";
const SESSION_DAYS = 7;

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export function createSessionToken() {
  return randomBytes(32).toString("hex");
}

export async function createSession(userId: number, ipAddress?: string | null) {
  const token = createSessionToken();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + SESSION_DAYS);

  await prisma.session.create({
    data: { userId, token, ipAddress: ipAddress ?? null, expiresAt },
  });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });

  return token;
}

export async function destroySession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (token) {
    await prisma.session.deleteMany({ where: { token } });
    cookieStore.delete(SESSION_COOKIE);
  }
}

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const session = await prisma.session.findUnique({
    where: { token },
    include: {
      user: {
        include: {
          customer: { include: { milesAccount: true } },
          admin: true,
        },
      },
    },
  });

  if (!session || session.expiresAt < new Date()) {
    if (session) await prisma.session.delete({ where: { id: session.id } });
    return null;
  }

  if (session.user.status !== "ACTIVE") return null;
  return session.user;
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/login");
  return user;
}

export async function requireAdmin() {
  const user = await requireUser();
  if (user.role !== "ADMIN") redirect("/");
  return user;
}

export async function recordLoginAttempt(opts: {
  username: string;
  success: boolean;
  ipAddress?: string | null;
  userId?: number | null;
}) {
  await prisma.loginAttempt.create({
    data: {
      username: opts.username,
      success: opts.success,
      ipAddress: opts.ipAddress ?? null,
      userId: opts.userId ?? null,
    },
  });
}

export function isSuspicious(recentFails: number) {
  return recentFails >= 5;
}

export function bookingRef() {
  return `SL${randomBytes(3).toString("hex").toUpperCase()}`;
}

export function ticketNo() {
  return `TKT${randomBytes(4).toString("hex").toUpperCase()}`;
}

export function transactionRef() {
  return `TXN${randomBytes(4).toString("hex").toUpperCase()}`;
}
