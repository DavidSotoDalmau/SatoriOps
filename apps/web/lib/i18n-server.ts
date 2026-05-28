import { cookies } from "next/headers";
import { dictionaries, localeCookieName, locales, type Locale } from "@/lib/i18n";

export async function getLocale(): Promise<Locale> {
  const cookieStore = await cookies();
  const value = cookieStore.get(localeCookieName)?.value;
  if (value && locales.includes(value as Locale)) {
    return value as Locale;
  }
  return "en";
}

export async function getTranslations() {
  const locale = await getLocale();
  return {
    locale,
    t: dictionaries[locale],
  };
}
