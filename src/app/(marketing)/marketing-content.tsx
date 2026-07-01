"use client";

import Link from "next/link";

import { useI18n } from "@/i18n/context";
import { LanguageSwitcher } from "@/ui/patterns/language-switcher";
import { Button } from "@/ui/primitives/button";

export function MarketingPageContent() {
  const { t } = useI18n();

  return (
    <div className="flex min-h-screen flex-col bg-base">
      <header className="mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-6">
        <span className="text-sm font-semibold tracking-tight">freenances</span>
        <div className="flex items-center gap-3">
          <LanguageSwitcher />
          <Link href="/login">
            <Button variant="ghost">{t.common.signIn}</Button>
          </Link>
          <Link href="/register">
            <Button>{t.common.getStarted}</Button>
          </Link>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col justify-center px-6 pb-24 pt-12">
        <p className="text-xs font-medium uppercase tracking-widest text-secondary">
          {t.marketing.tagline}
        </p>
        <h1 className="mt-4 max-w-2xl text-5xl font-semibold tracking-tight text-primary sm:text-6xl">
          {t.marketing.headline}{" "}
          <span className="text-accent">{t.marketing.headlineAccent}</span>.
        </h1>
        <p className="mt-6 max-w-xl text-lg leading-relaxed text-secondary">
          {t.marketing.description}
        </p>
        <div className="mt-10 flex flex-wrap gap-3">
          <Link href="/register">
            <Button className="h-10 px-6">{t.marketing.startFree}</Button>
          </Link>
          <Link href="/login">
            <Button variant="secondary" className="h-10 px-6">
              {t.common.signIn}
            </Button>
          </Link>
        </div>
      </main>
    </div>
  );
}
