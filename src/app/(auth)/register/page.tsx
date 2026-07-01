"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { signUp } from "@/infrastructure/auth/client";
import { useI18n } from "@/i18n/context";
import { LanguageSwitcher } from "@/ui/patterns/language-switcher";
import { Button } from "@/ui/primitives/button";
import { Card } from "@/ui/primitives/card";
import { Input } from "@/ui/primitives/input";

export default function RegisterPage() {
  const router = useRouter();
  const { t } = useI18n();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const result = await signUp.email({ name, email, password });

    if (result.error) {
      setError(result.error.message ?? t.auth.registerFailed);
      setLoading(false);
      return;
    }

    router.push("/overview");
    router.refresh();
  }

  return (
    <div className="flex min-h-screen flex-col bg-base">
      <div className="flex justify-end p-4">
        <LanguageSwitcher />
      </div>
      <div className="flex flex-1 items-center justify-center px-4 pb-12">
        <Card className="w-full max-w-sm space-y-6">
          <div className="space-y-1">
            <h1 className="text-xl font-medium tracking-tight">
              {t.auth.registerTitle}
            </h1>
            <p className="text-sm text-secondary">{t.auth.registerSubtitle}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="name" className="text-xs text-secondary">
                {t.auth.name}
              </label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                autoComplete="name"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="email" className="text-xs text-secondary">
                {t.auth.email}
              </label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="password" className="text-xs text-secondary">
                {t.auth.password}
              </label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                autoComplete="new-password"
              />
            </div>
            {error && <p className="text-sm text-danger">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? t.auth.creating : t.auth.registerTitle}
            </Button>
          </form>

          <p className="text-center text-sm text-secondary">
            {t.auth.hasAccount}{" "}
            <Link href="/login" className="text-primary hover:underline">
              {t.common.signIn}
            </Link>
          </p>
        </Card>
      </div>
    </div>
  );
}
