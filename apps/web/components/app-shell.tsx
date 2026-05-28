import Link from "next/link";
import { LayoutDashboard, CalendarDays, ListChecks, Columns3, TriangleAlert, ScrollText, Users, Mail, Shield, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LanguageSwitcher } from "@/components/language-switcher";
import type { Locale } from "@/lib/i18n";

export function AppShell({
  children,
  organizationName,
  signOutAction,
  locale,
  labels,
}: {
  children: React.ReactNode;
  organizationName: string;
  signOutAction: (formData: FormData) => Promise<void>;
  locale: Locale;
  labels: {
    appName: string;
    publicOverview: string;
    signOut: string;
    nav: {
      dashboard: string;
      topics: string;
      kanban: string;
      blockers: string;
      decisions: string;
      people: string;
      invitations: string;
      auditLogs: string;
      settings: string;
    };
  };
}) {
  const navigation = [
    { href: "/dashboard", label: labels.nav.dashboard, icon: LayoutDashboard },
    { href: "/topics", label: labels.nav.topics, icon: ListChecks },
    { href: "/kanban", label: labels.nav.kanban, icon: Columns3 },
    { href: "/blockers", label: labels.nav.blockers, icon: TriangleAlert },
    { href: "/decisions", label: labels.nav.decisions, icon: ScrollText },
    { href: "/people", label: labels.nav.people, icon: Users },
    { href: "/invitations", label: labels.nav.invitations, icon: Mail },
    { href: "/audit-logs", label: labels.nav.auditLogs, icon: Shield },
    { href: "/settings", label: labels.nav.settings, icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-transparent">
      <div className="mx-auto grid min-h-screen max-w-7xl gap-6 px-4 py-4 lg:grid-cols-[260px_1fr]">
        <aside className="rounded-3xl border border-white/10 bg-slate-950/70 p-4">
          <div className="mb-6 border-b border-white/10 pb-4">
            <p className="text-xs uppercase tracking-[0.3em] text-cyan-300/80">{labels.appName}</p>
            <p className="mt-2 text-lg font-semibold text-white">{organizationName}</p>
            <div className="mt-3">
              <LanguageSwitcher locale={locale} />
            </div>
          </div>
          <nav className="space-y-2">
            {navigation.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className="flex items-center gap-3 rounded-2xl px-3 py-2 text-sm text-slate-300 transition hover:bg-white/5 hover:text-white"
              >
                <Icon className="h-4 w-4 text-cyan-300" />
                {label}
              </Link>
            ))}
          </nav>
          <div className="mt-6 border-t border-white/10 pt-4">
            <Link
              href="/"
              className="mb-3 flex items-center gap-3 rounded-2xl px-3 py-2 text-sm text-slate-300 transition hover:bg-white/5 hover:text-white"
            >
              <CalendarDays className="h-4 w-4 text-cyan-300" />
              {labels.publicOverview}
            </Link>
            <form action={signOutAction}>
              <Button type="submit" variant="outline" className="w-full">
                {labels.signOut}
              </Button>
            </form>
          </div>
        </aside>
        <div className="rounded-3xl border border-white/10 bg-slate-950/55 p-6">{children}</div>
      </div>
    </div>
  );
}
