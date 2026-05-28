"use client";

import Image from "next/image";
import { usePathname } from "next/navigation";
import { setLocale } from "@/app/actions";
import { cn } from "@/lib/utils";
import { locales, type Locale } from "@/lib/i18n";
import catFlag from "@/assets/images/catflag.png";

const labels: Record<Locale, string> = {
  en: "English",
  es: "Castellano",
  ca: "Catala",
};

export function LanguageSwitcher({ locale }: { locale: Locale }) {
  const pathname = usePathname() || "/";

  return (
    <form action={setLocale} className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-black/20 p-1 backdrop-blur-md">
      <input type="hidden" name="returnTo" value={pathname} />
      {locales.map((entry) => (
        <button
          key={entry}
          type="submit"
          name="locale"
          value={entry}
          aria-label={labels[entry]}
          title={labels[entry]}
          className={cn(
            "flex h-9 w-9 items-center justify-center rounded-full text-base transition",
            entry === locale
              ? "bg-white/12 text-white shadow-[0_0_24px_rgba(168,85,247,0.24)]"
              : "text-white/70 hover:bg-white/8 hover:text-white",
          )}
        >
          {entry === "ca" ? (
            <Image
              src={catFlag}
              alt=""
              aria-hidden="true"
              className="h-5 w-5 rounded-full object-cover"
            />
          ) : (
            <span aria-hidden="true">{entry === "en" ? "🇬🇧" : "🇪🇸"}</span>
          )}
        </button>
      ))}
    </form>
  );
}
