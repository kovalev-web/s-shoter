"use client";

import Link from "next/link";
import { Pencil, Trash2, LayoutGrid } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { boardHref } from "@/config/site";
import type { BoardDto } from "@/lib/board-dto";

interface BoardCardProps {
  board: BoardDto;
  onRename: (board: BoardDto) => void;
  onDelete: (board: BoardDto) => void;
}

export function BoardCard({ board, onRename, onDelete }: BoardCardProps) {
  return (
    <Card className="group relative">
      <Link href={boardHref(board.id)} className="block">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LayoutGrid className="h-4 w-4 text-muted-foreground" />
            {board.name}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            {board.screenshotCount} {board.screenshotCount === 1 ? "скриншот" : "скриншотов"}
          </p>
        </CardContent>
      </Link>
      <div className="absolute right-3 top-3 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
        <Button variant="ghost" size="icon-sm" onClick={() => onRename(board)}>
          <Pencil className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          className="text-destructive"
          onClick={() => onDelete(board)}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </Card>
  );
}
