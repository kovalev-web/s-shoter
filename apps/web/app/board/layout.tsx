import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { routes } from "@/config/site";
import { SiteHeader } from "@/components/site-header";

export default async function BoardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user?.id) redirect(routes.login);

  return (
    <div className="grid min-h-0 flex-1 grid-rows-[auto_1fr]">
      <SiteHeader />
      <div className="relative flex min-h-0">{children}</div>
    </div>
  );
}
