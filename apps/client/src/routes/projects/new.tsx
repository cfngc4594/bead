import { createFileRoute } from "@tanstack/react-router";
import { canvasSizes } from "@/config/canvas-sizes";
import { SizePicker } from "@/features/bead/components/size-picker";
import { preloadProjectsCollection } from "@/features/bead/storage/projects";

export const Route = createFileRoute("/projects/new")({
  loader: preloadProjectsCollection,
  component: NewProjectPage,
});

function NewProjectPage() {
  const navigate = Route.useNavigate();

  return (
    <main className="flex h-full min-h-0 flex-col overflow-y-auto bg-background">
      <div className="m-auto w-full max-w-5xl space-y-10 px-4 py-6">
        <div className="text-center">
          <h1 className="font-bold text-3xl tracking-tight md:text-5xl">
            新建拼豆作品
          </h1>
        </div>

        <SizePicker
          initialSize={canvasSizes[0].id}
          onCancel={() => navigate({ to: "/projects" })}
          onProjectCreated={(project) =>
            navigate({
              to: "/projects/$projectId",
              params: { projectId: project.id },
            })
          }
        />
      </div>
    </main>
  );
}
