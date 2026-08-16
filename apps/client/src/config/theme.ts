export const themePreferences = ["light", "dark", "system"] as const;
export const resolvedThemes = ["light", "dark"] as const;

export type ThemePreference = (typeof themePreferences)[number];
export type ResolvedTheme = (typeof resolvedThemes)[number];

export const themeConfig = {
  criticalBackgrounds: {
    dark: "oklch(0.145 0 0)",
    light: "oklch(1 0 0)",
  },
  defaultPreference: "system",
  storageKey: "vite-ui-theme",
} as const satisfies {
  criticalBackgrounds: Record<ResolvedTheme, string>;
  defaultPreference: ThemePreference;
  storageKey: string;
};

export function isThemePreference(value: unknown): value is ThemePreference {
  return themePreferences.some((theme) => theme === value);
}

export function isResolvedTheme(value: unknown): value is ResolvedTheme {
  return resolvedThemes.some((theme) => theme === value);
}

export function resolveThemeState(
  preference: string | undefined,
  resolvedTheme: string | undefined,
  systemTheme: string | undefined,
  documentTheme: ResolvedTheme,
): {
  preference: ThemePreference;
  resolvedTheme: ResolvedTheme;
  shouldResetPreference: boolean;
} {
  const safePreference = isThemePreference(preference)
    ? preference
    : themeConfig.defaultPreference;
  let safeResolvedTheme = documentTheme;

  if (isResolvedTheme(resolvedTheme)) {
    safeResolvedTheme = resolvedTheme;
  } else if (safePreference === "system" && isResolvedTheme(systemTheme)) {
    safeResolvedTheme = systemTheme;
  } else if (isResolvedTheme(safePreference)) {
    safeResolvedTheme = safePreference;
  }

  return {
    preference: safePreference,
    resolvedTheme: safeResolvedTheme,
    shouldResetPreference:
      preference !== undefined && !isThemePreference(preference),
  };
}

export function createThemeBootstrapScript(): string {
  const defaultPreference = JSON.stringify(themeConfig.defaultPreference);
  const storageKey = JSON.stringify(themeConfig.storageKey);
  const supportedPreferences = JSON.stringify(themePreferences);

  return `(()=>{const d=document.documentElement,k=${storageKey},p=${supportedPreferences};let t=${defaultPreference};try{const s=localStorage.getItem(k);if(p.includes(s)){t=s}else if(s!==null){localStorage.removeItem(k)}}catch{}const r=t==="system"?(window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"):t;d.classList.remove("light","dark");d.classList.add(r);d.style.colorScheme=r})();`;
}

export function createThemeCriticalStyles(): string {
  return `html{background-color:${themeConfig.criticalBackgrounds.light}}html.dark{background-color:${themeConfig.criticalBackgrounds.dark}}`;
}
