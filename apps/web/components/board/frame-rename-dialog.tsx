"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { FrameDto } from "@/lib/frame-dto";

interface FrameRenameDialogProps {
  frame: FrameDto | null;
  onOpenChange: (open: boolean) => void;
  onSave: (id: string, name: string) => void;
}

export function FrameRenameDialog({ frame, onOpenChange, onSave }: FrameRenameDialogProps) {
  const [name, setName] = useState("");

  useEffect(() => {
    setName(frame?.name ?? "");
  }, [frame]);

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!frame || !name.trim()) return;
    onSave(frame.id, name.trim());
  }

  return (
    <Dialog open={frame !== null} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        {frame ? (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <DialogHeader>
              <DialogTitle>Название зоны</DialogTitle>
            </DialogHeader>
            <Input
              value={name}
              onChange={(event) => setName(event.target.value)}
              autoFocus
              required
            />
            <DialogFooter>
              <Button type="submit">Сохранить</Button>
            </DialogFooter>
          </form>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
