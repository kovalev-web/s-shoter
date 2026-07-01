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
  const rectRef = useRef<Konva.Rect>(null);
  const trRef = useRef<Konva.Transformer>(null);

  // Uncontrolled after mount: the Transformer's target (the Rect itself) owns
  // its live width/height/scale during a resize; React state only mirrors the
  // committed value once the gesture ends.
  const [size, setSize] = useState({ width: frame.width, height: frame.height });

  useEffect(() => {
    // Attach the Transformer to the Rect, NOT the wrapping Group — a Group's
    // size is derived from its children, which made Konva's own resize math
    // (position correction for top/left anchors) drift as we mutated those
    // children mid-drag. A plain Rect has native width()/height() that Konva
    // is built to resize directly, so it stays stable throughout the drag.
    if (isSelected && rectRef.current && trRef.current) {
      trRef.current.nodes([rectRef.current]);
      trRef.current.getLayer()?.batchDraw();
    }
  }, [isSelected]);

  function handleTransformEnd() {
    const group = groupRef.current;
    const rect = rectRef.current;
    if (!group || !rect) return;

    const width = Math.max(FRAME_MIN_WIDTH, rect.width() * rect.scaleX());
    const height = Math.max(FRAME_MIN_HEIGHT, rect.height() * rect.scaleY());
    // Resizing from a top/left anchor also shifts the Rect's own local x/y
    // (to keep the opposite corner fixed) — fold that into the Group's
    // absolute position and reset the Rect back to (0,0)/scale 1, so
    // frame.x/y keeps meaning "the box's absolute top-left" everywhere else
    // (persistence, the contained-screenshots bounds check).
    const x = group.x() + rect.x();
    const y = group.y() + rect.y();

    rect.position({ x: 0, y: 0 });
    rect.scale({ x: 1, y: 1 });
    rect.width(width);
    rect.height(height);
    group.position({ x, y });

    setSize({ width, height });
    onChange(frame.id, x, y, width, height);
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
      >
        <Rect
          ref={rectRef}
          width={size.width}
          height={size.height}
          fill={theme.border}
          stroke={isSelected ? theme.primary : theme.mutedForeground}
          strokeWidth={isSelected ? 2 : 1}
          strokeScaleEnabled={false}
          dash={[6, 4]}
          cornerRadius={CORNER_RADIUS}
          onTransformEnd={handleTransformEnd}
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
