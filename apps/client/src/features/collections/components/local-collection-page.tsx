import { Button } from "@bead/ui/components/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@bead/ui/components/empty";
import { Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, FolderOpen, Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { ProjectCard } from "@/features/bead/components/project-card";
import { CollectionProjectActions } from "@/features/collections/components/collection-project-actions";
import { LocalCollectionActions } from "@/features/collections/components/local-collection-actions";
import { ProjectSelectionDialog } from "@/features/collections/components/project-selection-dialog";
import { useLocalCollection } from "@/features/collections/hooks/use-local-collections";
import { addProjectsToCollection } from "@/features/collections/storage/collection-commands";
import { trackEvent } from "@/lib/analytics";

export function LocalCollectionPage({
  collectionId,
}: {
  collectionId: string;
}) {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const navigate = useNavigate();
  const { data: collections = [] } = useLocalCollection(collectionId);
  const collection = collections[0];

  if (!collection) {
    return <LocalCollectionMissing />;
  }

  async function addProjects({ projectIds }: { projectIds: string[] }) {
    await addProjectsToCollection({ collectionId, projectIds });
    trackEvent("collection_project_added", {
      projectCount: projectIds.length,
    });
    toast.success(
      projectIds.length === 1
        ? "作品已加入合集"
        : `已加入 ${projectIds.length} 个作品`,
    );
  }

  return (
    <main className="flex h-full min-h-0 min-w-0 flex-col bg-background">
      <header className="flex h-16 shrink-0 items-center gap-2 border-b px-3 md:gap-3 md:px-5">
        <Button asChild size="icon-sm" variant="outline">
          <Link aria-label="返回合集" to="/projects/collections">
            <ArrowLeft />
          </Link>
        </Button>
        <div className="min-w-0 flex-1">
          <h1 className="truncate font-medium text-sm" title={collection.title}>
            {collection.title}
          </h1>
          <p className="text-muted-foreground text-xs tabular-nums">
            {collection.projects.length} 个作品
          </p>
        </div>
        <Button onClick={() => setIsAddOpen(true)} variant="outline">
          <Plus aria-hidden="true" />
          <span className="hidden sm:inline">添加作品</span>
          <span className="sm:hidden">添加</span>
        </Button>
        <LocalCollectionActions
          collection={collection}
          onDeleted={() =>
            void navigate({ to: "/projects/collections", replace: true })
          }
          projects={collection.projects}
        />
      </header>

      <section className="min-h-0 flex-1 overflow-auto scrollbar-gutter-stable px-4 py-6 md:px-8">
        <div className="mx-auto w-full max-w-5xl">
          {collection.projects.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {collection.projects.map((project, index) => (
                <ProjectCard
                  actions={
                    <CollectionProjectActions
                      canMoveDown={index < collection.projects.length - 1}
                      canMoveUp={index > 0}
                      collectionId={collection.id}
                      projectId={project.id}
                      projectTitle={project.title}
                    />
                  }
                  key={project.id}
                  onOpen={(source) =>
                    trackEvent("project_opened", {
                      sizeId: project.sizeId,
                      source: `collection_${source}`,
                    })
                  }
                  openLabel="打开"
                  project={project}
                  route="/projects/$projectId"
                  snapshot={project.snapshots[project.currentIndex]}
                  timestamp={project.updatedAt}
                  timestampLabel="更新"
                />
              ))}
            </div>
          ) : (
            <Empty className="min-h-72 flex-none border">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <FolderOpen />
                </EmptyMedia>
                <EmptyTitle>合集还是空的</EmptyTitle>
                <EmptyDescription>
                  添加作品后即可整理和发布这个合集。
                </EmptyDescription>
              </EmptyHeader>
              <EmptyContent>
                <Button onClick={() => setIsAddOpen(true)}>
                  <Plus aria-hidden="true" />
                  添加作品
                </Button>
              </EmptyContent>
            </Empty>
          )}
        </div>
      </section>

      {isAddOpen ? (
        <ProjectSelectionDialog
          description="选择尚未加入这个合集的本地作品。"
          excludedProjectIds={collection.projects.map((project) => project.id)}
          onOpenChange={setIsAddOpen}
          onSubmit={addProjects}
          open={isAddOpen}
          submitLabel="添加"
          title="添加作品"
        />
      ) : null}
    </main>
  );
}

export function LocalCollectionMissing() {
  return (
    <main className="flex min-h-full bg-background px-4 py-6 md:px-8">
      <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col">
        <Empty className="min-h-72 flex-none border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <FolderOpen />
            </EmptyMedia>
            <EmptyTitle>合集不存在</EmptyTitle>
            <EmptyDescription>这个合集可能已被删除。</EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button asChild>
              <Link to="/projects/collections">
                <ArrowLeft aria-hidden="true" />
                返回合集
              </Link>
            </Button>
          </EmptyContent>
        </Empty>
      </div>
    </main>
  );
}
