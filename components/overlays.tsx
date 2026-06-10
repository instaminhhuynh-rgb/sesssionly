"use client";

import * as React from "react";
import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { Avatar, Btn, Card, Empty, Pill, ScoreRing, Segmented, Star, Toggle, cx } from "./ui";
import { Icon } from "./icons";
import { useToast } from "./toast";
import { HostAvatar, readImageScaled } from "./profile";
import { HOST, SERVICES, getService, getSessionsForClient } from "@/lib/mock-data";
import { fmtDay, to12 } from "@/lib/format";
import { detectLocation, mapsUrl, appleMapsUrl, wazeUrl, smsHref, isUrl, type LocationType } from "@/lib/location";
import { scoreReasons, scoreBand } from "@/lib/session-score";

/** Shape returned by POST /api/session-score (kept local so no server module is imported into the client bundle). */
interface AiScore {
  score: number;
  band: "good" | "warn" | "bad";
  reasons: { positive: string[]; negative: string[] };
  recommendations: string[];
  source: "ai" | "heuristic";
  model?: string;
}

type FollowUpKind = "recap" | "review" | "rebook" | "renewal";
/** Shape returned by POST /api/follow-up. */
interface FollowUpDraft {
  kind: FollowUpKind;
  subject: string | null;
  body: string;
  channel: "email" | "sms";
  source: "ai" | "template";
  model?: string;
}
import type { Client, ClientTag, ClientPayment, Review, EnrichedSession } from "@/lib/types";

/* ------------------------- overlay context ------------------------- */
interface OverlayApi {
  openInvite: (toName?: string) => void;
  openSession: (s: EnrichedSession) => void;
  openClient: (c: Client) => void;
}
const Ctx = createContext<OverlayApi | null>(null);
export function useOverlays(): OverlayApi {
  const v = useContext(Ctx);
  if (!v) throw new Error("useOverlays must be used inside <OverlayProvider>");
  return v;
}

export function OverlayProvider({ children }: { children: React.ReactNode }) {
  const [invite, setInvite] = useState<{ to?: string } | null>(null);
  const [session, setSession] = useState<EnrichedSession | null>(null);
  const [client, setClient] = useState<Client | null>(null);

  const api = useMemo<OverlayApi>(
    () => ({
      openInvite: (toName) => setInvite({ to: toName }),
      openSession: (s) => setSession(s),
      openClient: (c) => setClient(c),
    }),
    [],
  );

  return (
    <Ctx.Provider value={api}>
      {children}
      {invite && <SmartInvite toName={invite.to} onClose={() => setInvite(null)} />}
      {session && <SessionDetail session={session} onClose={() => setSession(null)} onOpenClient={(c) => { setSession(null); setClient(c); }} />}
      {client && <ClientDetail client={client} onClose={() => setClient(null)} onOpenSession={(s) => { setClient(null); setSession(s); }} />}
    </Ctx.Provider>
  );
}

