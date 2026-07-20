import { useIsMobile } from "@bead/ui/hooks/use-mobile";
import { Link, Outlet } from "@tanstack/react-router";
import { Grid2x2, type LucideIcon, Palette, UserRound } from "lucide-react";
import { appTabs, TAB_CONTENT_ID } from "@/features/navigation/tab-config";

const tabIcons = {
  materials: Palette,
  me: UserRound,
  projects: Grid2x2,
} satisfies Record<(typeof appTabs)[number]["id"], LucideIcon>;

export function TabLayout() {
  const isMobile = useIsMobile();

  return (
    <div className="flex h-full min-h-0 flex-col">
      {isMobile ? null : <DesktopTabHeader />}
      <div className="min-h-0 flex-1 overflow-auto" id={TAB_CONTENT_ID}>
        <Outlet />
      </div>
      {isMobile ? <MobileTabNavigation /> : null}
    </div>
  );
}

function DesktopTabHeader() {
  return (
    <header className="shrink-0 border-b bg-background">
      <nav
        aria-label="主要导航"
        className="mx-auto flex h-14 w-full max-w-5xl items-stretch gap-1 px-8"
      >
        {appTabs.map(({ id, label, ...linkProps }) => {
          const Icon = tabIcons[id];

          return (
            <Link
              {...linkProps}
              className="relative flex min-w-24 items-center justify-center gap-2 px-4 text-muted-foreground text-sm outline-none transition-colors after:absolute after:inset-x-4 after:bottom-0 after:h-0.5 after:bg-foreground after:opacity-0 hover:text-foreground data-[status=active]:font-medium data-[status=active]:text-foreground data-[status=active]:after:opacity-100 focus-visible:bg-muted"
              key={id}
            >
              <Icon aria-hidden="true" className="size-4" strokeWidth={1.8} />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>
    </header>
  );
}

function MobileTabNavigation() {
  return (
    <nav aria-label="主要导航" className="shrink-0 border-t bg-background">
      <div className="mx-auto grid h-16 w-full max-w-md grid-cols-3 px-2">
        {appTabs.map(({ id, label, ...linkProps }) => {
          const Icon = tabIcons[id];

          return (
            <Link
              {...linkProps}
              className="flex min-w-0 flex-col items-center justify-center gap-1 text-muted-foreground text-xs outline-none transition-colors data-[status=active]:font-medium data-[status=active]:text-foreground focus-visible:bg-muted"
              key={id}
            >
              <Icon aria-hidden="true" className="size-5" strokeWidth={1.8} />
              <span className="truncate">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
