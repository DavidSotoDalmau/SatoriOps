"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, CircuitBoard, Radar, Sparkles } from "lucide-react";
import logoImage from "@/assets/images/SatoriLogo.jpeg";
import { LanguageSwitcher } from "@/components/language-switcher";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { Locale } from "@/lib/i18n";

type Track = {
  title: string;
  accent: "blue" | "violet" | "red";
};

type LandingCopy = {
  eyebrow: string;
  title: string;
  subtitle: string;
  description: string;
  primaryCta: string;
  secondaryCta: string;
  manifestoTitle: string;
  manifestoBody: readonly string[];
  tracksTitle: string;
  tracks: readonly Track[];
  philosophyTitle: string;
  philosophy: readonly { title: string; body: string }[];
  ecosystemTitle: string;
  ecosystemBody: readonly string[];
  signalCards: readonly string[];
  footerLinks: readonly string[];
  footerText: string;
};

const accentStyles = {
  blue: "before:bg-[radial-gradient(circle_at_top,rgba(59,164,255,0.22),transparent_60%)]",
  violet: "before:bg-[radial-gradient(circle_at_top,rgba(168,85,247,0.22),transparent_60%)]",
  red: "before:bg-[radial-gradient(circle_at_top,rgba(255,77,109,0.2),transparent_60%)]",
};

