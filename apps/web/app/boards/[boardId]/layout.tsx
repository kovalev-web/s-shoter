import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@s-shoter/db";
import { routes } from "@/config/site";

// The ownership check lives here, not in page.tsx: this segment's page.tsx
// is implicitly wrapped in a Suspense boundary by loading.tsx, so Next.js
// flushes a 200 shell before the page's own async work resolves — any
// redirect() called from inside the page renders correctly for a browser
// (client-side navigation via the RSC stream) but can no longer change the
// already-sent HTTP status. A layout at this same segment is NOT behind
// that boundary, so its redirect() propagates a real HTTP status.
export default async function BoardIdLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ boardId: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect(routes.login);

  const { boardId } = await params;
  const board = await prisma.board.findUnique({ where: { id: boardId } });
  if (!board || board.userId !== session.user.id) redirect(routes.boards);

  return <>{children}</>;
}
