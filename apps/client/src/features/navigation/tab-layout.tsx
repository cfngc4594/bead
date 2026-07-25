import { useIsMobile } from "@bead/ui/hooks/use-mobile";
import { cn } from "@bead/ui/lib/utils";
import { Link, Outlet } from "@tanstack/react-router";
import { Compass, Grid2x2, type LucideIcon, Settings } from "lucide-react";
import {
  appMainTabs,
  appSettingsTab,
  appTabs,
} from "@/features/navigation/tab-config";

const tabIcons = {
  discover: Compass,
  projects: Grid2x2,
  settings: Settings,
} satisfies Record<(typeof appTabs)[number]["id"], LucideIcon>;

export function TabLayout() {
  const isMobile = useIsMobile();

  return (
    <div className="flex h-full min-h-0">
      {isMobile ? null : <DesktopTabSidebar />}
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <div className="min-h-0 flex-1 overflow-hidden">
          <Outlet />
        </div>
        {isMobile ? <MobileTabNavigation /> : null}
      </div>
    </div>
  );
}

function DesktopTabSidebar() {
  return (
    <aside className="flex h-full w-16 shrink-0 flex-col border-r bg-sidebar text-sidebar-foreground">
      <nav
        aria-label="主要导航"
        className="flex flex-1 flex-col items-stretch gap-1 p-2"
      >
        {appMainTabs.map((tab) => (
          <DesktopTabLink key={tab.id} tab={tab} />
        ))}
      </nav>
      <nav aria-label="设置" className="flex flex-col items-stretch p-2">
        <DesktopTabLink tab={appSettingsTab} />
      </nav>
    </aside>
  );
}

function DesktopTabLink({
  tab,
}: {
  tab: (typeof appTabs)[number];
}) {
  const Icon = tabIcons[tab.id];
  const { label, ...linkProps } = tab;

  return (
    <Link
      {...linkProps}
      aria-label={label}
      className={cn(
        "flex flex-col items-center justify-center gap-1 rounded-lg px-1 py-2.5 text-muted-foreground text-xs outline-none transition-colors",
        "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
        "focus-visible:bg-sidebar-accent focus-visible:text-sidebar-accent-foreground",
        "data-[status=active]:bg-sidebar-accent data-[status=active]:font-medium data-[status=active]:text-sidebar-accent-foreground",
      )}
    >
      <Icon aria-hidden="true" className="size-5" strokeWidth={1.8} />
      <span className="truncate">{label}</span>
    </Link>
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
