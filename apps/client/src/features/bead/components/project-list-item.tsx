import { Button } from "@bead/ui/components/button";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@bead/ui/components/context-menu";
import {
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@bead/ui/components/dropdown-menu";
import { useIsMobile } from "@bead/ui/hooks/use-mobile";
import {
  Copy,
  Edit3,
  LoaderCircle,
  MoreHorizontal,
  Share2,
  Trash2,
} from "lucide-react";
import type { ComponentType, ReactNode } from "react";
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

type MenuItemProps = {
  children: ReactNode;
  disabled?: boolean;
  onSelect?: () => void;
  variant?: "destructive";
};

export function ProjectListItem({
  project,
}: {
  project: ProjectListItemProject;
}) {
  const isMobile = useIsMobile();
  const commands = useProjectCommands(project);
  const card = (
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
  );

  return (
    <>
      {isMobile ? (
        card
      ) : (
        <ContextMenu>
          <ContextMenuTrigger asChild>
            <div>{card}</div>
          </ContextMenuTrigger>
          <ContextMenuContent className="w-40">
            <ProjectMenuItems
              Item={ContextMenuItem}
              Separator={ContextMenuSeparator}
              commands={commands}
            />
          </ContextMenuContent>
        </ContextMenu>
      )}

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
        <ProjectMenuItems
          Item={DropdownMenuItem}
          Separator={DropdownMenuSeparator}
          commands={commands}
        />
      </DropdownMenuContent>
    </NativeBackDropdownMenu>
  );
}

function ProjectMenuItems({
  commands,
  Item,
  Separator,
}: {
  commands: ReturnType<typeof useProjectCommands>;
  Item: ComponentType<MenuItemProps>;
  Separator: ComponentType;
}) {
  return (
    <>
      <Item onSelect={() => commands.setIsRenameOpen(true)}>
        <Edit3 />
        重命名
      </Item>
      <Item onSelect={() => void commands.duplicate()}>
        <Copy />
        复制
      </Item>
      <Item
        disabled={!commands.canPublish}
        onSelect={() => void commands.publish()}
      >
        {commands.isPublishing ? (
          <LoaderCircle className="animate-spin" />
        ) : (
          <Share2 />
        )}
        {commands.isPublishing ? "正在发布" : "发布"}
      </Item>
      <Separator />
      <Item onSelect={() => commands.setDeleteOpen(true)} variant="destructive">
        <Trash2 />
        删除
      </Item>
    </>
  );
}
