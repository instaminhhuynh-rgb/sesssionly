"use client";

import { useState } from "react";
import { Card, Segmented, cx } from "@/components/ui";
import { useOverlays } from "@/components/overlays";
import { SERVICES, getSessions } from "@/lib/mock-data";
import { dnum, dow, to12, toMin } from "@/lib/format";

const DAYS = ["2026-06-08", "2026-06-09", "2026-06-10", "2026-06-11", "2026-06-12", "2026-06-13", "2026-06-14"];
const HOURS = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17];

export default function CalendarPage() {
  const { openSession } = useOverlays();
  const [view, setView] = useState<"5day" | "week" | "month">("week");
  const sessions = getSessions();
  const shown = view === "5day" ? DAYS.slice(0, 5) : DAYS;

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Calendar</h1>
          <p className="text-sm text-muted">June 8–14, 2026 · availability blocks reflect your rules &amp; connected calendars</p>
        </div>
        <Segmented<"5day" | "week" | "month"> value={view} onChange={setView} size="sm" options={[{ value: "5day", label: "5-day" }, { value: "week", label: "Week" }, { value: "month", label: "Month" }]} />
      </div>

      <div className="flex flex-wrap items-center gap-3 text-[12px] text-muted">
        {SERVICES.filter((s) => s.active).map((s) => (
          <span key={s.id} className="inline-flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full" style={{ background: s.color }} />{s.name}</span>
        ))}
        <span className="inline-flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-[3px] bg-[#EFEFEC] border border-line" />Unavailable</span>
      </div>

      {view !== "month" ? (
        <Card className="!p-0 overflow-hidden">
          <div className="overflow-x-auto no-scrollbar">
            <div style={{ minWidth: view === "5day" ? 640 : 760 }}>
              <div className="grid border-b border-line" style={{ gridTemplateColumns: `48px repeat(${shown.length},1fr)` }}>
                <div />
                {shown.map((d) => {
                  const isToday = d === "2026-06-09";
                  return (
                    <div key={d} className={cx("px-2 py-2.5 text-center border-l border-line", isToday && "bg-accentSoft")}>
                      <div className="text-[11px] text-faint uppercase">{dow(d)}</div>
                      <div className={cx("text-sm font-semibold", isToday && "text-accent")}>{dnum(d)}</div>
                    </div>
                  );
                })}
              </div>
              <div className="relative grid" style={{ gridTemplateColumns: `48px repeat(${shown.length},1fr)` }}>
                <div className="border-r border-line">{HOURS.map((h) => <div key={h} className="h-14 text-[10px] text-faint text-right pr-1.5 pt-0.5">{to12(h + ":00")}</div>)}</div>
                {shown.map((d) => (
                  <div key={d} className="border-l border-line relative">
                    {HOURS.map((h) => <div key={h} className="h-14 border-b border-[#F1F1EE]" />)}
                    <div className="absolute left-0.5 right-0.5 rounded-[6px] bg-[#F4F4F1] border border-line" style={{ top: (12 - 8) * 56, height: 56 }}><div className="text-[9px] text-faint p-1">Buffer</div></div>
                    {sessions.filter((s) => s.day === d).map((s) => {
                      const top = ((toMin(s.start) - 8 * 60) / 60) * 56;
                      const h = ((toMin(s.end) - toMin(s.start)) / 60) * 56;
                      return (
                        <button key={s.id} onClick={() => openSession(s)} className="absolute left-0.5 right-0.5 rounded-[7px] px-1.5 py-1 text-left overflow-hidden text-white shadow-sm" style={{ top, height: h - 3, background: s.service.color, opacity: s.confirmed ? 1 : 0.65 }}>
                          <div className="text-[10px] font-semibold leading-tight truncate">{s.client.name}</div>
                          <div className="text-[9px] opacity-90 truncate">{to12(s.start)} · {s.service.name}</div>
                          {!s.confirmed && <div className="text-[8px] mt-0.5 bg-white/25 inline-block px-1 rounded">Unconfirmed</div>}
                        </button>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>
      ) : (
        <MonthGrid />
      )}
    </div>
  );
}

function MonthGrid() {
  const cells = Array.from({ length: 30 }, (_, i) => i + 1);
  const counts: Record<number, number> = { 8: 1, 9: 3, 10: 1, 11: 1, 12: 1, 15: 2, 16: 1, 18: 2, 19: 1, 22: 1, 24: 1, 26: 2 };
  const dot = ["#3E5C76", "#5B8266", "#A6794C"];
  return (
    <Card className="!p-0 overflow-hidden">
      <div className="grid grid-cols-7 border-b border-line">
        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => <div key={d} className="text-center text-[11px] text-faint font-medium py-2">{d}</div>)}
      </div>
      <div className="grid grid-cols-7">
        {cells.map((n) => {
          const isToday = n === 9;
          return (
            <div key={n} className={cx("min-h-[78px] border-b border-r border-[#F1F1EE] p-1.5", n % 7 === 0 && "border-r-0")}>
              <div className={cx("text-[12px] font-medium w-6 h-6 flex items-center justify-center rounded-full", isToday && "bg-accent text-white")}>{n}</div>
              {counts[n] && (
                <div className="mt-1 space-y-0.5">
                  {Array.from({ length: Math.min(counts[n], 3) }).map((_, i) => <div key={i} className="h-1.5 rounded-full" style={{ background: dot[i % 3], width: "70%" }} />)}
                  <div className="text-[9px] text-faint">{counts[n]} session{counts[n] > 1 ? "s" : ""}</div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
}
