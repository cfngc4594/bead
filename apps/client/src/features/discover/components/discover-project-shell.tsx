import { Button } from "@bead/ui/components/button";
import { useRouter } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import type { ReactNode } from "react";

type DiscoverProjectShellProps = {
  header: ReactNode;
  children?: ReactNode;
};

export function DiscoverProjectShell({
  header,
  children,
}: DiscoverProjectShellProps) {
  return (
    <main className="flex h-full min-h-0 min-w-0 flex-col overflow-hidden bg-background">
      <header className="flex h-16 min-w-0 shrink-0 items-center gap-2 border-b px-3 md:gap-3 md:px-5">
        {header}
      </header>

      {children}
    </main>
  );
}

export function DiscoverProjectBackButton() {
  const router = useRouter();

  const returnToDiscover = () => {
    if (router.history.canGoBack()) {
      router.history.back();
      return;
    }

    void router.navigate({ to: "/discover", replace: true });
  };

  return (
    <Button
      aria-label="返回发现"
      onClick={returnToDiscover}
      size="icon-sm"
      variant="outline"
    >
      <ArrowLeft />
    </Button>
  );
}
