import type { Frame } from "@s-shoter/db";

export function toFrameDto(frame: Frame) {
  return {
    id: frame.id,
    name: frame.name,
    x: frame.x,
    y: frame.y,
    width: frame.width,
    height: frame.height,
  };
}

export type FrameDto = ReturnType<typeof toFrameDto>;
