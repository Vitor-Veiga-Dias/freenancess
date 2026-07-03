"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { useI18n } from "@/i18n/context";
import { Button } from "@/ui/primitives/button";

interface RevokeConnectionButtonProps {
  connectionId: string;
  disabled?: boolean;
}

export function RevokeConnectionButton({
  connectionId,
  disabled,
}: RevokeConnectionButtonProps) {
  const router = useRouter();
  const { t } = useI18n();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleRevoke() {
    if (!window.confirm(t.connections.revokeConfirm)) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/open-finance/revoke", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ connectionId }),
      });

      const data = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(data.error ?? t.connections.revokeFailed);
      }

      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : t.connections.revokeFailed,
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-1">
      <Button
        type="button"
        variant="ghost"
        disabled={disabled || loading}
        onClick={handleRevoke}
        className="text-danger hover:text-danger"
      >
        {loading ? t.connections.revoking : t.connections.revoke}
      </Button>
      {error && <p className="text-xs text-danger">{error}</p>}
    </div>
  );
}
