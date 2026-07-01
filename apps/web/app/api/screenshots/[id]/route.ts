import { NextResponse } from "next/server";
import { prisma } from "@s-shoter/db";
import { screenshotPositionSchema } from "@s-shoter/shared";
import { getCurrentUserId } from "@/lib/get-current-user";
import { deleteScreenshotFile } from "@/lib/storage";
import { toScreenshotDto } from "@/lib/screenshot-dto";

function unauthorized() {
  return NextResponse.json(
    { error: { code: "UNAUTHORIZED", message: "Not authenticated" } },
    { status: 401 },
  );
}

function notFound() {
  return NextResponse.json(
    { error: { code: "NOT_FOUND", message: "Screenshot not found" } },
    { status: 404 },
  );
}

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getCurrentUserId(req);
  if (!userId) return unauthorized();

  const { id } = await params;
  const screenshot = await prisma.screenshot.findUnique({ where: { id } });
  if (!screenshot || screenshot.userId !== userId) return notFound();

  return NextResponse.json(toScreenshotDto(screenshot));
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getCurrentUserId(req);
  if (!userId) return unauthorized();

  const { id } = await params;
  const screenshot = await prisma.screenshot.findUnique({ where: { id } });
  if (!screenshot || screenshot.userId !== userId) return notFound();

  const body = await req.json().catch(() => null);
  const parsed = screenshotPositionSchema.safeParse(body);
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

  const updated = await prisma.screenshot.update({
    where: { id },
    data: parsed.data,
  });

  return NextResponse.json(toScreenshotDto(updated));
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getCurrentUserId(req);
  if (!userId) return unauthorized();

  const { id } = await params;
  const screenshot = await prisma.screenshot.findUnique({ where: { id } });
  if (!screenshot || screenshot.userId !== userId) return notFound();

  await prisma.screenshot.delete({ where: { id } });
  await deleteScreenshotFile(screenshot.storageKey);

  return NextResponse.json({ ok: true });
}
