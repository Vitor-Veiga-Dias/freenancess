import { cn } from "@/ui/tokens/cn";

type CardProps = React.HTMLAttributes<HTMLDivElement>;

export function Card({ className, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-subtle bg-surface p-6 backdrop-blur-md",
        className,
      )}
      {...props}
    />
  );
}
