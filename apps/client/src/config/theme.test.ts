import { expect, test } from "bun:test";
import { createThemeBootstrapScript, resolveThemeState } from "@/config/theme";

type BootstrapResult = {
  classes: string[];
  colorScheme: string;
  storedPreference: string | null;
};

function runThemeBootstrap(
  storedPreference: string | null,
  prefersDark: boolean,
): BootstrapResult {
  const classes = new Set(["h-full", "light"]);
  let preference = storedPreference;
  const document = {
    documentElement: {
      classList: {
        add: (...tokens: string[]) => {
          for (const token of tokens) {
            classes.add(token);
          }
        },
        remove: (...tokens: string[]) => {
          for (const token of tokens) {
            classes.delete(token);
          }
        },
      },
      style: { colorScheme: "" },
    },
  };
  const storage = {
    getItem: () => preference,
    removeItem: () => {
      preference = null;
    },
  };
  const browserWindow = {
    matchMedia: () => ({ matches: prefersDark }),
  };
  const execute = new Function(
    "document",
    "localStorage",
    "window",
    createThemeBootstrapScript(),
  );

  execute(document, storage, browserWindow);

  return {
    classes: [...classes],
    colorScheme: document.documentElement.style.colorScheme,
    storedPreference: preference,
  };
}

test("applies a stored theme before the app starts", () => {
  const result = runThemeBootstrap("light", true);

  expect(result.classes).toContain("light");
  expect(result.classes).not.toContain("dark");
  expect(result.colorScheme).toBe("light");
  expect(result.storedPreference).toBe("light");
});

test("discards an invalid preference and falls back to the system theme", () => {
  const result = runThemeBootstrap("sepia", true);

  expect(result.classes).toContain("dark");
  expect(result.classes).not.toContain("light");
  expect(result.colorScheme).toBe("dark");
  expect(result.storedPreference).toBeNull();
});

test("normalizes an invalid runtime preference to the resolved system theme", () => {
  const result = resolveThemeState("sepia", "sepia", "dark", "light");

  expect(result).toEqual({
    preference: "system",
    resolvedTheme: "dark",
    shouldResetPreference: true,
  });
});

test("keeps a valid explicit runtime preference", () => {
  const result = resolveThemeState("light", "light", "dark", "dark");

  expect(result).toEqual({
    preference: "light",
    resolvedTheme: "light",
    shouldResetPreference: false,
  });
});
