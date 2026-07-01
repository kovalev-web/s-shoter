import { getAccessToken } from "./storage";
import { captureActiveTab } from "./capture";

const CAPTURE_COMMAND = "capture-screenshot";
const BADGE_MS = 2000;

// Toolbar badge is drawn by Chrome, not by our CSS — semantic tokens can't
// reach it and a service worker has no DOM to read them from. So these are
// plain color strings (same rationale as the canvas-theme exception).
const BADGE_OK = "#16a34a";
const BADGE_ERROR = "#dc2626";

chrome.commands.onCommand.addListener((command) => {
  if (command === CAPTURE_COMMAND) void handleCommand();
});

async function handleCommand(): Promise<void> {
  const token = await getAccessToken();
  if (!token) {
    // Not logged in — signal via badge; the user signs in from the popup.
    await flashBadge("!", BADGE_ERROR);
    return;
  }

  try {
    await captureActiveTab(token);
    await flashBadge("✓", BADGE_OK);
  } catch {
    await flashBadge("!", BADGE_ERROR);
  }
}

async function flashBadge(text: string, color: string): Promise<void> {
  await chrome.action.setBadgeBackgroundColor({ color });
  await chrome.action.setBadgeText({ text });
  setTimeout(() => {
    void chrome.action.setBadgeText({ text: "" });
  }, BADGE_MS);
}
