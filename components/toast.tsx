"use client";

import * as React from "react";
import { createContext, useCallback, useContext, useState } from "react";

/**
 * Minimal toast system. `useToast()` returns a function you call with a short
 * confirmation message. Used to give the demo's action buttons real feedback.
 */
type Toast = { id: number; msg: string };
const Ctx = createContext<(msg: string) => void>(() => {});

export function useToast(): (msg: string) => void {
  return useContext(Ctx);
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toast = useCallback((msg: string) => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, msg }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 2600);
  }, []);

  return (
    <Ctx.Provider value={toast}>
      {children}
      <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-[60] flex flex-col items-center gap-2 pointer-events-none">
        {toasts.map((t) => (
          <div key={t.id} className="pointer-events-auto bg-ink text-white text-[13px] font-medium pl-3 pr-4 h-10 rounded-[10px] shadow-lg flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-white/15 flex items-center justify-center shrink-0">
              <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.4}>
                <path d="m5 12 5 5L20 6" />
              </svg>
            </span>
            {t.msg}
          </div>
        ))}
      </div>
    </Ctx.Provider>
  );
}
