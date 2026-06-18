import { Skeleton } from "@/components/ui/skeleton";

const toolbarToolSkeletons = ["pan", "paint", "erase", "picker"];
const toolbarHistorySkeletons = ["undo", "redo"];
const desktopLetterSkeletons = [
  "A",
  "B",
  "C",
  "D",
  "E",
  "F",
  "G",
  "H",
  "M",
  "P",
  "R",
  "Y",
];
const desktopColorSkeletons = Array.from(
  { length: 35 },
  (_, index) => `desktop-color-${index + 1}`,
);
const mobileLetterSkeletons = [
  "A",
  "B",
  "C",
  "D",
  "E",
  "F",
  "G",
  "H",
  "M",
  "P",
];
const mobileColorSkeletons = Array.from(
  { length: 24 },
  (_, index) => `mobile-color-${index + 1}`,
);

export function BeadEditorSkeleton() {
  return (
    <main className="grid h-screen min-w-0 grid-rows-[minmax(0,1fr)_auto] overflow-hidden bg-background md:grid-cols-[1fr_280px] md:grid-rows-1">
      <section className="flex min-h-0 min-w-0 flex-col">
        <EditorToolbarSkeleton />

        <div className="min-h-0 flex-1 overflow-hidden bg-muted/30">
          <BeadCanvasSkeleton />
        </div>
      </section>

      <DesktopColorSidebarSkeleton />
      <MobileColorPanelSkeleton />
    </main>
  );
}

export function BeadCanvasSkeleton() {
  return (
    <div className="grid h-full w-full place-items-center p-6">
      <div className="flex w-full max-w-[min(78vw,520px)] flex-col items-center gap-4">
        <Skeleton className="aspect-square w-full max-w-[min(72vh,520px)] rounded-lg" />
        <div className="flex items-center gap-2">
          <Skeleton className="size-2 rounded-full" />
          <Skeleton className="h-2 w-24 rounded-full" />
        </div>
      </div>
    </div>
  );
}

function EditorToolbarSkeleton() {
  return (
    <header className="flex h-16 min-w-0 shrink-0 items-center justify-center overflow-hidden border-b px-4 md:px-5">
      <div className="flex items-center justify-center gap-1.5">
        {toolbarToolSkeletons.map((item) => (
          <Skeleton className="size-7 rounded-lg" key={item} />
        ))}
        <Skeleton className="mx-1 h-6 w-px rounded-none" />
        <Skeleton className="size-7 rounded-lg" />
        <Skeleton className="mx-1 h-6 w-px rounded-none" />
        {toolbarHistorySkeletons.map((item) => (
          <Skeleton className="size-7 rounded-lg" key={item} />
        ))}
      </div>
    </header>
  );
}

function DesktopColorSidebarSkeleton() {
  return (
    <aside className="hidden h-full min-h-0 flex-col border-l bg-card md:flex">
      <CurrentColorSkeleton className="h-16 border-b px-4" />

      <div className="grid min-h-0 flex-1 grid-cols-[44px_1fr] overflow-hidden">
        <div className="flex flex-col gap-1 border-r p-2">
          {desktopLetterSkeletons.map((letter) => (
            <Skeleton className="size-8 rounded-lg" key={letter} />
          ))}
        </div>

        <div className="grid grid-cols-5 gap-2 p-4">
          {desktopColorSkeletons.map((item) => (
            <Skeleton className="aspect-square rounded-md" key={item} />
          ))}
        </div>
      </div>
    </aside>
  );
}

function MobileColorPanelSkeleton() {
  return (
    <section className="flex min-w-0 shrink-0 flex-col overflow-hidden border-t bg-card md:hidden">
      <CurrentColorSkeleton className="h-14 px-4" showAction />

      <div className="min-w-0 shrink-0 border-y">
        <div className="flex w-max gap-1 p-2">
          {mobileLetterSkeletons.map((letter) => (
            <Skeleton className="size-8 rounded-lg" key={letter} />
          ))}
        </div>
      </div>

      <div className="grid h-[calc(40px*3+8px*2+8px*2)] grid-cols-[repeat(auto-fill,40px)] justify-center gap-2 overflow-hidden p-2">
        {mobileColorSkeletons.map((item) => (
          <Skeleton className="size-10 rounded-md" key={item} />
        ))}
      </div>
    </section>
  );
}

function CurrentColorSkeleton({
  className,
  showAction = false,
}: {
  className: string;
  showAction?: boolean;
}) {
  return (
    <div
      className={`flex shrink-0 items-center justify-between gap-3 ${className}`}
    >
      <div className="flex min-w-0 items-center gap-3">
        <Skeleton className="size-8 shrink-0 rounded-full" />
        <div className="space-y-1.5">
          <Skeleton className="h-3 w-10" />
          <Skeleton className="h-2.5 w-16" />
        </div>
      </div>
      {showAction ? <Skeleton className="size-8 rounded-lg" /> : null}
    </div>
  );
}
