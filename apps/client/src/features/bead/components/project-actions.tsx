import {
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@bead/ui/components/alert-dialog";
import { Button } from "@bead/ui/components/button";
import {
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@bead/ui/components/dialog";
import {
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@bead/ui/components/dropdown-menu";
import { Input } from "@bead/ui/components/input";
import {
  Copy,
  Edit3,
  FolderInput,
  FolderMinus,
  LoaderCircle,
  MoreHorizontal,
  Share2,
  Trash2,
} from "lucide-react";
import { type SubmitEvent, useEffect, useState } from "react";
import { toast } from "sonner";
import {
  DEFAULT_PROJECT_TITLE,
  deleteProject as deleteStoredProject,
  duplicateProject as duplicateStoredProject,
  getFilledCount,
  type Project,
  renameProject as renameStoredProject,
} from "@/features/bead/storage/projects";
import { JoinCollectionDialog } from "@/features/collections/components/join-collection-dialog";
import { removeProjectFromCollection } from "@/features/collections/storage/collection-commands";
import { usePublishDiscoverProjects } from "@/features/discover/api/discover-queries";
import { createPublishInput } from "@/features/discover/lib/create-publish-input";
import {
  NativeBackAlertDialog,
  NativeBackDialog,
  NativeBackDropdownMenu,
} from "@/features/native/native-back-overlays";
import { trackEvent } from "@/lib/analytics";

type ProjectActionsProject = Pick<
  Project,
  "currentIndex" | "id" | "sizeId" | "snapshots" | "title"
>;

export function ProjectActions({
  collectionId,
  project,
}: {
  collectionId?: string;
  project: ProjectActionsProject;
}) {
  const [isRenameOpen, setIsRenameOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isJoinOpen, setIsJoinOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const publishMutation = usePublishDiscoverProjects();
  const inCollection = collectionId != null;

  async function handleDuplicateProject() {
    try {
      await duplicateStoredProject(project.id);
      trackEvent("project_duplicated", { sizeId: project.sizeId });
      toast.success("作品已复制");
    } catch (error) {
      console.error("Unable to duplicate bead project", error);
      toast.error("复制作品失败");
    }
  }

  async function handleDeleteProject() {
    if (isDeleting) {
      return;
    }

    setIsDeleting(true);

    try {
      await deleteStoredProject(project.id);
      setIsDeleteOpen(false);
      trackEvent("project_deleted", { sizeId: project.sizeId });
      toast.success("作品已删除");
    } catch (error) {
      console.error("Unable to delete bead project", error);
      toast.error("删除作品失败");
    } finally {
      setIsDeleting(false);
    }
  }

  async function handlePublishProject() {
    if (publishMutation.isPending || getFilledCount(project) === 0) {
      return;
    }

    try {
      await publishMutation.mutateAsync([createPublishInput(project)]);
      trackEvent("project_published", {
        projectCount: 1,
        sizeId: project.sizeId,
        source: "project_actions",
      });
      toast.success("作品已发布到发现");
    } catch (error) {
      console.error("Unable to publish bead project", error);
      toast.error("发布作品失败");
    }
  }

  async function handleRemoveFromCollection() {
    if (!collectionId || isRemoving) {
      return;
    }

    setIsRemoving(true);

    try {
      await removeProjectFromCollection({
        collectionId,
        projectId: project.id,
      });
      trackEvent("collection_project_removed", { source: "menu" });
      toast.success("已移出合集");
    } catch (error) {
      console.error("Unable to remove project from collection", error);
      toast.error("移出合集失败");
    } finally {
      setIsRemoving(false);
    }
  }

  function handleDeleteOpenChange(nextOpen: boolean) {
    if (!nextOpen && isDeleting) {
      return;
    }

    setIsDeleteOpen(nextOpen);
  }

  return (
    <>
      <NativeBackDropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            aria-label={`${project.title} 操作`}
            onPointerDown={(event) => event.stopPropagation()}
            size="icon-sm"
            variant="ghost"
          >
            <MoreHorizontal />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-40">
          <DropdownMenuItem onSelect={() => setIsRenameOpen(true)}>
            <Edit3 />
            重命名
          </DropdownMenuItem>
          {inCollection ? (
            <DropdownMenuItem
              disabled={isRemoving}
              onSelect={() => void handleRemoveFromCollection()}
            >
              {isRemoving ? (
                <LoaderCircle className="animate-spin" />
              ) : (
                <FolderMinus />
              )}
              移出合集
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem onSelect={() => setIsJoinOpen(true)}>
              <FolderInput />
              加入合集…
            </DropdownMenuItem>
          )}
          <DropdownMenuItem onSelect={handleDuplicateProject}>
            <Copy />
            复制
          </DropdownMenuItem>
          <DropdownMenuItem
            disabled={
              publishMutation.isPending || getFilledCount(project) === 0
            }
            onSelect={handlePublishProject}
          >
            {publishMutation.isPending ? (
              <LoaderCircle className="animate-spin" />
            ) : (
              <Share2 />
            )}
            {publishMutation.isPending ? "正在发布" : "发布到发现"}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onSelect={() => setIsDeleteOpen(true)}
            variant="destructive"
          >
            <Trash2 />
            删除
          </DropdownMenuItem>
        </DropdownMenuContent>
      </NativeBackDropdownMenu>

      {isRenameOpen ? (
        <RenameProjectDialog
          project={project}
          onOpenChange={setIsRenameOpen}
          open={isRenameOpen}
        />
      ) : null}
      {isDeleteOpen ? (
        <DeleteProjectDialog
          isDeleting={isDeleting}
          project={project}
          onConfirm={handleDeleteProject}
          onOpenChange={handleDeleteOpenChange}
          open={isDeleteOpen}
        />
      ) : null}
      {isJoinOpen ? (
        <JoinCollectionDialog
          onOpenChange={setIsJoinOpen}
          open={isJoinOpen}
          projectIds={[project.id]}
        />
      ) : null}
    </>
  );
}

function RenameProjectDialog({
  project,
  onOpenChange,
  open,
}: {
  project: ProjectActionsProject;
  onOpenChange: (open: boolean) => void;
  open: boolean;
}) {
  const [title, setTitle] = useState(project.title);

  useEffect(() => {
    if (open) {
      setTitle(project.title);
    }
  }, [project.title, open]);

  async function handleRenameProject(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      await renameStoredProject({ projectId: project.id, title });
      trackEvent("project_renamed", { sizeId: project.sizeId });
      toast.success("作品已重命名");
      onOpenChange(false);
    } catch (error) {
      console.error("Unable to rename bead project", error);
      toast.error("重命名失败");
    }
  }

  return (
    <NativeBackDialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form className="grid gap-4" onSubmit={handleRenameProject}>
          <DialogHeader>
            <DialogTitle>重命名作品</DialogTitle>
            <DialogDescription className="sr-only">
              输入新的作品名称
            </DialogDescription>
          </DialogHeader>
          <Input
            aria-label="作品名称"
            autoFocus
            maxLength={80}
            onChange={(event) => setTitle(event.target.value)}
            placeholder={DEFAULT_PROJECT_TITLE}
            value={title}
          />
          <DialogFooter>
            <Button
              onClick={() => onOpenChange(false)}
              type="button"
              variant="outline"
            >
              取消
            </Button>
            <Button type="submit">保存</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </NativeBackDialog>
  );
}

function DeleteProjectDialog({
  isDeleting,
  project,
  onConfirm,
  onOpenChange,
  open,
}: {
  isDeleting: boolean;
  project: ProjectActionsProject;
  onConfirm: () => Promise<void>;
  onOpenChange: (open: boolean) => void;
  open: boolean;
}) {
  return (
    <NativeBackAlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>删除作品？</AlertDialogTitle>
          <AlertDialogDescription>
            删除「{project.title}」后无法恢复
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>取消</AlertDialogCancel>
          <Button
            disabled={isDeleting}
            onClick={() => void onConfirm()}
            type="button"
            variant="destructive"
          >
            {isDeleting ? <LoaderCircle className="animate-spin" /> : null}
            {isDeleting ? "正在删除" : "删除"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </NativeBackAlertDialog>
  );
}
