import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@s-shoter/db";
import { routes } from "@/config/site";
import { toScreenshotDto } from "@/lib/screenshot-dto";
import { toFrameDto } from "@/lib/frame-dto";
import { BoardCanvas } from "@/components/board/board-canvas";

export default async function BoardPage({ params }: { params: Promise<{ boardId: string }> }) {
  const session = await auth();
  if (!session?.user?.id) redirect(routes.login);

  const { boardId } = await params;

  const [screenshots, frames] = await Promise.all([
    prisma.screenshot.findMany({
      where: { userId: session.user.id, boardId },
      orderBy: { capturedAt: "desc" },
    }),
    prisma.frame.findMany({ where: { userId: session.user.id, boardId } }),
  ]);

  return (
    <BoardCanvas
      boardId={boardId}
      initialScreenshots={screenshots.map(toScreenshotDto)}
      initialFrames={frames.map(toFrameDto)}
    />
  );
}
