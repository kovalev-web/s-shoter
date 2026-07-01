"use client";

import { useRef, useState } from "react";
import { Group, Rect, Text, Image as KonvaImage } from "react-konva";
import useImage from "use-image";
import type Konva from "konva";
import type { CanvasTheme } from "@/lib/canvas-theme";
import type { ScreenshotDto } from "@/lib/screenshot-dto";

const CARD_WIDTH = 220;
const CARD_HEIGHT = 160;
const PADDING = 8;
const TITLE_HEIGHT = 28;
const IMAGE_BOX_HEIGHT = CARD_HEIGHT - TITLE_HEIGHT;

interface ScreenshotCardProps {
  screenshot: ScreenshotDto;
  theme: CanvasTheme;
  isSelected: boolean;
  onDragEnd: (id: string, x: number, y: number) => void;
  onSelect: (screenshot: ScreenshotDto) => void;
  onOpen: (screenshot: ScreenshotDto) => void;
}

export function ScreenshotCard({ screenshot, theme, isSelected, onDragEnd, onSelect, onOpen }: ScreenshotCardProps) {
  const [image] = useImage(screenshot.imageUrl, "anonymous");
  const dragMoved = useRef(false);

  // Avoid this component owning live position state during drag; Konva moves the node directly.
  const [position] = useState({ x: screenshot.boardX, y: screenshot.boardY });

  let drawWidth = CARD_WIDTH - PADDING * 2;
  let drawHeight = IMAGE_BOX_HEIGHT - PADDING * 2;
  if (image) {
    const fitScale = Math.min(drawWidth / image.width, drawHeight / image.height);
    drawWidth = image.width * fitScale;
    drawHeight = image.height * fitScale;
  }

  function handleClick(e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) {
    if (!dragMoved.current) {
      e.cancelBubble = true;
      onSelect(screenshot);
    }
  }

  function handleDblClick(e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) {
    e.cancelBubble = true;
    onOpen(screenshot);
  }

  return (
    <Group
      x={position.x}
      y={position.y}
      draggable
      onMouseDown={() => {
        dragMoved.current = false;
      }}
      onTouchStart={() => {
        dragMoved.current = false;
      }}
      onDragStart={(e: Konva.KonvaEventObject<DragEvent>) => {
        dragMoved.current = false;
        e.cancelBubble = true;
      }}
      onDragMove={(e: Konva.KonvaEventObject<DragEvent>) => {
        dragMoved.current = true;
        e.cancelBubble = true;
      }}
      onDragEnd={(e: Konva.KonvaEventObject<DragEvent>) => {
        e.cancelBubble = true;
        onDragEnd(screenshot.id, e.target.x(), e.target.y());
      }}
      onClick={handleClick}
      onTap={handleClick}
      onDblClick={handleDblClick}
      onDblTap={handleDblClick}
    >
      <Rect
        width={CARD_WIDTH}
        height={CARD_HEIGHT}
        fill={theme.card}
        stroke={isSelected ? theme.primary : theme.border}
        strokeWidth={isSelected ? 2 : 1}
        cornerRadius={8}
      />
      {image ? (
        <KonvaImage
          image={image}
          x={(CARD_WIDTH - drawWidth) / 2}
          y={PADDING + (IMAGE_BOX_HEIGHT - PADDING * 2 - drawHeight) / 2}
          width={drawWidth}
          height={drawHeight}
        />
      ) : null}
      <Text
        text={screenshot.pageTitle}
        x={PADDING}
        y={CARD_HEIGHT - TITLE_HEIGHT + 6}
        width={CARD_WIDTH - PADDING * 2}
        height={18}
        fontSize={12}
        fontFamily={theme.fontFamily}
        fill={theme.mutedForeground}
        ellipsis
        wrap="none"
      />
    </Group>
  );
}
