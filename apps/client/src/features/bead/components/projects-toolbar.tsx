import { Badge } from "@bead/ui/components/badge";
import { Button } from "@bead/ui/components/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@bead/ui/components/command";
import { Input } from "@bead/ui/components/input";
import { PopoverContent, PopoverTrigger } from "@bead/ui/components/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@bead/ui/components/select";
import { cn } from "@bead/ui/lib/utils";
import { Check, CheckSquare, PlusCircle, X } from "lucide-react";
import type { LibrarySort } from "@/features/collections/hooks/use-library-feed";
import { NativeBackPopover } from "@/features/native/native-back-overlays";

export type ProjectSizeFilterOption = {
  count: number;
  label: string;
  value: string;
};

type ProjectsToolbarProps = {
  onSelectModeChange: (enabled: boolean) => void;
  onSizeFilterChange: (value: string[]) => void;
  onSortChange: (value: LibrarySort) => void;
  onTitleFilterChange: (value: string) => void;
  selectMode: boolean;
  sizeFilter: string[];
  sizeOptions: ProjectSizeFilterOption[];
  sort: LibrarySort;
  titleFilter: string;
};

export function ProjectsToolbar({
  onSelectModeChange,
  onSizeFilterChange,
  onSortChange,
  onTitleFilterChange,
  selectMode,
  sizeFilter,
  sizeOptions,
  sort,
  titleFilter,
}: ProjectsToolbarProps) {
  const hasTitleFilter = titleFilter.length > 0;

  return (
    <div className="min-w-0 flex flex-1 items-center gap-2">
      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
        <div className="relative w-28 sm:w-48 lg:w-56">
          <Input
            aria-label="搜索作品标题"
            className="h-8 pr-8"
            onChange={(event) => onTitleFilterChange(event.target.value)}
            placeholder="搜索标题..."
            value={titleFilter}
          />
          {hasTitleFilter ? (
            <Button
              aria-label="清空搜索"
              className="-translate-y-1/2 absolute top-1/2 right-1 size-6"
              onClick={() => onTitleFilterChange("")}
              size="icon-xs"
              type="button"
              variant="ghost"
            >
              <X aria-hidden="true" />
            </Button>
          ) : null}
        </div>
        <ProjectSizeFilter
          onValueChange={onSizeFilterChange}
          options={sizeOptions}
          value={sizeFilter}
        />
        <Select
          onValueChange={(value) => onSortChange(value as LibrarySort)}
          value={sort}
        >
          <SelectTrigger
            aria-label="排序方式"
            className="h-8 w-auto gap-1.5 px-2.5"
            size="sm"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent align="start">
            <SelectItem value="updatedAt">最近更新</SelectItem>
            <SelectItem value="title">标题</SelectItem>
          </SelectContent>
        </Select>
        <Button
          aria-pressed={selectMode}
          className="h-8"
          onClick={() => onSelectModeChange(!selectMode)}
          type="button"
          variant={selectMode ? "secondary" : "outline"}
        >
          <CheckSquare aria-hidden="true" />
          {selectMode ? "取消选择" : "选择"}
        </Button>
      </div>
    </div>
  );
}

function ProjectSizeFilter({
  onValueChange,
  options,
  value,
}: {
  onValueChange: (value: string[]) => void;
  options: ProjectSizeFilterOption[];
  value: string[];
}) {
  const selectedValues = new Set(value);
  const isFiltered = selectedValues.size > 0;

  return (
    <NativeBackPopover>
      <PopoverTrigger asChild>
        <Button
          className="h-8 justify-start border-dashed"
          variant={isFiltered ? "secondary" : "outline"}
        >
          <PlusCircle aria-hidden="true" />
          尺寸
          {isFiltered ? (
            <Badge className="size-5 rounded-sm p-0 font-normal tabular-nums">
              {selectedValues.size}
            </Badge>
          ) : null}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-34 p-0">
        <Command>
          <CommandInput placeholder="筛选尺寸" />
          <CommandList>
            <CommandEmpty>没有结果</CommandEmpty>
            <CommandGroup>
              {options.map((option) => {
                const isSelected = selectedValues.has(option.value);

                return (
                  <CommandItem
                    data-checked={isSelected}
                    key={option.value}
                    onSelect={() => {
                      const nextValues = new Set(selectedValues);

                      if (isSelected) {
                        nextValues.delete(option.value);
                      } else {
                        nextValues.add(option.value);
                      }

                      onValueChange(Array.from(nextValues));
                    }}
                    value={option.value}
                  >
                    <span
                      className={cn(
                        "flex size-4 items-center justify-center rounded-sm border border-primary",
                        isSelected
                          ? "bg-primary text-primary-foreground"
                          : "opacity-50 [&_svg]:invisible",
                      )}
                    >
                      <Check aria-hidden="true" />
                    </span>
                    <span>{option.label}</span>
                    <CommandShortcut
                      className={cn(
                        "tracking-normal tabular-nums",
                        option.count === 0 && "text-muted-foreground/50",
                      )}
                    >
                      {option.count}
                    </CommandShortcut>
                  </CommandItem>
                );
              })}
            </CommandGroup>
            {selectedValues.size > 0 ? (
              <>
                <CommandSeparator />
                <CommandGroup>
                  <CommandItem
                    className="justify-center text-center"
                    onSelect={() => onValueChange([])}
                  >
                    清除筛选
                  </CommandItem>
                </CommandGroup>
              </>
            ) : null}
          </CommandList>
        </Command>
      </PopoverContent>
    </NativeBackPopover>
  );
}
