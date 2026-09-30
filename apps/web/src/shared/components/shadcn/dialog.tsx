"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import { AnimatePresence, type HTMLMotionProps, motion } from "motion/react";
import * as React from "react";

import { X } from "@/shared/components/icons/iconsax";
import { useControlledState } from "@/shared/hooks/use-controlled-state";
import { cn, getStrictContext } from "@/shared/utils/index";

type DialogContextType = {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
};

const [DialogProvider, useDialog] =
  getStrictContext<DialogContextType>("DialogContext");

function Dialog({
  open,
  defaultOpen,
  onOpenChange,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Root>) {
  const [isOpen, setIsOpen] = useControlledState({
    value: open,
    defaultValue: defaultOpen,
    onChange: onOpenChange,
  });

  return (
    <DialogProvider value={{ isOpen, setIsOpen }}>
      <DialogPrimitive.Root
        data-slot="dialog"
        open={isOpen}
        onOpenChange={setIsOpen}
        {...props}
      />
    </DialogProvider>
  );
}

const DialogTrigger = DialogPrimitive.Trigger;

function DialogPortal({
  children,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Portal>) {
  const { isOpen } = useDialog();

  return (
    <AnimatePresence>
      {isOpen && (
        <DialogPrimitive.Portal data-slot="dialog-portal" forceMount {...props}>
          {children}
        </DialogPrimitive.Portal>
      )}
    </AnimatePresence>
  );
}

const DialogClose = DialogPrimitive.Close;

/**
 * onUpdate가 있으면 motion이 WAAPI 대신 매 프레임 스타일을 쓴다.
 * WAAPI는 끝날 때 최종값보다 먼저 취소된다. 움직임 없는 페이지(독서 키재기)면 크롬이 그 한 프레임을 그려 깜빡인다
 */
const skipWaapi = () => {};

const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay> &
    Omit<HTMLMotionProps<"div">, "ref">
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay data-slot="dialog-overlay" asChild forceMount>
    <motion.div
      ref={ref}
      key="dialog-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      onUpdate={skipWaapi}
      className={cn(
        "fixed inset-0 z-50 bg-black/70 backdrop-blur-xs",
        className,
      )}
      {...props}
    />
  </DialogPrimitive.Overlay>
));
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName;

type DialogContentProps = React.ComponentPropsWithoutRef<
  typeof DialogPrimitive.Content
> &
  Omit<HTMLMotionProps<"div">, "ref"> & {
    showCloseButton?: boolean;
    /** 오버레이에 적용할 추가 클래스. 기본 z-index를 덮어써야 할 때 사용합니다. */
    overlayClassName?: string;
  };

const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  DialogContentProps
>(
  (
    { className, children, showCloseButton = true, overlayClassName, ...props },
    ref,
  ) => {
    return (
      <DialogPortal>
        <DialogOverlay className={overlayClassName} />
        <DialogPrimitive.Content
          data-slot="dialog-content"
          asChild
          forceMount
          onOpenAutoFocus={props.onOpenAutoFocus}
          onCloseAutoFocus={props.onCloseAutoFocus}
          onEscapeKeyDown={props.onEscapeKeyDown}
          onPointerDownOutside={props.onPointerDownOutside}
          onInteractOutside={props.onInteractOutside}
        >
          <motion.div
            ref={ref}
            key="dialog-content"
            initial={{ opacity: 0, scale: 0.95, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            onUpdate={skipWaapi}
            className={cn(
              "fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-xl sm:rounded-xl",
              className,
            )}
            {...props}
          >
            {children}
            {showCloseButton && (
              <DialogPrimitive.Close className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground z-50 cursor-pointer size-8 flex items-center justify-center">
                <X className="size-4" aria-hidden="true" />
                <span className="sr-only">Close</span>
              </DialogPrimitive.Close>
            )}
          </motion.div>
        </DialogPrimitive.Content>
      </DialogPortal>
    );
  },
);
DialogContent.displayName = DialogPrimitive.Content.displayName;

const DialogHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    data-slot="dialog-header"
    className={cn(
      "flex flex-col space-y-1.5 text-center sm:text-left",
      className,
    )}
    {...props}
  />
);
DialogHeader.displayName = "DialogHeader";

const DialogFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    data-slot="dialog-footer"
    className={cn(
      "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2",
      className,
    )}
    {...props}
  />
);
DialogFooter.displayName = "DialogFooter";

const DialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    data-slot="dialog-title"
    className={cn(
      "text-lg font-semibold leading-none tracking-tight",
      className,
    )}
    {...props}
  />
));
DialogTitle.displayName = DialogPrimitive.Title.displayName;

const DialogDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    data-slot="dialog-description"
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
));
DialogDescription.displayName = DialogPrimitive.Description.displayName;

export {
  Dialog,
  DialogClose,
  DialogContent,
  type DialogContentProps,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
  useDialog,
};
