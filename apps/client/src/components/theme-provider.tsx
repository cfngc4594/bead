import {
  ThemeProvider as NextThemesProvider,
  useTheme as useNextTheme,
} from "next-themes";
import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
} from "react";
import {
  type ResolvedTheme,
  resolvedThemes,
  resolveThemeState,
  type ThemePreference,
  themeConfig,
} from "@/config/theme";

type AppThemeState = {
  preference: ThemePreference;
  resolvedTheme: ResolvedTheme;
  setPreference: (preference: ThemePreference) => void;
};

const AppThemeContext = createContext<AppThemeState | undefined>(undefined);
const runtimeThemes = [...resolvedThemes];

export function AppThemeProvider({ children }: PropsWithChildren) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme={themeConfig.defaultPreference}
      disableTransitionOnChange
      enableColorScheme
      enableSystem
      storageKey={themeConfig.storageKey}
      themes={runtimeThemes}
    >
      <AppThemeStateProvider>{children}</AppThemeStateProvider>
    </NextThemesProvider>
  );
}

function AppThemeStateProvider({ children }: PropsWithChildren) {
  const {
    resolvedTheme: nextResolvedTheme,
    setTheme,
    systemTheme: nextSystemTheme,
    theme: nextPreference,
  } = useNextTheme();
  const { preference, resolvedTheme, shouldResetPreference } =
    resolveThemeState(
      nextPreference,
      nextResolvedTheme,
      nextSystemTheme,
      getDocumentThemeFallback(),
    );
  const setPreference = useCallback(
    (nextPreference: ThemePreference) => setTheme(nextPreference),
    [setTheme],
  );

  useEffect(() => {
    if (shouldResetPreference) {
      setTheme(themeConfig.defaultPreference);
    }
  }, [setTheme, shouldResetPreference]);

  const value = useMemo(
    () => ({ preference, resolvedTheme, setPreference }),
    [preference, resolvedTheme, setPreference],
  );

  return (
    <AppThemeContext.Provider value={value}>
      {children}
    </AppThemeContext.Provider>
  );
}

function getDocumentThemeFallback(): ResolvedTheme {
  return typeof document !== "undefined" &&
    document.documentElement.classList.contains("dark")
    ? "dark"
    : "light";
}

export function useAppTheme(): AppThemeState {
  const context = useContext(AppThemeContext);

  if (!context) {
    throw new Error("useAppTheme must be used within AppThemeProvider");
  }

  return context;
}
