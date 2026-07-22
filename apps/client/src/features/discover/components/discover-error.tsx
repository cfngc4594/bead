import { Button } from "@bead/ui/components/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@bead/ui/components/empty";
import { useRouter } from "@tanstack/react-router";
import { RefreshCw, WifiOff } from "lucide-react";

export function DiscoverError() {
  const router = useRouter();

  return (
    <main className="flex min-h-full bg-background px-4 py-6 md:px-8">
      <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col">
        <Empty className="min-h-72 flex-none border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <WifiOff />
            </EmptyMedia>
            <EmptyTitle>暂时无法加载发现</EmptyTitle>
            <EmptyDescription>检查网络连接后再试一次。</EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button onClick={() => void router.invalidate()}>
              <RefreshCw aria-hidden="true" />
              重试
            </Button>
          </EmptyContent>
        </Empty>
      </div>
    </main>
  );
}
