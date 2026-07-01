"use client";

import dynamic from "next/dynamic";
import type { ScreenshotDto } from "@/lib/screenshot-dto";
import type { FrameDto } from "@/lib/frame-dto";

const BoardStage = dynamic(
  () => import("@/components/board/board-stage").then((mod) => mod.BoardStage),
  { ssr: false },
);

interface BoardCanvasProps {
  boardId: string;
  initialScreenshots: ScreenshotDto[];
  initialFrames: FrameDto[];
}

export function BoardCanvas({ boardId, initialScreenshots, initialFrames }: BoardCanvasProps) {
  return (
    <BoardStage
      boardId={boardId}
      initialScreenshots={initialScreenshots}
      initialFrames={initialFrames}
    />
  );
}
