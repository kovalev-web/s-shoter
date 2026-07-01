export interface CanvasTheme {
  background: string;
  border: string;
  card: string;
  foreground: string;
  mutedForeground: string;
  primary: string;
  ring: string;
  fontFamily: string;
}

const TOKEN_VARS = {
  background: "--background",
  border: "--border",
  card: "--card",
  foreground: "--foreground",
  mutedForeground: "--muted-foreground",
  primary: "--primary",
  ring: "--ring",
} as const;

export function getCanvasTheme(): CanvasTheme {
  const styles = getComputedStyle(document.documentElement);
  const read = (variable: string) => styles.getPropertyValue(variable).trim();

  // Resolve the actual font family name from the CSS variable so Konva
  // renders card titles with the same typeface as the rest of the UI.
  const fontVar = read("--font-geist-sans");
  const fontFamily = fontVar || "ui-sans-serif, system-ui, sans-serif";

  return {
    background: read(TOKEN_VARS.background),
    border: read(TOKEN_VARS.border),
    card: read(TOKEN_VARS.card),
    foreground: read(TOKEN_VARS.foreground),
    mutedForeground: read(TOKEN_VARS.mutedForeground),
    primary: read(TOKEN_VARS.primary),
    ring: read(TOKEN_VARS.ring),
    fontFamily,
  };
}
