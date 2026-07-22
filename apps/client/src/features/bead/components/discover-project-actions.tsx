import { Button } from "@bead/ui/components/button";
import {
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@bead/ui/components/dropdown-menu";
import { EyeOff, LoaderCircle, MoreHorizontal } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import {
  type PublishedProject,
  unpublishProject,
} from "@/features/bead/storage/published-projects";
import { NativeBackDropdownMenu } from "@/features/native/native-back-overlays";
import { trackEvent } from "@/lib/analytics";

export function DiscoverProjectActions({
  project,
}: {
  project: Pick<PublishedProject, "id" | "sizeId" | "title">;
}) {
  const [isUnpublishing, setIsUnpublishing] = useState(false);

  async function handleUnpublish() {
    if (isUnpublishing) {
      return;
    }

    setIsUnpublishing(true);

    try {
      await unpublishProject(project.id);
      trackEvent("project_unpublished", { sizeId: project.sizeId });
      toast.success("已从发现中移除");
    } catch (error) {
      console.error("Unable to unpublish bead project", error);
      toast.error("取消发布失败");
      setIsUnpublishing(false);
    }
  }

  return (
    <NativeBackDropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          aria-label={`${project.title} 操作`}
          disabled={isUnpublishing}
          size="icon-sm"
          variant="ghost"
        >
          {isUnpublishing ? (
            <LoaderCircle className="animate-spin" />
          ) : (
            <MoreHorizontal />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-32">
        <DropdownMenuItem
          disabled={isUnpublishing}
          onSelect={handleUnpublish}
          variant="destructive"
        >
          {isUnpublishing ? (
            <LoaderCircle className="animate-spin" />
          ) : (
            <EyeOff />
          )}
          取消发布
        </DropdownMenuItem>
      </DropdownMenuContent>
    </NativeBackDropdownMenu>
  );
}
