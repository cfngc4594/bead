import { Button } from "@bead/ui/components/button";
import {
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@bead/ui/components/dialog";
import {
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@bead/ui/components/drawer";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@bead/ui/components/empty";
import { ScrollArea } from "@bead/ui/components/scroll-area";
import { useIsMobile } from "@bead/ui/hooks/use-mobile";
import { cn } from "@bead/ui/lib/utils";
import { FolderOpen, LoaderCircle } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { getCanvasSize } from "@/config/canvas-sizes";
import { ProjectPreview } from "@/features/bead/components/project-preview";
import { projectsCollection } from "@/features/bead/storage/projects";
import { useLocalCollections } from "@/features/collections/hooks/use-local-collections";
import { addProjectsToCollection } from "@/features/collections/storage/collection-commands";
import {
  NativeBackDialog,
  NativeBackDrawer,
} from "@/features/native/native-back-overlays";
import { trackEvent } from "@/lib/analytics";

export function JoinCollectionDialog({
  onJoined,
  onOpenChange,
  open,
  projectIds,
}: {
  onJoined?: () => void;
  onOpenChange: (open: boolean) => void;
  open: boolean;
  projectIds: string[];
}) {
  const isMobile = useIsMobile();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pendingCollectionId, setPendingCollectionId] = useState<string | null>(
    null,
  );
  const { data: collections = [] } = useLocalCollections();

  useEffect(() => {
    if (!open) {
      setIsSubmitting(false);
      setPendingCollectionId(null);
    }
  }, [open]);

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen && isSubmitting) {
      return;
    }

    onOpenChange(nextOpen);
  }

  async function handleJoin(collectionId: string) {
    if (isSubmitting || projectIds.length === 0) {
      return;
    }

    setIsSubmitting(true);
    setPendingCollectionId(collectionId);

    try {
      await addProjectsToCollection({ collectionId, projectIds });
      trackEvent("collection_project_added", {
        projectCount: projectIds.length,
        source: "join_dialog",
      });
      toast.success(
        projectIds.length === 1
          ? "已加入合集"
          : `已加入 ${projectIds.length} 个作品`,
      );
      onJoined?.();
      onOpenChange(false);
    } catch (error) {
      console.error("Unable to join collection", error);
      toast.error("加入合集失败");
      setIsSubmitting(false);
      setPendingCollectionId(null);
    }
  }

  const body =
    collections.length > 0 ? (
      <ScrollArea className="-mx-1 min-h-0">
        <ul className="grid gap-2 px-1 pb-1">
          {collections.map((collection) => {
            const isPending = pendingCollectionId === collection.id;

            return (
              <li key={collection.id}>
                <button
                  className={cn(
                    "flex w-full items-center gap-3 rounded-xl border bg-card p-2 text-left outline-none transition-colors hover:border-primary/50 focus-visible:ring-3 focus-visible:ring-ring/50",
                    isPending && "border-primary ring-2 ring-primary/30",
                    isSubmitting && !isPending && "opacity-50",
                  )}
                  disabled={isSubmitting}
                  onClick={() => void handleJoin(collection.id)}
                  type="button"
                >
                  <CollectionPickerPreview projectIds={collection.projectIds} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-sm">
                      {collection.title}
                    </p>
                    <p className="text-muted-foreground text-xs tabular-nums">
                      {collection.projectIds.length} 个作品
                    </p>
                  </div>
                  {isPending ? (
                    <LoaderCircle className="size-4 shrink-0 animate-spin text-muted-foreground" />
                  ) : null}
                </button>
              </li>
            );
          })}
        </ul>
      </ScrollArea>
    ) : (
      <Empty className="flex-1 border">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <FolderOpen />
          </EmptyMedia>
          <EmptyTitle>还没有合集</EmptyTitle>
          <EmptyDescription>
            先用多选选择至少两个作品，再合并为合集。
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );

  if (isMobile) {
    return (
      <NativeBackDrawer open={open} onOpenChange={handleOpenChange}>
        <DrawerContent className="max-h-[85vh] gap-0">
          <DrawerHeader className="text-left">
            <DrawerTitle>加入合集</DrawerTitle>
            <DrawerDescription>选择要加入的合集。</DrawerDescription>
          </DrawerHeader>
          <div className="min-h-0 flex-1 overflow-hidden px-4 pb-4">{body}</div>
        </DrawerContent>
      </NativeBackDrawer>
    );
  }

  return (
    <NativeBackDialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[min(42rem,calc(100dvh-2rem))] grid-rows-[auto_minmax(0,1fr)_auto] sm:max-w-md">
        <DialogHeader>
          <DialogTitle>加入合集</DialogTitle>
          <DialogDescription>选择要加入的合集。</DialogDescription>
        </DialogHeader>
        {body}
        <div className="flex justify-end">
          <Button
            disabled={isSubmitting}
            onClick={() => handleOpenChange(false)}
            type="button"
            variant="outline"
          >
            取消
          </Button>
        </div>
      </DialogContent>
    </NativeBackDialog>
  );
}

function CollectionPickerPreview({
  projectIds,
}: {
  projectIds: readonly string[];
}) {
  const previewProjects = useMemo(
    () =>
      projectIds.slice(0, 4).flatMap((projectId) => {
        const project = projectsCollection.get(projectId);
        return project ? [project] : [];
      }),
    [projectIds],
  );

  if (previewProjects.length === 0) {
    return (
      <div className="grid size-14 shrink-0 place-items-center rounded-lg bg-muted/40 text-muted-foreground">
        <FolderOpen className="size-5" strokeWidth={1.5} />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "grid size-14 shrink-0 overflow-hidden rounded-lg border",
        previewProjects.length === 1 ? "grid-cols-1" : "grid-cols-2",
        previewProjects.length > 2 && "grid-rows-2",
      )}
    >
      {previewProjects.map((project) => {
        const size = getCanvasSize(project.sizeId);

        return (
          <div className="min-h-0 min-w-0 bg-muted/20" key={project.id}>
            <ProjectPreview
              className="p-0.5"
              cols={size.cols}
              rows={size.rows}
              snapshot={project.snapshots[project.currentIndex]}
            />
          </div>
        );
      })}
    </div>
  );
}
