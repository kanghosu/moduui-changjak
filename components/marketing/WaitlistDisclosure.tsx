"use client";

import { useState } from "react";
import { WaitlistForm } from "@/components/marketing/WaitlistForm";
import { type Dictionary, type Lang, t } from "@/lib/i18n";

type WaitlistDisclosureProps = {
  readonly lang: Lang;
  readonly dictionary: Dictionary;
};

export function WaitlistDisclosure({ lang, dictionary }: WaitlistDisclosureProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="mk-waitlist-block">
      <button
        type="button"
        data-toggle="waitlist"
        aria-expanded={open}
        aria-controls="waitlist-panel"
        onClick={() => setOpen((current) => !current)}
        className="mk-waitlist-toggle"
      >
        {t(dictionary, "form.toggle")}
      </button>
      <div
        id="waitlist-panel"
        data-waitlist-panel="true"
        data-open={open ? "true" : "false"}
        aria-hidden={!open}
        className="mk-waitlist-panel"
      >
        <WaitlistForm lang={lang} dictionary={dictionary} />
      </div>
    </div>
  );
}
