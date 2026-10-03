"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { randomBytes } from "crypto";
import { z } from "zod";
import {
  createSession,
  destroySession,
  hashPassword,
  isSuspicious,
  recordLoginAttempt,
  verifyPassword,
} from "@/lib/auth";
import { prisma } from "@/lib/db";

function formString(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

async function clientIp() {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || null;
}

const loginSchema = z.object({
  email: z.email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

const registerSchema = z.object({
  email: z.email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  phone: z.string().optional(),
  salutation: z.string().optional(),
});

export type ActionState = {
  ok: boolean;
  errors?: string[];
  message?: string;
  resetLink?: string;
};

export async function loginAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = loginSchema.safeParse({
    email: formString(formData, "email"),
    password: formString(formData, "password"),
  });

  if (!parsed.success) {
    return { ok: false, errors: parsed.error.issues.map((i) => i.message) };
  }

  const ip = await clientIp();
  const user = await prisma.user.findUnique({
    where: { email: parsed.data.email.toLowerCase() },
  });

  const recentFails = await prisma.loginAttempt.count({
    where: {
      username: parsed.data.email.toLowerCase(),
      success: false,
      attemptedAt: { gte: new Date(Date.now() - 15 * 60 * 1000) },
    },
  });

  if (isSuspicious(recentFails)) {
    await recordLoginAttempt({
      username: parsed.data.email.toLowerCase(),
      success: false,
      ipAddress: ip,
      userId: user?.id,
    });
    return {
      ok: false,
      errors: ["Too many failed attempts. Wait 15 minutes and try again."],
    };
  }

  if (!user || user.status !== "ACTIVE") {
    await recordLoginAttempt({
      username: parsed.data.email.toLowerCase(),
      success: false,
      ipAddress: ip,
    });
    return { ok: false, errors: ["Invalid email or password."] };
  }

  const valid = await verifyPassword(parsed.data.password, user.passwordHash);
  await recordLoginAttempt({
    username: user.email,
    success: valid,
    ipAddress: ip,
    userId: user.id,
  });

  if (!valid) {
    return { ok: false, errors: ["Invalid email or password."] };
  }

  await createSession(user.id, ip);
  redirect(user.role === "ADMIN" ? "/admin" : "/account");
}

export async function registerAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = registerSchema.safeParse({
    email: formString(formData, "email"),
    password: formString(formData, "password"),
    firstName: formString(formData, "firstName"),
    lastName: formString(formData, "lastName"),
    phone: formString(formData, "phone") || undefined,
    salutation: formString(formData, "salutation") || undefined,
  });

  if (!parsed.success) {
    return { ok: false, errors: parsed.error.issues.map((i) => i.message) };
  }

  const email = parsed.data.email.toLowerCase();
  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) {
    return { ok: false, errors: ["An account with this email already exists."] };
  }

  const passwordHash = await hashPassword(parsed.data.password);
  const milesNumber = `SL-${randomBytes(3).toString("hex").toUpperCase()}`;

  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      role: "CUSTOMER",
      customer: {
        create: {
          firstName: parsed.data.firstName,
          lastName: parsed.data.lastName,
          phone: parsed.data.phone,
          salutation: parsed.data.salutation,
          milesAccount: {
            create: { number: milesNumber, flightMiles: 0, statusMiles: 0 },
          },
        },
      },
    },
  });

  const ip = await clientIp();
  await createSession(user.id, ip);
  redirect("/account");
}

export async function logoutAction() {
  await destroySession();
  redirect("/");
}

export async function requestResetAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const email = formString(formData, "email").toLowerCase();
  if (!email.includes("@")) {
    return { ok: false, errors: ["Enter a valid email."] };
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return {
      ok: true,
      message: "If that email exists, a reset link is ready below.",
    };
  }

  const resetToken = randomBytes(24).toString("hex");
  const resetExpires = new Date(Date.now() + 60 * 60 * 1000);
  await prisma.user.update({
    where: { id: user.id },
    data: { resetToken, resetExpires },
  });

  return {
    ok: true,
    message: "Demo reset link generated (no email provider).",
    resetLink: `/auth/reset-password?token=${resetToken}`,
  };
}

export async function resetPasswordAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const token = formString(formData, "token");
  const password = formString(formData, "password");
  if (!token || password.length < 8) {
    return {
      ok: false,
      errors: ["Token is required and password must be at least 8 characters."],
    };
  }

  const user = await prisma.user.findFirst({
    where: { resetToken: token, resetExpires: { gt: new Date() } },
  });

  if (!user) {
    return { ok: false, errors: ["Reset link is invalid or expired."] };
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash: await hashPassword(password),
      resetToken: null,
      resetExpires: null,
    },
  });

  return { ok: true, message: "Password updated. You can sign in now." };
}
