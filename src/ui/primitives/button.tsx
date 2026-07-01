import { cn } from "@/ui/tokens/cn";

type ButtonVariant = "primary" | "ghost" | "outline" | "secondary";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    "bg-accent text-on-accent hover:bg-accent-hover border border-transparent",
  ghost: "bg-transparent text-primary hover:bg-elevated border border-transparent",
  outline:
    "bg-transparent text-primary border border-subtle hover:bg-elevated hover:border-accent/40",
  secondary:
    "bg-accent-secondary text-on-accent hover:bg-accent-secondary-hover border border-transparent",
};

export function Button({
  className,
  variant = "primary",
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex h-9 items-center justify-center rounded-lg px-4 text-sm font-medium transition-colors duration-150 disabled:pointer-events-none disabled:opacity-50",
        variantStyles[variant],
        className,
      )}
      {...props}
    />
  );
}
