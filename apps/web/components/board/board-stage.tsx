"use client";

import { useEffect, useRef, useState } from "react";
import { Stage, Layer } from "react-konva";
import type Konva from "konva";
import { toast } from "sonner";
import { getCanvasTheme, type CanvasTheme } from "@/lib/canvas-theme";
import type { ScreenshotDto } from "@/lib/screenshot-dto";
import { ScreenshotCard } from "@/components/board/screenshot-card";
import { ScreenshotDetailDialog } from "@/components/board/screenshot-detail-dialog";
import { BoardEmptyState } from "@/components/board/board-empty-state";
import { BoardUpload } from "@/components/board/board-upload";
import { GridOverlay } from "@/components/board/grid-overlay";
import { MIN_SCALE, MAX_SCALE } from "@/components/board/board-constants";

const ZOOM_STEP = 1.05 ** 2;
const POSITION_SAVE_DEBOUNCE_MS = 500;

interface BoardStageProps {
  initialScreenshots: ScreenshotDto[];
}

export function BoardStage({ initialScreenshots }: BoardStageProps) {
  const [screenshots, setScreenshots] = useState(initialScreenshots);
  const [viewport, setViewport] = useState({ width: 0, height: 0 });
  const [theme, setTheme] = useState<CanvasTheme | null>(null);
  const [activeScreenshot, setActiveScreenshot] = useState<ScreenshotDto | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const stageRef = useRef<Konva.Stage>(null);
  const saveTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const didFitRef = useRef(false);
  const cascadeCount = useRef(0);

  useEffect(() => {
    setTheme(getCanvasTheme());

    function updateViewport() {
      setViewport({ width: window.innerWidth, height: window.innerHeight });
    }
    updateViewport();
    window.addEventListener("resize", updateViewport);
    return () => window.removeEventListener("resize", updateViewport);
  }, []);

  // Подогнать вьюпорт под все скриншоты при первой загрузке
  useEffect(() => {
    if (!theme || screenshots.length === 0 || didFitRef.current) return;
    didFitRef.current = true;

    const stage = stageRef.current;
    if (!stage) return;

    const CARD_W = 220;
    const CARD_H = 160;
    const PADDING = 100;

    let minX = Infinity,
      minY = Infinity,
      maxX = -Infinity,
      maxY = -Infinity;
    for (const s of screenshots) {
      if (s.boardX < minX) minX = s.boardX;
      if (s.boardY < minY) minY = s.boardY;
      if (s.boardX + CARD_W > maxX) maxX = s.boardX + CARD_W;
      if (s.boardY + CARD_H > maxY) maxY = s.boardY + CARD_H;
    }

    const bboxW = maxX - minX + PADDING * 2;
    const bboxH = maxY - minY + PADDING * 2;
    const fitScale = Math.min(viewport.width / bboxW, viewport.height / bboxH, 1);

    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;

    stage.position({
      x: viewport.width / 2 - centerX * fitScale,
      y: viewport.height / 2 - centerY * fitScale,
    });
    stage.scale({ x: fitScale, y: fitScale });
    stage.batchDraw();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [theme]);

  // Подхватывать новые скриншоты (из расширения): poll + при возврате на вкладку
  useEffect(() => {
    if (!theme) return;

    async function fetchNew() {
      try {
        const res = await fetch("/api/screenshots");
        if (!res.ok) return;
        const data = await res.json();
        const items: ScreenshotDto[] = data.items;

        setScreenshots((prev) => {
          const missing = items.filter((s) => !prev.some((p) => p.id === s.id));
          if (missing.length === 0) return prev;
          return [...missing, ...prev];
        });
      } catch {
        // silent
      }
    }

    const interval = setInterval(fetchNew, 5000);

    function onVisible() {
      if (document.visibilityState === "visible") fetchNew();
    }
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [theme]);

  useEffect(() => {
    const timers = saveTimers.current;
    return () => {
      timers.forEach((timer) => clearTimeout(timer));
    };
  }, []);

  // Удаление выделенного скриншота по Delete
  const selectedIdRef = useRef(selectedId);
  selectedIdRef.current = selectedId;
  const isDeletingRef = useRef(isDeleting);
  isDeletingRef.current = isDeleting;

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (
        (e.key === "Delete" || e.key === "Backspace") &&
        selectedIdRef.current &&
        !isDeletingRef.current
      ) {
        handleDelete(selectedIdRef.current);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  function schedulePositionSave(id: string, boardX: number, boardY: number) {
    const existing = saveTimers.current.get(id);
    if (existing) clearTimeout(existing);

    const timer = setTimeout(async () => {
      saveTimers.current.delete(id);
      try {
        const boardScale = stageRef.current?.scaleX() ?? 1;
        const res = await fetch(`/api/screenshots/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ boardX, boardY, boardScale }),
        });
        if (!res.ok) throw new Error("save failed");
      } catch {
        toast.error("Не удалось сохранить позицию карточки");
      }
    }, POSITION_SAVE_DEBOUNCE_MS);

    saveTimers.current.set(id, timer);
  }

  function handleCardDragEnd(id: string, x: number, y: number) {
    setScreenshots((prev) => prev.map((s) => (s.id === id ? { ...s, boardX: x, boardY: y } : s)));
    schedulePositionSave(id, x, y);
  }

  function handleWheel(e: Konva.KonvaEventObject<WheelEvent>) {
    e.evt.preventDefault();
    const stage = e.target.getStage();
    if (!stage) return;

    const pointer = stage.getPointerPosition();
    if (!pointer) return;

    const oldScale = stage.scaleX();
    const pos = stage.position();

    const mousePointTo = {
      x: (pointer.x - pos.x) / oldScale,
      y: (pointer.y - pos.y) / oldScale,
    };

    const direction = e.evt.deltaY > 0 ? -1 : 1;
    let newScale = direction > 0 ? oldScale * ZOOM_STEP : oldScale / ZOOM_STEP;
    newScale = Math.min(Math.max(newScale, MIN_SCALE), MAX_SCALE);

    stage.position({
      x: pointer.x - mousePointTo.x * newScale,
      y: pointer.y - mousePointTo.y * newScale,
    });
    stage.scale({ x: newScale, y: newScale });
    stage.batchDraw();
  }

  function handleStageDragMove(e: Konva.KonvaEventObject<DragEvent>) {
    if (e.target !== e.target.getStage()) return;
  }

  function handleStageDragEnd(e: Konva.KonvaEventObject<DragEvent>) {
    if (e.target !== e.target.getStage()) return;
  }

  function handleStageClick(e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) {
    // Снять выделение при клике на пустое место (не на карточку)
    if (e.target === e.target.getStage() || e.target.name() === "stage-layer") {
      setSelectedId(null);
    }
  }

  async function handleUpload(file: File) {
    const body = new FormData();
    body.append("file", file);
    body.append("sourceUrl", "https://manual.upload");
    body.append("pageTitle", file.name || "Снимок экрана");
    body.append("capturedAt", new Date().toISOString());

    const stage = stageRef.current;
    if (stage) {
      const cx = viewport.width / 2;
      const cy = viewport.height / 2;
      const offset = (cascadeCount.current % 10) * 40;
      body.append("boardX", String(Math.round((cx - stage.x()) / stage.scaleX() - 110 + offset)));
      body.append("boardY", String(Math.round((cy - stage.y()) / stage.scaleY() - 80 + offset)));
      cascadeCount.current++;
    }

    try {
      const res = await fetch("/api/screenshots", { method: "POST", body });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error?.message ?? "Upload failed");
      }
      const created: ScreenshotDto = await res.json();
      setScreenshots((prev) => [created, ...prev]);
      toast.success("Скриншот загружен");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Не удалось загрузить скриншот");
    }
  }

  async function handleDelete(id: string) {
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/screenshots/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("delete failed");
      setScreenshots((prev) => prev.filter((s) => s.id !== id));
      setActiveScreenshot(null);
    } catch {
      toast.error("Не удалось удалить скриншот");
    } finally {
      setIsDeleting(false);
    }
  }

  if (!theme || viewport.width === 0) {
    return <div className="flex-1 bg-background" />;
  }

  return (
    <div className="relative flex-1 overflow-hidden bg-background">
      <GridOverlay stageRef={stageRef} dotColor={theme.border} />

      <Stage
        ref={stageRef}
        width={viewport.width}
        height={viewport.height}
        draggable
        onWheel={handleWheel}
        onDragMove={handleStageDragMove}
        onDragEnd={handleStageDragEnd}
        onClick={handleStageClick}
        onTap={handleStageClick}
      >
        <Layer>
          {screenshots.map((screenshot) => (
            <ScreenshotCard
              key={screenshot.id}
              screenshot={screenshot}
              theme={theme}
              isSelected={selectedId === screenshot.id}
              onDragEnd={handleCardDragEnd}
              onSelect={(s) => setSelectedId(s.id)}
              onOpen={setActiveScreenshot}
            />
          ))}
        </Layer>
      </Stage>

      {screenshots.length === 0 ? <BoardEmptyState /> : null}

      <BoardUpload onUpload={handleUpload} />

      <ScreenshotDetailDialog
        screenshot={activeScreenshot}
        onOpenChange={(open) => {
          if (!open) setActiveScreenshot(null);
        }}
        onDelete={handleDelete}
        isDeleting={isDeleting}
      />
    </div>
  );
}
