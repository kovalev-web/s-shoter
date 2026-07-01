import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import sharp, { type OutputInfo } from "sharp";
import { prisma } from "@s-shoter/db";
import {
  ALLOWED_SCREENSHOT_MIME_TYPES,
  MAX_SCREENSHOT_FILE_SIZE_BYTES,
  screenshotUploadFieldsSchema,
} from "@s-shoter/shared";
import { getCurrentUserId } from "@/lib/get-current-user";
import { saveScreenshotFile } from "@/lib/storage";
import { toScreenshotDto } from "@/lib/screenshot-dto";

// Cap the longest edge and always re-encode as JPEG: raw browser captures can
// be several MB and multiple megapixels (especially on hi-DPI displays),
// which made the board and detail view janky/freeze decoding them.
const MAX_IMAGE_DIMENSION = 2560;
const JPEG_QUALITY = 90;

function unauthorized() {
  return NextResponse.json(
    { error: { code: "UNAUTHORIZED", message: "Not authenticated" } },
    { status: 401 },
  );
}

export async function GET(req: Request) {
  const userId = await getCurrentUserId(req);
  if (!userId) return unauthorized();

  const screenshots = await prisma.screenshot.findMany({
    where: { userId },
    orderBy: { capturedAt: "desc" },
  });

  return NextResponse.json({ items: screenshots.map(toScreenshotDto) });
}

export async function POST(req: Request) {
  const userId = await getCurrentUserId(req);
  if (!userId) return unauthorized();

  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json(
      { error: { code: "VALIDATION_ERROR", message: "Missing file" } },
      { status: 400 },
    );
  }

  const fields = screenshotUploadFieldsSchema.safeParse({
    sourceUrl: form.get("sourceUrl"),
    pageTitle: form.get("pageTitle"),
    capturedAt: form.get("capturedAt"),
    boardX: form.get("boardX"),
    boardY: form.get("boardY"),
  });
  if (!fields.success) {
    return NextResponse.json(
      {
        error: {
          code: "VALIDATION_ERROR",
          message: fields.error.issues[0]?.message ?? "Invalid input",
        },
      },
      { status: 400 },
    );
  }

  if (
    !ALLOWED_SCREENSHOT_MIME_TYPES.includes(
      file.type as (typeof ALLOWED_SCREENSHOT_MIME_TYPES)[number],
    )
  ) {
    return NextResponse.json(
      { error: { code: "INVALID_MIME", message: "Only PNG/JPEG images are allowed" } },
      { status: 400 },
    );
  }
  if (file.size > MAX_SCREENSHOT_FILE_SIZE_BYTES) {
    return NextResponse.json(
      { error: { code: "FILE_TOO_LARGE", message: "File exceeds 10MB limit" } },
      { status: 400 },
    );
  }

  const rawBuffer = Buffer.from(await file.arrayBuffer());
  let buffer: Buffer;
  let info: OutputInfo;
  try {
    ({ data: buffer, info } = await sharp(rawBuffer)
      .resize({
        width: MAX_IMAGE_DIMENSION,
        height: MAX_IMAGE_DIMENSION,
        fit: "inside",
        withoutEnlargement: true,
      })
      .jpeg({ quality: JPEG_QUALITY })
      .toBuffer({ resolveWithObject: true }));
  } catch {
    // Corrupt or unreadable image data — reject cleanly instead of 500-ing.
    return NextResponse.json(
      { error: { code: "INVALID_IMAGE", message: "Image could not be processed" } },
      { status: 400 },
    );
  }

  const storageKey = `${randomUUID()}.jpg`;
  await saveScreenshotFile(storageKey, buffer);

  let boardX = fields.data.boardX;
  let boardY = fields.data.boardY;
  if (boardX === undefined || boardY === undefined) {
    const captured = new Date(fields.data.capturedAt);
    const dayStart = new Date(captured);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(captured);
    dayEnd.setHours(23, 59, 59, 999);

    const lastToday = await prisma.screenshot.findFirst({
      where: { userId, capturedAt: { gte: dayStart, lte: dayEnd } },
      orderBy: { capturedAt: "desc" },
    });

    if (lastToday) {
      boardX = lastToday.boardX + 40;
      boardY = lastToday.boardY + 40;
    } else {
      const existingCount = await prisma.screenshot.count({ where: { userId } });
      const cascadeOffset = (existingCount % 10) * 40;
      boardX = cascadeOffset;
      boardY = cascadeOffset;
    }
  }

  const screenshot = await prisma.screenshot.create({
    data: {
      userId,
      storageKey,
      width: info.width,
      height: info.height,
      mimeType: "image/jpeg",
      sourceUrl: fields.data.sourceUrl,
      pageTitle: fields.data.pageTitle,
      capturedAt: new Date(fields.data.capturedAt),
      boardX,
      boardY,
    },
  });

  return NextResponse.json(toScreenshotDto(screenshot), { status: 201 });
}
