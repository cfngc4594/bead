import { Button } from "@bead/ui/components/button";
import {
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@bead/ui/components/dialog";
import {
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@bead/ui/components/drawer";
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@bead/ui/components/empty";
import { ScrollArea } from "@bead/ui/components/scroll-area";
import { useIsMobile } from "@bead/ui/hooks/use-mobile";
import { FolderOpen, LoaderCircle } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { SelectableProjectCard } from "@/features/bead/components/selectable-project-card";
import { useProjectChoices } from "@/features/bead/hooks/use-project-choices";
import { useGroupedProjectIds } from "@/features/collections/hooks/use-local-collections";
import { addProjectsToCollection } from "@/features/collections/storage/collection-commands";
import {
  NativeBackDialog,
  NativeBackDrawer,
} from "@/features/native/native-back-overlays";
import { trackEvent } from "@/lib/analytics";

export function AddProjectsToCollectionDialog({
  collectionId,
  collectionProjectIds,
  onOpenChange,
  open,
}: {
  collectionId: string;
  collectionProjectIds: readonly string[];
  onOpenChange: (open: boolean) => void;
  open: boolean;
}) {
  const isMobile = useIsMobile();
  const [selectedProjectIds, setSelectedProjectIds] = useState<Set<string>>(
    () => new Set(),
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { data: projects = [] } = useProjectChoices();
  const groupedProjectIds = useGroupedProjectIds();
  const collectionProjectIdSet = useMemo(
    () => new Set(collectionProjectIds),
    [collectionProjectIds],
  );

  const availableProjects = useMemo(
    () =>
      projects.filter(
        (project) =>
          !collectionProjectIdSet.has(project.id) &&
          !groupedProjectIds.has(project.id),
      ),
    [collectionProjectIdSet, groupedProjectIds, projects],
  );

  useEffect(() => {
    if (!open) {
      setSelectedProjectIds(new Set());
      setIsSubmitting(false);
    }
  }, [open]);

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen && isSubmitting) {
      return;
    }

    onOpenChange(nextOpen);
  }

  function toggleProject(projectId: string) {
    setSelectedProjectIds((currentIds) => {
      const nextIds = new Set(currentIds);

      if (nextIds.has(projectId)) {
        nextIds.delete(projectId);
      } else {
        nextIds.add(projectId);
      }

      return nextIds;
    });
  }

  async function handleSubmit() {
    if (selectedProjectIds.size === 0 || isSubmitting) {
      return;
    }

    setIsSubmitting(true);

    try {
      await addProjectsToCollection({
        collectionId,
        projectIds: [...selectedProjectIds],
      });
      trackEvent("collection_project_added", {
        projectCount: selectedProjectIds.size,
        source: "collection_page_picker",
      });
      toast.success(
        selectedProjectIds.size === 1
          ? "已加入合集"
          : `已加入 ${selectedProjectIds.size} 个作品`,
      );
      onOpenChange(false);
    } catch (error) {
      console.error("Unable to add projects to collection", error);
      toast.error("加入合集失败");
      setIsSubmitting(false);
    }
  }

  const body =
    availableProjects.length > 0 ? (
      <ScrollArea className="-mx-1 min-h-0">
        <div className="grid gap-3 px-1 pb-1 sm:grid-cols-2">
          {availableProjects.map((project) => {
            const isSelected = selectedProjectIds.has(project.id);

            return (
              <SelectableProjectCard
                isSelected={isSelected}
                key={project.id}
                onToggle={() => toggleProject(project.id)}
                project={project}
              />
            );
          })}
        </div>
      </ScrollArea>
    ) : (
      <Empty className="flex-1 border">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <FolderOpen />
          </EmptyMedia>
          <EmptyTitle>暂无可添加作品</EmptyTitle>
        </EmptyHeader>
      </Empty>
    );

  const footer = (
    <>
      <Button
        disabled={isSubmitting}
        onClick={() => handleOpenChange(false)}
        type="button"
        variant="outline"
      >
        取消
      </Button>
      <Button
        disabled={selectedProjectIds.size === 0 || isSubmitting}
        onClick={() => void handleSubmit()}
        type="button"
      >
        {isSubmitting ? <LoaderCircle className="animate-spin" /> : null}
        {isSubmitting
          ? "正在添加"
          : selectedProjectIds.size > 0
            ? `添加 ${selectedProjectIds.size} 个`
            : "添加"}
      </Button>
    </>
  );

  if (isMobile) {
    return (
      <NativeBackDrawer open={open} onOpenChange={handleOpenChange}>
        <DrawerContent className="max-h-[85vh] gap-0">
          <DrawerHeader className="text-left">
            <DrawerTitle>添加作品</DrawerTitle>
            <DrawerDescription className="sr-only">
              选择要加入此合集的作品
            </DrawerDescription>
          </DrawerHeader>
          <div className="min-h-0 flex-1 overflow-hidden px-4">{body}</div>
          <DrawerFooter className="flex-row justify-end gap-2">
            {footer}
          </DrawerFooter>
        </DrawerContent>
      </NativeBackDrawer>
    );
  }

  return (
    <NativeBackDialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[min(42rem,calc(100dvh-2rem))] grid-rows-[auto_minmax(0,1fr)_auto] sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>添加作品</DialogTitle>
          <DialogDescription className="sr-only">
            选择要加入此合集的作品
          </DialogDescription>
        </DialogHeader>
        {body}
        <DialogFooter>{footer}</DialogFooter>
      </DialogContent>
    </NativeBackDialog>
  );
}
