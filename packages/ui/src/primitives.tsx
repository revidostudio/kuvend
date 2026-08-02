"use client";

import * as React from "react";
import { Button as BaseButton } from "@base-ui/react/button";
import { Dialog as BaseDialog } from "@base-ui/react/dialog";
import { Accordion as BaseAccordion } from "@base-ui/react/accordion";
import { Select as BaseSelect } from "@base-ui/react/select";
import { Tabs as BaseTabs } from "@base-ui/react/tabs";
import { Tooltip as BaseTooltip } from "@base-ui/react/tooltip";
import { Radio as BaseRadio } from "@base-ui/react/radio";
import { RadioGroup as BaseRadioGroup } from "@base-ui/react/radio-group";
import { AlertDialog as BaseAlertDialog } from "@base-ui/react/alert-dialog";
import { Drawer as BaseDrawer } from "@base-ui/react/drawer";
import { cva, type VariantProps } from "class-variance-authority";
import { Check, X, ChevronDown, LoaderCircle } from "lucide-react";
import { Toaster as SonnerToaster, toast } from "sonner";
import { cn } from "./lib";

export const buttonVariants = cva(
  "inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-md border border-transparent px-4 text-sm font-semibold outline-none transition-colors duration-150 focus-visible:ring-3 focus-visible:ring-[var(--kuvend-focus)]/30 disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        primary: "bg-[var(--kuvend-red)] text-white hover:bg-[var(--kuvend-red-hover)]",
        default: "bg-[var(--kuvend-red)] text-white hover:bg-[var(--kuvend-red-hover)]",
        outline:
          "border-[var(--kuvend-border-strong)] bg-[var(--kuvend-canvas)] text-[var(--kuvend-ink)] hover:bg-[var(--kuvend-surface)]",
        secondary:
          "bg-[var(--kuvend-surface)] text-[var(--kuvend-ink)] hover:bg-[var(--kuvend-border)]",
        ghost: "text-[var(--kuvend-ink)] hover:bg-[var(--kuvend-surface)]",
        destructive: "bg-[var(--kuvend-danger)] text-white hover:opacity-90",
        link: "min-h-0 px-0 text-[var(--kuvend-red)] underline-offset-4 hover:underline",
      },
      size: {
        default: "min-h-11",
        sm: "min-h-11 px-3 text-sm sm:min-h-9",
        lg: "min-h-12 px-5 text-base",
        icon: "size-11 min-h-11 p-0",
      },
    },
    defaultVariants: { variant: "primary", size: "default" },
  },
);

export function Button({
  className,
  variant,
  size,
  ...props
}: BaseButton.Props & VariantProps<typeof buttonVariants>) {
  return (
    <BaseButton
      data-slot="button"
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  );
}

export const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  function Input({ className, ...props }, ref) {
    return (
      <input
        ref={ref}
        data-slot="input"
        className={cn(
          "min-h-11 w-full rounded-md border border-[var(--kuvend-border-strong)] bg-[var(--kuvend-canvas)] px-3 text-base text-[var(--kuvend-ink)] outline-none placeholder:text-[var(--kuvend-ink-soft)] focus-visible:border-[var(--kuvend-focus)] focus-visible:ring-3 focus-visible:ring-[var(--kuvend-focus)]/20 disabled:bg-[var(--kuvend-surface)] disabled:opacity-70 sm:text-sm",
          className,
        )}
        {...props}
      />
    );
  },
);

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.ComponentProps<"textarea">>(
  function Textarea({ className, ...props }, ref) {
    return (
      <textarea
        ref={ref}
        data-slot="textarea"
        className={cn(
          "min-h-28 w-full resize-y rounded-md border border-[var(--kuvend-border-strong)] bg-[var(--kuvend-canvas)] px-3 py-2.5 text-base leading-6 text-[var(--kuvend-ink)] outline-none placeholder:text-[var(--kuvend-ink-soft)] focus-visible:border-[var(--kuvend-focus)] focus-visible:ring-3 focus-visible:ring-[var(--kuvend-focus)]/20 disabled:bg-[var(--kuvend-surface)] disabled:opacity-70 sm:text-sm",
          className,
        )}
        {...props}
      />
    );
  },
);

