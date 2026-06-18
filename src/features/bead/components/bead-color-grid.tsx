import type { BeadColor } from "@/data/colors";
import { getReadableTextColor } from "@/features/bead/lib/color-utils";
import { cn } from "@/lib/utils";

type BeadColorGridProps = {
  colors: readonly BeadColor[];
  selectedColor: BeadColor;
  layout: "desktop" | "mobile";
  onSelectColor: (color: BeadColor) => void;
};

export function BeadColorGrid({
  colors,
  selectedColor,
  layout,
  onSelectColor,
}: BeadColorGridProps) {
  return (
    <div
      className={cn(
        "grid min-w-0 gap-2",
        layout === "desktop"
          ? "grid-cols-5 p-4"
          : "grid-cols-[repeat(auto-fill,40px)] justify-center p-2",
      )}
    >
      {colors.map((color) => {
        const isSelected = color.code === selectedColor.code;

        return (
          <button
            aria-label={`选择颜色 ${color.code}`}
            className={cn(
              "aspect-square rounded-md border font-semibold text-[10px] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              layout === "mobile" && "size-10",
              isSelected && "ring-2 ring-primary ring-offset-2",
            )}
            key={color.code}
            onClick={() => onSelectColor(color)}
            style={{
              backgroundColor: color.hex,
              color: getReadableTextColor(color.hex),
            }}
            title={color.code}
            type="button"
          >
            {color.code}
          </button>
        );
      })}
    </div>
  );
}
