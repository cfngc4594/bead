"use client";

import { useEffect, useRef, useState } from "react";

type BeadProjectTitleEditorProps = {
  title: string;
  onRename: (title: string) => void;
};

export function BeadProjectTitleEditor({
  title,
  onRename,
}: BeadProjectTitleEditorProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const shouldSkipCommitRef = useRef(false);
  const [isEditing, setIsEditing] = useState(false);
  const displayTitle = title.trim() || "未命名作品";
  const [draftTitle, setDraftTitle] = useState(displayTitle);

  useEffect(() => {
    if (!isEditing) {
      setDraftTitle(displayTitle);
    }
  }, [displayTitle, isEditing]);

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

    if (!title.trim() && nextTitle === displayTitle) {
      return;
    }

    if (nextTitle !== title.trim()) {
      onRename(nextTitle);
    }
  }

  function cancelEdit() {
    shouldSkipCommitRef.current = true;
    setDraftTitle(displayTitle);
    setIsEditing(false);
  }

  return (
    <div className="w-[42vw] max-w-56 min-w-28 shrink-0 md:w-56">
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
            setDraftTitle(displayTitle);
            setIsEditing(true);
          }}
          title={displayTitle}
          type="button"
        >
          {displayTitle}
        </button>
      )}
    </div>
  );
}
