import Link from "next/link";
import { db } from "@/lib/db";
import { authenticate } from "@/app/login/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { LanguageSwitcher } from "@/components/language-switcher";
import { Label } from "@/components/ui/label";
import { translateLoginError } from "@/lib/i18n";
import { getTranslations } from "@/lib/i18n-server";

type LoginPageProps = {
  searchParams: Promise<{
    error?: string;
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const { locale, t } = await getTranslations();
  const hasGitHub = Boolean(process.env.AUTH_GITHUB_ID && process.env.AUTH_GITHUB_SECRET);
  const organization = await db.organization.findFirst({
    orderBy: { createdAt: "asc" },
  });

  return (
    <main className="mx-auto flex min-h-screen max-w-5xl items-center px-6 py-10">
      <div className="grid w-full gap-8 md:grid-cols-[1.2fr_0.8fr]">
        <section className="space-y-6">
          <div className="flex items-center justify-between gap-4">
            <p className="text-sm uppercase tracking-[0.35em] text-cyan-300/80">{t.common.secureAccess}</p>
            <LanguageSwitcher locale={locale} />
          </div>
          <h1 className="text-4xl font-semibold tracking-tight text-white md:text-5xl">
            {t.auth.loginTitle}
          </h1>
          <p className="max-w-xl text-base leading-7 text-slate-300">
            {t.auth.loginDescription}
          </p>
          {organization ? (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-300">
              {t.auth.activeOrganization}: <span className="font-medium text-white">{organization.name}</span>
            </div>
          ) : null}
        </section>

        <Card className="border-white/10 bg-slate-950/70">
          <CardHeader>
            <CardTitle className="text-white">{t.auth.signIn}</CardTitle>
          </CardHeader>
          <CardContent>
            {params.error ? (
              <Badge variant="danger" className="mb-4">
                {translateLoginError(locale, params.error)}
              </Badge>
            ) : null}
            <form action={authenticate} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">{t.common.email}</Label>
                <Input id="email" name="email" type="email" autoComplete="email" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">{t.common.password}</Label>
                <Input id="password" name="password" type="password" autoComplete="current-password" required />
              </div>
              <Button className="w-full" type="submit">
                {t.auth.signIn}
              </Button>
            </form>
            {hasGitHub ? (
              <p className="mt-4 text-xs text-slate-400">
                {t.auth.githubEnabled}
              </p>
            ) : null}
            <p className="mt-4 text-xs text-slate-400">
              {t.auth.needAccess}
            </p>
            <Link href="/" className="mt-4 inline-flex text-sm text-cyan-300 hover:text-cyan-200">
              {t.auth.backToOverview}
            </Link>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
