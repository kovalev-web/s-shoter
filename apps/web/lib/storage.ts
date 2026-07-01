import { mkdir, unlink, writeFile } from "fs/promises";
import path from "path";

const STORAGE_DIR = path.join(process.cwd(), "storage");

export function storagePath(key: string): string {
  return path.join(STORAGE_DIR, key);
}

export async function saveScreenshotFile(key: string, buffer: Buffer): Promise<void> {
  await mkdir(STORAGE_DIR, { recursive: true });
  await writeFile(storagePath(key), buffer);
}

export async function deleteScreenshotFile(key: string): Promise<void> {
  await unlink(storagePath(key)).catch(() => {});
}
