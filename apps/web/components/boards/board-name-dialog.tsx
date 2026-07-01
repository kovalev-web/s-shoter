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

interface BoardNameDialogProps {
  open: boolean;
  title: string;
  initialName?: string;
  submitLabel: string;
  onOpenChange: (open: boolean) => void;
  onSubmit: (name: string) => void;
}

// Shared shell for "create board" and "rename board" — both are just a
// dialog with a single name field, differing only in title/initial value.
export function BoardNameDialog({
  open,
  title,
  initialName,
  submitLabel,
  onOpenChange,
  onSubmit,
}: BoardNameDialogProps) {
  const [name, setName] = useState(initialName ?? "");

  useEffect(() => {
    if (open) setName(initialName ?? "");
  }, [open, initialName]);

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!name.trim()) return;
    onSubmit(name.trim());
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
          </DialogHeader>
          <Input
            value={name}
            onChange={(event) => setName(event.target.value)}
            autoFocus
            required
          />
          <DialogFooter>
            <Button type="submit">{submitLabel}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
