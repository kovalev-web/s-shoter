import { NextResponse } from "next/server";
import { prisma } from "@s-shoter/db";
import { frameCreateSchema } from "@s-shoter/shared";
import { getCurrentUserId } from "@/lib/get-current-user";
import { toFrameDto } from "@/lib/frame-dto";

function unauthorized() {
  return NextResponse.json(
    { error: { code: "UNAUTHORIZED", message: "Not authenticated" } },
    { status: 401 },
  );
}

export async function GET(req: Request) {
  const userId = await getCurrentUserId(req);
  if (!userId) return unauthorized();

  const frames = await prisma.frame.findMany({ where: { userId } });
  return NextResponse.json({ items: frames.map(toFrameDto) });
}

export async function POST(req: Request) {
  const userId = await getCurrentUserId(req);
  if (!userId) return unauthorized();

  const body = await req.json().catch(() => null);
  const parsed = frameCreateSchema.safeParse(body);
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

  const frame = await prisma.frame.create({ data: { userId, ...parsed.data } });
  return NextResponse.json(toFrameDto(frame), { status: 201 });
}
