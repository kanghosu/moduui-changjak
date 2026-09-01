import {
  type CreationSession,
  type ElementConfidence,
  type ElementKey,
  type ExtractedElement,
  type ExtractedElements,
} from "../../engine/creation.ts";

const EXPLICIT_UNKNOWN = /^없(음|어요?)$/;

export type ElementStatus = "confirmed" | "unknown" | "empty";

export interface ProfileElementState {
  readonly key: ElementKey;
  readonly label: string;
  readonly status: ElementStatus;
  readonly value: string;
  readonly confidence: ElementConfidence | null;
  readonly isAiGuess: boolean;
}

export interface WorkProgressDefinition {
  readonly key: ElementKey;
  readonly label: string;
}

export type WorkProgressState = ProfileElementState;

export interface HighlightedSegment {
  readonly text: string;
  readonly highlighted: boolean;
}

export function profileElementsFromSession(session: CreationSession): ExtractedElements {
  const elements: ExtractedElements = { ...session.elements };

  for (const question of session.questions) {
    const rawAnswer = session.answers[question.id];
    if (rawAnswer === undefined) continue;

    const answer = rawAnswer.trim();
    if (!answer) continue;

    const unknown = EXPLICIT_UNKNOWN.test(answer);
    elements[question.elementKey] = {
      value: unknown ? "" : answer,
      confidence: "high",
      evidence: rawAnswer,
      ...(unknown ? { unknown: true } : {}),
      source: "user",
    };
  }

  return elements;
}

export function classifyElement(element: ExtractedElement | undefined): ElementStatus {
  if (element?.unknown === true) return "unknown";
  if (element?.value.trim()) return "confirmed";
  return "empty";
}

export function profileElementState(input: {
  readonly key: ElementKey;
  readonly label: string;
  readonly element: ExtractedElement | undefined;
}): ProfileElementState {
  const status = classifyElement(input.element);
  return {
    key: input.key,
    label: input.label,
    status,
    value: status === "confirmed" ? input.element?.value.trim() ?? "" : "",
    confidence: input.element?.confidence ?? null,
    isAiGuess: status === "confirmed" && input.element?.confidence === "low",
  };
}

export function deriveWorkProgress(
  elements: ExtractedElements,
  definitions: readonly WorkProgressDefinition[],
): readonly WorkProgressState[] {
  return definitions.map((definition) => profileElementState({
    key: definition.key,
    label: definition.label,
    element: elements[definition.key],
  }));
}

export function highlightLogline(
  logline: string,
  answers: readonly string[],
): readonly HighlightedSegment[] {
  if (!logline) return [];

  const phrases = [...new Set(answers
    .map((answer) => answer.trim())
    .filter((answer) => answer && !EXPLICIT_UNKNOWN.test(answer)))]
    .sort((a, b) => b.length - a.length);
  if (phrases.length === 0) return [{ text: logline, highlighted: false }];

  const segments: HighlightedSegment[] = [];
  let cursor = 0;
  while (cursor < logline.length) {
    let matchIndex = logline.length;
    let matchPhrase = "";
    for (const phrase of phrases) {
      const index = logline.indexOf(phrase, cursor);
      if (index < 0) continue;
      if (index < matchIndex || (index === matchIndex && phrase.length > matchPhrase.length)) {
        matchIndex = index;
        matchPhrase = phrase;
      }
    }

    if (!matchPhrase) {
      segments.push({ text: logline.slice(cursor), highlighted: false });
      break;
    }
    if (matchIndex > cursor) segments.push({ text: logline.slice(cursor, matchIndex), highlighted: false });
    segments.push({ text: matchPhrase, highlighted: true });
    cursor = matchIndex + matchPhrase.length;
  }

  return segments;
}
