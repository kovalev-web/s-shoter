import { NextResponse } from "next/server";
import { prisma } from "@s-shoter/db";
import { getCurrentUserId } from "@/lib/get-current-user";

export async function GET(req: Request) {
  const userId = await getCurrentUserId(req);
  if (!userId) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "Not authenticated" } },
      { status: 401 },
    );
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, createdAt: true },
  });

  return NextResponse.json({ user });
}
