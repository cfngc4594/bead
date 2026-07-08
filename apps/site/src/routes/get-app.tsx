import { Button } from "@bead/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@bead/ui/components/card";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Apple, ArrowLeft, Download, Globe2, Smartphone } from "lucide-react";
import { siteLinks } from "@/config/links";

export const Route = createFileRoute("/get-app")({
  component: GetAppPage,
});

function GetAppPage() {
  return (
    <main className="min-h-screen bg-background px-5 py-5 sm:px-6">
      <div className="mx-auto flex w-full max-w-4xl flex-col">
        <header className="flex h-12 items-center justify-between">
          <Button asChild variant="ghost" size="sm">
            <Link to="/">
              <ArrowLeft data-icon="inline-start" />
              Bead
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <a href={siteLinks.webApp}>立即体验</a>
          </Button>
        </header>

        <section className="mx-auto flex w-full max-w-2xl flex-col items-center pt-16 text-center sm:pt-24">
          <h1 className="text-balance font-semibold text-4xl leading-tight tracking-normal sm:text-5xl">
            获取 Bead 应用
          </h1>
          <p className="mt-4 max-w-xl text-pretty text-base leading-7 text-muted-foreground sm:text-lg">
            选择你的平台。移动端下载链接可以在发布到商店或提供安装包后直接替换。
          </p>
        </section>

        <section className="mt-10 grid gap-4 sm:grid-cols-2">
          <PlatformCard
            title="Android"
            description="下载 Android 版本，适合手机和平板使用。"
            href={siteLinks.android}
            icon={<Smartphone className="size-5" />}
            action="下载 Android"
          />
          <PlatformCard
            title="iOS"
            description="前往 iPhone 和 iPad 的 iOS 下载入口。"
            href={siteLinks.ios}
            icon={<Apple className="size-5" />}
            action="下载 iOS"
          />
        </section>

        <Card className="mt-4 rounded-2xl border-0 bg-white/75 shadow-sm ring-1 ring-foreground/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe2 className="size-4" />
              Web
            </CardTitle>
            <CardDescription>
              不安装应用也可以直接打开网页版开始使用。
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" className="w-full sm:w-auto">
              <a href={siteLinks.webApp}>立即体验</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

function PlatformCard({
  title,
  description,
  href,
  icon,
  action,
}: {
  title: string;
  description: string;
  href: string;
  icon: React.ReactNode;
  action: string;
}) {
  return (
    <Card className="rounded-2xl border-0 bg-white/80 shadow-sm ring-1 ring-foreground/10">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span className="flex size-9 items-center justify-center rounded-lg bg-secondary text-secondary-foreground">
            {icon}
          </span>
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <Button asChild className="w-full">
          <a href={href}>
            {action}
            <Download data-icon="inline-end" />
          </a>
        </Button>
      </CardContent>
    </Card>
  );
}
