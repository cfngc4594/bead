import { Badge } from "@bead/ui/components/badge";
import { Button } from "@bead/ui/components/button";
import { Card } from "@bead/ui/components/card";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Brush, Download, Layers3, Sparkles } from "lucide-react";
import { siteLinks } from "@/config/links";

export const Route = createFileRoute("/")({
  component: HomePage,
});

const screenshots = [
  {
    title: "Import",
    caption: "Turn a reference image into a clean bead canvas.",
    accent: "bg-emerald-400",
    cells: ["#f4c7b8", "#e95c40", "#f6dd74", "#2d6cdf", "#59b383"],
  },
  {
    title: "Design",
    caption: "Edit shapes, colors, and project details in one focused space.",
    accent: "bg-sky-400",
    cells: ["#e8edf2", "#111827", "#f8fafc", "#84cc16", "#ef4444"],
  },
  {
    title: "Export",
    caption: "Keep patterns ready for web, Android, and iOS workflows.",
    accent: "bg-amber-400",
    cells: ["#111827", "#f97316", "#facc15", "#22c55e", "#e5e7eb"],
  },
];

const previewCells = Array.from({ length: 49 }, (_, index) => ({
  id: `cell-${index}`,
  index,
}));

function HomePage() {
  return (
    <main className="min-h-screen overflow-hidden bg-background">
      <SiteHeader />

      <section className="mx-auto flex w-full max-w-6xl flex-col items-center px-5 pt-16 pb-10 text-center sm:px-6 sm:pt-20 lg:pt-24">
        <Badge
          variant="outline"
          className="h-7 gap-1.5 rounded-full border-emerald-200 bg-emerald-50 px-3 text-emerald-900"
        >
          <Sparkles className="size-3.5" />
          Web, Android, iOS
        </Badge>

        <h1 className="mt-6 max-w-3xl text-balance font-semibold text-5xl leading-none tracking-normal sm:text-6xl lg:text-7xl">
          Bead
        </h1>
        <p className="mt-5 max-w-2xl text-pretty text-base leading-7 text-muted-foreground sm:text-lg">
          把图片变成清晰的串珠图纸，在网页上快速创作，也能在手机上随时查看和继续整理项目。
        </p>

        <div className="mt-8 flex w-full max-w-sm flex-col gap-3 sm:max-w-none sm:flex-row sm:justify-center">
          <Button asChild size="lg" className="h-12 px-6 text-base">
            <Link to="/get-app">
              获取应用
              <Download data-icon="inline-end" />
            </Link>
          </Button>
          <Button
            asChild
            size="lg"
            variant="outline"
            className="h-12 border-foreground/15 bg-white/70 px-6 text-base shadow-sm"
          >
            <a href={siteLinks.webApp}>
              立即体验
              <ArrowRight data-icon="inline-end" />
            </a>
          </Button>
        </div>
      </section>

      <section
        aria-label="Product screenshots"
        className="mx-auto grid w-full max-w-6xl gap-4 px-5 pb-16 sm:px-6 md:grid-cols-3 lg:pb-24"
      >
        {screenshots.map((screenshot) => (
          <ProductScreenshot key={screenshot.title} screenshot={screenshot} />
        ))}
      </section>
    </main>
  );
}

function SiteHeader() {
  return (
    <header className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-5 sm:px-6">
      <Link to="/" className="flex items-center gap-2 font-semibold">
        <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          B
        </span>
        <span>Bead</span>
      </Link>
      <nav className="flex items-center gap-1">
        <Button
          asChild
          variant="ghost"
          size="sm"
          className="hidden sm:inline-flex"
        >
          <a href={siteLinks.webApp}>立即体验</a>
        </Button>
        <Button asChild size="sm">
          <Link to="/get-app">获取应用</Link>
        </Button>
      </nav>
    </header>
  );
}

function ProductScreenshot({
  screenshot,
}: {
  screenshot: (typeof screenshots)[number];
}) {
  return (
    <Card className="min-h-80 rounded-2xl border-0 bg-white/80 p-3 shadow-sm ring-1 ring-foreground/10">
      <div className="flex items-center justify-between px-2 pt-1">
        <div>
          <div className="text-sm font-medium">{screenshot.title}</div>
          <div className="mt-1 text-xs text-muted-foreground">
            {screenshot.caption}
          </div>
        </div>
        <div
          className={`size-3 rounded-full ${screenshot.accent}`}
          aria-hidden="true"
        />
      </div>
      <div className="mt-5 rounded-xl border bg-[oklch(0.98_0.006_120)] p-3">
        <div className="grid grid-cols-7 gap-1">
          {previewCells.map((cell) => (
            <span
              key={cell.id}
              className="aspect-square rounded-[4px]"
              style={{
                backgroundColor:
                  screenshot.cells[
                    (cell.index + Math.floor(cell.index / 7)) %
                      screenshot.cells.length
                  ],
                opacity: cell.index % 5 === 0 ? 0.55 : 1,
              }}
            />
          ))}
        </div>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2">
        <div className="rounded-lg border bg-background p-3">
          <Brush className="size-4 text-emerald-700" />
          <div className="mt-3 h-2 w-16 rounded bg-foreground/15" />
          <div className="mt-2 h-2 w-10 rounded bg-foreground/10" />
        </div>
        <div className="rounded-lg border bg-background p-3">
          <Layers3 className="size-4 text-sky-700" />
          <div className="mt-3 h-2 w-14 rounded bg-foreground/15" />
          <div className="mt-2 h-2 w-12 rounded bg-foreground/10" />
        </div>
      </div>
    </Card>
  );
}
