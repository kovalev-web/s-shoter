"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { boardHref } from "@/config/site";
import type { BoardDto } from "@/lib/board-dto";
import { BoardCard } from "@/components/boards/board-card";
import { BoardNameDialog } from "@/components/boards/board-name-dialog";
import { DeleteBoardDialog } from "@/components/boards/delete-board-dialog";

interface BoardsListProps {
  initialBoards: BoardDto[];
}

export function BoardsList({ initialBoards }: BoardsListProps) {
  const router = useRouter();
  const [boards, setBoards] = useState(initialBoards);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [boardToRename, setBoardToRename] = useState<BoardDto | null>(null);
  const [boardToDelete, setBoardToDelete] = useState<BoardDto | null>(null);

  async function handleCreate(name: string) {
    try {
      const res = await fetch("/api/boards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      if (!res.ok) throw new Error("create failed");
      const created: BoardDto = await res.json();
      setIsCreateOpen(false);
      router.push(boardHref(created.id));
    } catch {
      toast.error("Не удалось создать доску");
    }
  }

  async function handleRename(name: string) {
    if (!boardToRename) return;
    const id = boardToRename.id;
    setBoardToRename(null);
    try {
      const res = await fetch(`/api/boards/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      if (!res.ok) throw new Error("rename failed");
      setBoards((prev) => prev.map((b) => (b.id === id ? { ...b, name } : b)));
    } catch {
      toast.error("Не удалось переименовать доску");
    }
  }

  async function handleDelete(id: string) {
    setBoardToDelete(null);
    try {
      const res = await fetch(`/api/boards/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("delete failed");
      setBoards((prev) => prev.filter((b) => b.id !== id));
    } catch {
      toast.error("Не удалось удалить доску");
    }
  }

  return (
    <div className="flex flex-1 flex-col gap-6 overflow-y-auto p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-medium text-foreground">Доски</h1>
        <Button size="sm" className="gap-2" onClick={() => setIsCreateOpen(true)}>
          <Plus className="h-4 w-4" />
          Создать доску
        </Button>
      </div>

      {boards.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Пока нет ни одной доски. Создай первую, чтобы начать конкурентный аудит.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {boards.map((board) => (
            <BoardCard
              key={board.id}
              board={board}
              onRename={setBoardToRename}
              onDelete={setBoardToDelete}
            />
          ))}
        </div>
      )}

      <BoardNameDialog
        open={isCreateOpen}
        title="Новая доска"
        submitLabel="Создать"
        onOpenChange={setIsCreateOpen}
        onSubmit={handleCreate}
      />

      <BoardNameDialog
        open={boardToRename !== null}
        title="Название доски"
        initialName={boardToRename?.name}
        submitLabel="Сохранить"
        onOpenChange={(open) => {
          if (!open) setBoardToRename(null);
        }}
        onSubmit={handleRename}
      />

      <DeleteBoardDialog
        board={boardToDelete}
        onOpenChange={(open) => {
          if (!open) setBoardToDelete(null);
        }}
        onConfirm={handleDelete}
      />
    </div>
  );
}
