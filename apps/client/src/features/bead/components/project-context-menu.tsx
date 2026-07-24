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
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@bead/ui/components/context-menu";
import {
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@bead/ui/components/dialog";
import { Input } from "@bead/ui/components/input";
import { useIsMobile } from "@bead/ui/hooks/use-mobile";
import {
  Copy,
  Edit3,
  FolderInput,
  LoaderCircle,
  Share2,
  Trash2,
} from "lucide-react";
import { type ReactNode, type SubmitEvent, useEffect, useState } from "react";
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
import { usePublishDiscoverProjects } from "@/features/discover/api/discover-queries";
import { createPublishInput } from "@/features/discover/lib/create-publish-input";
import {
  NativeBackAlertDialog,
  NativeBackDialog,
} from "@/features/native/native-back-overlays";
import { trackEvent } from "@/lib/analytics";

type ProjectContextProject = Pick<
  Project,
  "currentIndex" | "id" | "sizeId" | "snapshots" | "title"
>;

export function ProjectContextMenu({
  children,
  disabled = false,
  project,
}: {
  children: ReactNode;
  disabled?: boolean;
  project: ProjectContextProject;
}) {
  const isMobile = useIsMobile();
  const [isRenameOpen, setIsRenameOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isJoinOpen, setIsJoinOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const publishMutation = usePublishDiscoverProjects();

  if (isMobile || disabled) {
    return children;
  }

  async function handleDuplicate() {
    try {
      await duplicateStoredProject(project.id);
      trackEvent("project_duplicated", { sizeId: project.sizeId });
      toast.success("作品已复制");
    } catch (error) {
      console.error("Unable to duplicate bead project", error);
      toast.error("复制作品失败");
    }
  }

  async function handlePublish() {
    if (publishMutation.isPending || getFilledCount(project) === 0) {
      return;
    }

    try {
      await publishMutation.mutateAsync([createPublishInput(project)]);
      trackEvent("project_published", {
        projectCount: 1,
        sizeId: project.sizeId,
        source: "context_menu",
      });
      toast.success("已发布");
    } catch (error) {
      console.error("Unable to publish bead project", error);
      toast.error("发布作品失败");
    }
  }

  async function handleDelete() {
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

  return (
    <>
      <ContextMenu>
        <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
        <ContextMenuContent className="w-40">
          <ContextMenuItem onSelect={() => setIsRenameOpen(true)}>
            <Edit3 />
            重命名
          </ContextMenuItem>
          <ContextMenuItem onSelect={() => setIsJoinOpen(true)}>
            <FolderInput />
            加入合集…
          </ContextMenuItem>
          <ContextMenuItem onSelect={() => void handleDuplicate()}>
            <Copy />
            复制
          </ContextMenuItem>
          <ContextMenuItem
            disabled={
              publishMutation.isPending || getFilledCount(project) === 0
            }
            onSelect={() => void handlePublish()}
          >
            {publishMutation.isPending ? (
              <LoaderCircle className="animate-spin" />
            ) : (
              <Share2 />
            )}
            {publishMutation.isPending ? "正在发布" : "发布"}
          </ContextMenuItem>
          <ContextMenuSeparator />
          <ContextMenuItem
            onSelect={() => setIsDeleteOpen(true)}
            variant="destructive"
          >
            <Trash2 />
            删除
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>

      {isRenameOpen ? (
        <RenameDialog
          onOpenChange={setIsRenameOpen}
          open={isRenameOpen}
          project={project}
        />
      ) : null}
      {isDeleteOpen ? (
        <NativeBackAlertDialog
          open={isDeleteOpen}
          onOpenChange={(next) => {
            if (!next && isDeleting) {
              return;
            }
            setIsDeleteOpen(next);
          }}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>删除作品？</AlertDialogTitle>
              <AlertDialogDescription>
                删除后无法恢复
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isDeleting}>取消</AlertDialogCancel>
              <Button
                disabled={isDeleting}
                onClick={() => void handleDelete()}
                type="button"
                variant="destructive"
              >
                {isDeleting ? <LoaderCircle className="animate-spin" /> : null}
                {isDeleting ? "正在删除" : "删除"}
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </NativeBackAlertDialog>
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

function RenameDialog({
  onOpenChange,
  open,
  project,
}: {
  onOpenChange: (open: boolean) => void;
  open: boolean;
  project: ProjectContextProject;
}) {
  const [title, setTitle] = useState(project.title);

  useEffect(() => {
    if (open) {
      setTitle(project.title);
    }
  }, [open, project.title]);

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
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
        <form className="grid gap-4" onSubmit={handleSubmit}>
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
