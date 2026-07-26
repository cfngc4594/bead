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
import { Input } from "@bead/ui/components/input";
import { LoaderCircle } from "lucide-react";
import { type SubmitEvent, useEffect, useState } from "react";
import type { ProjectCommandTarget } from "@/features/bead/hooks/use-project-commands";
import { DEFAULT_PROJECT_TITLE } from "@/features/bead/storage/projects";
import {
  NativeBackAlertDialog,
  NativeBackDialog,
} from "@/features/native/native-back-overlays";

export function RenameProjectDialog({
  onOpenChange,
  onRename,
  open,
  project,
}: {
  onOpenChange: (open: boolean) => void;
  onRename: (title: string) => Promise<void>;
  open: boolean;
  project: Pick<ProjectCommandTarget, "title">;
}) {
  const [title, setTitle] = useState(project.title);

  useEffect(() => {
    if (open) {
      setTitle(project.title);
    }
  }, [open, project.title]);

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    await onRename(title);
  }

  return (
    <NativeBackDialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form
          className="grid gap-4"
          onSubmit={(event) => void handleSubmit(event)}
        >
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

export function DeleteProjectDialog({
  isDeleting,
  onConfirm,
  onOpenChange,
  open,
}: {
  isDeleting: boolean;
  onConfirm: () => Promise<void>;
  onOpenChange: (open: boolean) => void;
  open: boolean;
}) {
  return (
    <NativeBackAlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>删除作品？</AlertDialogTitle>
          <AlertDialogDescription>删除后无法恢复</AlertDialogDescription>
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
