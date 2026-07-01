import { NextResponse } from "next/server";
import { prisma } from "@s-shoter/db";
import { boardPatchSchema } from "@s-shoter/shared";
import { getCurrentUserId } from "@/lib/get-current-user";
import { deleteScreenshotFile } from "@/lib/storage";
import { toBoardDto } from "@/lib/board-dto";

function unauthorized() {
  return NextResponse.json(
    { error: { code: "UNAUTHORIZED", message: "Not authenticated" } },
    { status: 401 },
  );
}

function notFound() {
  return NextResponse.json(
    { error: { code: "NOT_FOUND", message: "Board not found" } },
    { status: 404 },
  );
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getCurrentUserId(req);
  if (!userId) return unauthorized();

  const { id } = await params;
  const board = await prisma.board.findUnique({ where: { id } });
  if (!board || board.userId !== userId) return notFound();

  const body = await req.json().catch(() => null);
  const parsed = boardPatchSchema.safeParse(body);
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

  const updated = await prisma.board.update({ where: { id }, data: parsed.data });
  return NextResponse.json(toBoardDto(updated));
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getCurrentUserId(req);
  if (!userId) return unauthorized();

  const { id } = await params;
  const board = await prisma.board.findUnique({ where: { id } });
  if (!board || board.userId !== userId) return notFound();

  // Delete the image files before the DB rows, so a mid-crash never leaves
  // an orphaned file with no record pointing back to it.
  const screenshots = await prisma.screenshot.findMany({
    where: { boardId: id },
    select: { storageKey: true },
  });
  await Promise.all(screenshots.map((s) => deleteScreenshotFile(s.storageKey)));

  await prisma.board.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
