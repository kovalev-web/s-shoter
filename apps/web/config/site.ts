export const routes = {
  home: "/",
  register: "/register",
  login: "/login",
  boards: "/boards",
} as const;

export function boardHref(boardId: string): string {
  return `${routes.boards}/${boardId}`;
}

export const siteConfig = {
  name: "s-shoter",
  description: "Скриншоты с полным контекстом на бесконечной доске",
};
