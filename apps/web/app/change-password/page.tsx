import { changePassword } from "@/app/change-password/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { LanguageSwitcher } from "@/components/language-switcher";
import { Label } from "@/components/ui/label";
import { requireUser } from "@/lib/auth";
import { getTranslations } from "@/lib/i18n-server";

type ChangePasswordPageProps = {
  searchParams: Promise<{
    error?: string;
  }>;
};

export default async function ChangePasswordPage({ searchParams }: ChangePasswordPageProps) {
  const user = await requireUser();
  const params = await searchParams;
  const { locale, t } = await getTranslations();

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl items-center px-6 py-10">
      <Card className="w-full border-white/10 bg-slate-950/80">
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <CardTitle className="text-white">{t.auth.changePassword}</CardTitle>
            <LanguageSwitcher locale={locale} />
          </div>
        </CardHeader>
        <CardContent>
          {user.mustChangePassword ? (
            <Badge className="mb-4">
              {t.auth.mustChangePassword}
            </Badge>
          ) : null}
          {params.error ? (
            <Badge variant="danger" className="mb-4">
              {params.error}
            </Badge>
          ) : null}
          <form action={changePassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">{t.auth.currentPassword}</Label>
              <Input id="currentPassword" name="currentPassword" type="password" autoComplete="current-password" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="newPassword">{t.auth.newPassword}</Label>
              <Input id="newPassword" name="newPassword" type="password" autoComplete="new-password" minLength={12} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">{t.auth.confirmPassword}</Label>
              <Input id="confirmPassword" name="confirmPassword" type="password" autoComplete="new-password" minLength={12} required />
            </div>
            <Button className="w-full" type="submit">
              {t.auth.updatePassword}
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
