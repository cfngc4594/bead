"use client";

import { Copy, Edit3, MoreHorizontal, Trash2 } from "lucide-react";
import { type FormEvent, useEffect, useState } from "react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  type BeadDocument,
  DEFAULT_BEAD_DOCUMENT_TITLE,
  deleteBeadDocument,
  duplicateBeadDocument,
  renameBeadDocument,
} from "@/features/bead/storage/bead-documents";

export function BeadProjectActions({ document }: { document: BeadDocument }) {
  const [isRenameOpen, setIsRenameOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  async function duplicateProject() {
    try {
      await duplicateBeadDocument(document.id);
      toast.success("作品已复制");
    } catch (error) {
      console.error("Unable to duplicate bead document", error);
      toast.error("复制作品失败");
    }
  }

  async function deleteProject() {
    try {
      await deleteBeadDocument(document.id);
      setIsDeleteOpen(false);
      toast.success("作品已删除");
    } catch (error) {
      console.error("Unable to delete bead document", error);
      toast.error("删除作品失败");
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            aria-label={`${document.title} 操作`}
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
          <DropdownMenuItem onSelect={duplicateProject}>
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
          document={document}
          onOpenChange={setIsRenameOpen}
          open={isRenameOpen}
        />
      ) : null}
      {isDeleteOpen ? (
        <DeleteProjectDialog
          document={document}
          onConfirm={deleteProject}
          onOpenChange={setIsDeleteOpen}
          open={isDeleteOpen}
        />
      ) : null}
    </>
  );
}

function RenameProjectDialog({
  document,
  onOpenChange,
  open,
}: {
  document: BeadDocument;
  onOpenChange: (open: boolean) => void;
  open: boolean;
}) {
  const [title, setTitle] = useState(document.title);

  useEffect(() => {
    if (open) {
      setTitle(document.title);
    }
  }, [document.title, open]);

  async function renameProject(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      await renameBeadDocument({ documentId: document.id, title });
      toast.success("作品已重命名");
      onOpenChange(false);
    } catch (error) {
      console.error("Unable to rename bead document", error);
      toast.error("重命名失败");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form className="grid gap-4" onSubmit={renameProject}>
          <DialogHeader>
            <DialogTitle>重命名作品</DialogTitle>
          </DialogHeader>
          <Input
            autoFocus
            maxLength={80}
            onChange={(event) => setTitle(event.target.value)}
            placeholder={DEFAULT_BEAD_DOCUMENT_TITLE}
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
  document,
  onConfirm,
  onOpenChange,
  open,
}: {
  document: BeadDocument;
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
            删除「{document.title}」后无法恢复。
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
