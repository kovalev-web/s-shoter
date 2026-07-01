"use client";

import { useSession, signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { siteConfig } from "@/config/site";

export function SiteHeader() {
  const { data: session } = useSession();

  return (
    <header className="flex h-10 shrink-0 items-center justify-between border-b border-border bg-background px-4">
      <span className="text-sm font-medium text-foreground">{siteConfig.name}</span>

      <div className="flex items-center gap-3">
        <span className="text-xs text-muted-foreground">{session?.user?.email}</span>
        <Button variant="ghost" size="xs" onClick={() => signOut({ callbackUrl: "/login" })}>
          Выйти
        </Button>
      </div>
    </header>
  );
}
