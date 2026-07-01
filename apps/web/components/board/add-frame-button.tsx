"use client";

import { Button } from "@/components/ui/button";
import { SquareDashed } from "lucide-react";

interface AddFrameButtonProps {
  onAdd: () => void;
}

export function AddFrameButton({ onAdd }: AddFrameButtonProps) {
  return (
    <Button variant="outline" size="sm" className="gap-2" onClick={onAdd}>
      <SquareDashed className="h-4 w-4" />
      Добавить зону
    </Button>
  );
}
