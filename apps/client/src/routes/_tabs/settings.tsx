import { ScrollArea } from "@bead/ui/components/scroll-area";
import { cn } from "@bead/ui/lib/utils";
import { createFileRoute } from "@tanstack/react-router";
import { Monitor, Moon, Sun } from "lucide-react";
import { useAppTheme } from "@/components/theme-provider";

export const Route = createFileRoute("/_tabs/settings")({
  component: SettingsPage,
});

const themeOptions = [
  {
    icon: Monitor,
    label: "跟随系统",
    value: "system",
  },
  {
    icon: Sun,
    label: "浅色",
    value: "light",
  },
  {
    icon: Moon,
    label: "深色",
    value: "dark",
  },
] as const;

function SettingsPage() {
  const { preference, setPreference } = useAppTheme();

  return (
    <main
      aria-label="设置"
      className="flex h-full min-h-0 flex-col bg-background"
    >
      <header className="mx-auto flex h-16 w-full max-w-5xl shrink-0 items-center border-b px-4 md:px-8">
        <h1 className="font-semibold text-lg tracking-tight">设置</h1>
      </header>

      <ScrollArea className="min-h-0 flex-1">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 py-6 md:px-8">
          <section aria-labelledby="theme-title" className="space-y-4">
            <h2 className="font-medium text-base" id="theme-title">
              主题
            </h2>
            <fieldset
              aria-labelledby="theme-title"
              className="m-0 flex min-w-0 flex-col gap-2 border-0 p-0"
            >
              {themeOptions.map(({ icon: Icon, label, value }) => {
                const isSelected = preference === value;

                return (
                  <label
                    className={cn(
                      "flex min-h-12 cursor-pointer items-center gap-3 rounded-lg border bg-background px-3 py-3 transition-colors hover:bg-muted/60",
                      isSelected && "border-primary bg-muted",
                    )}
                    key={value}
                  >
                    <input
                      checked={isSelected}
                      className="sr-only"
                      name="theme"
                      onChange={() => setPreference(value)}
                      type="radio"
                      value={value}
                    />
                    <Icon
                      aria-hidden="true"
                      className="size-4 shrink-0 text-muted-foreground"
                      strokeWidth={1.8}
                    />
                    <span className="min-w-0 flex-1 text-sm">{label}</span>
                  </label>
                );
              })}
            </fieldset>
          </section>
        </div>
      </ScrollArea>
    </main>
  );
}
