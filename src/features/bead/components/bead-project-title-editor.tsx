"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

type BeadProjectTitleEditorProps = {
  title: string;
  className?: string;
  onRename: (title: string) => void;
};

export function BeadProjectTitleEditor({
  title,
  className,
  onRename,
}: BeadProjectTitleEditorProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const shouldSkipCommitRef = useRef(false);
  const [isEditing, setIsEditing] = useState(false);
  const [draftTitle, setDraftTitle] = useState(title);

  useEffect(() => {
    if (!isEditing) {
      setDraftTitle(title);
    }
  }, [isEditing, title]);

  useEffect(() => {
    if (isEditing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [isEditing]);

  function commitTitle() {
    if (shouldSkipCommitRef.current) {
      shouldSkipCommitRef.current = false;
      return;
    }

    const nextTitle = draftTitle.trim();

    setIsEditing(false);

    if (nextTitle !== title) {
      onRename(nextTitle);
    }
  }

  function cancelEdit() {
    shouldSkipCommitRef.current = true;
    setDraftTitle(title);
    setIsEditing(false);
  }

  return (
    <div
      className={cn(
        "w-[76px] max-w-[92px] min-w-16 shrink-0 md:w-[92px]",
        className,
      )}
    >
      {isEditing ? (
        <input
          aria-label="作品名"
          className="h-8 w-full rounded-md border border-input bg-background px-2.5 font-medium text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          maxLength={80}
          onBlur={commitTitle}
          onChange={(event) => setDraftTitle(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.currentTarget.blur();
            }

            if (event.key === "Escape") {
              event.preventDefault();
              cancelEdit();
            }
          }}
          ref={inputRef}
          type="text"
          value={draftTitle}
        />
      ) : (
        <button
          aria-label="重命名作品"
          className="w-full truncate rounded-md px-2 py-1 text-left font-medium text-sm outline-none transition-colors hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50"
          onClick={() => {
            setDraftTitle(title);
            setIsEditing(true);
          }}
          title={title}
          type="button"
        >
          {title}
        </button>
      )}
    </div>
  );
}
