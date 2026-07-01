"use client";

import { useEffect, useRef, useState } from "react";
import { Stage, Layer } from "react-konva";
import type Konva from "konva";
import { toast } from "sonner";
import { getCanvasTheme, type CanvasTheme } from "@/lib/canvas-theme";
import type { ScreenshotDto } from "@/lib/screenshot-dto";
import type { FrameDto } from "@/lib/frame-dto";
import { ScreenshotCard, CARD_WIDTH, CARD_HEIGHT } from "@/components/board/screenshot-card";
import { ScreenshotDetailDialog } from "@/components/board/screenshot-detail-dialog";
import { BoardEmptyState } from "@/components/board/board-empty-state";
import { BoardUpload } from "@/components/board/board-upload";
import { BoardToolbar } from "@/components/board/board-toolbar";
import { AddFrameButton } from "@/components/board/add-frame-button";
import { FrameShape } from "@/components/board/frame-shape";
import { FrameRenameDialog } from "@/components/board/frame-rename-dialog";
import { GridOverlay } from "@/components/board/grid-overlay";
import { MIN_SCALE, MAX_SCALE } from "@/components/board/board-constants";

const ZOOM_STEP = 1.05 ** 2;
const POSITION_SAVE_DEBOUNCE_MS = 500;
const DEFAULT_FRAME_WIDTH = 320;
const DEFAULT_FRAME_HEIGHT = 220;

// A card "belongs" to a frame if its center point falls inside the frame's
// rectangle — same heuristic Figma/Miro use for frame membership.
function isScreenshotInFrame(screenshot: ScreenshotDto, frame: FrameDto): boolean {
  const cx = screenshot.boardX + CARD_WIDTH / 2;
  const cy = screenshot.boardY + CARD_HEIGHT / 2;
  return (
    cx >= frame.x && cx <= frame.x + frame.width && cy >= frame.y && cy <= frame.y + frame.height
  );
}

interface BoardStageProps {
  initialScreenshots: ScreenshotDto[];
  initialFrames: FrameDto[];
}

