import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@s-shoter/db";
import { routes } from "@/config/site";
import { toScreenshotDto } from "@/lib/screenshot-dto";
import { BoardCanvas } from "@/components/board/board-canvas";

export default async function BoardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect(routes.login);

  const screenshots = await prisma.screenshot.findMany({
    where: { userId: session.user.id },
    orderBy: { capturedAt: "desc" },
  });

  return <BoardCanvas initialScreenshots={screenshots.map(toScreenshotDto)} />;
}
