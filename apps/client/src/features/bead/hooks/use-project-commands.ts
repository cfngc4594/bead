import { useState } from "react";
import { toast } from "sonner";
import {
  deleteProject as deleteStoredProject,
  duplicateProject as duplicateStoredProject,
  getFilledCount,
  type Project,
  renameProject as renameStoredProject,
} from "@/features/bead/storage/projects";
import { AuthenticationRequiredError } from "@/features/discover/api/discover-api";
import { usePublishDiscoverProject } from "@/features/discover/api/discover-queries";
import { createPublishInput } from "@/features/discover/lib/create-publish-input";
import { trackEvent } from "@/lib/analytics";

export type ProjectCommandTarget = Pick<
  Project,
  "currentIndex" | "id" | "sizeId" | "snapshots" | "title"
>;

export function useProjectCommands(project: ProjectCommandTarget) {
  const [isRenameOpen, setIsRenameOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const publishMutation = usePublishDiscoverProject();
  const canPublish = !publishMutation.isPending && getFilledCount(project) > 0;

  async function duplicate() {
    try {
      await duplicateStoredProject(project.id);
      trackEvent("project_duplicated", { sizeId: project.sizeId });
      toast.success("作品已复制");
    } catch (error) {
      console.error("Unable to duplicate bead project", error);
      toast.error("复制作品失败");
    }
  }

  async function publish() {
    if (!canPublish) {
      return;
    }

    try {
      await publishMutation.mutateAsync(createPublishInput(project));
      trackEvent("project_published", { sizeId: project.sizeId });
      toast.success("已发布");
    } catch (error) {
      if (error instanceof AuthenticationRequiredError) {
        setIsLoginOpen(true);
        return;
      }

      console.error("Unable to publish bead project", error);
      toast.error("发布作品失败");
    }
  }

  async function rename(title: string) {
    try {
      await renameStoredProject({ projectId: project.id, title });
      trackEvent("project_renamed", { sizeId: project.sizeId });
      toast.success("作品已重命名");
      setIsRenameOpen(false);
    } catch (error) {
      console.error("Unable to rename bead project", error);
      toast.error("重命名失败");
    }
  }

  async function confirmDelete() {
    if (isDeleting) {
      return;
    }

    setIsDeleting(true);

    try {
      await deleteStoredProject(project.id);
      setIsDeleteOpen(false);
      trackEvent("project_deleted", { sizeId: project.sizeId });
      toast.success("作品已删除");
    } catch (error) {
      console.error("Unable to delete bead project", error);
      toast.error("删除作品失败");
    } finally {
      setIsDeleting(false);
    }
  }

  function setDeleteOpen(nextOpen: boolean) {
    if (!nextOpen && isDeleting) {
      return;
    }

    setIsDeleteOpen(nextOpen);
  }

  return {
    canPublish,
    confirmDelete,
    duplicate,
    isDeleteOpen,
    isDeleting,
    isLoginOpen,
    isPublishing: publishMutation.isPending,
    isRenameOpen,
    publish,
    rename,
    setDeleteOpen,
    setIsRenameOpen,
    setIsLoginOpen,
  };
}
