import type { BeadColor } from "@/data/colors";

type PerlerCurrentColorProps = {
  color: BeadColor;
};

export function PerlerCurrentColor({ color }: PerlerCurrentColorProps) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <span
        className="size-8 shrink-0 rounded-full border"
        style={{ backgroundColor: color.hex }}
      />
      <div className="min-w-0">
        <p className="font-medium text-sm">{color.code}</p>
        <p className="truncate text-muted-foreground text-xs">{color.hex}</p>
      </div>
    </div>
  );
}
