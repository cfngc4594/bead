import { getRouteApi, useRouter } from "@tanstack/react-router";
import { canvasSizes } from "@/config/canvas-sizes";
import { SizePicker } from "@/features/bead/components/size-picker";

const routeApi = getRouteApi("/projects/new");

export function NewProjectPage() {
  const router = useRouter();
  const navigate = routeApi.useNavigate();

  const returnToProjects = () => {
    if (router.history.canGoBack()) {
      router.history.back();
      return;
    }

    void navigate({ to: "/projects", replace: true });
  };

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
          onCancel={returnToProjects}
          onProjectCreated={(project) =>
            navigate({
              to: "/projects/$projectId",
              params: { projectId: project.id },
              replace: true,
            })
          }
        />
      </div>
    </main>
  );
}
