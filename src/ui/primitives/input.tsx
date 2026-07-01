import { cn } from "@/ui/tokens/cn";

type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

export function Input({ className, ...props }: InputProps) {
  return (
    <input
      className={cn(
        "h-9 w-full rounded-lg border border-transparent bg-elevated px-3 text-sm text-primary placeholder:text-tertiary outline-none backdrop-blur-sm transition-colors duration-150 focus:border-accent/50 focus:ring-1 focus:ring-accent/50",
        className,
      )}
      {...props}
    />
  );
}
