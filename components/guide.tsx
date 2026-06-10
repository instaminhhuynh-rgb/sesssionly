"use client";

import * as React from "react";
import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { Btn, cx } from "./ui";
import { Icon } from "./icons";

/**
 * Guided welcome tour. A stepped window that explains what each part of
 * Sessionly is for. Shows once on first visit (remembered on the device) and
 * can be reopened anytime from the Help button in the top bar.
 */
const STEPS: { tag: string; title: string; body: string }[] = [
  {
    tag: "Welcome",
    title: "This is your command center",
    body: "Sessionly keeps everything around your appointments in one place: who's coming, who needs attention, who owes you, and who to follow up with. Here's a quick lay of the land.",
  },
  {
    tag: "Today",
    title: "Start your day here",
    body: "Today is your home base. The briefing sums up what needs you first, then shows your next session, anything that needs attention, payments due, and follow-ups waiting to go out.",
  },
  {
    tag: "Clients",
    title: "Everything you remember about a client",
    body: "Each client has their history, your notes, their reviews, and their payments in one record. Open anyone to see the full picture before a session.",
  },
  {
    tag: "Calendar & Services",
    title: "Your schedule and what you offer",
    body: "Calendar shows your week in day, week, or month views. Services is where you set each offering's length, price, deposit, and cancellation rules, which decide how it can be booked.",
  },
  {
    tag: "Payments",
    title: "Stay on top of getting paid",
    body: "See outstanding balances, deposits you're holding, what's been paid, and how your revenue is trending week to week.",
  },
  {
    tag: "Session Score",
    title: "Know which sessions are at risk",
    body: "Open any session to see how ready it is to go ahead. The score is just for you, and it always shows the reasons behind it so you know exactly what to fix.",
  },
  {
    tag: "You're set",
    title: "That's the tour",
    body: "You can reopen this anytime from the question mark in the top bar. Have a look around.",
  },
];

const STORAGE_KEY = "sessionly_guide_seen";
const Ctx = createContext<() => void>(() => {});

export function useGuide(): () => void {
  return useContext(Ctx);
}

export function GuideProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [i, setI] = useState(0);

  const openGuide = useCallback(() => {
    setI(0);
    setOpen(true);
  }, []);

  useEffect(() => {
    try {
      if (!localStorage.getItem(STORAGE_KEY)) {
        const t = setTimeout(() => setOpen(true), 600);
        return () => clearTimeout(t);
      }
    } catch {
      /* localStorage unavailable; just don't auto-open */
    }
  }, []);

  const close = useCallback(() => {
    setOpen(false);
    try {
      localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      /* ignore */
    }
  }, []);

  const step = STEPS[i];
  const last = i === STEPS.length - 1;

  return (
    <Ctx.Provider value={openGuide}>
      {children}
      {open && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/30" onClick={close} />
          <div className="relative bg-surface rounded-[16px] shadow-2xl w-full max-w-md p-6">
            <button onClick={close} className="absolute top-4 right-4 w-7 h-7 rounded-full hover:bg-[#F2F2EF] flex items-center justify-center text-faint hover:text-ink">
              <Icon.x className="w-4 h-4" />
            </button>
            <div className="text-[12px] font-semibold text-accent uppercase tracking-wide">{step.tag}</div>
            <h2 className="text-lg font-semibold mt-1 pr-6">{step.title}</h2>
            <p className="text-[14px] text-muted leading-relaxed mt-2">{step.body}</p>
            <div className="flex items-center justify-between mt-6">
              <div className="flex gap-1.5">
                {STEPS.map((_, k) => (
                  <span key={k} className={cx("w-1.5 h-1.5 rounded-full transition-colors", k === i ? "bg-accent" : "bg-line")} />
                ))}
              </div>
              <div className="flex gap-2 items-center">
                {!last && <button onClick={close} className="text-[13px] text-faint hover:text-ink mr-1">Skip</button>}
                {i > 0 && <Btn size="sm" variant="secondary" onClick={() => setI(i - 1)}>Back</Btn>}
                {last ? <Btn size="sm" onClick={close}>Done</Btn> : <Btn size="sm" onClick={() => setI(i + 1)}>Next</Btn>}
              </div>
            </div>
          </div>
        </div>
      )}
    </Ctx.Provider>
  );
}
