import { SheetContent } from "@bead/ui/components/sheet";
import { cn } from "@bead/ui/lib/utils";
import type { ComponentProps, PropsWithChildren } from "react";

export function NativeSafeAreaViewport({ children }: PropsWithChildren) {
  return (
    <div className="box-border h-svh min-h-0 w-full overflow-hidden bg-background pt-[env(safe-area-inset-top,0px)] pr-[env(safe-area-inset-right,0px)] pb-[env(safe-area-inset-bottom,0px)] pl-[env(safe-area-inset-left,0px)]">
      <div className="h-full min-h-0 min-w-0">{children}</div>
    </div>
  );
}

export function NativeBottomSheetContent({
  className,
  ...props
}: Omit<ComponentProps<typeof SheetContent>, "side">) {
  return (
    <SheetContent
      className={cn(
        "pr-[env(safe-area-inset-right,0px)] pb-[max(1rem,env(safe-area-inset-bottom,0px))] pl-[env(safe-area-inset-left,0px)]",
        className,
      )}
      side="bottom"
      {...props}
    />
  );
}
