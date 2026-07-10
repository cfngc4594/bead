import { AlertDialog as AlertDialogRoot } from "@bead/ui/components/alert-dialog";
import { Dialog as DialogRoot } from "@bead/ui/components/dialog";
import { DropdownMenu as DropdownMenuRoot } from "@bead/ui/components/dropdown-menu";
import { Popover as PopoverRoot } from "@bead/ui/components/popover";
import { Sheet as SheetRoot } from "@bead/ui/components/sheet";
import { type ComponentProps, useCallback, useState } from "react";
import { useNativeBackDismiss } from "@/features/native/use-native-back";

type OverlayOpenProps = {
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  open?: boolean;
};

export function NativeBackSheet({
  defaultOpen,
  onOpenChange,
  open,
  ...props
}: ComponentProps<typeof SheetRoot>) {
  const openProps = useNativeBackOpen({
    defaultOpen,
    onOpenChange,
    open,
  });

  return <SheetRoot {...props} {...openProps} />;
}

export function NativeBackDialog({
  defaultOpen,
  onOpenChange,
  open,
  ...props
}: ComponentProps<typeof DialogRoot>) {
  const openProps = useNativeBackOpen({
    defaultOpen,
    onOpenChange,
    open,
  });

  return <DialogRoot {...props} {...openProps} />;
}

export function NativeBackAlertDialog({
  defaultOpen,
  onOpenChange,
  open,
  ...props
}: ComponentProps<typeof AlertDialogRoot>) {
  const openProps = useNativeBackOpen({
    defaultOpen,
    onOpenChange,
    open,
  });

  return <AlertDialogRoot {...props} {...openProps} />;
}

export function NativeBackDropdownMenu({
  defaultOpen,
  onOpenChange,
  open,
  ...props
}: ComponentProps<typeof DropdownMenuRoot>) {
  const openProps = useNativeBackOpen({
    defaultOpen,
    onOpenChange,
    open,
  });

  return <DropdownMenuRoot {...props} {...openProps} />;
}

export function NativeBackPopover({
  defaultOpen,
  onOpenChange,
  open,
  ...props
}: ComponentProps<typeof PopoverRoot>) {
  const openProps = useNativeBackOpen({
    defaultOpen,
    onOpenChange,
    open,
  });

  return <PopoverRoot {...props} {...openProps} />;
}

function useNativeBackOpen({
  defaultOpen = false,
  onOpenChange,
  open: controlledOpen,
}: OverlayOpenProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen);
  const open = controlledOpen ?? uncontrolledOpen;
  const setOpen = useCallback(
    (nextOpen: boolean) => {
      if (controlledOpen === undefined) {
        setUncontrolledOpen(nextOpen);
      }

      onOpenChange?.(nextOpen);
    },
    [controlledOpen, onOpenChange],
  );

  useNativeBackDismiss({
    enabled: open,
    onDismiss: () => setOpen(false),
  });

  return {
    onOpenChange: setOpen,
    open,
  };
}
