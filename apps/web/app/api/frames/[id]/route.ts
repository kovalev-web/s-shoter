import { NextResponse } from "next/server";
import { prisma } from "@s-shoter/db";
import { framePatchSchema } from "@s-shoter/shared";
import { getCurrentUserId } from "@/lib/get-current-user";
import { toFrameDto } from "@/lib/frame-dto";

function unauthorized() {
  return NextResponse.json(
    { error: { code: "UNAUTHORIZED", message: "Not authenticated" } },
    { status: 401 },
  );
}

function notFound() {
  return NextResponse.json(
    { error: { code: "NOT_FOUND", message: "Frame not found" } },
    { status: 404 },
  );
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getCurrentUserId(req);
  if (!userId) return unauthorized();

  const { id } = await params;
  const frame = await prisma.frame.findUnique({ where: { id } });
  if (!frame || frame.userId !== userId) return notFound();

  const body = await req.json().catch(() => null);
  const parsed = framePatchSchema.safeParse(body);
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

  const updated = await prisma.frame.update({ where: { id }, data: parsed.data });
  return NextResponse.json(toFrameDto(updated));
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getCurrentUserId(req);
  if (!userId) return unauthorized();

  const { id } = await params;
  const frame = await prisma.frame.findUnique({ where: { id } });
  if (!frame || frame.userId !== userId) return notFound();

  await prisma.frame.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