export const NativeSelect = React.forwardRef<HTMLSelectElement, React.ComponentProps<"select">>(
  function NativeSelect({ className, ...props }, ref) {
    return (
      <select
        ref={ref}
        data-slot="native-select"
        className={cn(
          "min-h-11 w-full rounded-md border border-[var(--kuvend-border-strong)] bg-[var(--kuvend-canvas)] px-3 text-sm text-[var(--kuvend-ink)] outline-none focus-visible:border-[var(--kuvend-focus)] focus-visible:ring-3 focus-visible:ring-[var(--kuvend-focus)]/20",
          className,
        )}
        {...props}
      />
    );
  },
);

export const Checkbox = React.forwardRef<
  HTMLInputElement,
  Omit<React.ComponentProps<"input">, "type">
>(function Checkbox({ className, ...props }, ref) {
  return (
    <input
      ref={ref}
      type="checkbox"
      data-slot="checkbox"
      className={cn(
        "size-5 shrink-0 accent-[var(--kuvend-red)] outline-none focus-visible:ring-3 focus-visible:ring-[var(--kuvend-focus)]/25",
        className,
      )}
      {...props}
    />
  );
});

export function Label({ className, ...props }: React.ComponentProps<"label">) {
  return (
    <label
      data-slot="label"
      className={cn("text-sm font-semibold text-[var(--kuvend-ink)]", className)}
      {...props}
    />
  );
}

export function Field({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="field" className={cn("grid gap-2", className)} {...props} />;
}
export function FieldGroup({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("grid gap-5", className)} {...props} />;
}
export const FieldLabel = Label;
export function FieldDescription({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <p className={cn("text-sm leading-5 text-[var(--kuvend-ink-soft)]", className)} {...props} />
  );
}
export function FieldError({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <p role="alert" className={cn("text-sm text-[var(--kuvend-danger)]", className)} {...props} />
  );
}

export function Card({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card"
      className={cn(
        "rounded-lg border border-[var(--kuvend-border)] bg-[var(--kuvend-surface-raised)]",
        className,
      )}
      {...props}
    />
  );
}
export function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("grid gap-1.5 p-4", className)} {...props} />;
}
export function CardTitle({ className, ...props }: React.ComponentProps<"h3">) {
  return (
    <h3
      className={cn("text-base font-semibold leading-6 text-[var(--kuvend-ink)]", className)}
      {...props}
    />
  );
}
export function CardDescription({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <p className={cn("text-sm leading-5 text-[var(--kuvend-ink-soft)]", className)} {...props} />
  );
}
export function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("px-4 pb-4", className)} {...props} />;
}
export function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn("flex items-center border-t border-[var(--kuvend-border)] p-4", className)}
      {...props}
    />
  );
}

export function Badge({
  className,
  variant = "secondary",
  ...props
}: React.ComponentProps<"span"> & {
  variant?: "default" | "secondary" | "outline" | "destructive";
}) {
  return (
    <span
      data-slot="badge"
      className={cn(
        "inline-flex min-h-6 items-center rounded-md border border-[var(--kuvend-border)] bg-[var(--kuvend-surface)] px-2 text-xs font-medium text-[var(--kuvend-ink-soft)]",
        variant === "default" && "border-transparent bg-[var(--kuvend-red)] text-white",
        variant === "outline" && "bg-transparent text-[var(--kuvend-ink)]",
        variant === "destructive" &&
          "border-transparent bg-[var(--kuvend-red-soft)] text-[var(--kuvend-danger)]",
        className,
      )}
      {...props}
    />
  );
}

export function Separator({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      role="separator"
      className={cn("h-px w-full bg-[var(--kuvend-border)]", className)}
      {...props}
    />
  );
}

