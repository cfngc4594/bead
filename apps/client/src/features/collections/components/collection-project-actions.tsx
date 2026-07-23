import { Button } from "@bead/ui/components/button";
import {
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@bead/ui/components/dropdown-menu";
import { ArrowDown, ArrowUp, MoreHorizontal, X } from "lucide-react";
import { toast } from "sonner";
import {
  moveCollectionProject,
  removeProjectFromCollection,
} from "@/features/collections/storage/collection-commands";
import { NativeBackDropdownMenu } from "@/features/native/native-back-overlays";
import { trackEvent } from "@/lib/analytics";

export function CollectionProjectActions({
  canMoveDown,
  canMoveUp,
  collectionId,
  projectId,
  projectTitle,
}: {
  canMoveDown: boolean;
  canMoveUp: boolean;
  collectionId: string;
  projectId: string;
  projectTitle: string;
}) {
  async function move(direction: -1 | 1) {
    try {
      await moveCollectionProject({ collectionId, direction, projectId });
      trackEvent("collection_project_reordered", { direction });
    } catch (error) {
      console.error("Unable to reorder collection project", error);
      toast.error("调整顺序失败");
    }
  }

  async function remove() {
    try {
      await removeProjectFromCollection({ collectionId, projectId });
      trackEvent("collection_project_removed");
      toast.success("已从合集中移除");
    } catch (error) {
      console.error("Unable to remove collection project", error);
      toast.error("移除作品失败");
    }
  }

  return (
    <NativeBackDropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          aria-label={`${projectTitle} 合集操作`}
          size="icon-sm"
          variant="ghost"
        >
          <MoreHorizontal />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-36">
        <DropdownMenuItem disabled={!canMoveUp} onSelect={() => void move(-1)}>
          <ArrowUp />
          向前移动
        </DropdownMenuItem>
        <DropdownMenuItem disabled={!canMoveDown} onSelect={() => void move(1)}>
          <ArrowDown />
          向后移动
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => void remove()} variant="destructive">
          <X />
          移出合集
        </DropdownMenuItem>
      </DropdownMenuContent>
    </NativeBackDropdownMenu>
  );
}
