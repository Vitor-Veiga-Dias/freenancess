import Link from "next/link";

import { cn } from "@/ui/tokens/cn";

import { CloverIcon } from "./clover-icon";

type BrandLogoSize = "sm" | "md" | "lg";
type BrandLogoVariant = "default" | "round";

interface BrandLogoProps {
  href?: string;
  size?: BrandLogoSize;
  variant?: BrandLogoVariant;
  className?: string;
}

const sizeStyles: Record<
  BrandLogoSize,
  { icon: string; text: string; gap: string; round: string }
> = {
  sm: { icon: "h-5 w-5", text: "text-sm", gap: "gap-2", round: "h-10 w-10" },
  md: { icon: "h-6 w-6", text: "text-base", gap: "gap-2.5", round: "h-11 w-11" },
  lg: { icon: "h-7 w-7", text: "text-xl", gap: "gap-3", round: "h-14 w-14" },
};

export function BrandLogo({
  href = "/overview",
  size = "md",
  variant = "default",
  className,
}: BrandLogoProps) {
  const styles = sizeStyles[size];

  const content =
    variant === "round" ? (
      <span
        className={cn(
          "inline-flex items-center justify-center rounded-full border border-subtle bg-elevated/90 shadow-sm backdrop-blur-sm",
          styles.round,
          className,
        )}
      >
        <CloverIcon className={cn(styles.icon, "text-accent")} />
      </span>
    ) : (
      <span className={cn("inline-flex items-center", styles.gap, className)}>
        <span
          className={cn(
            "inline-flex items-center justify-center rounded-full bg-elevated/80",
            styles.round,
          )}
        >
          <CloverIcon className={cn(styles.icon, "text-accent")} />
        </span>
        <span
          className={cn(
            "font-brand font-extrabold tracking-[-0.03em] text-primary",
            styles.text,
          )}
        >
          FREENANCES
        </span>
      </span>
    );

  if (!href) {
    return content;
  }

  return (
    <Link
      href={href}
      className="inline-flex rounded-full transition-opacity hover:opacity-90"
    >
      {content}
    </Link>
  );
}
