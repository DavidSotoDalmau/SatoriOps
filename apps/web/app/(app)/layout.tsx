import { AppShell } from "@/components/app-shell";
import { redirect } from "next/navigation";
import { requireMembership, requireUser } from "@/lib/auth";
import { getTranslations } from "@/lib/i18n-server";
import { performSignOut } from "@/app/(app)/sign-out-action";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();
  if (user.mustChangePassword) {
    redirect("/change-password");
  }

  const membership = await requireMembership();
  const { locale, t } = await getTranslations();

  return (
    <AppShell
      organizationName={membership.organization.name}
      signOutAction={performSignOut}
      locale={locale}
      labels={{
        appName: t.common.appName,
        publicOverview: t.common.publicOverview,
        signOut: t.common.signOut,
        nav: t.nav,
      }}
    >
      {children}
    </AppShell>
  );
}
