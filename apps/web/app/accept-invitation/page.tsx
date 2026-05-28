import { acceptInvitation } from "@/app/accept-invitation/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { LanguageSwitcher } from "@/components/language-switcher";
import { Label } from "@/components/ui/label";
import { getTranslations } from "@/lib/i18n-server";

type AcceptInvitationPageProps = {
  searchParams: Promise<{
    token?: string;
    email?: string;
    error?: string;
  }>;
};

export default async function AcceptInvitationPage({ searchParams }: AcceptInvitationPageProps) {
  const params = await searchParams;
  const { locale, t } = await getTranslations();

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl items-center px-6 py-10">
      <Card className="w-full border-white/10 bg-slate-950/80">
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <CardTitle className="text-white">{t.auth.acceptInvitation}</CardTitle>
            <LanguageSwitcher locale={locale} />
          </div>
        </CardHeader>
        <CardContent>
          {params.error ? (
            <Badge variant="danger" className="mb-4">
              {params.error}
            </Badge>
          ) : null}
          <p className="mb-4 text-sm text-slate-300">{t.auth.temporaryPasswordHelp}</p>
          <form action={acceptInvitation} className="space-y-4">
            <input type="hidden" name="token" value={params.token ?? ""} />
            <div className="space-y-2">
              <Label htmlFor="name">{t.common.name}</Label>
              <Input id="name" name="name" autoComplete="name" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">{t.common.email}</Label>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                defaultValue={params.email ?? ""}
                required
              />
            </div>
            <Button className="w-full" type="submit">
              {t.auth.createAccount}
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
