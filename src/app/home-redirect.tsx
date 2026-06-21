"use client";

import { useLiveQuery } from "@tanstack/react-db";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { beadDocumentsCollection } from "@/features/bead/storage/bead-documents";

export function HomeRedirect() {
  const router = useRouter();
  const { data: documents = [], isReady } = useLiveQuery((query) =>
    query
      .from({ document: beadDocumentsCollection })
      .select(({ document }) => ({ id: document.id })),
  );

  useEffect(() => {
    if (!isReady) {
      return;
    }

    router.replace(documents.length > 0 ? "/projects" : "/projects/new");
  }, [documents.length, isReady, router]);

  return <main className="min-h-screen bg-background" />;
}
