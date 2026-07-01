"use client";

import dynamic from "next/dynamic";
import type { ScreenshotDto } from "@/lib/screenshot-dto";
import type { FrameDto } from "@/lib/frame-dto";

const BoardStage = dynamic(
  () => import("@/components/board/board-stage").then((mod) => mod.BoardStage),
  { ssr: false },
);

interface BoardCanvasProps {
  initialScreenshots: ScreenshotDto[];
  initialFrames: FrameDto[];
}

export function BoardCanvas({ initialScreenshots, initialFrames }: BoardCanvasProps) {
  return <BoardStage initialScreenshots={initialScreenshots} initialFrames={initialFrames} />;
}
