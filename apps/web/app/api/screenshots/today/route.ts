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

  const { searchParams } = new URL(req.url);
  // tz: minutes to ADD to local time to get UTC (same convention as Date.prototype.getTimezoneOffset()).
  const tzOffsetMinutes = Number(searchParams.get("tz") ?? "0") || 0;

  const nowUtc = new Date();
  const localNow = new Date(nowUtc.getTime() - tzOffsetMinutes * 60_000);
  const localMidnightUtcStamp = Date.UTC(
    localNow.getUTCFullYear(),
    localNow.getUTCMonth(),
    localNow.getUTCDate(),
  );
  const startUtc = new Date(localMidnightUtcStamp + tzOffsetMinutes * 60_000);
  const endUtc = new Date(startUtc.getTime() + 24 * 60 * 60_000);

  const items = await prisma.screenshot.findMany({
    where: { userId, capturedAt: { gte: startUtc, lt: endUtc } },
    orderBy: { capturedAt: "desc" },
    select: { id: true, capturedAt: true, storageKey: true },
  });

  return NextResponse.json({
    count: items.length,
    items: items.map((s) => ({
      id: s.id,
      capturedAt: s.capturedAt,
      thumbnailUrl: `/api/files/${s.storageKey}`,
    })),
  });
}
