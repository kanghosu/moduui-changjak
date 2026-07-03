/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Vercel 서버리스 번들은 정적 import만 자동 추적한다.
  // /api/benchmark, /api/suggest, /api/generate가 fs.readdir/readFile로 동적으로 읽는
  // 폴더들은 명시적으로 포함시켜야 배포본에서도 파일을 찾는다 (안 하면 AI 분석 76편이 조용히 사라짐).
  experimental: {
    outputFileTracingIncludes: {
      "/api/benchmark": ["./engine/ai-library/**/*", "./engine/poster-cache.json"],
      "/api/suggest": ["./knowledge/method/**/*", "./engine/ai-library/**/*"],
      "/api/generate": [
        "./knowledge/method/**/*",
        "./skills/**/*",
        "./.claude/agents/**/*",
        "./engine/prompts/**/*",
      ],
    },
  },
};

export default nextConfig;
