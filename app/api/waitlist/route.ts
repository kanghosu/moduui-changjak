import { checkGuard } from "../../../engine/guard.ts";
import { createWaitlistStore } from "../../../engine/waitlist.ts";
import { getDictionary, t, type Lang } from "../../../lib/i18n.ts";
import { waitlistPayloadSchema } from "../../../lib/waitlist-schema.ts";

export const runtime = "nodejs";

/** 폼은 모델을 부르지 않는다. 창작 라우트와 분당 한도를 나눠 쓰면 안 된다. */
const WAITLIST_SCOPE = "waitlist";

function invalidInput(): Response {
  return Response.json({ ok: false, error: "Invalid input." }, { status: 400 });
}

/** 방문자가 읽을 문구는 방문자 언어로 낸다. guard의 한국어 상수를 그대로 흘리지 않는다. */
function localized(lang: Lang, key: string): string {
  return t(getDictionary(lang), key);
}

export async function POST(request: Request): Promise<Response> {
  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch (error) {
    if (error instanceof SyntaxError) return invalidInput();
    throw error;
  }

  const parsed = waitlistPayloadSchema.safeParse(rawBody);
  if (!parsed.success) return invalidInput();

  const payload = parsed.data;
  if (payload.website !== "") return Response.json({ ok: true });

  const guard = await checkGuard(request, payload.email.length + payload.name.length + payload.message.length, {
    consumeDaily: false,
    scope: WAITLIST_SCOPE,
  });
  if (!guard.ok) {
    return Response.json(
      { ok: false, error: localized(payload.lang, "form.rateLimited") },
      { status: guard.status },
    );
  }

  try {
    const result = await createWaitlistStore().add({
      email: payload.email,
      name: payload.name,
      message: payload.message,
      type: payload.type,
      lang: payload.lang,
    });
    return result === "duplicate"
      ? Response.json({ ok: true, duplicate: true })
      : Response.json({ ok: true });
  } catch (error) {
    console.error("Waitlist save failed.", error instanceof Error ? error.message : "unknown error");
    return Response.json({ ok: false, error: localized(payload.lang, "form.error") }, { status: 500 });
  }
}
