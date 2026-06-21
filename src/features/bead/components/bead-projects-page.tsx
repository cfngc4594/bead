"use client";

import { useLiveQuery } from "@tanstack/react-db";
import { Clock3, Grid2x2, Plus } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getCanvasSize } from "@/config/canvas-sizes";
import {
  beadDocumentsCollection,
  getBeadDocumentFilledCount,
} from "@/features/bead/storage/bead-documents";

export function BeadProjectsPage() {
  const { data: documents = [] } = useLiveQuery((query) =>
    query
      .from({ document: beadDocumentsCollection })
      .select(({ document }) => ({
        id: document.id,
        sizeId: document.sizeId,
        rows: document.rows,
        cols: document.cols,
        snapshots: document.snapshots,
        currentIndex: document.currentIndex,
        updatedAt: document.updatedAt,
      })),
  );
  const sortedDocuments = [...documents].sort(
    (left, right) => right.updatedAt - left.updatedAt,
  );

  return (
    <main className="flex min-h-screen bg-background px-4 py-6 md:px-8">
      <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6">
        <header className="flex flex-col gap-4 border-b pb-5 md:flex-row md:items-end md:justify-between">
          <h1 className="font-semibold text-2xl tracking-tight md:text-3xl">
            我的拼豆
          </h1>

          {sortedDocuments.length > 0 ? (
            <Button asChild className="w-full md:w-auto">
              <Link href="/projects/new">
                <Plus aria-hidden="true" />
                新建
              </Link>
            </Button>
          ) : null}
        </header>

        {sortedDocuments.length > 0 ? (
          <div className="grid gap-3 md:grid-cols-2">
            {sortedDocuments.map((document) => {
              const size = getCanvasSize(document.sizeId);
              const filledCount = getBeadDocumentFilledCount(document);

              return (
                <Link
                  className="group block rounded-lg outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                  href={`/projects?projectId=${document.id}`}
                  key={document.id}
                >
                  <Card className="h-full transition-colors group-hover:border-primary/60">
                    <CardContent className="flex items-center justify-between gap-4 p-4">
                      <div className="flex min-w-0 items-center gap-4">
                        <div className="grid size-14 shrink-0 place-items-center rounded-md border bg-muted text-2xl">
                          {size.emoji}
                        </div>

                        <div className="min-w-0 space-y-1">
                          <p className="truncate font-medium">
                            {size.title} 作品
                          </p>
                          <div className="flex flex-wrap gap-x-4 gap-y-1 text-muted-foreground text-sm">
                            <span className="inline-flex items-center gap-1.5">
                              <Grid2x2 className="size-4" aria-hidden="true" />
                              {document.rows} x {document.cols}
                            </span>
                            <span>{filledCount} 颗</span>
                          </div>
                        </div>
                      </div>

                      <time
                        className="hidden shrink-0 items-center gap-1.5 text-muted-foreground text-xs md:inline-flex"
                        dateTime={new Date(document.updatedAt).toISOString()}
                      >
                        <Clock3 className="size-3.5" aria-hidden="true" />
                        {formatUpdatedAt(document.updatedAt)}
                      </time>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="grid flex-1 place-items-center rounded-lg border border-dashed">
            <div className="flex max-w-sm flex-col items-center gap-3 text-center">
              <div className="grid size-12 place-items-center rounded-md bg-muted">
                <Grid2x2 className="size-5" aria-hidden="true" />
              </div>
              <p className="text-muted-foreground text-sm">还没有拼豆作品</p>
              <Button asChild>
                <Link href="/projects/new">
                  <Plus aria-hidden="true" />
                  开始拼豆
                </Link>
              </Button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

function formatUpdatedAt(updatedAt: number) {
  return new Intl.DateTimeFormat("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(updatedAt);
}
