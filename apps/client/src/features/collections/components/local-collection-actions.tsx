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
  Edit3,
  LoaderCircle,
  MoreHorizontal,
  Share2,
  Trash2,
} from "lucide-react";
import { type SubmitEvent, useEffect, useState } from "react";
import { toast } from "sonner";
import type { Project } from "@/features/bead/storage/projects";
import {
  deleteLocalCollection,
  renameLocalCollection,
} from "@/features/collections/storage/collection-commands";
import type { LocalCollection } from "@/features/collections/storage/collection-storage";
import {
  createPublishCollectionInput,
  getCollectionPublishIssue,
} from "@/features/collections/storage/collection-transfer";
import { usePublishDiscoverCollection } from "@/features/discover/api/discover-queries";
import {
  NativeBackAlertDialog,
  NativeBackDialog,
  NativeBackDropdownMenu,
} from "@/features/native/native-back-overlays";
import { trackEvent } from "@/lib/analytics";

export function LocalCollectionActions({
  collection,
  onDeleted,
  projects,
}: {
  collection: LocalCollection;
  onDeleted?: () => void;
  projects: Array<
    Pick<Project, "currentIndex" | "sizeId" | "snapshots" | "title">
  >;
}) {
  const [isRenameOpen, setIsRenameOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const publishMutation = usePublishDiscoverCollection();
  const publishIssue = getCollectionPublishIssue(projects);

  async function publishCollection() {
    if (publishMutation.isPending) {
      return;
    }

    if (publishIssue) {
      toast.error(publishIssue);
      return;
    }

    try {
      const input = await createPublishCollectionInput(collection.id);
      await publishMutation.mutateAsync(input);
      trackEvent("collection_published", { projectCount: projects.length });
      toast.success("合集已发布到发现");
    } catch (error) {
      console.error("Unable to publish bead collection", error);
      toast.error(error instanceof Error ? error.message : "发布合集失败");
    }
  }

  async function deleteCollection() {
    if (isDeleting) {
      return;
    }

    setIsDeleting(true);

    try {
      await deleteLocalCollection(collection.id);
      trackEvent("collection_deleted", { projectCount: projects.length });
      toast.success("合集已删除，作品仍保留在作品库中");
      setIsDeleteOpen(false);
      onDeleted?.();
    } catch (error) {
      console.error("Unable to delete bead collection", error);
      toast.error("删除合集失败");
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <>
      <NativeBackDropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            aria-label={`${collection.title} 操作`}
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
          <DropdownMenuItem
            disabled={publishMutation.isPending}
            onSelect={() => void publishCollection()}
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
            删除合集
          </DropdownMenuItem>
        </DropdownMenuContent>
      </NativeBackDropdownMenu>

      {isRenameOpen ? (
        <RenameCollectionDialog
          collection={collection}
          onOpenChange={setIsRenameOpen}
          open={isRenameOpen}
        />
      ) : null}

      {isDeleteOpen ? (
        <NativeBackAlertDialog
          open={isDeleteOpen}
          onOpenChange={(nextOpen) => {
            if (!nextOpen && isDeleting) {
              return;
            }
            setIsDeleteOpen(nextOpen);
          }}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>删除合集？</AlertDialogTitle>
              <AlertDialogDescription>
                只会删除「{collection.title}」的分组，合集中的作品仍会保留。
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isDeleting}>取消</AlertDialogCancel>
              <Button
                disabled={isDeleting}
                onClick={() => void deleteCollection()}
                type="button"
                variant="destructive"
              >
                {isDeleting ? <LoaderCircle className="animate-spin" /> : null}
                {isDeleting ? "正在删除" : "删除合集"}
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </NativeBackAlertDialog>
      ) : null}
    </>
  );
}

function RenameCollectionDialog({
  collection,
  onOpenChange,
  open,
}: {
  collection: LocalCollection;
  onOpenChange: (open: boolean) => void;
  open: boolean;
}) {
  const [title, setTitle] = useState(collection.title);

  useEffect(() => {
    if (open) {
      setTitle(collection.title);
    }
  }, [collection.title, open]);

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      await renameLocalCollection({ collectionId: collection.id, title });
      trackEvent("collection_renamed");
      toast.success("合集已重命名");
      onOpenChange(false);
    } catch (error) {
      console.error("Unable to rename bead collection", error);
      toast.error("重命名失败");
    }
  }

  return (
    <NativeBackDialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form className="grid gap-4" onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>重命名合集</DialogTitle>
            <DialogDescription className="sr-only">
              输入新的合集名称
            </DialogDescription>
          </DialogHeader>
          <Input
            aria-label="合集名称"
            autoFocus
            maxLength={80}
            onChange={(event) => setTitle(event.target.value)}
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