export function Alert({
  className,
  variant = "default",
  ...props
}: React.ComponentProps<"div"> & { variant?: "default" | "destructive" }) {
  return (
    <div
      role="alert"
      className={cn(
        "grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 rounded-md border border-[var(--kuvend-border)] bg-[var(--kuvend-surface)] p-4 text-sm [&>svg]:mt-0.5 [&>svg]:size-4",
        variant === "destructive" &&
          "border-[var(--kuvend-danger)]/30 bg-[var(--kuvend-red-soft)] text-[var(--kuvend-danger)]",
        className,
      )}
      {...props}
    />
  );
}
export function AlertTitle({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("font-semibold", className)} {...props} />;
}
export function AlertDescription({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn("col-start-2 leading-5 text-[var(--kuvend-ink-soft)]", className)}
      {...props}
    />
  );
}

export function Progress({
  className,
  value = 0,
  children,
  ...props
}: React.ComponentProps<"div"> & { value?: number }) {
  return (
    <div
      className={cn(
        "grid grid-cols-[1fr_auto] gap-2 text-xs font-medium text-[var(--kuvend-ink-soft)]",
        className,
      )}
      {...props}
    >
      {children}
      <div className="col-span-2 h-1.5 overflow-hidden rounded-full bg-[var(--kuvend-border)]">
        <span
          className="block h-full rounded-full bg-[var(--kuvend-red)] transition-[width]"
          style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
        />
      </div>
    </div>
  );
}
export function ProgressLabel(props: React.ComponentProps<"span">) {
  return <span {...props} />;
}
export function ProgressValue(props: React.ComponentProps<"span">) {
  return <span {...props} />;
}

export const Select = BaseSelect.Root;
export const SelectGroup = BaseSelect.Group;
export const SelectValue = BaseSelect.Value;
export function SelectTrigger({ className, children, ...props }: BaseSelect.Trigger.Props) {
  return (
    <BaseSelect.Trigger
      className={cn(
        "flex min-h-11 w-full items-center justify-between rounded-md border border-[var(--kuvend-border-strong)] bg-[var(--kuvend-canvas)] px-3 text-sm outline-none focus-visible:ring-3 focus-visible:ring-[var(--kuvend-focus)]/20",
        className,
      )}
      {...props}
    >
      {children}
      <BaseSelect.Icon render={<ChevronDown className="size-4 text-[var(--kuvend-ink-soft)]" />} />
    </BaseSelect.Trigger>
  );
}
export function SelectContent({ className, children, ...props }: BaseSelect.Popup.Props) {
  return (
    <BaseSelect.Portal>
      <BaseSelect.Positioner sideOffset={6} className="z-[60]">
        <BaseSelect.Popup
          className={cn(
            "max-h-[min(24rem,var(--available-height))] min-w-[var(--anchor-width)] overflow-y-auto rounded-md border border-[var(--kuvend-border)] bg-[var(--kuvend-canvas)] p-1 shadow-[var(--kuvend-shadow-overlay)] outline-none",
            className,
          )}
          {...props}
        >
          <BaseSelect.List>{children}</BaseSelect.List>
        </BaseSelect.Popup>
      </BaseSelect.Positioner>
    </BaseSelect.Portal>
  );
}
export function SelectItem({ className, children, ...props }: BaseSelect.Item.Props) {
  return (
    <BaseSelect.Item
      className={cn(
        "relative flex min-h-11 cursor-default items-center rounded-sm px-3 pr-9 text-sm outline-none focus:bg-[var(--kuvend-surface)] data-disabled:opacity-50",
        className,
      )}
      {...props}
    >
      <BaseSelect.ItemText>{children}</BaseSelect.ItemText>
      <BaseSelect.ItemIndicator className="absolute right-3">
        <Check className="size-4" />
      </BaseSelect.ItemIndicator>
    </BaseSelect.Item>
  );
}

export function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      aria-hidden="true"
      className={cn("animate-pulse rounded-md bg-[var(--kuvend-surface)]", className)}
      {...props}
    />
  );
}
export function Spinner({
  className,
  label = "Duke u ngarkuar",
}: {
  className?: string;
  label?: string;
}) {
  return (
    <span
      role="status"
      className={cn(
        "inline-flex items-center gap-2 text-sm text-[var(--kuvend-ink-soft)]",
        className,
      )}
    >
      <LoaderCircle className="size-4 animate-spin" />
      {label}
    </span>
  );
}

