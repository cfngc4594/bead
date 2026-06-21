"use client";

import { useLiveQuery } from "@tanstack/react-db";
import { Grid2x2, Plus } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { getCanvasSize } from "@/config/canvas-sizes";
import { BeadProjectActions } from "@/features/bead/components/bead-project-actions";
import { BeadProjectPreview } from "@/features/bead/components/bead-project-preview";
import { beadDocumentsCollection } from "@/features/bead/storage/bead-documents";

export function BeadProjectsPage() {
  const { data: documents = [] } = useLiveQuery((query) =>
    query
      .from({ document: beadDocumentsCollection })
      .select(({ document }) => ({
        id: document.id,
        sizeId: document.sizeId,
        rows: document.rows,
        cols: document.cols,
        title: document.title,
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
        <header className="flex items-center justify-between gap-4 border-b pb-5">
          <h1 className="font-semibold text-2xl tracking-tight md:text-3xl">
            我的拼豆
          </h1>

          {sortedDocuments.length > 0 ? (
            <Button asChild>
              <Link href="/projects/new">
                <Plus aria-hidden="true" />
                新建
              </Link>
            </Button>
          ) : null}
        </header>

        {sortedDocuments.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2">
            {sortedDocuments.map((document) => {
              const size = getCanvasSize(document.sizeId);

              return (
                <article
                  className="group overflow-hidden rounded-xl border bg-card shadow-xs transition-colors hover:border-primary/50"
                  key={document.id}
                >
                  <Link
                    aria-label={`打开 ${document.title}`}
                    className="block bg-muted/30 outline-none transition-colors group-hover:bg-muted/50 focus-visible:ring-3 focus-visible:ring-ring/50"
                    href={`/projects?projectId=${document.id}`}
                  >
                    <div className="aspect-4/3">
                      <BeadProjectPreview document={document} />
                    </div>
                  </Link>

                  <div className="flex items-center gap-3 border-t bg-card p-4">
                    <Link
                      aria-label={`打开 ${document.title}`}
                      className="grid size-9 shrink-0 place-items-center rounded-md border bg-muted text-lg outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                      href={`/projects?projectId=${document.id}`}
                    >
                      {size.emoji}
                    </Link>

                    <Link
                      className="min-w-0 flex-1 rounded-md outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                      href={`/projects?projectId=${document.id}`}
                    >
                      <p className="truncate font-medium leading-tight">
                        {document.title}
                      </p>
                      <time
                        className="mt-1 block truncate text-muted-foreground text-sm"
                        dateTime={new Date(document.updatedAt).toISOString()}
                      >
                        {formatUpdatedAt(document.updatedAt)}
                      </time>
                    </Link>

                    <BeadProjectActions document={document} />
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <Empty className="border">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Grid2x2 />
              </EmptyMedia>
              <EmptyTitle>还没有拼豆作品</EmptyTitle>
            </EmptyHeader>
            <EmptyContent>
              <Button asChild>
                <Link href="/projects/new">
                  <Plus aria-hidden="true" />
                  开始拼豆
                </Link>
              </Button>
            </EmptyContent>
          </Empty>
        )}
      </div>
    </main>
  );
}

function formatUpdatedAt(updatedAt: number) {
  const elapsedSeconds = Math.max(
    1,
    Math.floor((Date.now() - updatedAt) / 1000),
  );
  const units = [
    { label: "年", seconds: 60 * 60 * 24 * 365 },
    { label: "个月", seconds: 60 * 60 * 24 * 30 },
    { label: "天", seconds: 60 * 60 * 24 },
    { label: "小时", seconds: 60 * 60 },
    { label: "分钟", seconds: 60 },
  ];

  for (const unit of units) {
    const value = Math.floor(elapsedSeconds / unit.seconds);

    if (value >= 1) {
      return `${value} ${unit.label}前编辑`;
    }
  }

  return "刚刚编辑";
}
