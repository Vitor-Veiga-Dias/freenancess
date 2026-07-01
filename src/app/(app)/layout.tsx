import { AppShell } from "@/ui/patterns/app-shell";
import { ensureUserContexts } from "@/application/use-cases/sync-orchestrator";
import { requireSession } from "@/infrastructure/auth/session";
import { getContextPreference } from "@/i18n/locale";

export const dynamic = "force-dynamic";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireSession();
  await ensureUserContexts(session.user.id);
  const initialContext = await getContextPreference();

  return (
    <AppShell initialContext={initialContext}>{children}</AppShell>
  );
}