/* ------------------------------ Drawer ----------------------------- */
function Drawer({ children, onClose, title, footer, wide }: { children: React.ReactNode; onClose: () => void; title: string; footer?: React.ReactNode; wide?: boolean }) {
  useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", k);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", k);
      document.body.style.overflow = "";
    };
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/25" onClick={onClose} />
      <div className={cx("absolute bg-surface shadow-2xl flex flex-col inset-x-0 bottom-0 rounded-t-[20px] max-h-[92vh] sm:inset-y-0 sm:right-0 sm:left-auto sm:rounded-t-none sm:rounded-l-[20px] w-full", wide ? "sm:w-[760px]" : "sm:w-[440px]")}>
        <div className="flex items-center justify-between px-5 h-14 border-b border-line shrink-0">
          <span className="font-semibold">{title}</span>
          <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-[#F2F2EF] flex items-center justify-center text-muted">
            <Icon.x className="w-4 h-4" />
          </button>
        </div>
        <div className="overflow-y-auto p-5 flex-1">{children}</div>
        {footer && <div className="px-5 py-3.5 border-t border-line bg-[#FCFCFA] shrink-0">{footer}</div>}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-[12px] font-semibold text-faint uppercase block mb-1.5">{label}</label>
      {children}
    </div>
  );
}
function Row({ label, desc, children }: { label: string; desc?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="min-w-0">
        <div className="text-[14px] font-medium">{label}</div>
        {desc && <div className="text-[12px] text-muted">{desc}</div>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

/* --------------------------- Smart Invite -------------------------- */
function SmartInvite({ toName, onClose }: { toName?: string; onClose: () => void }) {
  const [serviceId, setServiceId] = useState("svc_1on1");
  const [recipient, setRecipient] = useState(toName || "Sarah Mitchell");
  const [channels, setChannels] = useState({ email: true, sms: true, custom: false });
  const [customCh, setCustomCh] = useState("WhatsApp");
  const [reqDeposit, setReqDeposit] = useState(true);
  const [reqIntake, setReqIntake] = useState(true);
  const [reqConfirm, setReqConfirm] = useState(true);
  const [msg, setMsg] = useState("");
  const s = getService(serviceId)!;
  const toast = useToast();
  const [aiLoading, setAiLoading] = useState(false);

  async function writeWithAI() {
    setAiLoading(true);
    try {
      const res = await fetch("/api/smart-invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipient, serviceId, reqDeposit, reqIntake }),
      });
      const data = await res.json();
      if (res.ok && data.body) setMsg(data.body);
    } catch {
      /* keep the client-side draft on failure */
    } finally {
      setAiLoading(false);
    }
  }

  const generated = useMemo(() => {
    const first = recipient.split(" ")[0] || "there";
    return [
      `Hi ${first}, I'd love to get our next ${s.name.toLowerCase()} on the calendar.`,
      `Here are a few times that work on my end:`,
      `  • Thu Jun 11, 10:30 AM`,
      `  • Fri Jun 12, 1:00 PM`,
      `  • Mon Jun 15, 9:00 AM`,
      reqDeposit && s.deposit ? `A $${s.deposit} deposit holds your spot (applied to the $${s.price} total).` : null,
      reqIntake ? `There's a quick intake so I can prepare — takes 2 minutes.` : null,
      `Pick a time here: sessionly.com/${HOST.slug}/invite\n\n${HOST.firstName}`,
    ]
      .filter(Boolean)
      .join("\n");
  }, [recipient, reqDeposit, reqIntake, s]);

  const text = msg || generated;
  const ch = (k: keyof typeof channels) => setChannels((o) => ({ ...o, [k]: !o[k] }));

  return (
    <Drawer
      title="Smart Invite"
      onClose={onClose}
      wide
      footer={
        <div className="flex items-center justify-between gap-2">
          <span className="text-[12px] text-faint hidden sm:block">A personal invite with hand-picked times. Warmer than a cold link.</span>
          <div className="flex gap-2 w-full sm:w-auto">
            <Btn variant="secondary" className="flex-1 sm:flex-none" onClick={onClose}>Cancel</Btn>
            <Btn className="flex-1 sm:flex-none" onClick={() => { toast(`Invite sent to ${recipient}`); onClose(); }}><Icon.invite className="w-4 h-4" />Send invite</Btn>
          </div>
        </div>
      }
    >
      <div className="grid md:grid-cols-2 gap-5">
        <div className="space-y-4">
          <Field label="Recipient"><input value={recipient} onChange={(e) => setRecipient(e.target.value)} className="inp" /></Field>
          <Field label="Service">
            <select value={serviceId} onChange={(e) => setServiceId(e.target.value)} className="inp">
              {SERVICES.filter((x) => x.active).map((x) => (
                <option key={x.id} value={x.id}>{x.name} · {x.price ? `$${x.price}` : "Free"}</option>
              ))}
            </select>
          </Field>
          <div>
            <div className="text-[12px] font-semibold text-faint uppercase mb-2">Rules</div>
            <div className="space-y-2.5">
              <Row label="Require deposit" desc={s.deposit ? `$${s.deposit} holds the spot` : "No deposit on this service"}><Toggle on={reqDeposit && !!s.deposit} onClick={() => setReqDeposit((v) => !v)} /></Row>
              <Row label="Require intake form"><Toggle on={reqIntake} onClick={() => setReqIntake((v) => !v)} /></Row>
              <Row label="Require confirmation" desc="Reduces no-shows"><Toggle on={reqConfirm} onClick={() => setReqConfirm((v) => !v)} /></Row>
            </div>
          </div>
          <div>
            <div className="text-[12px] font-semibold text-faint uppercase mb-2">Send via</div>
            <div className="flex flex-wrap gap-2">
              {(["email", "sms"] as const).map((k) => (
                <button key={k} onClick={() => ch(k)} className={cx("px-3 h-9 rounded-[10px] border text-sm font-medium capitalize", channels[k] ? "border-accent bg-accentSoft text-accent" : "border-line text-muted")}>{k}</button>
              ))}
              <button onClick={() => ch("custom")} className={cx("px-3 h-9 rounded-[10px] border text-sm font-medium", channels.custom ? "border-accent bg-accentSoft text-accent" : "border-line text-muted")}>+ Custom channel</button>
            </div>
            {channels.custom && <input value={customCh} onChange={(e) => setCustomCh(e.target.value)} placeholder="Channel name (e.g. WhatsApp, iMessage)" className="inp mt-2" />}
          </div>
          <Field label="Message">
            <div className="flex items-center justify-between mb-1.5 gap-2">
              <div className="flex items-center gap-1.5 min-w-0">
                <Pill tone="info">Editable draft</Pill>
                {msg && <button onClick={() => setMsg("")} className="text-[12px] text-accent">Reset</button>}
              </div>
              <Btn size="sm" variant="secondary" onClick={writeWithAI}><Icon.pencil className="w-4 h-4" />{aiLoading ? "Drafting…" : "Draft message"}</Btn>
            </div>
            <textarea value={text} onChange={(e) => setMsg(e.target.value)} rows={7} className="inp font-mono text-[12px] leading-relaxed resize-none" />
          </Field>
        </div>

        <div className="md:sticky md:top-0">
          <div className="text-[12px] font-semibold text-faint uppercase mb-2">Live preview</div>
          <div className="rounded-[14px] border border-line bg-[#FAFAF8] p-4">
            <div className="flex items-center gap-2 mb-3">
              {channels.email && <Pill tone="neutral">Email</Pill>}
              {channels.sms && <Pill tone="neutral">SMS</Pill>}
              {channels.custom && <Pill tone="neutral">{customCh}</Pill>}
            </div>
            <div className="bg-white rounded-[12px] border border-line p-4 shadow-sm">
              <div className="flex items-center gap-2.5 pb-3 border-b border-line">
                <HostAvatar size={36} />
                <div><div className="text-sm font-semibold">{HOST.firstName} {HOST.lastName}</div><div className="text-[11px] text-faint">{HOST.business}</div></div>
              </div>
              <pre className="whitespace-pre-wrap text-[13px] leading-relaxed text-ink/90 mt-3 font-sans">{text}</pre>
              <div className="mt-3">
                <div className="w-full h-10 rounded-[10px] bg-ink text-white text-sm font-medium flex items-center justify-center">Choose a time</div>
                {reqDeposit && s.deposit ? <div className="text-[11px] text-faint text-center mt-2">Secured by a ${s.deposit} deposit · {s.cancelWindow}h cancellation</div> : null}
              </div>
            </div>
            <div className="mt-3 text-[12px] text-muted">A fallback booking link is included in case none of the times work.</div>
          </div>
        </div>
      </div>
    </Drawer>
  );
}

/* -------------------------- Session detail ------------------------- */
function StateCard({ ok, label, okText, badText }: { ok: boolean; label: string; okText: string; badText: string }) {
  return (
    <div className={cx("rounded-[10px] border p-2.5 text-center", ok ? "border-[#C9EBD4] bg-[#F4FBF6]" : "border-[#FAD1D6] bg-[#FFF7F8]")}>
      <div className={cx("text-[13px] font-semibold", ok ? "text-good" : "text-bad")}>{ok ? okText : badText}</div>
      <div className="text-[11px] text-faint">{label}</div>
    </div>
  );
}

function SessionDetail({ session: s, onClose, onOpenClient }: { session: EnrichedSession; onClose: () => void; onOpenClient: (c: Client) => void }) {
  const base = scoreReasons(s);
  const toast = useToast();
  const [prep, setPrep] = useState(s.prep);
  const [ai, setAi] = useState<AiScore | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // Location & directions.
  const initLoc = detectLocation(s.location);
  const [locType, setLocType] = useState<LocationType>(initLoc.type);
  const [locValue, setLocValue] = useState(initLoc.value);
  const [editLoc, setEditLoc] = useState(false);
  function copyLoc() {
    try { navigator.clipboard.writeText(locValue); toast("Copied"); } catch { toast("Copy failed"); }
  }

  // Live values come from the agent once it has run; otherwise the seeded score.
  const score = ai?.score ?? s.score;
  const pos = ai?.reasons.positive ?? base.pos;
  const neg = ai?.reasons.negative ?? base.neg;
  const band = scoreBand(score);
  const recs = ai?.recommendations ?? [];

  async function reScore() {
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch("/api/session-score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId: s.id }),
      });
      const data = await res.json();
      if (!res.ok || data.error) setErr(data.error || "Scoring failed.");
      else setAi(data as AiScore);
    } catch {
      setErr("Could not reach the scoring agent.");
    } finally {
      setLoading(false);
    }
  }

  // --- Follow-Up agent (After the session) ---
  const [fu, setFu] = useState<FollowUpDraft | null>(null);
  const [fuKind, setFuKind] = useState<FollowUpKind | null>(null);
  const [fuLoading, setFuLoading] = useState(false);
  const [fuErr, setFuErr] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function draftFollowUp(kind: FollowUpKind) {
    setFuKind(kind);
    setFuLoading(true);
    setFuErr(null);
    setSent(false);
    try {
      const res = await fetch("/api/follow-up", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId: s.id, kind }),
      });
      const data = await res.json();
      if (!res.ok || data.error) setFuErr(data.error || "Draft failed.");
      else setFu(data as FollowUpDraft);
    } catch {
      setFuErr("Could not reach the follow-up agent.");
    } finally {
      setFuLoading(false);
    }
  }

  return (
    <Drawer
      title="Session"
      onClose={onClose}
      footer={
        <div className="flex gap-2 w-full">
          <Btn variant="secondary" className="flex-1" onClick={() => toast(`Reschedule link sent to ${s.client.name}`)}>Reschedule</Btn>
          {s.confirmed
            ? <Btn className="flex-1" onClick={() => toast("Starting session…")}>Start session</Btn>
            : <Btn className="flex-1" onClick={() => toast(`Confirmation requested from ${s.client.name}`)}>Request confirmation</Btn>}
        </div>
      }
    >
      <div className="flex items-center gap-3.5 mb-5">
        <div className="w-1.5 self-stretch rounded-full" style={{ background: s.service.color }} />
        <Avatar initials={s.client.initials} color={s.client.color} photo={s.client.photo} size={48} />
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-lg">{s.client.name}</div>
          <div className="text-[13px] text-muted">{s.service.name} · {fmtDay(s.day)} · {to12(s.start)} to {to12(s.end)}</div>
        </div>
      </div>

      <Card className="!p-4 mb-4">
        <div className="flex items-start gap-3.5">
          <ScoreRing score={score} size={60} stroke={6} />
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <span className="font-semibold">Session Score</span>
              <Btn size="sm" variant="secondary" onClick={reScore}>
                <Icon.refresh className="w-4 h-4" />{loading ? "Updating…" : ai ? "Update" : "Update score"}
              </Btn>
            </div>
            <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
              <Pill tone="info">Host-only</Pill>
            </div>
            <p className="text-[12px] text-muted mt-1.5">{band === "good" ? "Low risk. Well prepared." : band === "warn" ? "Some gaps to close before this runs." : "High risk. Protect this session."}</p>
          </div>
        </div>

        {err && <p className="text-[12px] text-bad mt-2">{err}</p>}

        <div className="mt-4 space-y-1.5">
          {pos.map((p, i) => (
            <div key={`p${i}`} className="flex items-start gap-2 text-[13px]"><span className="w-4 h-4 mt-0.5 shrink-0 rounded-full bg-goodSoft text-good flex items-center justify-center"><Icon.check className="w-3 h-3" /></span><span className="text-ink/85">{p}</span></div>
          ))}
          {neg.map((n, i) => (
            <div key={`n${i}`} className="flex items-start gap-2 text-[13px]"><span className="w-4 h-4 mt-0.5 shrink-0 rounded-full bg-badSoft text-bad flex items-center justify-center"><Icon.x className="w-2.5 h-2.5" /></span><span className="text-ink/85">{n}</span></div>
          ))}
        </div>

        {recs.length > 0 ? (
          <div className="mt-3 pt-3 border-t border-line">
            <div className="text-[11px] font-semibold text-faint uppercase mb-1.5">Recommended actions</div>
            <ul className="space-y-1">
              {recs.map((r, i) => (
                <li key={i} className="flex items-start gap-2 text-[13px] text-ink/85"><span className="text-accent mt-0.5 shrink-0">→</span><span>{r}</span></li>
              ))}
            </ul>
          </div>
        ) : neg.length > 0 ? (
          <div className="mt-3 pt-3 border-t border-line flex flex-wrap gap-1.5">
            {!s.depositPaid && <Btn size="sm" variant="secondary" onClick={() => toast(`Deposit requested from ${s.client.name}`)}>Require deposit</Btn>}
            {!s.intakeDone && <Btn size="sm" variant="secondary" onClick={() => toast(`Intake resent to ${s.client.name}`)}>Resend intake</Btn>}
            {!s.confirmed && <Btn size="sm" variant="secondary" onClick={() => toast(`Confirmation requested from ${s.client.name}`)}>Request confirmation</Btn>}
          </div>
        ) : null}

        {ai && <p className="text-[11px] text-faint mt-3">Updated just now</p>}
      </Card>

      <Card className="!p-4 mb-4">
        <div className="flex items-center justify-between mb-2">
          <div className="text-[12px] font-semibold text-faint uppercase">Location</div>
          <button onClick={() => setEditLoc((v) => !v)} className="text-[12px] text-accent font-medium">{editLoc ? "Done" : "Edit"}</button>
        </div>
        {editLoc ? (
          <div className="space-y-2">
            <Segmented<LocationType> size="sm" value={locType} onChange={setLocType} options={[{ value: "inperson", label: "In person" }, { value: "virtual", label: "Virtual" }, { value: "phone", label: "Phone" }]} />
            <input value={locValue} onChange={(e) => setLocValue(e.target.value)} placeholder={locType === "inperson" ? "Street address" : locType === "virtual" ? "Video link (Zoom, Meet…)" : "Phone number"} className="inp !text-[13px]" />
            <div className="flex justify-end"><Btn size="sm" onClick={() => { setEditLoc(false); toast("Location saved"); }}>Save</Btn></div>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2 mb-2.5">
              <Pill tone={locType === "inperson" ? "info" : "neutral"}>{locType === "inperson" ? "In person" : locType === "virtual" ? "Virtual" : "Phone"}</Pill>
              <span className="text-[13px] text-ink/90 truncate">{locValue || "No location set"}</span>
            </div>
            {locValue && locType === "inperson" && (
              <div className="flex flex-wrap gap-1.5">
                <a href={mapsUrl(locValue)} target="_blank" rel="noreferrer" className="inline-flex items-center h-8 px-3 rounded-[10px] text-[13px] font-medium bg-ink text-white hover:bg-black">Open in Maps</a>
                <a href={appleMapsUrl(locValue)} target="_blank" rel="noreferrer" className="inline-flex items-center h-8 px-3 rounded-[10px] text-[13px] font-medium bg-white text-ink border border-line hover:bg-[#FAFAF8]">Apple</a>
                <a href={wazeUrl(locValue)} target="_blank" rel="noreferrer" className="inline-flex items-center h-8 px-3 rounded-[10px] text-[13px] font-medium bg-white text-ink border border-line hover:bg-[#FAFAF8]">Waze</a>
                <Btn size="sm" variant="secondary" onClick={copyLoc}>Copy</Btn>
                <a href={smsHref(`Address for our session: ${locValue}\nDirections: ${mapsUrl(locValue)}`)} className="inline-flex items-center h-8 px-3 rounded-[10px] text-[13px] font-medium bg-white text-ink border border-line hover:bg-[#FAFAF8]">Text to client</a>
              </div>
            )}
            {locValue && locType === "virtual" && (
              <div className="flex flex-wrap gap-1.5">
                {isUrl(locValue) && <a href={locValue} target="_blank" rel="noreferrer" className="inline-flex items-center h-8 px-3 rounded-[10px] text-[13px] font-medium bg-ink text-white hover:bg-black">Open link</a>}
                <Btn size="sm" variant="secondary" onClick={copyLoc}>Copy link</Btn>
                <a href={smsHref(`Here's the link for our session: ${locValue}`)} className="inline-flex items-center h-8 px-3 rounded-[10px] text-[13px] font-medium bg-white text-ink border border-line hover:bg-[#FAFAF8]">Text to client</a>
              </div>
            )}
            {locValue && locType === "phone" && (
              <div className="flex flex-wrap gap-1.5">
                <a href={`tel:${locValue.replace(/[^+\d]/g, "")}`} className="inline-flex items-center h-8 px-3 rounded-[10px] text-[13px] font-medium bg-ink text-white hover:bg-black">Call</a>
                <Btn size="sm" variant="secondary" onClick={copyLoc}>Copy</Btn>
              </div>
            )}
          </>
        )}
      </Card>

      <div className="grid grid-cols-3 gap-2 mb-4">
        <StateCard ok={s.depositPaid} label="Deposit" okText="Paid" badText="Unpaid" />
        <StateCard ok={s.confirmed} label="Confirmation" okText="Confirmed" badText="Pending" />
        <StateCard ok={s.intakeDone} label="Intake" okText="Complete" badText="Missing" />
      </div>

      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <div className="text-[12px] font-semibold text-faint uppercase">Prep notes</div>
          <button onClick={() => toast("Prep notes saved")} className="text-[12px] text-accent font-medium">Save</button>
        </div>
        <textarea
          value={prep}
          onChange={(e) => setPrep(e.target.value)}
          rows={4}
          placeholder="Add your prep notes for this session…"
          className="inp !text-[13px] leading-relaxed resize-none"
        />
      </div>

      <div className="mb-4">
        <div className="text-[12px] font-semibold text-faint uppercase mb-2">Client context</div>
        <Card className="!p-4">
          <div className="flex flex-wrap gap-1.5 mb-2">{s.client.prefs.map((p, i) => <span key={i} className="text-[12px] bg-accentSoft text-accent px-2 py-1 rounded-full">{p}</span>)}</div>
          {s.client.notes[0] && <p className="text-[13px] text-ink/85"><span className="text-faint">Last note · {s.client.notes[0].d}: </span>{s.client.notes[0].t}</p>}
          <button onClick={() => onOpenClient(s.client)} className="text-[13px] text-accent font-medium mt-2 flex items-center gap-0.5">Open full client record<Icon.chevron className="w-3.5 h-3.5" /></button>
        </Card>
      </div>

      <div>
        <div className="text-[12px] font-semibold text-faint uppercase mb-2">After the session</div>
        <div className="flex flex-wrap gap-2">
          {([["recap", "Draft recap"], ["review", "Request review"], ["rebook", "Rebook"]] as const).map(([k, label]) => (
            <Btn key={k} size="sm" variant="secondary" onClick={() => draftFollowUp(k)}>
              <Icon.pencil className="w-4 h-4" />{fuLoading && fuKind === k ? "Drafting…" : label}
            </Btn>
          ))}
        </div>

        {fuErr && <p className="text-[12px] text-bad mt-2">{fuErr}</p>}

        {fu && (
          <Card className="!p-3.5 mt-3">
            <div className="flex items-center gap-2 mb-2">
              <Pill tone="info">Draft</Pill>
              <Pill tone="neutral">{fu.channel === "sms" ? "SMS" : "Email"}</Pill>
              <span className="text-[11px] text-faint capitalize">{fu.kind} · edit freely</span>
            </div>
            {fu.subject !== null && (
              <input value={fu.subject} onChange={(e) => setFu({ ...fu, subject: e.target.value })} className="inp mb-2 !text-[13px] font-medium" />
            )}
            <textarea value={fu.body} onChange={(e) => setFu({ ...fu, body: e.target.value })} rows={6} className="inp !text-[13px] leading-relaxed resize-none" />
            <div className="flex gap-1.5 mt-2.5">
              <Btn size="sm" variant="secondary" className="flex-1" onClick={() => draftFollowUp(fu.kind)}>Regenerate</Btn>
              <Btn size="sm" className="flex-1" onClick={() => { setSent(true); toast(`Sent to ${s.client.name}`); }}>{sent ? "Sent ✓" : "Approve & send"}</Btn>
            </div>
            {sent && <p className="text-[11px] text-good mt-2">Approved. Would send via {fu.channel.toUpperCase()} (host-gated action).</p>}
          </Card>
        )}
      </div>
    </Drawer>
  );
}

