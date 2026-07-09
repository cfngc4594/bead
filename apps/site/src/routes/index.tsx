import { Button } from "@bead/ui/components/button";
import { createFileRoute } from "@tanstack/react-router";
import { Apple, Globe2, Smartphone } from "lucide-react";
import { siteLinks } from "@/config/links";

export const Route = createFileRoute("/")({
  component: HomePage,
});

function HomePage() {
  return (
    <main className="relative isolate flex min-h-screen flex-col overflow-hidden bg-background text-foreground">
      <DashedGridBackground />
      <SiteHeader />

      <section className="relative z-10 mx-auto flex w-full max-w-5xl flex-1 flex-col items-center justify-center px-6 py-10 text-center">
        <h1 className="text-balance font-semibold text-6xl leading-none tracking-normal sm:text-7xl lg:text-8xl">
          Bead
        </h1>
        <p className="mt-6 max-w-2xl text-pretty text-base leading-7 text-muted-foreground sm:text-lg">
          把喜欢的图片做成拼豆图纸。
        </p>

        <nav
          aria-label="Platform links"
          className="mt-10 flex w-full max-w-md items-center justify-center gap-5 sm:gap-7"
        >
          <PlatformLink
            href={siteLinks.android}
            label="Android"
            icon={<Smartphone className="size-6" />}
          />
          <PlatformLink
            href={siteLinks.ios}
            label="iOS"
            icon={<Apple className="size-6" />}
          />
          <PlatformLink
            href={siteLinks.webApp}
            label="Web"
            icon={<Globe2 className="size-6" />}
          />
        </nav>
      </section>
    </main>
  );
}

function DashedGridBackground() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 -z-10"
      style={{
        backgroundImage: `
          linear-gradient(to right, #e7e5e4 1px, transparent 1px),
          linear-gradient(to bottom, #e7e5e4 1px, transparent 1px)
        `,
        backgroundSize: "20px 20px",
        backgroundPosition: "0 0, 0 0",
        maskImage: `
          repeating-linear-gradient(
            to right,
            black 0px,
            black 3px,
            transparent 3px,
            transparent 8px
          ),
          repeating-linear-gradient(
            to bottom,
            black 0px,
            black 3px,
            transparent 3px,
            transparent 8px
          ),
          radial-gradient(ellipse 60% 60% at 50% 50%, #000 30%, transparent 70%)
        `,
        WebkitMaskImage: `
          repeating-linear-gradient(
            to right,
            black 0px,
            black 3px,
            transparent 3px,
            transparent 8px
          ),
          repeating-linear-gradient(
            to bottom,
            black 0px,
            black 3px,
            transparent 3px,
            transparent 8px
          ),
          radial-gradient(ellipse 60% 60% at 50% 50%, #000 30%, transparent 70%)
        `,
        maskComposite: "intersect",
        WebkitMaskComposite: "source-in",
      }}
    />
  );
}

function SiteHeader() {
  return (
    <header className="h-16">
      <div className="container mx-auto flex h-full items-center justify-between px-4 sm:justify-around sm:px-6 lg:px-8">
        <a href="/" className="flex items-center gap-2 font-semibold">
          <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            B
          </span>
          <span>Bead</span>
        </a>
        <Button asChild variant="ghost" size="icon">
          <a
            href={siteLinks.github}
            target="_blank"
            rel="noreferrer"
            aria-label="GitHub"
          >
            <GithubIcon />
          </a>
        </Button>
      </div>
    </header>
  );
}

function GithubIcon() {
  return (
    <svg
      aria-hidden="true"
      className="size-6"
      fill="currentColor"
      viewBox="0 0 24 24"
    >
      <path d="M12 2C6.48 2 2 6.58 2 12.26c0 4.53 2.87 8.38 6.84 9.74.5.09.68-.22.68-.49 0-.24-.01-1.05-.01-1.9-2.78.62-3.37-1.22-3.37-1.22-.45-1.18-1.11-1.49-1.11-1.49-.91-.64.07-.63.07-.63 1 .07 1.53 1.06 1.53 1.06.89 1.56 2.34 1.11 2.91.85.09-.66.35-1.11.63-1.37-2.22-.26-4.56-1.14-4.56-5.06 0-1.12.39-2.03 1.03-2.75-.1-.26-.45-1.3.1-2.71 0 0 .84-.28 2.75 1.05A9.38 9.38 0 0 1 12 6.99c.85 0 1.7.12 2.5.35 1.9-1.33 2.74-1.05 2.74-1.05.55 1.41.2 2.45.1 2.71.64.72 1.03 1.63 1.03 2.75 0 3.93-2.34 4.79-4.57 5.05.36.32.68.94.68 1.9 0 1.37-.01 2.47-.01 2.81 0 .27.18.59.69.49A10.05 10.05 0 0 0 22 12.26C22 6.58 17.52 2 12 2Z" />
    </svg>
  );
}

function PlatformLink({
  href,
  label,
  icon,
}: {
  href: string;
  label: string;
  icon: React.ReactNode;
}) {
  return (
    <a
      href={href}
      className="flex size-20 shrink-0 flex-col items-center justify-center gap-1.5 rounded-full border border-border bg-card text-xs font-medium text-card-foreground shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none sm:size-22 sm:text-sm"
    >
      {icon}
      <span>{label}</span>
    </a>
  );
}
