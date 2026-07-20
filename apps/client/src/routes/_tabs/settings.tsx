import { Button } from "@bead/ui/components/button";
import { Label } from "@bead/ui/components/label";
import { RadioGroup, RadioGroupItem } from "@bead/ui/components/radio-group";
import { Separator } from "@bead/ui/components/separator";
import { createFileRoute } from "@tanstack/react-router";
import type { LucideIcon } from "lucide-react";
import { Database, Info, Monitor, Moon, RotateCcw, Sun } from "lucide-react";
import { toast } from "sonner";
import { useTheme } from "@/components/theme-provider";
import { appConfig } from "@/config/app";

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

  function resetSettings() {
    setTheme("system");
    toast.success("设置已重置");
  }

  return (
    <main aria-label="设置" className="min-h-full bg-background">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-4 py-6 sm:px-6 lg:px-8">
        <header className="space-y-1">
          <h1 className="font-semibold text-2xl tracking-normal">设置</h1>
          <p className="text-muted-foreground text-sm">
            管理外观、本地数据和应用信息。
          </p>
        </header>

        <section aria-labelledby="appearance-title" className="space-y-4">
          <SectionHeading
            description="选择应用使用的颜色模式。"
            icon={Monitor}
            id="appearance-title"
            title="外观"
          />
          <RadioGroup className="gap-2" onValueChange={setTheme} value={theme}>
            {themeOptions.map(({ description, icon: Icon, label, value }) => (
              <Label
                className="flex min-h-16 cursor-pointer items-center gap-3 rounded-lg border bg-background px-3 py-3 transition-colors hover:bg-muted/60 has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-muted"
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

        <section aria-labelledby="data-title" className="space-y-4">
          <SectionHeading
            description="恢复当前设备上的应用偏好。"
            icon={Database}
            id="data-title"
            title="数据"
          />
          <div className="flex flex-col gap-3 rounded-lg border px-3 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <h3 className="font-medium text-sm">重置本地设置</h3>
              <p className="text-muted-foreground text-xs leading-5">
                将主题恢复为跟随系统，不会删除作品。
              </p>
            </div>
            <Button
              className="w-full sm:w-auto"
              onClick={resetSettings}
              type="button"
              variant="outline"
            >
              <RotateCcw aria-hidden="true" />
              重置
            </Button>
          </div>
        </section>

        <Separator />

        <section aria-labelledby="about-title" className="space-y-4">
          <SectionHeading
            description="查看当前应用版本。"
            icon={Info}
            id="about-title"
            title="关于"
          />
          <dl className="grid gap-3 rounded-lg border px-3 py-3 text-sm sm:grid-cols-[8rem_1fr]">
            <dt className="text-muted-foreground">应用</dt>
            <dd className="font-medium">{appConfig.name}</dd>
            <dt className="text-muted-foreground">版本</dt>
            <dd className="font-medium">{appConfig.version}</dd>
          </dl>
        </section>
      </div>
    </main>
  );
}

function SectionHeading({
  description,
  icon: Icon,
  id,
  title,
}: {
  description: string;
  icon: LucideIcon;
  id: string;
  title: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
        <Icon aria-hidden="true" className="size-4" strokeWidth={1.8} />
      </span>
      <div className="space-y-1">
        <h2 className="font-medium text-base" id={id}>
          {title}
        </h2>
        <p className="text-muted-foreground text-sm">{description}</p>
      </div>
    </div>
  );
}