/* --------------------------- Client detail ------------------------- */
function ClientDetail({ client: c, onClose, onOpenSession }: { client: Client; onClose: () => void; onOpenSession: (s: EnrichedSession) => void }) {
  const toast = useToast();
  const [tab, setTab] = useState<"memory" | "sessions" | "reviews" | "payments">("memory");
  const sessions = getSessionsForClient(c.id);

  // Editable memory (held in the drawer; persists to the client record once the backend lands).
  const [notes, setNotes] = useState(c.notes);
  const [noteDraft, setNoteDraft] = useState("");
  const [prefs, setPrefs] = useState(c.prefs);
  const [prefDraft, setPrefDraft] = useState("");
  function addNote() {
    const t = noteDraft.trim();
    if (!t) return;
    setNotes((n) => [{ d: "Today", t }, ...n]);
    setNoteDraft("");
    toast("Note added");
  }
  function addPref() {
    const t = prefDraft.trim();
    if (!t) return;
    setPrefs((p) => [...p, t]);
    setPrefDraft("");
  }

  // Editable client info (name, contact, tag, color, photo).
  const CLIENT_COLORS = ["#3E5C76", "#5B8266", "#A6794C", "#7A5C8E", "#B45309", "#2F6F6A", "#BE123C", "#475569"];
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(c.name);
  const [email, setEmail] = useState(c.email);
  const [phone, setPhone] = useState(c.phone);
  const [address, setAddress] = useState(c.address ?? "");
  const [tag, setTag] = useState<ClientTag>(c.tag);
  const [color, setColor] = useState(c.color);
  const [photo, setPhoto] = useState<string | null>(c.photo ?? null);
  const fileRef = useRef<HTMLInputElement>(null);
  const ini = (name.trim().split(/\s+/).map((w) => w[0]).slice(0, 2).join("") || c.initials).toUpperCase();
  async function onPickPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    try { setPhoto(await readImageScaled(f)); } catch {}
  }

  // Add-records: log a past session, add a testimonial, record a payment.
  const [reviews, setReviews] = useState(c.reviews);
  const [payments, setPayments] = useState(c.payments);
  const [logged, setLogged] = useState<{ service: string; date: string; note: string }[]>([]);
  const [addPanel, setAddPanel] = useState<null | "session" | "review" | "payment">(null);
  const tagTone = tag === "At risk" || tag === "Overdue" ? "bad" : tag === "New lead" ? "info" : "good";
  return (
    <Drawer title="Client" onClose={onClose}>
      <div className="flex items-start gap-3.5 mb-4">
        <Avatar initials={ini} color={color} photo={photo} size={56} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2"><h2 className="text-lg font-semibold truncate">{name}</h2><Pill tone={tagTone}>{tag}</Pill></div>
          <div className="text-[13px] text-muted truncate">{[email, phone].filter(Boolean).join(" · ") || "No contact info yet"}</div>
          {address && <a href={mapsUrl(address)} target="_blank" rel="noreferrer" className="text-[12px] text-accent truncate block mt-0.5">{address}</a>}
          <button onClick={() => setEditing((v) => !v)} className="text-[12px] text-accent font-medium mt-1">{editing ? "Close editor" : "Edit details"}</button>
        </div>
        <div className="text-center"><ScoreRing score={c.avgScore} size={50} /><div className="text-[10px] text-faint mt-1">Avg score</div></div>
      </div>

      {editing && (
        <Card className="!p-4 mb-4 space-y-3">
          <div className="flex items-center gap-3">
            <button onClick={() => fileRef.current?.click()} className="relative group rounded-[16px] overflow-hidden shrink-0" style={{ width: 48, height: 48 }} title="Add photo">
              <Avatar initials={ini} color={color} photo={photo} size={48} />
              <span className="absolute inset-0 bg-black/0 group-hover:bg-black/35 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity"><Icon.pencil className="w-4 h-4" /></span>
            </button>
            <div className="flex flex-wrap items-center gap-1.5">
              {CLIENT_COLORS.map((cc) => (
                <button key={cc} onClick={() => setColor(cc)} className={cx("w-6 h-6 rounded-full", color === cc && !photo && "ring-2 ring-offset-2 ring-ink")} style={{ background: cc }} aria-label="Pick color" />
              ))}
              {photo && <button onClick={() => setPhoto(null)} className="text-[12px] text-accent ml-1">Remove photo</button>}
            </div>
          </div>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" className="inp !text-[13px]" />
          <div className="grid grid-cols-2 gap-2">
            <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" className="inp !text-[13px]" />
            <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone" className="inp !text-[13px]" />
          </div>
          <input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Address (for in-person or on-site visits)" className="inp !text-[13px]" />
          <select value={tag} onChange={(e) => setTag(e.target.value as ClientTag)} className="inp !text-[13px]">
            {(["New lead", "Repeat", "Package", "At risk", "Overdue"] as ClientTag[]).map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          <div className="flex justify-end"><Btn size="sm" onClick={() => { setEditing(false); toast("Client updated"); }}>Save</Btn></div>
          <input ref={fileRef} type="file" accept="image/*" onChange={onPickPhoto} className="hidden" />
        </Card>
      )}

      <div className="grid grid-cols-4 gap-2 mb-5">
        {([["Sessions", c.sessions], ["Lifetime", "$" + c.lifetime.toLocaleString()], ["Cancels", c.cancellations], ["No-shows", c.noShows]] as const).map(([k, v]) => (
          <div key={k} className="bg-[#FAFAF8] border border-line rounded-[10px] p-2.5 text-center"><div className="text-base font-semibold">{v}</div><div className="text-[11px] text-faint">{k}</div></div>
        ))}
      </div>

      <div className="mb-4">
        <Segmented<"memory" | "sessions" | "reviews" | "payments"> size="sm" value={tab} onChange={setTab} options={[{ value: "memory", label: "Memory" }, { value: "sessions", label: "Sessions" }, { value: "reviews", label: "Reviews" }, { value: "payments", label: "Payments" }]} />
      </div>

      {tab === "memory" && (
        <div className="space-y-4">
          <div>
            <div className="text-[12px] font-semibold text-faint uppercase mb-2">Relationship memory</div>
            <div className="flex flex-wrap items-center gap-1.5">
              {prefs.map((p, i) => (
                <span key={i} className="text-[12px] bg-accentSoft text-accent pl-2 pr-1 py-1 rounded-full inline-flex items-center gap-1">
                  {p}
                  <button onClick={() => setPrefs((arr) => arr.filter((_, idx) => idx !== i))} className="text-accent/50 hover:text-accent"><Icon.x className="w-3 h-3" /></button>
                </span>
              ))}
            </div>
            <div className="flex gap-2 mt-2">
              <input value={prefDraft} onChange={(e) => setPrefDraft(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addPref()} placeholder="Add something to remember…" className="inp !text-[13px]" />
              <Btn size="sm" variant="secondary" onClick={addPref}>Add</Btn>
            </div>
          </div>
          <div>
            <div className="text-[12px] font-semibold text-faint uppercase mb-2">Notes timeline</div>
            <div className="flex gap-2 mb-3 items-start">
              <textarea value={noteDraft} onChange={(e) => setNoteDraft(e.target.value)} rows={2} placeholder="Add a note…" className="inp !text-[13px] resize-none" />
              <Btn size="sm" onClick={addNote}>Add</Btn>
            </div>
            <div className="space-y-2.5">
              {notes.length ? notes.map((n, i) => (
                <div key={i} className="flex gap-3"><div className="text-[11px] text-faint w-12 shrink-0 pt-0.5">{n.d}</div><div className="flex-1 text-[13px] text-ink/90 border-l-2 border-line pl-3">{n.t}</div></div>
              )) : <Empty>No notes yet. Add your first above.</Empty>}
            </div>
          </div>
        </div>
      )}
      {tab === "sessions" && (
        <div className="space-y-2">
          <div className="flex justify-end">
            <Btn size="sm" variant="secondary" onClick={() => setAddPanel(addPanel === "session" ? null : "session")}><Icon.plus className="w-4 h-4" />Add session</Btn>
          </div>
          {addPanel === "session" && <AddSessionForm onAdd={(r) => { setLogged((l) => [r, ...l]); setAddPanel(null); toast("Session logged"); }} onCancel={() => setAddPanel(null)} />}
          {logged.map((r, i) => (
            <div key={"log" + i} className="flex items-center gap-3 p-3 border border-line rounded-[10px]">
              <div className="w-1 self-stretch rounded-full bg-[#9A9A9F]" />
              <div className="flex-1"><div className="text-sm font-medium">{r.service}</div><div className="text-[12px] text-muted">{r.date}{r.note ? ` · ${r.note}` : ""}</div></div>
              <Pill tone="neutral">Logged</Pill>
            </div>
          ))}
          {sessions.map((s) => (
            <button key={s.id} onClick={() => onOpenSession(s)} className="w-full">
              <div className="flex items-center gap-3 p-3 border border-line rounded-[10px] hover:bg-[#FAFAF8] text-left">
                <div className="w-1 self-stretch rounded-full" style={{ background: s.service.color }} />
                <div className="flex-1"><div className="text-sm font-medium">{s.service.name}</div><div className="text-[12px] text-muted">{fmtDay(s.day)} · {to12(s.start)}</div></div>
                <ScoreRing score={s.score} size={34} />
              </div>
            </button>
          ))}
          {sessions.length === 0 && logged.length === 0 && <Empty>No sessions on file yet.</Empty>}
        </div>
      )}
      {tab === "reviews" && (
        <div className="space-y-3">
          <div className="flex justify-end gap-2">
            <Btn size="sm" onClick={() => toast(`Review request drafted for ${name}`)}><Icon.pencil className="w-4 h-4" />Request review</Btn>
            <Btn size="sm" variant="secondary" onClick={() => setAddPanel(addPanel === "review" ? null : "review")}><Icon.plus className="w-4 h-4" />Save a kind word</Btn>
          </div>
          <p className="text-[12px] text-muted">Reviews clients submit are <span className="text-good font-medium">verified</span> and can be shown publicly. Anything you save yourself is a private note, kept for your records only.</p>
          {addPanel === "review" && <AddReviewForm onAdd={(r) => { setReviews((rv) => [r, ...rv]); setAddPanel(null); toast("Saved to your records"); }} onCancel={() => setAddPanel(null)} />}
          {reviews.length ? reviews.map((r, i) => (
            <Card key={i} className="!p-4">
              <div className="flex items-center gap-1 mb-1.5">
                {Array.from({ length: 5 }).map((_, k) => <Star key={k} filled={k < r.stars} />)}
                <span className="text-[11px] text-faint ml-1">{r.d}</span>
                <span className="ml-auto">{r.verified ? <Pill tone="good"><Icon.check className="w-3 h-3" />Verified</Pill> : <Pill tone="neutral">Private note</Pill>}</span>
              </div>
              <p className="text-[13px] text-ink/90 italic">“{r.t}”</p>
            </Card>
          )) : <Empty>No reviews yet. Send a request after a session to collect a verified one.</Empty>}
        </div>
      )}
      {tab === "payments" && (
        <div className="space-y-2">
          <div className="flex justify-end">
            <Btn size="sm" variant="secondary" onClick={() => setAddPanel(addPanel === "payment" ? null : "payment")}><Icon.plus className="w-4 h-4" />Record payment</Btn>
          </div>
          {addPanel === "payment" && <AddPaymentForm onAdd={(p) => { setPayments((arr) => [p, ...arr]); setAddPanel(null); toast("Payment recorded"); }} onCancel={() => setAddPanel(null)} />}
          {c.balance > 0 && <Card className="!p-3.5 flex items-center justify-between bg-badSoft border-[#FAD1D6]"><span className="text-[13px] font-medium text-bad">${c.balance} outstanding</span><Btn size="sm" onClick={() => toast(`Reminder sent to ${name}`)}>Send reminder</Btn></Card>}
          {payments.length ? payments.map((p, i) => (
            <div key={i} className="flex items-center justify-between p-3 border border-line rounded-[10px]">
              <div><div className="text-[13px] font-medium">{p.what}</div><div className="text-[11px] text-faint">{p.d}</div></div>
              <div className="text-right"><div className="text-sm font-semibold">${p.amt}</div><Pill tone={p.status === "Paid" ? "good" : p.status === "Overdue" ? "bad" : "warn"}>{p.status}</Pill></div>
            </div>
          )) : <Empty>No payment history yet.</Empty>}
        </div>
      )}
    </Drawer>
  );
}

function AddSessionForm({ onAdd, onCancel }: { onAdd: (r: { service: string; date: string; note: string }) => void; onCancel: () => void }) {
  const [service, setService] = useState("");
  const [date, setDate] = useState("");
  const [note, setNote] = useState("");
  return (
    <Card className="!p-3.5 space-y-2">
      <input value={service} onChange={(e) => setService(e.target.value)} placeholder="Service (e.g. 1:1 Coaching)" autoFocus className="inp !text-[13px]" />
      <div className="grid grid-cols-2 gap-2">
        <input value={date} onChange={(e) => setDate(e.target.value)} placeholder="Date (e.g. Jun 3)" className="inp !text-[13px]" />
        <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Note (optional)" className="inp !text-[13px]" />
      </div>
      <div className="flex justify-end gap-2"><Btn size="sm" variant="secondary" onClick={onCancel}>Cancel</Btn><Btn size="sm" onClick={() => service.trim() && onAdd({ service: service.trim(), date: date.trim() || "Today", note: note.trim() })}>Log session</Btn></div>
    </Card>
  );
}

function AddReviewForm({ onAdd, onCancel }: { onAdd: (r: Review) => void; onCancel: () => void }) {
  const [stars, setStars] = useState(5);
  const [text, setText] = useState("");
  return (
    <Card className="!p-3.5 space-y-2">
      <div className="text-[12px] text-muted">Save a kind word you got by text or email. This stays private to you and is marked unverified — it can&apos;t be shown publicly.</div>
      <div className="flex items-center gap-1">{[1, 2, 3, 4, 5].map((n) => <button key={n} onClick={() => setStars(n)}><Star filled={n <= stars} /></button>)}</div>
      <textarea value={text} onChange={(e) => setText(e.target.value)} rows={3} placeholder="Paste what they said…" className="inp !text-[13px] resize-none" />
      <div className="flex justify-end gap-2"><Btn size="sm" variant="secondary" onClick={onCancel}>Cancel</Btn><Btn size="sm" onClick={() => text.trim() && onAdd({ d: "Saved today", stars, t: text.trim(), verified: false })}>Save note</Btn></div>
    </Card>
  );
}

function AddPaymentForm({ onAdd, onCancel }: { onAdd: (p: ClientPayment) => void; onCancel: () => void }) {
  const [amt, setAmt] = useState("");
  const [what, setWhat] = useState("");
  return (
    <Card className="!p-3.5 space-y-2">
      <div className="grid grid-cols-2 gap-2">
        <input value={amt} onChange={(e) => setAmt(e.target.value)} placeholder="Amount ($)" inputMode="numeric" autoFocus className="inp !text-[13px]" />
        <input value={what} onChange={(e) => setWhat(e.target.value)} placeholder="For (e.g. 1:1 Coaching)" className="inp !text-[13px]" />
      </div>
      <div className="flex justify-end gap-2"><Btn size="sm" variant="secondary" onClick={onCancel}>Cancel</Btn><Btn size="sm" onClick={() => { const a = Number(amt) || 0; if (a <= 0 || !what.trim()) return; onAdd({ d: "Today", amt: a, status: "Paid", what: what.trim() }); }}>Record</Btn></div>
    </Card>
  );
}
