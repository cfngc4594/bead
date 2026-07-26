import { Button } from "@bead/ui/components/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@bead/ui/components/empty";
import { Link, useRouter } from "@tanstack/react-router";
import { ArrowLeft, RefreshCw, SearchX, WifiOff } from "lucide-react";
import { TAB_CONTENT_ID } from "@/features/navigation/tab-config";

export function DiscoverContentError({ onRetry }: { onRetry: () => void }) {
  return (
    <div
      className="mx-auto flex min-h-0 w-full max-w-5xl flex-1 flex-col px-4 py-6 md:px-8"
      id={TAB_CONTENT_ID}
    >
      <Empty className="flex-1 border">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <WifiOff />
          </EmptyMedia>
          <EmptyTitle>加载失败</EmptyTitle>
          <EmptyDescription>检查网络连接</EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button onClick={onRetry}>
            <RefreshCw aria-hidden="true" />
            重试
          </Button>
        </EmptyContent>
      </Empty>
    </div>
  );
}

export function DiscoverError() {
  const router = useRouter();

  return (
    <main className="flex h-full min-h-0 flex-col bg-background">
      <header className="mx-auto flex h-16 w-full max-w-5xl shrink-0 items-center gap-2 border-b px-4 md:px-8">
        <h1 className="font-semibold text-lg tracking-tight">发现</h1>
      </header>
      <DiscoverContentError onRetry={() => void router.invalidate()} />
    </main>
  );
}

export function DiscoverProjectNotFound() {
  return (
    <main className="flex h-full min-h-0 flex-col bg-background">
      <header className="mx-auto flex h-16 w-full max-w-5xl shrink-0 items-center gap-2 border-b px-4 md:px-8">
        <h1 className="font-semibold text-lg tracking-tight">发现</h1>
      </header>
      <div className="mx-auto flex min-h-0 w-full max-w-5xl flex-1 flex-col px-4 py-6 md:px-8">
        <Empty className="flex-1 border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <SearchX />
            </EmptyMedia>
            <EmptyTitle>作品不存在</EmptyTitle>
            <EmptyDescription>可能已删除</EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button asChild>
              <Link to="/discover">
                <ArrowLeft aria-hidden="true" />
                返回发现
              </Link>
            </Button>
          </EmptyContent>
        </Empty>
      </div>
    </main>
  );
}
