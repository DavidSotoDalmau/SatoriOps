"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

type InvitationShareCardProps = {
  inviteUrl?: string | null;
  temporaryPassword?: string | null;
  invitationLinkLabel: string;
  temporaryPasswordLabel: string;
  copyLabel: string;
  copiedLabel: string;
};

export function InvitationShareCard({
  inviteUrl,
  temporaryPassword,
  invitationLinkLabel,
  temporaryPasswordLabel,
  copyLabel,
  copiedLabel,
}: InvitationShareCardProps) {
  const [copiedField, setCopiedField] = useState<"link" | "password" | null>(null);

  async function copyValue(value: string, field: "link" | "password") {
    await navigator.clipboard.writeText(value);
    setCopiedField(field);
    window.setTimeout(() => setCopiedField((current) => (current === field ? null : current)), 1500);
  }

  return (
    <div className="space-y-3">
      {inviteUrl ? (
        <div className="space-y-2">
          <a
            href={inviteUrl}
            className="block break-all text-sm text-cyan-200 underline decoration-cyan-400/40 underline-offset-4 hover:text-cyan-100"
          >
            {inviteUrl}
          </a>
          <Button type="button" variant="outline" size="sm" onClick={() => copyValue(inviteUrl, "link")}>
            {copiedField === "link" ? copiedLabel : `${copyLabel}: ${invitationLinkLabel}`}
          </Button>
        </div>
      ) : null}
      {temporaryPassword ? (
        <div className="rounded-xl border border-red-400/20 bg-red-500/5 p-3">
          <p className="text-xs uppercase tracking-[0.25em] text-red-200/80">{temporaryPasswordLabel}</p>
          <p className="mt-2 break-all font-mono text-sm text-white">{temporaryPassword}</p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-3"
            onClick={() => copyValue(temporaryPassword, "password")}
          >
            {copiedField === "password" ? copiedLabel : `${copyLabel}: ${temporaryPasswordLabel}`}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
