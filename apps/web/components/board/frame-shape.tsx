"use client";

import { useEffect, useRef, useState } from "react";
import { Group, Rect, Text, Transformer } from "react-konva";
import type Konva from "konva";
import { FRAME_MIN_HEIGHT, FRAME_MIN_WIDTH } from "@s-shoter/shared";
import type { CanvasTheme } from "@/lib/canvas-theme";
import type { FrameDto } from "@/lib/frame-dto";

const CORNER_RADIUS = 8;
const LABEL_PADDING = 10;

interface FrameShapeProps {
  frame: FrameDto;
  theme: CanvasTheme;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onChange: (id: string, x: number, y: number, width: number, height: number) => void;
  onRename: (frame: FrameDto) => void;
  // Live drag hooks so the board can carry contained screenshots along with
  // the frame (Figma/Miro "frame" behavior), separate from the final commit
  // in onChange which also fires after a resize (no card movement then).
  onGroupDragStart: (frame: FrameDto) => void;
  onGroupDragMove: (frame: FrameDto, dx: number, dy: number) => void;
}

export function FrameShape({
  frame,
  theme,
  isSelected,
  onSelect,
  onChange,
  onRename,
  onGroupDragStart,
  onGroupDragMove,
}: FrameShapeProps) {
  const groupRef = useRef<Konva.Group>(null);
  const trRef = useRef<Konva.Transformer>(null);
  const fillRectRef = useRef<Konva.Rect>(null);
  const borderRectRef = useRef<Konva.Rect>(null);

  // Uncontrolled size after mount, same rationale as ScreenshotCard: Konva
  // owns the live transform during drag/resize, React state only mirrors it
  // for the sibling Rect/Text so they redraw with the new dimensions.
  const [size, setSize] = useState({ width: frame.width, height: frame.height });
  // Tracks the size computed on the most recent onTransform tick, so
  // onTransformEnd can commit it without re-deriving from scale (which this
  // component already resets to 1 on every tick — see handleTransform).
  const liveSizeRef = useRef(size);

  useEffect(() => {
    if (isSelected && groupRef.current && trRef.current) {
      trRef.current.nodes([groupRef.current]);
      trRef.current.getLayer()?.batchDraw();
    }
  }, [isSelected]);

  function handleTransform() {
    const node = groupRef.current;
    if (!node) return;

    // Konva's Transformer resizes by scaling the whole node, which would
    // stretch the dashed stroke and the label text for the duration of the
    // drag. Convert scale -> width/height on every tick (not only at the
    // end) so only the rect grows — the recommended pattern for resizable
    // Konva shapes.
    const width = Math.max(FRAME_MIN_WIDTH, size.width * node.scaleX());
    const height = Math.max(FRAME_MIN_HEIGHT, size.height * node.scaleY());
    node.scaleX(1);
    node.scaleY(1);

    fillRectRef.current?.width(width);
    fillRectRef.current?.height(height);
    borderRectRef.current?.width(width);
    borderRectRef.current?.height(height);
    liveSizeRef.current = { width, height };
    node.getLayer()?.batchDraw();
  }

  function handleTransformEnd() {
    const node = groupRef.current;
    if (!node) return;

    const { width, height } = liveSizeRef.current;
    setSize({ width, height });
    onChange(frame.id, node.x(), node.y(), width, height);
  }

  function handleDragEnd() {
    const node = groupRef.current;
    if (!node) return;
    onChange(frame.id, node.x(), node.y(), size.width, size.height);
  }

  function select(e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) {
    e.cancelBubble = true;
    onSelect(frame.id);
  }

  function rename(e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) {
    e.cancelBubble = true;
    onRename(frame);
  }

  return (
    <>
      <Group
        ref={groupRef}
        x={frame.x}
        y={frame.y}
        draggable
        onClick={select}
        onTap={select}
        onDblClick={rename}
        onDblTap={rename}
        onDragStart={() => onGroupDragStart(frame)}
        onDragMove={(e: Konva.KonvaEventObject<DragEvent>) => {
          onGroupDragMove(frame, e.target.x() - frame.x, e.target.y() - frame.y);
        }}
        onDragEnd={handleDragEnd}
        onTransform={handleTransform}
        onTransformEnd={handleTransformEnd}
      >
        <Rect
          ref={fillRectRef}
          width={size.width}
          height={size.height}
          fill={theme.mutedForeground}
          opacity={0.08}
          cornerRadius={CORNER_RADIUS}
        />
        <Rect
          ref={borderRectRef}
          width={size.width}
          height={size.height}
          fillEnabled={false}
          stroke={isSelected ? theme.primary : theme.border}
          strokeWidth={isSelected ? 2 : 1}
          dash={[6, 4]}
          cornerRadius={CORNER_RADIUS}
        />
        <Text
          text={frame.name}
          x={LABEL_PADDING}
          y={LABEL_PADDING}
          fontSize={13}
          fontFamily={theme.fontFamily}
          fill={theme.mutedForeground}
        />
      </Group>
      {isSelected ? (
        <Transformer
          ref={trRef}
          rotateEnabled={false}
          keepRatio={false}
          anchorStroke={theme.primary}
          anchorFill={theme.card}
          borderStroke={theme.primary}
          boundBoxFunc={(oldBox, newBox) => {
            if (newBox.width < FRAME_MIN_WIDTH || newBox.height < FRAME_MIN_HEIGHT) return oldBox;
            return newBox;
          }}
        />
      ) : null}
    </>
  );
}
