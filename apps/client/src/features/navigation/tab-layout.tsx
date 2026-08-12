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

const tabLinkClassName = cn(
  "inline-flex min-h-11 min-w-11 flex-col items-center justify-center gap-1 text-muted-foreground text-[11px] outline-none transition-colors",
  "hover:text-foreground",
  "focus-visible:text-foreground",
  "data-[status=active]:font-medium data-[status=active]:text-foreground",
);

export function TabLayout() {
  return (
    <div className="flex h-full min-h-0">
      <DesktopTabSidebar />
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <div className="min-h-0 flex-1 overflow-hidden">
          <Outlet />
        </div>
        <MobileTabNavigation />
      </div>
    </div>
  );
}

function TabLink({ tab }: { tab: (typeof appTabs)[number] }) {
  const Icon = tabIcons[tab.id];
  const { label, ...linkProps } = tab;

  return (
    <Link {...linkProps} aria-label={label} className={tabLinkClassName}>
      {({ isActive }) => (
        <>
          <Icon
            aria-hidden="true"
            className="size-5"
            strokeWidth={isActive ? 2.2 : 1.8}
          />
          <span className="leading-none">{label}</span>
        </>
      )}
    </Link>
  );
}

function DesktopTabSidebar() {
  return (
    <aside className="hidden h-full w-16 shrink-0 flex-col border-r bg-background md:flex">
      <nav
        aria-label="主要导航"
        className="flex flex-1 flex-col items-center gap-1 py-2"
      >
        {appMainTabs.map((tab) => (
          <TabLink key={tab.id} tab={tab} />
        ))}
      </nav>
      <nav aria-label="设置" className="flex flex-col items-center py-2">
        <TabLink tab={appSettingsTab} />
      </nav>
    </aside>
  );
}

function MobileTabNavigation() {
  return (
    <nav
      aria-label="主要导航"
      className="shrink-0 border-t bg-background md:hidden"
    >
      <div className="mx-auto grid h-14 w-full max-w-md grid-cols-3">
        {appTabs.map((tab) => (
          <div className="grid place-items-center" key={tab.id}>
            <TabLink tab={tab} />
          </div>
        ))}
      </div>
    </nav>
  );
}