export const Dialog = BaseDialog.Root;
export const DialogTrigger = BaseDialog.Trigger;
export const DialogClose = BaseDialog.Close;
export function DialogTitle(props: BaseDialog.Title.Props) {
  return (
    <BaseDialog.Title
      className={cn("text-lg font-semibold text-[var(--kuvend-ink)]", props.className)}
      {...props}
    />
  );
}
export function DialogDescription(props: BaseDialog.Description.Props) {
  return (
    <BaseDialog.Description
      className={cn("text-sm leading-5 text-[var(--kuvend-ink-soft)]", props.className)}
      {...props}
    />
  );
}
export function DialogContent({ children, className, ...props }: BaseDialog.Popup.Props) {
  return (
    <BaseDialog.Portal>
      <BaseDialog.Backdrop className="fixed inset-0 z-50 bg-[var(--kuvend-ink)]/20 backdrop-blur-[2px]" />
      <BaseDialog.Popup
        className={cn(
          "fixed left-1/2 top-1/2 z-50 grid max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 gap-4 overflow-y-auto rounded-lg border border-[var(--kuvend-border)] bg-[var(--kuvend-canvas)] p-5 shadow-[var(--kuvend-shadow-overlay)] outline-none",
          className,
        )}
        {...props}
      >
        {children}
        <BaseDialog.Close
          render={<Button variant="ghost" size="icon" className="absolute right-2 top-2" />}
        >
          <X />
          <span className="sr-only">Mbyll</span>
        </BaseDialog.Close>
      </BaseDialog.Popup>
    </BaseDialog.Portal>
  );
}
export function DialogHeader({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("grid gap-2 pr-10", className)} {...props} />;
}
export function DialogFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn("flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end", className)}
      {...props}
    />
  );
}

export const Accordion = BaseAccordion.Root;
export function AccordionItem({ className, ...props }: BaseAccordion.Item.Props) {
  return (
    <BaseAccordion.Item
      className={cn("border-b border-[var(--kuvend-border)]", className)}
      {...props}
    />
  );
}
export function AccordionTrigger({ className, children, ...props }: BaseAccordion.Trigger.Props) {
  return (
    <BaseAccordion.Header>
      <BaseAccordion.Trigger
        className={cn(
          "flex min-h-12 w-full items-center justify-between gap-3 py-3 text-left text-sm font-semibold text-[var(--kuvend-ink)] outline-none focus-visible:ring-3 focus-visible:ring-[var(--kuvend-focus)]/25",
          className,
        )}
        {...props}
      >
        {children}
        <ChevronDown className="size-4 transition-transform group-data-[panel-open]:rotate-180" />
      </BaseAccordion.Trigger>
    </BaseAccordion.Header>
  );
}
export function AccordionPanel({ className, ...props }: BaseAccordion.Panel.Props) {
  return (
    <BaseAccordion.Panel
      className={cn("pb-4 text-sm leading-6 text-[var(--kuvend-ink-soft)]", className)}
      {...props}
    />
  );
}

export const Tabs = BaseTabs.Root;
export function TabsList({ className, ...props }: BaseTabs.List.Props) {
  return (
    <BaseTabs.List
      className={cn("flex min-h-11 gap-1 border-b border-[var(--kuvend-border)]", className)}
      {...props}
    />
  );
}
export function TabsTrigger({ className, ...props }: BaseTabs.Tab.Props) {
  return (
    <BaseTabs.Tab
      className={cn(
        "min-h-11 border-b-2 border-transparent px-3 text-sm font-semibold text-[var(--kuvend-ink-soft)] outline-none focus-visible:ring-3 focus-visible:ring-[var(--kuvend-focus)]/25 data-active:border-[var(--kuvend-red)] data-active:text-[var(--kuvend-ink)]",
        className,
      )}
      {...props}
    />
  );
}
export function TabsContent({ className, ...props }: BaseTabs.Panel.Props) {
  return <BaseTabs.Panel className={cn("py-4 outline-none", className)} {...props} />;
}

