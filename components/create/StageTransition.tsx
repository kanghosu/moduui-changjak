"use client";

import type { ReactNode } from "react";
import type { CreationSession } from "@/engine/creation";

export interface StageTransitionProps {
  readonly stage: CreationSession["stage"];
  readonly children: ReactNode;
}

export function StageTransition({ children, stage }: StageTransitionProps) {
  return (
    <div className="stage-transition-enter" data-stage={stage}>
      {children}
      <style jsx>{`
        .stage-transition-enter {
          animation: stage-transition-enter var(--duration-standard) ease-in-out both;
        }

        @keyframes stage-transition-enter {
          from {
            opacity: 0;
            transform: translateY(var(--space-1));
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .stage-transition-enter {
            animation: none;
          }
        }
      `}</style>
    </div>
  );
}
