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

export function DiscoverError() {
  const router = useRouter();

  return (
    <main className="flex min-h-full bg-background px-4 py-6 md:px-8">
      <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col">
        <Empty className="flex-1 border">
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

export function DiscoverProjectNotFound() {
  return (
    <main className="flex min-h-full bg-background px-4 py-6 md:px-8">
      <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col">
        <Empty className="flex-1 border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <SearchX />
            </EmptyMedia>
            <EmptyTitle>作品不存在</EmptyTitle>
            <EmptyDescription>这个作品可能已被移除。</EmptyDescription>
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
