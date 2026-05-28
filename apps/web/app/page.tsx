import { PublicLanding } from "@/components/public-landing";
import { getTranslations } from "@/lib/i18n-server";

export default async function HomePage() {
  const { locale, t } = await getTranslations();

  return <PublicLanding locale={locale} copy={t.landing} />;
}
