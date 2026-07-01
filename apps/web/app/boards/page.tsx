import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@s-shoter/db";
import { routes } from "@/config/site";
import { toBoardDto } from "@/lib/board-dto";
import { BoardsList } from "@/components/boards/boards-list";

export default async function BoardsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect(routes.login);

  const boards = await prisma.board.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { screenshots: true } } },
  });

  return <BoardsList initialBoards={boards.map(toBoardDto)} />;
}
