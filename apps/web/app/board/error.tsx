"use client";

import { Button } from "@/components/ui/button";

interface BoardErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function BoardError({ reset }: BoardErrorProps) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 bg-background">
      <p className="text-sm text-muted-foreground">
        Не удалось загрузить доску
      </p>
      <Button variant="outline" onClick={reset}>
        Попробовать снова
      </Button>
    </div>
  );
}
