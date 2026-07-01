export const DOMAIN_EVENT_TYPES = [
  "TRANSACTION_SYNCED",
  "LEAKAGE_DETECTED",
  "CONSENT_EXPIRING",
  "CONNECTION_ESTABLISHED",
  "CONNECTION_REVOKED",
] as const;

export type DomainEventType = (typeof DOMAIN_EVENT_TYPES)[number];

export interface DomainEventEntity {
  id: string;
  userId: string;
  type: DomainEventType;
  title: string;
  narrative: string;
  metadata?: Record<string, unknown> | null;
  createdAt: Date;
}

export interface NarrativeFeedItem {
  id: string;
  title: string;
  narrative: string;
  type: DomainEventType;
  createdAt: Date;
  relativeTime: string;
}

export function toNarrativeFeedItem(event: DomainEventEntity): NarrativeFeedItem {
  return {
    id: event.id,
    title: event.title,
    narrative: event.narrative,
    type: event.type,
    createdAt: event.createdAt,
    relativeTime: formatRelativeTime(event.createdAt),
  };
}

function formatRelativeTime(date: Date): string {
  const diffMs = Date.now() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

  if (diffHours < 1) return "just now";
  if (diffHours < 24) return `${diffHours}h ago`;

  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}
