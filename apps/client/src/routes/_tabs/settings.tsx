import { ScrollArea } from "@bead/ui/components/scroll-area";
import { Separator } from "@bead/ui/components/separator";
import { cn } from "@bead/ui/lib/utils";
import { createFileRoute } from "@tanstack/react-router";
import type { LucideIcon } from "lucide-react";
import { Info, Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "@/components/theme-provider";
import { appConfig } from "@/config/app";
import { TAB_CONTENT_ID } from "@/features/navigation/tab-config";

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
  const { setTheme, theme = "system" } = useTheme();

  return (
    <main
      aria-label="设置"
      className="flex h-full min-h-0 flex-col bg-background"
    >
      <header className="mx-auto flex h-16 w-full max-w-5xl shrink-0 items-center border-b px-4 md:px-8">
        <h1 className="font-semibold text-lg tracking-tight">设置</h1>
      </header>

      <ScrollArea className="min-h-0 flex-1" id={TAB_CONTENT_ID}>
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 py-6 md:px-8">
          <section aria-labelledby="appearance-title" className="space-y-4">
            <SectionHeading icon={Monitor} id="appearance-title" title="外观" />
            <fieldset
              aria-labelledby="appearance-title"
              className="m-0 flex min-w-0 flex-col gap-2 border-0 p-0"
            >
              {themeOptions.map(({ icon: Icon, label, value }) => {
                const isSelected = theme === value;

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
                      onChange={() => setTheme(value)}
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

          <Separator />

          <section aria-labelledby="about-title" className="space-y-4">
            <SectionHeading icon={Info} id="about-title" title="关于" />
            <dl className="grid gap-3 rounded-lg border px-3 py-3 text-sm sm:grid-cols-[8rem_1fr]">
              <dt className="text-muted-foreground">应用</dt>
              <dd className="font-medium">{appConfig.name}</dd>
              <dt className="text-muted-foreground">版本</dt>
              <dd className="font-medium">{appConfig.version}</dd>
            </dl>
          </section>
        </div>
      </ScrollArea>
    </main>
  );
}

function SectionHeading({
  icon: Icon,
  id,
  title,
}: {
  icon: LucideIcon;
  id: string;
  title: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
        <Icon aria-hidden="true" className="size-4" strokeWidth={1.8} />
      </span>
      <h2 className="font-medium text-base" id={id}>
        {title}
      </h2>
    </div>
  );
}
