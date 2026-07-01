import Link from "next/link";

import type { NarrativeFeedItem } from "@/domain/insights/types";
import { Button } from "@/ui/primitives/button";
import { Card } from "@/ui/primitives/card";

interface NarrativeCardProps {
  item: NarrativeFeedItem;
  action?: {
    href: string;
    label: string;
  };
}

export function NarrativeCard({ item, action }: NarrativeCardProps) {
  return (
    <Card className="space-y-3 p-5">
      <p className="text-sm font-medium leading-relaxed text-primary">
        {item.title}
      </p>
      <p className="text-sm text-secondary">{item.narrative}</p>
      <div className="flex items-center justify-between gap-4 pt-1">
        <p className="text-xs text-tertiary">{item.relativeTime}</p>
        {action && (
          <Link href={action.href} className="shrink-0">
            <Button variant="outline">{action.label}</Button>
          </Link>
        )}
      </div>
    </Card>
  );
}
