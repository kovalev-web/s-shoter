"use client";

import { useEffect, useRef } from "react";
import type Konva from "konva";

interface GridOverlayProps {
  stageRef: { current: Konva.Stage | null };
  dotColor: string;
}

const DOT_RADIUS = 1.5;

function getGridStep(scale: number): number {
  if (scale < 0.2) return 128;
  if (scale < 0.4) return 64;
  if (scale < 1) return 32;
  if (scale < 2.5) return 16;
  return 8;
}

export function GridOverlay({ stageRef, dotColor }: GridOverlayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const stage = stageRef.current;
    if (!canvas || !stage) return;

    let prevX = 0, prevY = 0, prevScale = 0, prevW = 0, prevH = 0;
    let animId: number;

    function draw() {
      const scale = stage.scaleX();
      const pos = stage.position();
      const w = stage.width();
      const h = stage.height();

      if (
        prevX === pos.x &&
        prevY === pos.y &&
        prevScale === scale &&
        prevW === w &&
        prevH === h
      ) {
        animId = requestAnimationFrame(draw);
        return;
      }
      prevX = pos.x; prevY = pos.y; prevScale = scale; prevW = w; prevH = h;

      const dpr = window.devicePixelRatio || 1;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = w + "px";
      canvas.style.height = h + "px";

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        animId = requestAnimationFrame(draw);
        return;
      }

      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, w, h);

      const left = -pos.x / scale;
      const top = -pos.y / scale;
      const right = left + w / scale;
      const bottom = top + h / scale;

      const step = getGridStep(scale);
      const startX = Math.floor(left / step) * step;
      const startY = Math.floor(top / step) * step;

      ctx.fillStyle = dotColor;

      for (let x = startX; x <= right; x += step) {
        for (let y = startY; y <= bottom; y += step) {
          const sx = x * scale + pos.x;
          const sy = y * scale + pos.y;
          ctx.beginPath();
          ctx.arc(sx, sy, DOT_RADIUS, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      animId = requestAnimationFrame(draw);
    }

    animId = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animId);
  }, [stageRef, dotColor]);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none absolute inset-0"
    />
  );
}
