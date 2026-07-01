"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { BoardDto } from "@/lib/board-dto";

interface DeleteBoardDialogProps {
  board: BoardDto | null;
  onOpenChange: (open: boolean) => void;
  onConfirm: (id: string) => void;
}

export function DeleteBoardDialog({ board, onOpenChange, onConfirm }: DeleteBoardDialogProps) {
  return (
    <AlertDialog open={board !== null} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        {board ? (
          <>
            <AlertDialogHeader>
              <AlertDialogTitle>Удалить доску «{board.name}»?</AlertDialogTitle>
              <AlertDialogDescription>
                Все скриншоты и зоны на этой доске будут удалены безвозвратно.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Отмена</AlertDialogCancel>
              <AlertDialogAction variant="destructive" onClick={() => onConfirm(board.id)}>
                Удалить
              </AlertDialogAction>
            </AlertDialogFooter>
          </>
        ) : null}
      </AlertDialogContent>
    </AlertDialog>
  );
}
