"use client";

import { useState } from "react";

import type { ContextType } from "@/domain/context/types";
import { useI18n } from "@/i18n/context";
import { BankPicker } from "@/ui/patterns/bank-picker";
import { Button } from "@/ui/primitives/button";

interface ConnectBankTriggerProps {
  defaultContext: ContextType;
}

export function ConnectBankTrigger({ defaultContext }: ConnectBankTriggerProps) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setOpen(true)}>{t.connections.connectBank}</Button>
      <BankPicker
        open={open}
        onClose={() => setOpen(false)}
        defaultContext={defaultContext}
      />
    </>
  );
}