export const TooltipProvider = BaseTooltip.Provider;
export const Tooltip = BaseTooltip.Root;
export const TooltipTrigger = BaseTooltip.Trigger;
export function TooltipContent({ className, ...props }: BaseTooltip.Popup.Props) {
  return (
    <BaseTooltip.Portal>
      <BaseTooltip.Positioner sideOffset={8} className="z-[70]">
        <BaseTooltip.Popup
          className={cn(
            "max-w-64 rounded-md bg-[var(--kuvend-ink)] px-3 py-2 text-xs leading-5 text-[var(--kuvend-canvas)] shadow-[var(--kuvend-shadow-overlay)]",
            className,
          )}
          {...props}
        />
      </BaseTooltip.Positioner>
    </BaseTooltip.Portal>
  );
}

export const RadioGroup = BaseRadioGroup;
export function RadioGroupItem({ className, ...props }: BaseRadio.Root.Props) {
  return (
    <BaseRadio.Root
      className={cn(
        "flex size-11 shrink-0 items-center justify-center rounded-full outline-none focus-visible:ring-3 focus-visible:ring-[var(--kuvend-focus)]/25 sm:size-6",
        className,
      )}
      {...props}
    >
      <span className="flex size-5 items-center justify-center rounded-full border border-[var(--kuvend-border-strong)] bg-[var(--kuvend-canvas)]">
        <BaseRadio.Indicator className="size-2.5 rounded-full bg-[var(--kuvend-red)]" />
      </span>
    </BaseRadio.Root>
  );
}

export const AlertDialog = BaseAlertDialog.Root;
export const AlertDialogTrigger = BaseAlertDialog.Trigger;
export const AlertDialogClose = BaseAlertDialog.Close;
export const AlertDialogTitle = DialogTitle;
export const AlertDialogDescription = DialogDescription;
export function AlertDialogContent({ children, className, ...props }: BaseAlertDialog.Popup.Props) {
  return (
    <BaseAlertDialog.Portal>
      <BaseAlertDialog.Backdrop className="fixed inset-0 z-50 bg-[var(--kuvend-ink)]/20" />
      <BaseAlertDialog.Popup
        className={cn(
          "fixed left-1/2 top-1/2 z-50 grid w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 gap-4 rounded-lg border border-[var(--kuvend-border)] bg-[var(--kuvend-canvas)] p-5 shadow-[var(--kuvend-shadow-overlay)] outline-none",
          className,
        )}
        {...props}
      >
        {children}
      </BaseAlertDialog.Popup>
    </BaseAlertDialog.Portal>
  );
}

export const Drawer = BaseDrawer.Root;
export const DrawerTrigger = BaseDrawer.Trigger;
export const DrawerClose = BaseDrawer.Close;
export const DrawerTitle = BaseDrawer.Title;
export const DrawerDescription = BaseDrawer.Description;
export function DrawerContent({ children, className, ...props }: BaseDrawer.Popup.Props) {
  return (
    <BaseDrawer.Portal>
      <BaseDrawer.Backdrop className="fixed inset-0 z-50 bg-[var(--kuvend-ink)]/20" />
      <BaseDrawer.Viewport className="fixed inset-0 z-50 flex items-end justify-center">
        <BaseDrawer.Popup
          className={cn(
            "max-h-[calc(100dvh-1rem)] w-full max-w-2xl overflow-y-auto rounded-t-xl border border-b-0 border-[var(--kuvend-border)] bg-[var(--kuvend-canvas)] p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] shadow-[var(--kuvend-shadow-overlay)] outline-none",
            className,
          )}
          {...props}
        >
          <div
            aria-hidden="true"
            className="mx-auto mb-4 h-1 w-10 rounded-full bg-[var(--kuvend-border-strong)]"
          />
          {children}
        </BaseDrawer.Popup>
      </BaseDrawer.Viewport>
    </BaseDrawer.Portal>
  );
}

export const Sheet = Drawer;
export const SheetTrigger = DrawerTrigger;
export const SheetClose = DrawerClose;
export const SheetTitle = DrawerTitle;
export const SheetDescription = DrawerDescription;
export const SheetContent = DrawerContent;

export function Toaster() {
  return <SonnerToaster position="bottom-center" richColors closeButton />;
}
export { toast };
