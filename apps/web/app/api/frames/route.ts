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

  const { searchParams } = new URL(req.url);
  const boardId = searchParams.get("boardId");
  if (!boardId) {
    return NextResponse.json(
      { error: { code: "VALIDATION_ERROR", message: "Missing boardId" } },
      { status: 400 },
    );
  }

  const frames = await prisma.frame.findMany({ where: { userId, boardId } });
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

  const board = await prisma.board.findUnique({ where: { id: parsed.data.boardId } });
  if (!board || board.userId !== userId) {
    return NextResponse.json(
      { error: { code: "NOT_FOUND", message: "Board not found" } },
      { status: 404 },
    );
  }

  const frame = await prisma.frame.create({ data: { userId, ...parsed.data } });
  return NextResponse.json(toFrameDto(frame), { status: 201 });
}
