import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { prisma } from "@s-shoter/db";
import { registerSchema } from "@s-shoter/shared";
import { signIn } from "@/auth";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: {
          code: "VALIDATION_ERROR",
          message: parsed.error.issues[0]?.message ?? "Invalid input",
        },
      },
      { status: 400 },
    );
  }
  const { email, password } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json(
      { error: { code: "EMAIL_TAKEN", message: "Email already registered" } },
      { status: 409 },
    );
  }

  const passwordHash = await bcrypt.hash(password, 10);
  await prisma.user.create({ data: { email, passwordHash } });

  await signIn("credentials", { email, password, redirect: false });

  return NextResponse.json({ ok: true }, { status: 201 });
}
