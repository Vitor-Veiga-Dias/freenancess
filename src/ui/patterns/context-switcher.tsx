"use client";

import type { ContextType } from "@/domain/context/types";
import { SegmentedControl } from "@/ui/primitives/segmented-control";

interface ContextSwitcherProps {
  value: ContextType;
  onChange: (value: ContextType) => void;
}

export function ContextSwitcher({ value, onChange }: ContextSwitcherProps) {
  return <SegmentedControl value={value} onChange={onChange} />;
}
