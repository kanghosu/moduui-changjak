import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getConceptHelp } from "@/engine/knowledge";

const ConceptQuerySchema = z.object({
  query: z.string().trim().min(1, "query가 필요합니다.").max(120, "query는 120자 이하로 입력하세요."),
});

function lookup(query: string) {
  const concept = getConceptHelp(query);
  if (!concept) return NextResponse.json({ query, concept: null }, { status: 404 });
  return NextResponse.json({ query, concept });
}

export async function GET(request: NextRequest) {
  const parsed = ConceptQuerySchema.safeParse({ query: request.nextUrl.searchParams.get("q") || "" });
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message || "용어를 입력하세요." }, { status: 400 });
  return lookup(parsed.data.query);
}

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "잘못된 요청 본문입니다." }, { status: 400 });
  }

  const parsed = ConceptQuerySchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message || "용어를 입력하세요." }, { status: 400 });
  return lookup(parsed.data.query);
}
