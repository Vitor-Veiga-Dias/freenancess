import { cn } from "@/ui/tokens/cn";

type BadgeVariant = "default" | "success" | "warning" | "danger";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

const variantStyles: Record<BadgeVariant, string> = {
  default: "bg-elevated text-secondary",
  success: "bg-accent/15 text-accent",
  warning: "bg-accent-secondary/15 text-accent-secondary",
  danger: "bg-danger/15 text-danger",
};

export function Badge({
  className,
  variant = "default",
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        variantStyles[variant],
        className,
      )}
      {...props}
    />
  );
}
