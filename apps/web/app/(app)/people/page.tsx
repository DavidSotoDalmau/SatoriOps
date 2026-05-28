import { deactivateMember, updateMemberRole } from "@/app/(app)/actions";
import { requireMembership } from "@/lib/auth";
import { db } from "@/lib/db";
import { translateRole } from "@/lib/i18n";
import { getTranslations } from "@/lib/i18n-server";
import { roles } from "@/lib/ui-options";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

type PeoplePageProps = {
  searchParams: Promise<{
    error?: string;
  }>;
};

export default async function PeoplePage({ searchParams }: PeoplePageProps) {
  const membership = await requireMembership();
  const params = await searchParams;
  const { locale, t } = await getTranslations();

  if (membership.role !== "OWNER") {
    return <Badge variant="danger">{t.pages.people.denied}</Badge>;
  }

  const members = await db.membership.findMany({
    where: { organizationId: membership.organizationId, active: true },
    include: { user: true },
    orderBy: [{ role: "asc" }, { createdAt: "asc" }],
  });

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm uppercase tracking-[0.3em] text-cyan-300/80">{t.pages.people.eyebrow}</p>
        <h1 className="mt-2 text-3xl font-semibold text-white">{t.pages.people.title}</h1>
      </div>
      {params.error ? <Badge variant="danger">{params.error}</Badge> : null}
      <div className="space-y-4">
        {members.map((member) => (
          <Card key={member.id} className="border-white/10 bg-white/5">
            <CardHeader>
              <div className="flex items-center justify-between gap-3">
                <CardTitle className="text-white">{member.user.name ?? member.user.email}</CardTitle>
                <Badge>{translateRole(locale, member.role)}</Badge>
              </div>
            </CardHeader>
            <CardContent className="flex flex-wrap items-center gap-3 text-sm text-slate-300">
              <span>{member.user.email}</span>
              {membership.role === "OWNER" ? (
                <div className="ml-auto flex flex-wrap items-center gap-3">
                  <form action={updateMemberRole} className="flex gap-3">
                    <input type="hidden" name="membershipId" value={member.id} />
                    <input type="hidden" name="returnTo" value="/people" />
                    <Select name="role" defaultValue={member.role} className="min-w-44">
                      {roles.map((role) => <option key={role} value={role}>{translateRole(locale, role)}</option>)}
                    </Select>
                    <Button type="submit">{t.pages.people.updateRole}</Button>
                  </form>
                  {member.id !== membership.id ? (
                    <form action={deactivateMember}>
                      <input type="hidden" name="membershipId" value={member.id} />
                      <input type="hidden" name="returnTo" value="/people" />
                      <Button type="submit" variant="outline">{t.pages.people.deactivateMember}</Button>
                    </form>
                  ) : null}
                </div>
              ) : null}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
