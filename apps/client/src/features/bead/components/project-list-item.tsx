import { Button } from "@bead/ui/components/button";
import {
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@bead/ui/components/dropdown-menu";
import {
  Copy,
  Edit3,
  LoaderCircle,
  MoreHorizontal,
  Share2,
  Trash2,
} from "lucide-react";
import { PhoneAuthDialog } from "@/features/auth/components/phone-auth-dialog";
import { ProjectCard } from "@/features/bead/components/project-card";
import {
  DeleteProjectDialog,
  RenameProjectDialog,
} from "@/features/bead/components/project-command-dialogs";
import {
  type ProjectCommandTarget,
  useProjectCommands,
} from "@/features/bead/hooks/use-project-commands";
import { NativeBackDropdownMenu } from "@/features/native/native-back-overlays";
import { trackEvent } from "@/lib/analytics";

type ProjectListItemProject = ProjectCommandTarget & {
  updatedAt: number;
};

export function ProjectListItem({
  project,
}: {
  project: ProjectListItemProject;
}) {
  const commands = useProjectCommands(project);

  return (
    <>
      <ProjectCard
        actions={
          <ProjectOverflowMenu commands={commands} title={project.title} />
        }
        onOpen={(source) =>
          trackEvent("project_opened", {
            sizeId: project.sizeId,
            source,
          })
        }
        openLabel="打开"
        project={project}
        route="/projects/$projectId"
        snapshot={project.snapshots[project.currentIndex]}
        timestamp={project.updatedAt}
        timestampLabel="更新"
      />

      {commands.isRenameOpen ? (
        <RenameProjectDialog
          onOpenChange={commands.setIsRenameOpen}
          onRename={commands.rename}
          open={commands.isRenameOpen}
          project={project}
        />
      ) : null}
      {commands.isDeleteOpen ? (
        <DeleteProjectDialog
          isDeleting={commands.isDeleting}
          onConfirm={commands.confirmDelete}
          onOpenChange={commands.setDeleteOpen}
          open={commands.isDeleteOpen}
        />
      ) : null}
      {commands.isLoginOpen ? (
        <PhoneAuthDialog
          onAuthenticated={commands.publish}
          onOpenChange={commands.setIsLoginOpen}
          open={commands.isLoginOpen}
        />
      ) : null}
    </>
  );
}

function ProjectOverflowMenu({
  commands,
  title,
}: {
  commands: ReturnType<typeof useProjectCommands>;
  title: string;
}) {
  return (
    <NativeBackDropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          aria-label={`${title} 操作`}
          onPointerDown={(event) => event.stopPropagation()}
          size="icon-sm"
          variant="ghost"
        >
          <MoreHorizontal />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        <DropdownMenuItem onSelect={() => commands.setIsRenameOpen(true)}>
          <Edit3 />
          重命名
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => void commands.duplicate()}>
          <Copy />
          复制
        </DropdownMenuItem>
        <DropdownMenuItem
          disabled={!commands.canPublish}
          onSelect={() => void commands.publish()}
        >
          {commands.isPublishing ? (
            <LoaderCircle className="animate-spin" />
          ) : (
            <Share2 />
          )}
          {commands.isPublishing ? "正在发布" : "发布"}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onSelect={() => commands.setDeleteOpen(true)}
          variant="destructive"
        >
          <Trash2 />
          删除
        </DropdownMenuItem>
      </DropdownMenuContent>
    </NativeBackDropdownMenu>
  );
}
