import type { Metadata } from "next";
import { DesignPreview } from "@/components/DesignPreview";

export const metadata: Metadata = {
  title: "디자인 시스템 프리뷰 | 모두의 창작",
  description: "모두의 창작 P1 디자인 토큰과 컴포넌트 상태 프리뷰",
};

export default function DesignPage() {
  return <DesignPreview />;
}
