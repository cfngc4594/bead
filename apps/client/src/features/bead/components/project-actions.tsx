import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@bead/ui/components/alert-dialog";
import { Button } from "@bead/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@bead/ui/components/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@bead/ui/components/dropdown-menu";
import { Input } from "@bead/ui/components/input";
import { Copy, Edit3, MoreHorizontal, Trash2 } from "lucide-react";
import { type FormEvent, useEffect, useState } from "react";
import { toast } from "sonner";
import {
  DEFAULT_PROJECT_TITLE,
  deleteProject as deleteStoredProject,
  duplicateProject as duplicateStoredProject,
  type Project,
  renameProject as renameStoredProject,
} from "@/features/bead/storage/projects";
import { trackEvent } from "@/lib/analytics";

export function ProjectActions({ project }: { project: Project }) {
  const [isRenameOpen, setIsRenameOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

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
    try {
      await deleteStoredProject(project.id);
      setIsDeleteOpen(false);
      trackEvent("project_deleted", { sizeId: project.sizeId });
      toast.success("作品已删除");
    } catch (error) {
      console.error("Unable to delete bead project", error);
      toast.error("删除作品失败");
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            aria-label={`${project.title} 操作`}
            size="icon-sm"
            variant="ghost"
          >
            <MoreHorizontal />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-32">
          <DropdownMenuItem onSelect={() => setIsRenameOpen(true)}>
            <Edit3 />
            重命名
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={handleDuplicateProject}>
            <Copy />
            复制
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
      </DropdownMenu>

      {isRenameOpen ? (
        <RenameProjectDialog
          project={project}
          onOpenChange={setIsRenameOpen}
          open={isRenameOpen}
        />
      ) : null}
      {isDeleteOpen ? (
        <DeleteProjectDialog
          project={project}
          onConfirm={handleDeleteProject}
          onOpenChange={setIsDeleteOpen}
          open={isDeleteOpen}
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
  project: Project;
  onOpenChange: (open: boolean) => void;
  open: boolean;
}) {
  const [title, setTitle] = useState(project.title);

  useEffect(() => {
    if (open) {
      setTitle(project.title);
    }
  }, [project.title, open]);

  async function handleRenameProject(event: FormEvent<HTMLFormElement>) {
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form className="grid gap-4" onSubmit={handleRenameProject}>
          <DialogHeader>
            <DialogTitle>重命名作品</DialogTitle>
          </DialogHeader>
          <Input
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
    </Dialog>
  );
}

function DeleteProjectDialog({
  project,
  onConfirm,
  onOpenChange,
  open,
}: {
  project: Project;
  onConfirm: () => void;
  onOpenChange: (open: boolean) => void;
  open: boolean;
}) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>删除作品？</AlertDialogTitle>
          <AlertDialogDescription>
            删除「{project.title}」后无法恢复。
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>取消</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} variant="destructive">
            删除
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
