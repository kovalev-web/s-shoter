import { uploadScreenshot } from "./api";

// Shared capture flow used by BOTH the popup button and the keyboard-command
// background worker. Grabs the visible area of the active tab and uploads it.
// Works from a service worker (no DOM APIs used): chrome.tabs.captureVisibleTab,
// fetch and Blob are all available there.
export async function captureActiveTab(token: string): Promise<void> {
  const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
  if (!tab?.url) throw new Error("Не удалось получить вкладку");

  // JPEG q90 instead of PNG — see api.ts: PNG of photographic/gradient pages is
  // multi-MB and made the board janky. Visually lossless for a reference shot.
  const dataUrl = await chrome.tabs.captureVisibleTab(tab.windowId, {
    format: "jpeg",
    quality: 90,
  });
  const blob = await (await fetch(dataUrl)).blob();
  const capturedAt = new Date().toISOString();

  await uploadScreenshot(token, blob, tab.url, tab.title ?? tab.url, capturedAt);
}
