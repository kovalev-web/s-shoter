import { NextResponse } from "next/server";
import { prisma } from "@s-shoter/db";
import { boardCreateSchema } from "@s-shoter/shared";
import { getCurrentUserId } from "@/lib/get-current-user";
import { toBoardDto } from "@/lib/board-dto";

function unauthorized() {
  return NextResponse.json(
    { error: { code: "UNAUTHORIZED", message: "Not authenticated" } },
    { status: 401 },
  );
}

export async function GET(req: Request) {
  const userId = await getCurrentUserId(req);
  if (!userId) return unauthorized();

  const boards = await prisma.board.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { screenshots: true } } },
  });

  return NextResponse.json({ items: boards.map(toBoardDto) });
}

export async function POST(req: Request) {
  const userId = await getCurrentUserId(req);
  if (!userId) return unauthorized();

  const body = await req.json().catch(() => null);
  const parsed = boardCreateSchema.safeParse(body);
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

  const board = await prisma.board.create({ data: { userId, name: parsed.data.name } });
  return NextResponse.json(toBoardDto(board), { status: 201 });
}
