import Image from "next/image";
import { Fragment, type ReactNode } from "react";
import { BlockGrid } from "@/components/marketing/BlockGrid";
import { DeferredTimeline24 } from "@/components/marketing/DeferredTimeline24";
import { DeferredWordToCards } from "@/components/marketing/DeferredWordToCards";
import { LangSwitcher } from "@/components/marketing/LangSwitcher";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import { MarketingScrollProvider } from "@/components/marketing/MarketingScrollProvider";
import { PinSection } from "@/components/marketing/PinSection";
import { ProblemCard } from "@/components/marketing/ProblemCard";
import { ProductFrame } from "@/components/marketing/ProductFrame";
import { Reveal } from "@/components/marketing/Reveal";
import { TurnBackdrop, TurnCopy } from "@/components/marketing/TurnTransition";
import { WaitlistDisclosure } from "@/components/marketing/WaitlistDisclosure";
import { type Dictionary, type Lang, t } from "@/lib/i18n";

type LandingPageProps = {
  readonly lang: Lang;
  readonly dictionary: Dictionary;
};

function renderLines(value: string): ReactNode {
  return value.split("\n").map((line, index) => (
    <Fragment key={`${index}-${line}`}>
      {index > 0 ? <br /> : null}
      {line}
    </Fragment>
  ));
}

function renderDoneHeading(value: string, focus: string): ReactNode {
  return value.split("\n").map((line, index) => {
    const focusStart = line.indexOf(focus);
    const hasFocus = focusStart >= 0;
    const before = hasFocus ? line.slice(0, focusStart) : line;
    const after = hasFocus ? line.slice(focusStart + focus.length) : "";

    return (
      <Fragment key={`${index}-${line}`}>
        {index > 0 ? <br /> : null}
        {before}
        {hasFocus ? <span className="mk-done-word">{focus}<Underline /></span> : null}
        {after}
      </Fragment>
    );
  });
}

function Underline() {
  return (
    <svg className="mk-done-underline" viewBox="0 0 100 12" preserveAspectRatio="none" aria-hidden="true">
      <path d="M2 8C25 2 55 11 98 4" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

export function LandingPage({ lang, dictionary }: LandingPageProps) {
  return (
    <main data-landing={lang} className="marketing-page">
      <MarketingScrollProvider>
        <header className="mk-marketing-nav">
          <a className="mk-wordmark" href={lang === "en" ? "/" : `/${lang}`}>
            {t(dictionary, "brand")}
          </a>
          <div className="mk-nav-tools">
            <a className="mk-nav-try" href="#try">{t(dictionary, "hero.cta")}</a>
            <LangSwitcher current={lang} dictionary={dictionary} />
          </div>
        </header>

        <PinSection id="hero" pinVh={200} tone="stage">
          <div className="mk-hero-backdrop" aria-hidden="true">
            <Image
              src="/marketing/hero-curtain.webp"
              alt=""
              fill
              priority
              fetchPriority="high"
              sizes="100vw"
              data-marketing-img="hero-curtain"
            />
          </div>
          <div className="mk-pin-inner mk-hero-inner">
            <Reveal className="mk-hero-copy">
              <p className="mk-label">{t(dictionary, "brand")}</p>
              <h1 id="hero-heading" className="mk-display-1">{renderLines(t(dictionary, "hero.h"))}</h1>
              <p className="mk-lead">{t(dictionary, "hero.p")}</p>
              <div className="mk-hero-actions">
                <a className="mk-primary-cta" href="/create">{t(dictionary, "hero.cta")}</a>
                <a className="mk-secondary-cta" href="#try">{t(dictionary, "hero.cta2")}</a>
              </div>
            </Reveal>
            <Reveal className="mk-hero-media" delay={1}>
              <ProductFrame asset="shot-create" alt={t(dictionary, "visual.create")} heroMotion />
            </Reveal>
          </div>
        </PinSection>

        <PinSection id="problem" pinVh={150} tone="stage">
          <div className="mk-pin-inner mk-problem-layout">
            <Reveal className="mk-section-copy">
              <h2 className="mk-headline">{renderLines(t(dictionary, "problem.h"))}</h2>
              <p className="mk-lead">{t(dictionary, "problem.p")}</p>
            </Reveal>
            <Reveal className="mk-problem-visual" delay={1}>
              <ProblemCard dictionary={dictionary} />
            </Reveal>
          </div>
        </PinSection>

        <PinSection id="turn" pinVh={200} tone="stage">
          <TurnBackdrop />
          <TurnCopy>
            <div className="mk-pin-inner mk-turn-inner">
              <Reveal className="mk-section-copy">
                <h2 className="mk-headline">{renderLines(t(dictionary, "turn.h"))}</h2>
                <p className="mk-lead">{t(dictionary, "turn.p")}</p>
              </Reveal>
              <DeferredWordToCards dictionary={dictionary} />
            </div>
          </TurnCopy>
        </PinSection>

        <PinSection id="structure" pinVh={250} tone="paper">
          <div className="mk-pin-inner mk-structure-inner">
            <Reveal className="mk-section-copy">
              <h2 className="mk-headline">{renderLines(t(dictionary, "structure.h"))}</h2>
              <p className="mk-lead">{t(dictionary, "structure.p")}</p>
            </Reveal>
            <DeferredTimeline24 dictionary={dictionary} />
          </div>
        </PinSection>

        <PinSection id="library" pinVh={150} tone="paper">
          <div className="mk-pin-inner mk-standard-layout">
            <Reveal className="mk-section-copy">
              <h2 className="mk-headline">{renderLines(t(dictionary, "library.h"))}</h2>
              <p className="mk-lead">{t(dictionary, "library.p")}</p>
            </Reveal>
            <Reveal className="mk-library-visual" delay={1}>
              <div className="mk-library-viewport">
                <ProductFrame asset="shot-explore" alt={t(dictionary, "visual.explore")} pan />
              </div>
              <ProductFrame asset="shot-library" alt={t(dictionary, "visual.library")} className="mk-library-note" />
            </Reveal>
          </div>
        </PinSection>

        <PinSection id="done" pinVh={150} tone="paper">
          <div className="mk-pin-inner mk-done-layout">
            <Reveal className="mk-section-copy">
              <h2 className="mk-headline">{renderDoneHeading(t(dictionary, "done.h"), t(dictionary, "done.focus"))}</h2>
              <p className="mk-lead">{t(dictionary, "done.p")}</p>
            </Reveal>
            <Reveal delay={1}>
              <BlockGrid dictionary={dictionary} />
            </Reveal>
          </div>
        </PinSection>

        <PinSection id="try" pinVh={100} tone="stage">
          <div className="mk-pin-inner mk-try-inner">
            <Reveal className="mk-try-copy">
              <h2 className="mk-display-2">{renderLines(t(dictionary, "try.h"))}</h2>
              <p className="mk-lead">{t(dictionary, "try.p")}</p>
              <a data-cta="try" className="mk-primary-cta mk-try-cta" href="/create">{t(dictionary, "hero.cta")}</a>
              <WaitlistDisclosure lang={lang} dictionary={dictionary} />
            </Reveal>
            <MarketingFooter lang={lang} dictionary={dictionary} />
          </div>
        </PinSection>
      </MarketingScrollProvider>
    </main>
  );
}
