"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Search, X } from "lucide-react";

import type { ContextType } from "@/domain/context/types";
import {
  filterInstitutions,
  type OpenFinanceInstitution,
} from "@/domain/open-finance/institutions";
import { useI18n } from "@/i18n/context";
import { Button } from "@/ui/primitives/button";
import { Input } from "@/ui/primitives/input";
import { cn } from "@/ui/tokens/cn";

interface BankPickerProps {
  open: boolean;
  onClose: () => void;
  defaultContext: ContextType;
}

export function BankPicker({ open, onClose, defaultContext }: BankPickerProps) {
  const router = useRouter();
  const { t } = useI18n();
  const [query, setQuery] = useState("");
  const [contextType, setContextType] = useState<ContextType>(defaultContext);
  const [connectingId, setConnectingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const institutions = filterInstitutions(query);

  useEffect(() => {
    if (open) {
      setContextType(defaultContext);
      setQuery("");
      setError(null);
    }
  }, [open, defaultContext]);

  useEffect(() => {
    if (!open) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose]);

  if (!open) return null;

  async function handleSelect(institution: OpenFinanceInstitution) {
    setConnectingId(institution.id);
    setError(null);

    try {
      const response = await fetch("/api/open-finance/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contextType,
          institutionId: institution.id,
        }),
      });

      const data = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(data.error ?? t.connections.connectFailed);
      }

      startTransition(() => {
        onClose();
        router.refresh();
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : t.connections.connectFailed);
    } finally {
      setConnectingId(null);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <button
        type="button"
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        aria-label={t.common.cancel}
        onClick={onClose}
      />

      <div className="relative z-10 flex max-h-[90vh] w-full max-w-lg flex-col rounded-t-2xl border border-subtle bg-surface shadow-2xl backdrop-blur-xl sm:rounded-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-subtle p-5">
          <div className="space-y-1">
            <h2 className="text-lg font-medium tracking-tight">
              {t.connections.chooseBank}
            </h2>
            <p className="text-sm text-secondary">
              {t.connections.chooseBankHint}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-secondary transition-colors hover:bg-elevated hover:text-primary"
            aria-label={t.common.cancel}
          >
            <X className="h-4 w-4" strokeWidth={1.5} />
          </button>
        </div>

        <div className="space-y-4 overflow-y-auto p-5">
          <div className="space-y-2">
            <p className="text-xs font-medium uppercase tracking-widest text-secondary">
              {t.connections.selectContext}
            </p>
            <div className="inline-flex rounded-lg bg-elevated p-1">
              {(["PERSONAL", "BUSINESS"] as const).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setContextType(type)}
                  className={cn(
                    "inline-flex h-8 items-center rounded-md px-3 text-sm font-medium transition-colors",
                    contextType === type
                      ? "bg-surface text-primary"
                      : "text-secondary hover:text-primary",
                  )}
                >
                  {type === "PERSONAL"
                    ? t.common.personal
                    : t.common.business}
                </button>
              ))}
            </div>
          </div>

          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-tertiary" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t.common.search}
              className="pl-9"
              autoFocus
            />
          </div>

          {error && <p className="text-sm text-danger">{error}</p>}

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {institutions.map((institution) => (
              <button
                key={institution.id}
                type="button"
                disabled={connectingId !== null || isPending}
                onClick={() => handleSelect(institution)}
                className={cn(
                  "flex flex-col items-start gap-3 rounded-xl border border-subtle bg-elevated p-3 text-left transition-colors hover:border-accent/40 hover:bg-surface",
                  connectingId === institution.id && "border-accent opacity-70",
                )}
              >
                <span
                  className="flex h-9 w-9 items-center justify-center rounded-lg text-sm font-semibold text-white"
                  style={{ backgroundColor: institution.color }}
                >
                  {institution.name.charAt(0)}
                </span>
                <span className="text-sm font-medium text-primary">
                  {connectingId === institution.id
                    ? t.common.connecting
                    : institution.name}
                </span>
              </button>
            ))}
          </div>

          {institutions.length === 0 && (
            <p className="py-8 text-center text-sm text-secondary">
              {t.common.noResults}
            </p>
          )}
        </div>

        <div className="border-t border-subtle p-4">
          <Button variant="ghost" className="w-full" onClick={onClose}>
            {t.common.cancel}
          </Button>
        </div>
      </div>
    </div>
  );
}