export function PublicLanding({
  locale,
  copy,
}: {
  locale: Locale;
  copy: LandingCopy;
}) {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#07070A] text-white">
      <div className="landing-noise pointer-events-none absolute inset-0 opacity-30" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_12%,rgba(59,164,255,0.28),transparent_16%),radial-gradient(circle_at_58%_20%,rgba(139,92,246,0.26),transparent_28%),radial-gradient(circle_at_80%_18%,rgba(255,77,109,0.12),transparent_32%),radial-gradient(circle_at_20%_75%,rgba(139,92,246,0.12),transparent_25%)]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[36rem] bg-[linear-gradient(180deg,rgba(7,7,10,0)_0%,rgba(7,7,10,0.18)_40%,#07070A_100%)]" />

      <div className="relative mx-auto flex min-h-screen max-w-7xl flex-col px-5 py-6 md:px-8 lg:px-10">
        <header className="mb-10 flex flex-col gap-4 rounded-[1.5rem] border border-white/8 bg-[rgba(15,17,23,0.55)] px-5 py-4 backdrop-blur-xl md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-[0.68rem] uppercase tracking-[0.45em] text-violet-200/80">{copy.eyebrow}</p>
            <p className="mt-2 text-sm text-white/80">SatoriCON</p>
          </div>
          <LanguageSwitcher locale={locale} />
        </header>

        <section className="relative grid gap-12 pb-20 pt-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="space-y-8"
          >
            <Badge className="rounded-full border border-violet-300/20 bg-violet-400/10 px-3 py-1 text-[0.7rem] uppercase tracking-[0.28em] text-violet-100">
              {copy.subtitle}
            </Badge>
            <div className="space-y-5">
              <h1 className="max-w-4xl text-5xl font-semibold uppercase tracking-[0.08em] text-white md:text-7xl">
                {copy.title}
              </h1>
              <p className="max-w-2xl text-base leading-8 text-white/72 md:text-lg">
                {copy.description}
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button asChild className="h-12 rounded-[1rem] bg-violet-400 px-6 text-base text-slate-950 hover:bg-violet-300">
                <Link href="/login">
                  {copy.primaryCta}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="h-12 rounded-[1rem] border-white/12 bg-white/5 px-6 text-base text-white hover:bg-white/10"
              >
                <a href="#vision">{copy.secondaryCta}</a>
              </Button>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: "easeOut", delay: 0.12 }}
            className="relative"
          >
            <div className="absolute inset-0 rounded-[2rem] bg-[radial-gradient(circle_at_center,rgba(59,164,255,0.28),transparent_24%),radial-gradient(circle_at_center,rgba(168,85,247,0.32),transparent_52%),radial-gradient(circle_at_78%_32%,rgba(255,77,109,0.14),transparent_72%)] blur-3xl" />
            <div className="relative rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(20,24,36,0.72),rgba(15,17,23,0.58))] p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.03),0_30px_120px_rgba(34,22,64,0.45)] backdrop-blur-2xl">
              <div className="absolute inset-4 rounded-[1.4rem] border border-white/8" />
              <div className="absolute inset-x-10 top-10 h-px bg-gradient-to-r from-transparent via-cyan-300/35 to-transparent" />
              <div className="absolute inset-y-12 left-10 w-px bg-gradient-to-b from-transparent via-violet-300/24 to-transparent" />
              <div className="relative flex flex-col items-center gap-6 py-8">
                <div className="relative">
                  <div className="absolute inset-[-18%] rounded-full bg-[radial-gradient(circle,rgba(59,164,255,0.22),rgba(168,85,247,0.2),rgba(255,77,109,0.08),transparent_72%)] blur-2xl" />
                  <Image
                    src={logoImage}
                    alt="SatoriCON logo"
                    priority
                    className="relative h-40 w-40 rounded-[1.6rem] border border-white/12 object-cover shadow-[0_0_40px_rgba(139,92,246,0.18)]"
                  />
                </div>
                <div className="grid w-full gap-3 md:grid-cols-3">
                  {[
                    { icon: CircuitBoard, label: copy.signalCards[0] },
                    { icon: Radar, label: copy.signalCards[1] },
                    { icon: Sparkles, label: copy.signalCards[2] },
                  ].map(({ icon: Icon, label }) => (
                    <div
                      key={label}
                      className="rounded-[1rem] border border-white/8 bg-black/18 px-4 py-4 text-center text-xs uppercase tracking-[0.24em] text-white/68"
                    >
                      <Icon className="mx-auto mb-3 h-4 w-4 text-violet-200" />
                      {label}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </section>

        <section id="vision" className="grid gap-6 border-t border-white/8 py-16 lg:grid-cols-[1fr_1.05fr]">
          <div className="space-y-4">
            <p className="text-[0.7rem] uppercase tracking-[0.38em] text-cyan-200/65">Manifesto</p>
            <h2 className="text-3xl font-semibold tracking-tight text-white md:text-4xl">{copy.manifestoTitle}</h2>
          </div>
          <div className="grid gap-4">
            {copy.manifestoBody.map((paragraph) => (
              <Card key={paragraph} className="rounded-[1.25rem] border-white/8 bg-[rgba(20,24,36,0.65)] backdrop-blur-xl">
                <CardContent className="p-6 text-sm leading-7 text-white/72 md:text-base">{paragraph}</CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className="py-12">
          <div className="mb-8 flex items-end justify-between gap-6">
            <div>
              <p className="text-[0.7rem] uppercase tracking-[0.38em] text-violet-200/65">Tracks</p>
              <h2 className="mt-3 text-3xl font-semibold text-white md:text-4xl">{copy.tracksTitle}</h2>
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            {copy.tracks.map((track, index) => (
              <motion.div
                key={track.title}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.35, delay: index * 0.03 }}
              >
                <Card className="group relative overflow-hidden rounded-[1.2rem] border-white/8 bg-[rgba(20,24,36,0.7)] transition duration-300 hover:border-violet-300/22 hover:bg-[rgba(20,24,36,0.82)]">
                  <div className={`absolute inset-0 opacity-0 blur-2xl transition duration-300 group-hover:opacity-100 ${accentStyles[track.accent]} before:absolute before:inset-0 before:content-['']`} />
                  <CardContent className="relative flex min-h-32 items-end p-5">
                    <h3 className="max-w-[13rem] text-lg font-medium text-white/92">{track.title}</h3>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </section>

        <section className="grid gap-4 py-12 lg:grid-cols-3">
          {copy.philosophy.map((item, index) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.4, delay: index * 0.06 }}
            >
              <Card className="h-full rounded-[1.35rem] border-white/8 bg-[rgba(20,24,36,0.68)] backdrop-blur-xl">
                <CardContent className="p-6">
                  <p className="text-[0.72rem] uppercase tracking-[0.34em] text-cyan-200/65">{copy.philosophyTitle}</p>
                  <h3 className="mt-4 text-2xl font-semibold text-white">{item.title}</h3>
                  <p className="mt-4 text-sm leading-7 text-white/72">{item.body}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </section>

        <section className="py-14">
          <Card className="overflow-hidden rounded-[1.6rem] border-white/8 bg-[linear-gradient(135deg,rgba(20,24,36,0.78),rgba(15,17,23,0.62))] backdrop-blur-2xl">
            <CardContent className="grid gap-8 p-8 lg:grid-cols-[0.75fr_1.25fr]">
              <div>
                <p className="text-[0.7rem] uppercase tracking-[0.38em] text-red-200/60">Ecosystem</p>
                <h2 className="mt-3 text-3xl font-semibold text-white md:text-4xl">{copy.ecosystemTitle}</h2>
              </div>
              <div className="grid gap-4 text-sm leading-7 text-white/72 md:grid-cols-2">
                {copy.ecosystemBody.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
            </CardContent>
          </Card>
        </section>

        <footer className="mt-auto flex flex-col gap-6 border-t border-white/8 py-8 md:flex-row md:items-center md:justify-between">
          <nav className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-white/68">
            {copy.footerLinks.map((label) => (
              <a key={label} href="/login" className="transition hover:text-white">
                {label}
              </a>
            ))}
          </nav>
          <p className="text-sm text-white/52">{copy.footerText}</p>
        </footer>
      </div>
    </main>
  );
}
