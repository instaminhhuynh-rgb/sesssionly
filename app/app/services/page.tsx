"use client";

import { useState } from "react";
import { Btn, Card, Pill } from "@/components/ui";
import { Icon } from "@/components/icons";
import { useToast } from "@/components/toast";
import { getServices } from "@/lib/mock-data";

interface ServiceDraft {
  name: string;
  duration: number;
  price: number;
  deposit: number;
  intake: boolean;
  cancelWindow: number;
  policy: string;
  source: "ai" | "template";
  model?: string;
}

export default function ServicesPage() {
  const toast = useToast();
  const [open, setOpen] = useState<string | null>(null);
  const services = getServices();

  // Build with AI
  const [showBuilder, setShowBuilder] = useState(false);
  const [desc, setDesc] = useState("");
  const [draft, setDraft] = useState<ServiceDraft | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function build() {
    if (!desc.trim()) return;
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch("/api/service-builder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: desc }),
      });
      const data = await res.json();
      if (!res.ok || data.error) setErr(data.error || "Build failed.");
      else setDraft(data as ServiceDraft);
    } catch {
      setErr("Could not reach the service builder.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Services</h1>
          <p className="text-sm text-muted">Duration, price, deposits, intake, and policies. These shape how each service can be booked.</p>
        </div>
        <Btn onClick={() => setShowBuilder((v) => !v)}><Icon.plus className="w-4 h-4" />Quick build</Btn>
      </div>

      {showBuilder && (
        <Card className="!p-4">
          {!draft ? (
            <>
              <div className="text-[13px] font-medium mb-2">Describe the service in plain words</div>
              <textarea
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
                rows={3}
                placeholder="e.g. A 90-minute strategy intensive for founders, $320, $100 deposit, 48-hour cancellation, intake required"
                className="inp !text-[13px] resize-none"
              />
              {err && <p className="text-[12px] text-bad mt-2">{err}</p>}
              <div className="flex gap-2 mt-2.5">
                <Btn variant="secondary" onClick={() => { setShowBuilder(false); setDesc(""); setErr(null); }}>Cancel</Btn>
                <Btn onClick={build}><Icon.pencil className="w-4 h-4" />{loading ? "Building…" : "Generate service"}</Btn>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center gap-2 mb-3">
                <Pill tone="neutral">Draft</Pill>
                <span className="text-[12px] text-faint">Review and save</span>
              </div>
              <div className="font-semibold text-[15px]">{draft.name}</div>
              <div className="text-[13px] text-muted mt-0.5">
                {draft.duration} min · {draft.price ? `$${draft.price}` : "Free"}{draft.deposit ? ` · $${draft.deposit} deposit` : ""}
              </div>
              <div className="flex gap-1.5 mt-2">
                {draft.intake && <Pill tone="info">Intake required</Pill>}
                <Pill tone="neutral">{draft.cancelWindow}h cancel window</Pill>
              </div>
              <div className="mt-3">
                <div className="text-[11px] font-semibold text-faint uppercase mb-1">Policy</div>
                <p className="text-[13px] text-ink/90">{draft.policy}</p>
              </div>
              <div className="flex gap-2 mt-3">
                <Btn variant="secondary" onClick={() => setDraft(null)}>Start over</Btn>
                <Btn onClick={() => { toast(`Saved “${draft.name}”`); setShowBuilder(false); setDraft(null); setDesc(""); }}>Save service</Btn>
              </div>
            </>
          )}
        </Card>
      )}

      <div className="grid sm:grid-cols-2 gap-3">
        {services.map((s) => (
          <Card key={s.id} className="!p-0 overflow-hidden">
            <button onClick={() => setOpen(open === s.id ? null : s.id)} className="w-full text-left">
              <div className="p-4 flex items-start gap-3">
                <div className="w-1.5 self-stretch rounded-full" style={{ background: s.color }} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2"><span className="font-semibold">{s.name}</span>{!s.active && <Pill>Inactive</Pill>}</div>
                  <div className="text-[13px] text-muted mt-0.5">{s.duration} min · {s.price ? `$${s.price}` : "Free"}{s.deposit ? ` · $${s.deposit} deposit` : ""}</div>
                  <div className="flex gap-1.5 mt-2">{s.intake && <Pill tone="info">Intake required</Pill>}<Pill tone="neutral">{s.cancelWindow}h cancel window</Pill></div>
                </div>
                <div className="text-right"><div className="text-[11px] text-faint">Booked</div><div className="text-sm font-semibold">{s.bookings}</div></div>
              </div>
            </button>
            {open === s.id && (
              <div className="px-4 pb-4 pt-1 border-t border-line bg-[#FAFAF8] space-y-3">
                <div><div className="text-[11px] font-semibold text-faint uppercase mb-1">Policy</div><p className="text-[13px] text-ink/90">{s.policy}</p></div>
                <div className="flex gap-2">
                  <Btn size="sm" variant="secondary" onClick={() => toast(`Editing ${s.name}`)}>Edit service</Btn>
                  <Btn size="sm" variant="secondary" onClick={() => toast("Booking link copied")}>Copy booking link</Btn>
                </div>
              </div>
            )}
          </Card>
        ))}
        <button onClick={() => setShowBuilder(true)} className="border border-dashed border-line rounded-xl2 p-4 flex items-center justify-center gap-2 text-muted hover:bg-[#FAFAF8] hover:text-ink min-h-[110px]"><Icon.plus className="w-4 h-4" />Create a new service</button>
      </div>
    </div>
  );
}
