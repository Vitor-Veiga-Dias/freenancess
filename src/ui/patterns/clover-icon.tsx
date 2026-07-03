import { cn } from "@/ui/tokens/cn";

interface CloverIconProps {
  className?: string;
}

export function CloverIcon({ className }: CloverIconProps) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      className={cn("shrink-0", className)}
    >
      <circle cx="16" cy="10" r="5.75" fill="currentColor" />
      <circle cx="22" cy="16" r="5.75" fill="currentColor" />
      <circle cx="16" cy="22" r="5.75" fill="currentColor" />
      <circle cx="10" cy="16" r="5.75" fill="currentColor" />
    </svg>
  );
}
