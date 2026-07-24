import { Label } from "@bead/ui/components/label";
import { RadioGroup, RadioGroupItem } from "@bead/ui/components/radio-group";
import { ScrollArea } from "@bead/ui/components/scroll-area";
import { Separator } from "@bead/ui/components/separator";
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
    description: "使用设备当前的外观偏好",
    icon: Monitor,
    label: "跟随系统",
    value: "system",
  },
  {
    description: "白天或明亮环境下更清爽",
    icon: Sun,
    label: "浅色",
    value: "light",
  },
  {
    description: "夜间或弱光环境下更柔和",
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
      <header className="mx-auto w-full max-w-3xl shrink-0 border-b px-4 pt-6 pb-5 sm:px-6 lg:px-8">
        <h1 className="font-semibold text-2xl tracking-normal">设置</h1>
      </header>

      <ScrollArea className="min-h-0 flex-1" id={TAB_CONTENT_ID}>
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-4 py-6 sm:px-6 lg:px-8">
          <section aria-labelledby="appearance-title" className="space-y-4">
            <SectionHeading icon={Monitor} id="appearance-title" title="外观" />
            <RadioGroup
              className="gap-2"
              onValueChange={setTheme}
              value={theme}
            >
              {themeOptions.map(({ description, icon: Icon, label, value }) => (
                <Label
                  className="flex min-h-16 cursor-pointer items-center gap-3 rounded-lg border bg-background px-3 py-3 transition-colors hover:bg-muted/60 has-data-[state=checked]:border-primary has-data-[state=checked]:bg-muted"
                  htmlFor={`theme-${value}`}
                  key={value}
                >
                  <RadioGroupItem id={`theme-${value}`} value={value} />
                  <Icon
                    aria-hidden="true"
                    className="size-4 shrink-0 text-muted-foreground"
                    strokeWidth={1.8}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm">{label}</span>
                    <span className="block text-muted-foreground text-xs leading-5">
                      {description}
                    </span>
                  </span>
                </Label>
              ))}
            </RadioGroup>
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
