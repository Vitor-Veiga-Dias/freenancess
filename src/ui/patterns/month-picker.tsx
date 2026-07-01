"use client";

import { useRouter, useSearchParams } from "next/navigation";

interface MonthPickerProps {
  month: string;
}

export function MonthPicker({ month }: MonthPickerProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("month", event.target.value);
    router.push(`?${params.toString()}`);
  }

  return (
    <input
      type="month"
      value={month}
      onChange={handleChange}
      className="h-9 rounded-lg border border-subtle bg-elevated/80 px-3 text-sm text-primary backdrop-blur-sm outline-none focus:border-accent/50"
    />
  );
}
