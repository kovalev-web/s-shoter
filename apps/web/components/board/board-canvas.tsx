"use client";

import dynamic from "next/dynamic";
import type { ScreenshotDto } from "@/lib/screenshot-dto";

const BoardStage = dynamic(
  () => import("@/components/board/board-stage").then((mod) => mod.BoardStage),
  { ssr: false },
);

interface BoardCanvasProps {
  initialScreenshots: ScreenshotDto[];
}

export function BoardCanvas({ initialScreenshots }: BoardCanvasProps) {
  return <BoardStage initialScreenshots={initialScreenshots} />;
}
