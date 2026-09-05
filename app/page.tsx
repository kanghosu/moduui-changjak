import type { Metadata } from "next";
import { LandingPage } from "@/components/marketing/LandingPage";
import { getDictionary, t } from "@/lib/i18n";

const dictionary = getDictionary("en");

export const metadata: Metadata = {
  title: `${t(dictionary, "brand")} — ${t(dictionary, "hero.h").replace("\n", " ")}`,
  description: t(dictionary, "hero.p").replace("\n", " "),
};

export default function HomePage() {
  return <LandingPage lang="en" dictionary={dictionary} />;
}
