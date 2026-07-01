"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { ScreenshotDto } from "@/lib/screenshot-dto";

interface ScreenshotDetailDialogProps {
  screenshot: ScreenshotDto | null;
  onOpenChange: (open: boolean) => void;
  onDelete: (id: string) => void;
  isDeleting: boolean;
}

export function ScreenshotDetailDialog({
  screenshot,
  onOpenChange,
  onDelete,
  isDeleting,
}: ScreenshotDetailDialogProps) {
  const [isImageReady, setIsImageReady] = useState(false);

  // Decode the screenshot off-screen before the dialog paints it, so the
  // open animation isn't fighting a (potentially heavy) image decode.
  useEffect(() => {
    setIsImageReady(false);
    if (!screenshot) return;

    let cancelled = false;
    const img = new Image();
    img.src = screenshot.imageUrl;
    img
      .decode()
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setIsImageReady(true);
      });

    return () => {
      cancelled = true;
    };
  }, [screenshot]);

  return (
    <Dialog open={screenshot !== null} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-hidden sm:max-w-[60vw]">
        {screenshot ? (
          <>
            <DialogHeader>
              <DialogTitle>{screenshot.pageTitle}</DialogTitle>
              <DialogDescription>
                <a
                  href={screenshot.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline underline-offset-4"
                >
                  {screenshot.sourceUrl}
                </a>
              </DialogDescription>
            </DialogHeader>
            <div
              className="flex max-h-[70vh] items-center justify-center overflow-hidden rounded-md border border-border bg-muted"
              style={{ aspectRatio: `${screenshot.width} / ${screenshot.height}` }}
            >
              {isImageReady ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={screenshot.imageUrl}
                  alt={screenshot.pageTitle}
                  decoding="async"
                  className="max-h-[70vh] w-full object-contain"
                />
              ) : (
                <span className="text-sm text-muted-foreground">Загрузка...</span>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              {new Date(screenshot.capturedAt).toLocaleString()}
            </p>
            <DialogFooter>
              <Button
                variant="destructive"
                onClick={() => onDelete(screenshot.id)}
                disabled={isDeleting}
              >
                {isDeleting ? "Удаляем..." : "Удалить"}
              </Button>
            </DialogFooter>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
