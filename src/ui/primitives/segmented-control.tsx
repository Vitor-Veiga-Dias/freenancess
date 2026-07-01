"use client";

import { cn } from "@/ui/tokens/cn";

import type { ContextType } from "@/domain/context/types";
import { useI18n } from "@/i18n/context";

interface SegmentedControlProps {
  value: ContextType;
  onChange: (value: ContextType) => void;
}

export function SegmentedControl({ value, onChange }: SegmentedControlProps) {
  const { t } = useI18n();

  const options: {
    value: ContextType;
    label: string;
    accentClass: string;
  }[] = [
    { value: "PERSONAL", label: t.common.personal, accentClass: "bg-accent" },
    {
      value: "BUSINESS",
      label: t.common.business,
      accentClass: "bg-accent-secondary",
    },
  ];

  return (
    <div
      className="inline-flex rounded-lg bg-elevated/80 p-1 backdrop-blur-sm"
      role="tablist"
      aria-label="Financial context"
    >
      {options.map((option) => {
        const isActive = value === option.value;

        return (
          <button
            key={option.value}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(option.value)}
            className={cn(
              "inline-flex h-8 items-center gap-2 rounded-md px-3 text-sm font-medium transition-colors duration-150",
              isActive
                ? "bg-surface text-primary"
                : "text-secondary hover:text-primary",
            )}
          >
            <span
              className={cn(
                "h-1.5 w-1.5 rounded-full",
                isActive ? option.accentClass : "bg-transparent",
              )}
            />
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
