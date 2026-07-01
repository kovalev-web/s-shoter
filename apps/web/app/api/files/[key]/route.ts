import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { prisma } from "@s-shoter/db";
import { getCurrentUserId } from "@/lib/get-current-user";
import { storagePath } from "@/lib/storage";

export async function GET(req: Request, { params }: { params: Promise<{ key: string }> }) {
  const userId = await getCurrentUserId(req);
  if (!userId) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "Not authenticated" } },
      { status: 401 },
    );
  }

  const { key } = await params;
  const screenshot = await prisma.screenshot.findUnique({ where: { storageKey: key } });
  if (!screenshot) {
    return NextResponse.json(
      { error: { code: "NOT_FOUND", message: "File not found" } },
      { status: 404 },
    );
  }
  if (screenshot.userId !== userId) {
    return NextResponse.json(
      { error: { code: "FORBIDDEN", message: "Not allowed" } },
      { status: 403 },
    );
  }

  const buffer = await readFile(storagePath(key)).catch(() => null);
  if (!buffer) {
    return NextResponse.json(
      { error: { code: "NOT_FOUND", message: "File not found" } },
      { status: 404 },
    );
  }

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": screenshot.mimeType,
      "Cache-Control": "private, max-age=31536000, immutable",
    },
  });
}
