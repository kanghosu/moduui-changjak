"use client";

import { useState, type FormEvent } from "react";
import { type Dictionary, type Lang, t } from "@/lib/i18n";

type WaitlistType = "waitlist" | "contact";
type FormStatus = "idle" | "submitting" | "done" | "duplicate" | "error";

type WaitlistFormProps = {
  readonly lang: Lang;
  readonly dictionary: Dictionary;
};

type WaitlistResponse = {
  readonly ok: boolean;
  readonly duplicate?: boolean;
};

function isWaitlistResponse(value: unknown): value is WaitlistResponse {
  if (typeof value !== "object" || value === null || !("ok" in value)) return false;
  return typeof value.ok === "boolean";
}

export function WaitlistForm({ lang, dictionary }: WaitlistFormProps) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [website, setWebsite] = useState("");
  const [type, setType] = useState<WaitlistType>("waitlist");
  const [status, setStatus] = useState<FormStatus>("idle");

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setStatus("submitting");

    try {
      const response = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name, message, type, lang, website }),
      });
      const payload: unknown = await response.json();
      if (!response.ok || !isWaitlistResponse(payload) || !payload.ok) {
        setStatus("error");
        return;
      }
      setStatus(payload.duplicate ? "duplicate" : "done");
    } catch (error) {
      if (error instanceof TypeError || error instanceof SyntaxError) {
        setStatus("error");
        return;
      }
      throw error;
    }
  }

  const feedback = status === "done"
    ? t(dictionary, "form.done")
    : status === "duplicate"
      ? t(dictionary, "form.duplicate")
      : status === "error"
        ? t(dictionary, "form.error")
        : "";

  return (
    <form onSubmit={handleSubmit} className="marketing-waitlist-form grid gap-ds-4 p-ds-5">
      <div className="grid gap-ds-2">
        <label htmlFor="waitlist-email" className="text-ds-label font-semibold text-cinema-sub">
          {t(dictionary, "form.email")}
        </label>
        <input
          id="waitlist-email"
          name="email"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="input marketing-input"
        />
      </div>

      <div className="grid gap-ds-2">
        <label htmlFor="waitlist-name" className="text-ds-label font-semibold text-cinema-sub">
          {t(dictionary, "form.name")}
        </label>
        <input
          id="waitlist-name"
          name="name"
          type="text"
          maxLength={80}
          autoComplete="name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          className="input marketing-input"
        />
      </div>

      <div className="grid gap-ds-2">
        <label htmlFor="waitlist-message" className="text-ds-label font-semibold text-cinema-sub">
          {t(dictionary, "form.message")}
        </label>
        <textarea
          id="waitlist-message"
          name="message"
          maxLength={2000}
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          rows={4}
          className="input marketing-input resize-y"
        />
      </div>

      <div className="grid gap-ds-2" role="group" aria-label="Message type">
        <span className="text-ds-label font-semibold text-cinema-sub">{t(dictionary, "form.typeWaitlist")}</span>
        <div className="flex flex-wrap gap-ds-2">
          <button
            type="button"
            aria-pressed={type === "waitlist"}
            onClick={() => setType("waitlist")}
            className={`${type === "waitlist" ? "btn-amber" : "btn-ghost"} marketing-form-toggle`}
          >
            {t(dictionary, "form.typeWaitlist")}
          </button>
          <button
            type="button"
            aria-pressed={type === "contact"}
            onClick={() => setType("contact")}
            className={`${type === "contact" ? "btn-amber" : "btn-ghost"} marketing-form-toggle`}
          >
            {t(dictionary, "form.typeContact")}
          </button>
        </div>
      </div>

      <div aria-hidden="true" className="sr-only">
        <label htmlFor="waitlist-website">Website</label>
        <input
          id="waitlist-website"
          name="website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={website}
          onChange={(event) => setWebsite(event.target.value)}
        />
      </div>

      <button type="submit" disabled={status === "submitting"} className="btn-amber marketing-form-submit w-full disabled:cursor-not-allowed disabled:opacity-60">
        {type === "contact" ? t(dictionary, "form.contact") : t(dictionary, "form.submit")}
      </button>

      <p
        aria-live="polite"
        className="text-ds-body-sm"
        style={{ color: status === "error" ? "var(--c-danger)" : "var(--c-ok)" }}
      >
        {feedback}
      </p>
    </form>
  );
}
