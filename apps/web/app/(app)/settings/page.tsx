import { updateOrganizationSettings } from "@/app/(app)/actions";
import { requireMembership } from "@/lib/auth";
import { canManageOrganization } from "@/lib/permissions";
import { db } from "@/lib/db";
import { getTranslations } from "@/lib/i18n-server";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export default async function SettingsPage() {
  const membership = await requireMembership();
  const { t } = await getTranslations();
  const organization = await db.organization.findUnique({
    where: { id: membership.organizationId },
  });

  if (!organization) {
    return <p className="text-sm text-slate-300">Organization not found.</p>;
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm uppercase tracking-[0.3em] text-cyan-300/80">{t.pages.settings.eyebrow}</p>
        <h1 className="mt-2 text-3xl font-semibold text-white">{t.pages.settings.title}</h1>
      </div>

      {!canManageOrganization(membership.role) ? (
        <p className="text-sm text-slate-300">{t.pages.settings.denied}</p>
      ) : (
        <Card className="max-w-2xl border-white/10 bg-white/5">
          <CardHeader><CardTitle className="text-white">{t.pages.settings.generalSettings}</CardTitle></CardHeader>
          <CardContent>
            <form action={updateOrganizationSettings} className="space-y-4">
              <input type="hidden" name="organizationId" value={organization.id} />
              <input type="hidden" name="returnTo" value="/settings" />
              <div className="space-y-2">
                <Label htmlFor="name">{t.common.name}</Label>
                <Input id="name" name="name" defaultValue={organization.name} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">{t.common.description}</Label>
                <Textarea id="description" name="description" defaultValue={organization.description ?? ""} />
              </div>
              <Button type="submit">{t.pages.settings.saveSettings}</Button>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
