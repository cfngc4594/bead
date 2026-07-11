import { ScrollArea } from "@bead/ui/components/scroll-area";
import { Skeleton } from "@bead/ui/components/skeleton";
import { mardColors } from "@/data/colors";

const modeToolSkeletons = ["pan", "paint", "mix", "erase", "picker", "select"];
const toolbarViewSkeletons = ["focus", "model-preview", "codes", "guides"];
const mobileToolbarViewSkeletons = ["focus", "model-preview"];
const toolbarHistorySkeletons = ["undo", "redo", "clear"];
const toolbarFileSkeletons = [
  "image-import",
  "image-export",
  "template-import",
  "template-export",
];
const desktopToolbarActionGroups = [
  toolbarViewSkeletons,
  toolbarHistorySkeletons,
  toolbarFileSkeletons,
];
const letterSkeletons = Array.from(
  new Set(mardColors.map((color) => color.code[0])),
);
const desktopColorSkeletons = Array.from(
  { length: 35 },
  (_, index) => `desktop-color-${index + 1}`,
);
const mobileColorSkeletons = Array.from(
  { length: 24 },
  (_, index) => `mobile-color-${index + 1}`,
);

export function EditorSkeleton() {
  return (
    <main className="grid h-svh min-h-0 min-w-0 grid-rows-[minmax(0,1fr)_auto] overflow-hidden overscroll-none bg-background md:grid-cols-[1fr_280px] md:grid-rows-1">
      <section className="flex min-h-0 min-w-0 flex-col">
        <EditorToolbarSkeleton />

        <div className="relative min-h-0 flex-1 touch-none overflow-hidden overscroll-none bg-muted/30">
          <CanvasBoardSkeleton />
        </div>
      </section>

      <DesktopColorSidebarSkeleton />
      <MobileColorPanelSkeleton />
    </main>
  );
}

export function CanvasBoardSkeleton() {
  return (
    <div className="grid h-full w-full touch-none place-items-center overflow-hidden overscroll-none p-6">
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
    <header className="flex h-16 min-w-0 shrink-0 items-center gap-2 overflow-hidden border-b px-3 md:gap-3 md:px-5">
      <div className="flex min-w-0 flex-1 items-center gap-2 lg:flex-none">
        <ToolbarIconSkeleton />
        <Skeleton className="h-7 w-[76px] max-w-[92px] min-w-0 flex-1 rounded-md lg:w-56 lg:flex-none" />
      </div>

      <div className="hidden min-w-0 flex-1 items-center justify-center gap-1.5 lg:flex">
        {modeToolSkeletons.map((item) => (
          <ToolbarIconSkeleton key={item} />
        ))}
        {desktopToolbarActionGroups.map((group) => (
          <ToolbarSkeletonGroup group={group} key={group.join("-")} />
        ))}
      </div>

      <div className="flex shrink-0 items-center gap-1.5 lg:hidden">
        {mobileToolbarViewSkeletons.map((item) => (
          <ToolbarIconSkeleton key={item} />
        ))}
        {toolbarHistorySkeletons.map((item) => (
          <ToolbarIconSkeleton key={item} />
        ))}
        <ToolbarIconSkeleton />
      </div>
    </header>
  );
}

function ToolbarSkeletonGroup({ group }: { group: readonly string[] }) {
  return (
    <>
      <ToolbarSeparatorSkeleton />
      {group.map((item) => (
        <ToolbarIconSkeleton key={item} />
      ))}
    </>
  );
}

function ToolbarIconSkeleton() {
  return <Skeleton className="size-7 shrink-0 rounded-lg" />;
}

function ToolbarSeparatorSkeleton() {
  return <Skeleton className="mx-1 h-6 w-px shrink-0 rounded-none" />;
}

function DesktopColorSidebarSkeleton() {
  return (
    <aside className="hidden h-full min-h-0 flex-col border-l bg-card md:flex">
      <CurrentColorSkeleton className="h-16 border-b px-4" />

      <div className="grid min-h-0 flex-1 grid-cols-[48px_minmax(0,1fr)] overflow-hidden">
        <ScrollArea className="h-full min-h-0 border-r [&_[data-slot=scroll-area-scrollbar]]:hidden">
          <div className="flex flex-col gap-1 p-2">
            {letterSkeletons.map((letter) => (
              <Skeleton className="size-8 rounded-lg" key={letter} />
            ))}
          </div>
        </ScrollArea>

        <ScrollArea className="h-full min-h-0">
          <div className="grid min-w-0 grid-cols-5 gap-2 p-4">
            {desktopColorSkeletons.map((item) => (
              <Skeleton className="aspect-square rounded-md" key={item} />
            ))}
          </div>
        </ScrollArea>
      </div>
    </aside>
  );
}

function MobileColorPanelSkeleton() {
  return (
    <section className="flex h-auto max-h-[50vh] min-w-0 shrink-0 flex-col overflow-hidden border-t bg-card md:hidden">
      <CurrentColorSkeleton className="h-14 border-b px-4" showAction />

      <div className="min-w-0 shrink-0 border-b">
        <div className="relative min-w-0 overflow-hidden">
          <div className="flex w-max flex-row gap-1 p-2">
            {letterSkeletons.map((letter) => (
              <Skeleton className="size-8 shrink-0 rounded-lg" key={letter} />
            ))}
          </div>
        </div>
      </div>

      <ScrollArea className="h-[calc(40px*3+8px*2+8px*2)] overscroll-contain [&_[data-slot=scroll-area-scrollbar]]:hidden">
        <div className="grid min-w-0 grid-cols-[repeat(auto-fill,40px)] justify-center gap-2 p-2">
          {mobileColorSkeletons.map((item) => (
            <Skeleton className="size-10 rounded-md" key={item} />
          ))}
        </div>
      </ScrollArea>
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
      className={`flex min-h-0 shrink-0 items-center justify-between gap-3 ${className}`}
    >
      <div className="flex min-w-0 items-center gap-3">
        <Skeleton className="size-8 shrink-0 rounded-full" />
        <div className="flex h-9 min-w-0 flex-col justify-center gap-1">
          <Skeleton className="h-4 w-8 rounded-sm" />
        </div>
      </div>
      {showAction ? (
        <div className="flex shrink-0 items-center gap-1.5">
          {modeToolSkeletons.map((item) => (
            <Skeleton className="size-7 shrink-0 rounded-lg" key={item} />
          ))}
          <Skeleton className="size-7 shrink-0 rounded-lg" />
        </div>
      ) : null}
    </div>
  );
}
