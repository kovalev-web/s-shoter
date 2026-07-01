import type { Screenshot } from "@s-shoter/db";

export function toScreenshotDto(screenshot: Screenshot) {
  return {
    id: screenshot.id,
    sourceUrl: screenshot.sourceUrl,
    pageTitle: screenshot.pageTitle,
    capturedAt: screenshot.capturedAt,
    width: screenshot.width,
    height: screenshot.height,
    mimeType: screenshot.mimeType,
    boardX: screenshot.boardX,
    boardY: screenshot.boardY,
    boardScale: screenshot.boardScale,
    createdAt: screenshot.createdAt,
    imageUrl: `/api/files/${screenshot.storageKey}`,
  };
}

export type ScreenshotDto = ReturnType<typeof toScreenshotDto>;