export function BoardStage({ initialScreenshots, initialFrames }: BoardStageProps) {
  const [screenshots, setScreenshots] = useState(initialScreenshots);
  const [frames, setFrames] = useState(initialFrames);
  const [viewport, setViewport] = useState({ width: 0, height: 0 });
  const [theme, setTheme] = useState<CanvasTheme | null>(null);
  const [activeScreenshot, setActiveScreenshot] = useState<ScreenshotDto | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedFrameId, setSelectedFrameId] = useState<string | null>(null);
  const [frameToRename, setFrameToRename] = useState<FrameDto | null>(null);

  const stageRef = useRef<Konva.Stage>(null);
  const saveTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const didFitRef = useRef(false);
  const cascadeCount = useRef(0);
  const screenshotNodesRef = useRef<Map<string, Konva.Group>>(new Map());
  const frameDragRef = useRef<{
    frameId: string;
    originX: number;
    originY: number;
    items: { id: string; startX: number; startY: number }[];
  } | null>(null);

  function registerScreenshotNode(id: string, node: Konva.Group | null) {
    if (node) screenshotNodesRef.current.set(id, node);
    else screenshotNodesRef.current.delete(id);
  }

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

  // Удаление выделенного скриншота/зоны по Delete
  const selectedIdRef = useRef(selectedId);
  selectedIdRef.current = selectedId;
  const selectedFrameIdRef = useRef(selectedFrameId);
  selectedFrameIdRef.current = selectedFrameId;
  const isDeletingRef = useRef(isDeleting);
  isDeletingRef.current = isDeleting;

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key !== "Delete" && e.key !== "Backspace") return;

      if (selectedFrameIdRef.current) {
        void handleDeleteFrame(selectedFrameIdRef.current);
      } else if (selectedIdRef.current && !isDeletingRef.current) {
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
    // Снять выделение при клике на пустое место (не на карточку/зону)
    if (e.target === e.target.getStage() || e.target.name() === "stage-layer") {
      setSelectedId(null);
      setSelectedFrameId(null);
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

  async function handleAddFrame() {
    const stage = stageRef.current;
    let x = 0;
    let y = 0;
    if (stage) {
      const cx = viewport.width / 2;
      const cy = viewport.height / 2;
      x = Math.round((cx - stage.x()) / stage.scaleX() - DEFAULT_FRAME_WIDTH / 2);
      y = Math.round((cy - stage.y()) / stage.scaleY() - DEFAULT_FRAME_HEIGHT / 2);
    }

    try {
      const res = await fetch("/api/frames", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Новая зона",
          x,
          y,
          width: DEFAULT_FRAME_WIDTH,
          height: DEFAULT_FRAME_HEIGHT,
        }),
      });
      if (!res.ok) throw new Error("create failed");
      const created: FrameDto = await res.json();
      setFrames((prev) => [...prev, created]);
      setSelectedFrameId(created.id);
      setSelectedId(null);
    } catch {
      toast.error("Не удалось создать зону");
    }
  }

  function handleFrameSelect(id: string) {
    setSelectedFrameId(id);
    setSelectedId(null);
  }

  // Snapshot which cards are inside the frame right as the drag begins, so
  // moving the frame carries exactly that set along (matches Figma/Miro).
  function handleFrameDragStart(frame: FrameDto) {
    const contained = screenshots.filter((s) => isScreenshotInFrame(s, frame));
    frameDragRef.current = {
      frameId: frame.id,
      originX: frame.x,
      originY: frame.y,
      items: contained.map((s) => ({ id: s.id, startX: s.boardX, startY: s.boardY })),
    };
  }

  // Move the contained cards' Konva nodes directly during the drag — same
  // "Konva owns the live transform" pattern already used for card dragging,
  // avoids re-rendering React on every pointer move.
  function handleFrameDragMove(frame: FrameDto, dx: number, dy: number) {
    const drag = frameDragRef.current;
    if (!drag || drag.frameId !== frame.id) return;

    for (const item of drag.items) {
      const node = screenshotNodesRef.current.get(item.id);
      node?.position({ x: item.startX + dx, y: item.startY + dy });
    }
    stageRef.current?.batchDraw();
  }

  async function handleFrameChange(
    id: string,
    x: number,
    y: number,
    width: number,
    height: number,
  ) {
    setFrames((prev) => prev.map((f) => (f.id === id ? { ...f, x, y, width, height } : f)));

    const drag = frameDragRef.current;
    frameDragRef.current = null;

    if (drag && drag.frameId === id && drag.items.length > 0) {
      const dx = x - drag.originX;
      const dy = y - drag.originY;

      setScreenshots((prev) =>
        prev.map((s) => {
          const item = drag.items.find((i) => i.id === s.id);
          return item ? { ...s, boardX: item.startX + dx, boardY: item.startY + dy } : s;
        }),
      );
      for (const item of drag.items) {
        schedulePositionSave(item.id, item.startX + dx, item.startY + dy);
      }
    }

    try {
      const res = await fetch(`/api/frames/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ x, y, width, height }),
      });
      if (!res.ok) throw new Error("save failed");
    } catch {
      toast.error("Не удалось сохранить зону");
    }
  }

  async function handleFrameRenameSave(id: string, name: string) {
    setFrames((prev) => prev.map((f) => (f.id === id ? { ...f, name } : f)));
    setFrameToRename(null);
    try {
      const res = await fetch(`/api/frames/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      if (!res.ok) throw new Error("save failed");
    } catch {
      toast.error("Не удалось переименовать зону");
    }
  }

  async function handleDeleteFrame(id: string) {
    try {
      const res = await fetch(`/api/frames/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("delete failed");
      setFrames((prev) => prev.filter((f) => f.id !== id));
      setSelectedFrameId(null);
    } catch {
      toast.error("Не удалось удалить зону");
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
          {frames.map((frame) => (
            <FrameShape
              key={frame.id}
              frame={frame}
              theme={theme}
              isSelected={selectedFrameId === frame.id}
              onSelect={handleFrameSelect}
              onChange={handleFrameChange}
              onRename={setFrameToRename}
              onGroupDragStart={handleFrameDragStart}
              onGroupDragMove={handleFrameDragMove}
            />
          ))}
          {screenshots.map((screenshot) => (
            <ScreenshotCard
              key={screenshot.id}
              screenshot={screenshot}
              theme={theme}
              isSelected={selectedId === screenshot.id}
              onDragEnd={handleCardDragEnd}
              onSelect={(s) => {
                setSelectedId(s.id);
                setSelectedFrameId(null);
              }}
              onOpen={setActiveScreenshot}
              registerNode={registerScreenshotNode}
            />
          ))}
        </Layer>
      </Stage>

      {screenshots.length === 0 ? <BoardEmptyState /> : null}

      <BoardToolbar>
        <AddFrameButton onAdd={handleAddFrame} />
        <BoardUpload onUpload={handleUpload} />
      </BoardToolbar>

      <ScreenshotDetailDialog
        screenshot={activeScreenshot}
        onOpenChange={(open) => {
          if (!open) setActiveScreenshot(null);
        }}
        onDelete={handleDelete}
        isDeleting={isDeleting}
      />

      <FrameRenameDialog
        frame={frameToRename}
        onOpenChange={(open) => {
          if (!open) setFrameToRename(null);
        }}
        onSave={handleFrameRenameSave}
      />
    </div>
  );
}
