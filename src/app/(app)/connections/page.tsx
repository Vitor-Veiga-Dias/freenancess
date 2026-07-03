import { formatConnectionScopes } from "@/domain/consent/scopes";
import { isConsentExpiringSoon } from "@/domain/consent/types";
import { requireSession } from "@/infrastructure/auth/session";
import { prisma } from "@/infrastructure/db/prisma";
import { localeToIntl } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { getContextPreference, getLocale } from "@/i18n/locale";
import { ConnectBankTrigger } from "@/ui/patterns/connect-bank-trigger";
import { PageHeader } from "@/ui/patterns/page-header";
import { RevokeConnectionButton } from "@/ui/patterns/revoke-connection-button";
import { Badge } from "@/ui/primitives/badge";
import { Card } from "@/ui/primitives/card";

function statusVariant(
  status: string,
): "default" | "success" | "warning" | "danger" {
  switch (status) {
    case "CONNECTED":
      return "success";
    case "PENDING":
      return "warning";
    case "ERROR":
      return "danger";
    default:
      return "default";
  }
}

export default async function ConnectionsPage() {
  const session = await requireSession();
  const locale = await getLocale();
  const contextType = await getContextPreference();
  const t = getDictionary(locale);
  const intlLocale = localeToIntl(locale);

  const connections = await prisma.bankConnection.findMany({
    where: { userId: session.user.id },
    include: { context: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-8">
      <PageHeader
        title={t.connections.title}
        description={t.connections.subtitle}
      />

      <ConnectBankTrigger defaultContext={contextType} />

      <div className="space-y-3">
        {connections.length === 0 ? (
          <Card className="p-5 text-sm text-secondary">{t.connections.empty}</Card>
        ) : (
          connections.map((connection) => {
            const contextLabel =
              connection.context.type === "PERSONAL"
                ? t.common.personal
                : t.common.business;
            const statusKey = connection.status as keyof typeof t.status;
            const statusLabel = t.status[statusKey] ?? connection.status;

            return (
              <Card key={connection.id} className="space-y-3 p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-primary">
                      {connection.institutionName}
                    </p>
                    <p className="text-xs text-tertiary">
                      {contextLabel} ·{" "}
                      {formatConnectionScopes(connection.scopes) ||
                        t.connections.scopes}
                    </p>
                  </div>
                  <Badge variant={statusVariant(connection.status)}>
                    {statusLabel}
                  </Badge>
                </div>
                {connection.consentExpiresAt && (
                  <p className="text-xs text-secondary">
                    {t.connections.consentExpires}{" "}
                    {connection.consentExpiresAt.toLocaleDateString(intlLocale)}
                    {isConsentExpiringSoon({
                      status: connection.status,
                      consentExpiresAt: connection.consentExpiresAt,
                    }) && ` · ${t.common.expiringSoon}`}
                  </p>
                )}
                {connection.lastSyncedAt && (
                  <p className="text-xs text-tertiary">
                    {t.connections.lastSynced}{" "}
                    {connection.lastSyncedAt.toLocaleString(intlLocale)}
                  </p>
                )}
                {connection.status !== "REVOKED" && (
                  <RevokeConnectionButton connectionId={connection.id} />
                )}
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
