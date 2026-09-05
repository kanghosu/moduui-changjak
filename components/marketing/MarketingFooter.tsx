import { LangSwitcher } from "@/components/marketing/LangSwitcher";
import { type Dictionary, type Lang, t } from "@/lib/i18n";

type MarketingFooterProps = {
  readonly lang: Lang;
  readonly dictionary: Dictionary;
};

const LANDING_PATHS = {
  en: "/",
  ko: "/ko",
  zh: "/zh",
} as const satisfies Record<Lang, string>;

export function MarketingFooter({ lang, dictionary }: MarketingFooterProps) {
  return (
    <footer className="mk-footer">
      <div className="mk-footer-grid">
        <a className="mk-wordmark" href={LANDING_PATHS[lang]}>
          {t(dictionary, "brand")}
        </a>
        <LangSwitcher current={lang} dictionary={dictionary} />
        <p className="mk-footer-note">{t(dictionary, "footer.note")}</p>
      </div>
      <p className="mk-footer-honest">{t(dictionary, "footer.honest")}</p>
    </footer>
  );
}
