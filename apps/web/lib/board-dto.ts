import type { Board } from "@s-shoter/db";

export function toBoardDto(board: Board & { _count?: { screenshots: number } }) {
  return {
    id: board.id,
    name: board.name,
    createdAt: board.createdAt,
    screenshotCount: board._count?.screenshots ?? 0,
  };
}

export type BoardDto = ReturnType<typeof toBoardDto>;
