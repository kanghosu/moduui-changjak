import { NextRequest, NextResponse } from "next/server";
import { searchMovie } from "@/engine/tmdb";

export const runtime = "nodejs";

// GET /api/tmdb?q=... — 영화 검색 자동완성 (동명작 구분용 포스터·연도 포함)
export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q") || "";
  if (!q.trim()) return NextResponse.json({ hits: [] });
  const hits = await searchMovie(q);
  return NextResponse.json({ hits });
}
