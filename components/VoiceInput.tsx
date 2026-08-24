"use client";

// 음성 입력 (Web Speech API) — 크롬/엣지 한국어. 미지원 브라우저에서는 렌더하지 않는다.
// 회의 확정: "말하거나 쓰거나" 둘 다 제공. 서버 비용 0원인 브라우저 STT를 1차로 쓴다.

import { useEffect, useRef, useState } from "react";

interface SpeechRecognitionLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  onresult: ((ev: SpeechRecognitionEventLike) => void) | null;
  onerror: ((ev: { error?: string }) => void) | null;
  onend: (() => void) | null;
}
interface SpeechRecognitionEventLike {
  resultIndex: number;
  results: ArrayLike<{ isFinal: boolean; 0: { transcript: string } }>;
}

function getRecognitionCtor(): (new () => SpeechRecognitionLike) | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as Record<string, unknown>;
  return (w.SpeechRecognition || w.webkitSpeechRecognition) as (new () => SpeechRecognitionLike) | null;
}

export default function VoiceInput({
  onFinalText,
  onListeningChange,
}: {
  onFinalText: (text: string) => void; // 확정된 문장이 나올 때마다 호출 (누적은 부모 몫)
  onListeningChange?: (listening: boolean) => void;
}) {
  const [supported, setSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const [interim, setInterim] = useState("");
  const recRef = useRef<SpeechRecognitionLike | null>(null);
  const wantRef = useRef(false); // 사용자가 켜둔 상태인지 (자동 재시작 판단)

  useEffect(() => {
    setSupported(Boolean(getRecognitionCtor()));
    return () => {
      wantRef.current = false;
      recRef.current?.stop();
    };
  }, []);

  function start() {
    const Ctor = getRecognitionCtor();
    if (!Ctor) return;
    const rec = new Ctor();
    rec.lang = "ko-KR";
    rec.continuous = true;
    rec.interimResults = true;
    rec.onresult = (ev) => {
      let interimText = "";
      for (let i = ev.resultIndex; i < ev.results.length; i++) {
        const r = ev.results[i];
        if (r.isFinal) onFinalText(r[0].transcript.trim() + " ");
        else interimText += r[0].transcript;
      }
      setInterim(interimText);
    };
    rec.onerror = () => {
      // no-speech 등 일시 오류 — 사용자가 켜둔 상태면 onend에서 재시작
    };
    rec.onend = () => {
      setInterim("");
      if (wantRef.current) {
        // 크롬은 일정 시간 무음이면 스스로 끝난다 — 켜둔 동안은 이어서 듣는다
        try { start(); } catch { setListening(false); onListeningChange?.(false); }
      } else {
        setListening(false);
        onListeningChange?.(false);
      }
    };
    recRef.current = rec;
    rec.start();
  }

  function toggle() {
    if (listening) {
      wantRef.current = false;
      recRef.current?.stop();
      setListening(false);
      onListeningChange?.(false);
    } else {
      wantRef.current = true;
      try {
        start();
        setListening(true);
        onListeningChange?.(true);
      } catch {
        setSupported(false);
      }
    }
  }

  if (!supported) return null;

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={toggle}
        className={`flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-sm transition-colors ${
          listening
            ? "border-cinema-amber bg-cinema-amber/15 text-cinema-amber"
            : "border-cinema-line text-cinema-sub hover:border-cinema-amber hover:text-cinema-amber"
        }`}
        title={listening ? "듣기 중지" : "말로 쏟아내기"}
      >
        <span className={`h-2 w-2 rounded-full ${listening ? "animate-pulse bg-cinema-amber" : "bg-cinema-dim"}`} />
        {listening ? "듣는 중… 탭해서 멈추기" : "🎙️ 말로 하기"}
      </button>
      {interim && <span className="max-w-[280px] truncate text-xs text-cinema-dim">“{interim}”</span>}
    </div>
  );
}
