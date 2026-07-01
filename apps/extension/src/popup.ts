import "./styles.css";
import { getAccessToken, setAccessToken, clearAccessToken } from "./storage";
import { login, fetchToday, uploadScreenshot, fetchAuthorizedImageUrl, AuthError, type TodayItem } from "./api";

const app = document.getElementById("app");
if (!app) throw new Error("Missing #app root element");

async function main() {
  const token = await getAccessToken();
  if (!token) {
    renderLogin();
  } else {
    await renderMain(token);
  }
}

function renderLogin() {
  app!.innerHTML = `
    <h1 class="text-sm font-medium">Вход в s-shoter</h1>
    <form id="login-form" class="flex flex-col gap-2">
      <input id="email" type="email" placeholder="Email" required autocomplete="email"
        class="h-8 rounded-md border border-input bg-transparent px-2 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring" />
      <input id="password" type="password" placeholder="Пароль" required autocomplete="current-password"
        class="h-8 rounded-md border border-input bg-transparent px-2 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring" />
      <p id="login-error" class="hidden text-xs text-destructive"></p>
      <button type="submit"
        class="h-8 rounded-md bg-primary text-sm font-medium text-primary-foreground">Войти</button>
    </form>
  `;

  const form = document.getElementById("login-form") as HTMLFormElement;
  const errorEl = document.getElementById("login-error") as HTMLParagraphElement;

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    errorEl.classList.add("hidden");

    const email = (document.getElementById("email") as HTMLInputElement).value;
    const password = (document.getElementById("password") as HTMLInputElement).value;

    try {
      const token = await login(email, password);
      await setAccessToken(token);
      await renderMain(token);
    } catch (err) {
      errorEl.textContent = err instanceof Error ? err.message : "Не удалось войти";
      errorEl.classList.remove("hidden");
    }
  });
}

async function renderMain(token: string) {
  app!.innerHTML = `
    <div class="flex items-center justify-between">
      <span id="today-count" class="text-sm font-medium">Сегодня: …</span>
      <button id="logout" class="text-xs text-muted-foreground underline underline-offset-4">Выйти</button>
    </div>
    <button id="capture"
      class="h-9 rounded-md bg-primary text-sm font-medium text-primary-foreground">Сохранить скриншот</button>
    <p id="status" class="hidden text-xs"></p>
    <div id="today-list" class="flex max-h-64 flex-col gap-2 overflow-y-auto"></div>
  `;

  document.getElementById("logout")?.addEventListener("click", async () => {
    await clearAccessToken();
    renderLogin();
  });

  document.getElementById("capture")?.addEventListener("click", () => {
    void handleCapture(token);
  });

  await refreshToday(token);
}

async function refreshToday(token: string) {
  const countEl = document.getElementById("today-count");
  const listEl = document.getElementById("today-list");
  if (!countEl || !listEl) return;

  try {
    const { count, items } = await fetchToday(token);
    countEl.textContent = `Сегодня: ${count}`;
    listEl.innerHTML = "";
    for (const item of items) {
      listEl.appendChild(await renderTodayItem(token, item));
    }
  } catch (err) {
    if (err instanceof AuthError) {
      renderLogin();
      return;
    }
    countEl.textContent = "Сегодня: —";
  }
}

async function renderTodayItem(token: string, item: TodayItem): Promise<HTMLElement> {
  const row = document.createElement("div");
  row.className = "flex items-center gap-2 rounded-md border border-border bg-card p-1.5";

  const img = document.createElement("img");
  img.className = "h-8 w-8 rounded object-cover";
  img.alt = "";
  try {
    img.src = await fetchAuthorizedImageUrl(token, item.thumbnailUrl);
  } catch {
    // leave the thumbnail empty if it fails to load
  }

  const time = document.createElement("span");
  time.className = "text-xs text-muted-foreground";
  time.textContent = new Date(item.capturedAt).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  row.append(img, time);
  return row;
}

async function handleCapture(token: string) {
  const statusEl = document.getElementById("status");
  if (!statusEl) return;

  statusEl.classList.remove("hidden");
  statusEl.textContent = "Снимаем...";
  statusEl.className = "text-xs text-muted-foreground";

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.url) throw new Error("Не удалось получить вкладку");

    // JPEG instead of PNG: PNG compresses photographic/gradient page content
    // poorly (multi-MB files), which made the board and detail view janky
    // decoding it. JPEG at high quality is visually lossless for a reference
    // screenshot and a fraction of the size.
    const dataUrl = await chrome.tabs.captureVisibleTab({ format: "jpeg", quality: 90 });
    const blob = await (await fetch(dataUrl)).blob();
    const capturedAt = new Date().toISOString();

    await uploadScreenshot(token, blob, tab.url, tab.title ?? tab.url, capturedAt);

    statusEl.textContent = "Сохранено";
    statusEl.className = "text-xs text-primary";
    await refreshToday(token);
  } catch (err) {
    if (err instanceof AuthError) {
      renderLogin();
      return;
    }
    statusEl.textContent = err instanceof Error ? err.message : "Не удалось сохранить скриншот";
    statusEl.className = "text-xs text-destructive";
  }
}

void main();
