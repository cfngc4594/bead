export type BoardTheme = "light" | "dark";
export type BoardThemePreference = BoardTheme | "system";

export function resolveBoardTheme(theme: BoardThemePreference): BoardTheme {
  if (theme !== "system") {
    return theme;
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}
