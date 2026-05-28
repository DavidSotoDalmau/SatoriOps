import { createInvitation, regenerateInvitationPassword } from "@/app/(app)/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { InvitationShareCard } from "@/components/invitation-share-card";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { requireMembership } from "@/lib/auth";
import { db } from "@/lib/db";
import { translateRole } from "@/lib/i18n";
import { getTranslations } from "@/lib/i18n-server";
import { roles } from "@/lib/ui-options";

type InvitationsPageProps = {
  searchParams: Promise<{
    created?: string;
    email?: string;
    password?: string;
    passwordOnly?: string;
    error?: string;
  }>;
};

export default async function InvitationsPage({ searchParams }: InvitationsPageProps) {
  const membership = await requireMembership();
  const params = await searchParams;
  const { locale, t } = await getTranslations();
  const invitations = await db.invitation.findMany({
    where: {
      organizationId: membership.organizationId,
    },
    orderBy: { createdAt: "desc" },
  });

  const allowedRoles: readonly ("OWNER" | "ORGANIZER" | "CONTRIBUTOR" | "VIEWER")[] =
    membership.role === "OWNER" ? roles : ["CONTRIBUTOR", "VIEWER"];
  const inviteUrl =
    params.created && params.email && params.passwordOnly !== "1"
      ? `${process.env.APP_URL ?? "http://localhost:3000"}/accept-invitation?token=${encodeURIComponent(params.created)}&email=${encodeURIComponent(params.email)}`
      : null;
  const initialPassword = params.password ?? null;

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_0.9fr]">
      <section className="space-y-4">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-cyan-300/80">{t.pages.invitations.eyebrow}</p>
          <h1 className="mt-2 text-3xl font-semibold text-white">{t.pages.invitations.title}</h1>
        </div>
        {inviteUrl || initialPassword ? (
          <Card className="border-cyan-400/20 bg-cyan-400/5">
            <CardHeader>
              <CardTitle className="text-white">
                {inviteUrl ? t.pages.invitations.invitationLink : t.pages.invitations.temporaryPassword}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <InvitationShareCard
                inviteUrl={inviteUrl}
                temporaryPassword={initialPassword}
                invitationLinkLabel={t.pages.invitations.invitationLink}
                temporaryPasswordLabel={t.pages.invitations.temporaryPassword}
                copyLabel={t.common.copy}
                copiedLabel={t.common.copied}
              />
            </CardContent>
          </Card>
        ) : null}
        {params.error ? <Badge variant="danger">{params.error}</Badge> : null}
        {invitations.map((invitation) => (
          <Card key={invitation.id} className="border-white/10 bg-white/5">
            <CardHeader>
              <div className="flex items-center justify-between gap-3">
                <CardTitle className="text-white">{invitation.email}</CardTitle>
                <Badge>{translateRole(locale, invitation.role)}</Badge>
              </div>
            </CardHeader>
            <CardContent className="text-sm text-slate-300">
              {t.pages.invitations.expires} {invitation.expiresAt.toLocaleString()}
              {" · "}
              {invitation.acceptedAt
                ? t.pages.invitations.accepted
                : invitation.revokedAt
                  ? t.pages.invitations.revoked
                  : t.pages.invitations.pending}
              {!invitation.acceptedAt && !invitation.revokedAt && invitation.expiresAt > new Date() ? (
                <form action={regenerateInvitationPassword} className="mt-3">
                  <input type="hidden" name="invitationId" value={invitation.id} />
                  <input type="hidden" name="returnTo" value="/invitations" />
                  <Button type="submit" variant="outline" size="sm">
                    {t.pages.invitations.regenerateTemporaryPassword}
                  </Button>
                </form>
              ) : null}
            </CardContent>
          </Card>
        ))}
      </section>

      <Card className="h-fit border-white/10 bg-white/5">
        <CardHeader>
          <CardTitle className="text-white">{t.pages.invitations.createInvitation}</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createInvitation} className="space-y-3">
            <input type="hidden" name="returnTo" value="/invitations" />
            <div className="space-y-2">
              <Label htmlFor="email">{t.common.email}</Label>
              <Input id="email" name="email" type="email" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">{t.common.role}</Label>
              <Select id="role" name="role" defaultValue={allowedRoles[0]}>
                {allowedRoles.map((role) => (
                  <option key={role} value={role}>
                    {translateRole(locale, role)}
                  </option>
                ))}
              </Select>
            </div>
            <Button type="submit" className="w-full">
              {t.pages.invitations.generateInvitation}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
