import { Button } from "@bead/ui/components/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@bead/ui/components/empty";
import { RefreshCw, SearchX, WifiOff } from "lucide-react";
import { DiscoverProjectReturnButton } from "@/features/discover/components/discover-project-shell";

export function DiscoverListError({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="mx-auto flex min-h-0 w-full max-w-5xl flex-1 flex-col px-4 py-6 md:px-8">
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

export function DiscoverProjectError({ onRetry }: { onRetry: () => void }) {
  return (
    <section className="relative flex min-h-0 flex-1 flex-col overflow-hidden bg-muted/30">
      <div className="mx-auto flex min-h-0 w-full max-w-5xl flex-1 flex-col px-4 py-6 md:px-8">
        <Empty className="flex-1 border bg-background">
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
    </section>
  );
}

export function DiscoverProjectNotFoundPanel() {
  return (
    <section className="relative flex min-h-0 flex-1 flex-col overflow-hidden bg-muted/30">
      <div className="mx-auto flex min-h-0 w-full max-w-5xl flex-1 flex-col px-4 py-6 md:px-8">
        <Empty className="flex-1 border bg-background">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <SearchX />
            </EmptyMedia>
            <EmptyTitle>作品不存在</EmptyTitle>
            <EmptyDescription>可能已删除</EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <DiscoverProjectReturnButton />
          </EmptyContent>
        </Empty>
      </div>
    </section>
  );
}

export function DiscoverProjectNotFoundTitle() {
  return (
    <p className="min-w-0 flex-1 truncate font-medium text-muted-foreground text-sm">
      作品不存在
    </p>
  );
}
