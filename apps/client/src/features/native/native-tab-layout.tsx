import { Capacitor } from "@capacitor/core";
import { Link, Outlet } from "@tanstack/react-router";
import { Grid2x2, type LucideIcon, Palette, UserRound } from "lucide-react";
import {
  NATIVE_TAB_CONTENT_ID,
  nativeTabs,
} from "@/features/native/native-tab-config";

const nativeTabIcons = {
  materials: Palette,
  me: UserRound,
  projects: Grid2x2,
} satisfies Record<(typeof nativeTabs)[number]["id"], LucideIcon>;

export function NativeTabLayout() {
  if (!Capacitor.isNativePlatform()) {
    return <Outlet />;
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="min-h-0 flex-1 overflow-auto" id={NATIVE_TAB_CONTENT_ID}>
        <Outlet />
      </div>
      <NativeBottomNavigation />
    </div>
  );
}

function NativeBottomNavigation() {
  return (
    <nav aria-label="主要导航" className="shrink-0 border-t bg-background">
      <div className="mx-auto grid h-16 w-full max-w-md grid-cols-3 px-2">
        {nativeTabs.map(({ id, label, ...linkProps }) => {
          const Icon = nativeTabIcons[id];

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
