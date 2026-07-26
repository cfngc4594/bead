import { mardColors } from "@bead/core/colors";
import { ScrollArea } from "@bead/ui/components/scroll-area";
import { Skeleton } from "@bead/ui/components/skeleton";

const toolbarViewSkeletons = ["focus", "model-preview"];
const canvasToolSkeletons = [
  "pan",
  "select",
  "paint",
  "mix",
  "erase",
  "picker",
];
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
    <main className="grid h-full min-h-0 min-w-0 grid-rows-[minmax(0,1fr)_auto] overflow-hidden overscroll-none bg-background md:grid-cols-[1fr_280px] md:grid-rows-1">
      <section className="flex min-h-0 min-w-0 flex-col">
        <EditorToolbarSkeleton />

        <div className="relative min-h-0 flex-1 touch-none overflow-hidden overscroll-none bg-muted/30">
          <CanvasBoardSkeleton />
        </div>
      </section>

      <DesktopEditorSidebarSkeleton />
      <MobileEditorPanelSkeleton />
    </main>
  );
}

export function CanvasBoardSkeleton() {
  return (
    <>
      <div className="grid h-full w-full touch-none place-items-center overflow-hidden overscroll-none p-6">
        <div className="flex w-full max-w-[min(78vw,520px)] flex-col items-center gap-4">
          <Skeleton className="aspect-square w-full max-w-[min(72vh,520px)] rounded-lg" />
          <div className="flex items-center gap-2">
            <Skeleton className="size-2 rounded-full" />
            <Skeleton className="h-2 w-24 rounded-full" />
          </div>
        </div>
      </div>
      <div className="pointer-events-none absolute inset-x-0 bottom-2 z-10 hidden justify-center px-4 md:flex">
        <div className="flex items-center gap-1.5 rounded-lg bg-card p-1.5 shadow-md">
          {canvasToolSkeletons.map((item) => (
            <Skeleton className="size-7 shrink-0 rounded-lg" key={item} />
          ))}
        </div>
      </div>
    </>
  );
}

function EditorToolbarSkeleton() {
  return (
    <header className="flex h-16 min-w-0 shrink-0 items-center gap-2 overflow-hidden border-b px-3 md:gap-3 md:px-5">
      <div className="flex min-w-0 flex-1 items-center gap-2 md:flex-none">
        <ToolbarIconSkeleton />
        <Skeleton className="h-7 w-19 max-w-23 min-w-0 flex-1 rounded-md md:w-56 md:flex-none" />
      </div>

      <div className="hidden min-w-0 flex-1 items-center justify-end gap-1.5 md:flex">
        {desktopToolbarActionGroups.map((group, index) => (
          <ToolbarSkeletonGroup
            group={group}
            key={group.join("-")}
            withSeparator={index > 0}
          />
        ))}
      </div>

      <div className="flex shrink-0 items-center gap-1.5 md:hidden">
        {[...toolbarViewSkeletons, ...toolbarHistorySkeletons.slice(0, 3)].map(
          (item) => (
            <ToolbarIconSkeleton key={item} />
          ),
        )}
        <ToolbarIconSkeleton />
      </div>
    </header>
  );
}

function ToolbarSkeletonGroup({
  group,
  withSeparator = false,
}: {
  group: readonly string[];
  withSeparator?: boolean;
}) {
  return (
    <>
      {withSeparator ? <ToolbarSeparatorSkeleton /> : null}
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

function DesktopEditorSidebarSkeleton() {
  return (
    <aside className="hidden h-full min-h-0 flex-col border-l bg-card md:flex">
      <div className="flex h-16 shrink-0 items-center border-b px-4">
        <CurrentColorSkeleton />
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-[48px_minmax(0,1fr)] overflow-hidden">
        <ScrollArea className="h-full min-h-0 border-r **:data-[slot=scroll-area-scrollbar]:hidden">
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

function MobileEditorPanelSkeleton() {
  return (
    <section className="flex h-auto max-h-[50vh] min-w-0 shrink-0 flex-col overflow-hidden border-t bg-card md:hidden">
      <div className="flex h-14 shrink-0 items-center justify-between gap-3 border-b px-4">
        <CurrentColorSkeleton />
        <div className="flex shrink-0 items-center gap-1.5">
          {canvasToolSkeletons.map((item) => (
            <ToolbarIconSkeleton key={item} />
          ))}
          <ToolbarIconSkeleton />
        </div>
      </div>

      <div className="flex h-50 min-h-0 flex-col">
        <div className="relative h-12 min-w-0 shrink-0">
          <div className="relative min-w-0 overflow-hidden">
            <div className="flex w-max flex-row gap-1 p-2">
              {letterSkeletons.map((letter) => (
                <Skeleton className="size-8 shrink-0 rounded-lg" key={letter} />
              ))}
            </div>
          </div>
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-border"
          />
        </div>

        <ScrollArea className="min-h-0 flex-1 overscroll-contain **:data-[slot=scroll-area-scrollbar]:hidden">
          <div className="grid min-w-0 grid-cols-[repeat(auto-fill,40px)] justify-center gap-2 p-2">
            {mobileColorSkeletons.map((item) => (
              <Skeleton className="size-10 rounded-md" key={item} />
            ))}
          </div>
        </ScrollArea>
      </div>
    </section>
  );
}

function CurrentColorSkeleton() {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <Skeleton className="size-8 shrink-0 rounded-full" />
      <Skeleton className="h-4 w-8 rounded-sm" />
    </div>
  );
}
