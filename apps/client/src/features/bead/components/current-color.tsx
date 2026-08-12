import type { BeadColor } from "@bead/core/colors";
import { getReadableTextColor } from "@/features/bead/lib/color-utils";

type CurrentColorProps = {
  color: BeadColor;
};

export function CurrentColor({ color }: CurrentColorProps) {
  return (
    <span
      aria-label={`当前豆色 ${color.code}`}
      className="grid size-8 shrink-0 select-none place-items-center rounded-full border font-semibold text-[10px]"
      role="img"
      style={{
        backgroundColor: color.hex,
        color: getReadableTextColor(color.hex),
      }}
    >
      {color.code}
    </span>
  );
}
