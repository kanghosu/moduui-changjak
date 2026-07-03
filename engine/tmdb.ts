// TMDb 연동 — 포스터·영화 검색 (서버 전용)
// 개인/비상업 무료 + 출처 표기 필수. 상업 출시 시 커머셜 계약 필요.

import { promises as fs } from "fs";
import path from "path";

const API = "https://api.themoviedb.org/3";
const IMG = "https://image.tmdb.org/t/p/w342";
const BACKDROP = "https://image.tmdb.org/t/p/w1280";
const CACHE_FILE = path.join(process.cwd(), "engine", "poster-cache.json");

export interface TmdbHit {
  id: number;
  title: string;
  year: string;
  posterUrl: string | null;
  backdropUrl?: string | null; // 가로 스틸 (분석 뷰 배경)
  overview: string;
}

// 라이브러리 제목 → TMDb 검색어 별칭 (분석 파일 제목이 정식 제목과 다른 경우)
const ALIAS: Record<string, string> = {
  "어벤져스04엔드게임": "어벤져스: 엔드게임",
  "변호인 : 작가입장에서의 분석": "변호인",
  "<광해, 왕이 된 남자>": "광해, 왕이 된 남자",
  "신과 함께 - 죄와 벌": "신과함께-죄와 벌",
  "칠번방의선물": "7번방의 선물",
  "어벤져스 [인피니티 워]": "어벤져스: 인피니티 워",
  "겨울왕국1": "겨울왕국",
  "왕의남자": "왕의 남자",
};

// 라이브러리에 연도 기록이 없는 작품의 동명작 오매칭 방지 (예: 아바타 2025 신작)
const YEAR_HINT: Record<string, string> = {
  "아바타": "2009",
  "칠번방의선물": "2013",
  "해운대": "2009",
};

let memCache: Record<string, TmdbHit | null> | null = null;

async function loadCache(): Promise<Record<string, TmdbHit | null>> {
  if (memCache) return memCache;
  try {
    memCache = JSON.parse(await fs.readFile(CACHE_FILE, "utf8"));
  } catch {
    memCache = {};
  }
  return memCache!;
}

async function saveCache() {
  if (!memCache) return;
  try {
    await fs.writeFile(CACHE_FILE, JSON.stringify(memCache, null, 1), "utf8");
  } catch {
    /* dev 편의 캐시 — 실패해도 무시 */
  }
}

// 데모 배포용 기본 키 — 사용자가 노출을 승인함 (개인/비상업 무료 키).
// .env.local의 TMDB_API_KEY가 있으면 그것을 우선 사용.
const DEFAULT_TMDB_KEY = "b622c6c5343734b3c7bd7a877a7468cf";

export async function searchMovie(query: string, year?: string): Promise<TmdbHit[]> {
  const key = process.env.TMDB_API_KEY || DEFAULT_TMDB_KEY;
  if (!key || !query.trim()) return [];
  const url = `${API}/search/movie?api_key=${key}&language=ko-KR&query=${encodeURIComponent(query.trim())}${year ? `&year=${year}` : ""}`;
  try {
    // Next fetch 데이터캐시 사용 안 함 — 실패 응답이 캐시되면 재시도가 막힘 (자체 파일 캐시 사용)
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return [];
    const data = (await res.json()) as { results?: { id: number; title: string; release_date?: string; poster_path?: string | null; backdrop_path?: string | null; overview?: string }[] };
    return (data.results || []).slice(0, 6).map((r) => ({
      id: r.id,
      title: r.title,
      year: (r.release_date || "").slice(0, 4),
      posterUrl: r.poster_path ? IMG + r.poster_path : null,
      backdropUrl: r.backdrop_path ? BACKDROP + r.backdrop_path : null,
      overview: r.overview || "",
    }));
  } catch {
    return [];
  }
}

// 라이브러리 제목의 포스터를 조회 (캐시 우선)
export async function posterFor(libTitle: string, year?: string): Promise<TmdbHit | null> {
  const cache = await loadCache();
  const cached = cache[libTitle];
  if (cached) return cached; // null(과거 실패)은 캐시 미스로 취급해 재시도
  const q = ALIAS[libTitle] || libTitle.replace(/[<>\[\]]/g, "").trim();
  const y = (year || YEAR_HINT[libTitle] || "").slice(0, 4) || undefined;
  let hits = await searchMovie(q, y);
  year = y;
  // 연도 필터가 0건이면(기록 연도와 개봉 연도 불일치 등) 연도 없이 재검색
  if (hits.length === 0 && year) hits = await searchMovie(q);
  // 연도 일치 우선, 없으면 첫 결과
  const best = (year && hits.find((h) => h.year === year)) || hits[0] || null;
  if (best) {
    cache[libTitle] = best; // 성공만 영구 캐시
    await saveCache();
  }
  return best;
}
