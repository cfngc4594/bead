"use client";

import { useLiveQuery } from "@tanstack/react-db";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { projectsCollection } from "@/features/bead/storage/projects";

export function HomeRedirect() {
  const router = useRouter();
  const { data: projects = [], isReady } = useLiveQuery((query) =>
    query
      .from({ project: projectsCollection })
      .select(({ project }) => ({ id: project.id })),
  );

  useEffect(() => {
    if (!isReady) {
      return;
    }

    router.replace(projects.length > 0 ? "/projects" : "/projects/new");
  }, [projects.length, isReady, router]);

  return <main className="min-h-screen bg-background" />;
}
