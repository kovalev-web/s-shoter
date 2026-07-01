"use client";

import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";

interface BoardUploadProps {
  onUpload: (file: File) => Promise<void>;
}

export function BoardUpload({ onUpload }: BoardUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const onUploadRef = useRef(onUpload);
  onUploadRef.current = onUpload;

  useEffect(() => {
    function handlePaste(e: ClipboardEvent) {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (const item of items) {
        if (item.type.startsWith("image/")) {
          e.preventDefault();
          const file = item.getAsFile();
          if (file) onUploadRef.current(file);
          return;
        }
      }
    }

    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, []);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    onUpload(file);
    e.target.value = "";
  }

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={handleFile}
      />
      <Button
        variant="outline"
        size="sm"
        className="fixed bottom-4 right-4 z-50 gap-2"
        onClick={() => inputRef.current?.click()}
      >
        <Upload className="h-4 w-4" />
        Загрузить
      </Button>
    </>
  );
}
