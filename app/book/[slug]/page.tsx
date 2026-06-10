"use client";

import { useEffect, useMemo, useState } from "react";
import { Avatar, Btn, cx } from "@/components/ui";
import { Icon } from "@/components/icons";
import { HOST, getServices } from "@/lib/mock-data";
import type { Service } from "@/lib/types";

/* The client-facing storefront. No app nav. Reads what the owner set in the
   Booking page studio (shared via localStorage), falls back to sensible
   defaults so it always looks complete. Mock booking flow. */

interface HostView {
  firstName: string;
  lastName: string;
  business: string;
  role: string;
  slug: string;
}

const SLOTS = ["Tomorrow · 10:00 AM", "Tomorrow · 2:00 PM", "Thu · 9:30 AM", "Thu · 4:00 PM", "Fri · 11:00 AM", "Fri · 1:30 PM"];

function videoEmbed(url: string): { kind: "youtube" | "mp4" | "link"; src: string } | null {
  const u = url.trim();
  if (!u) return null;
  const yt = u.match(/(?:youtube\.com\/.*[?&]v=|youtu\.be\/|youtube\.com\/embed\/)([\w-]{11})/);
  if (yt) return { kind: "youtube", src: `https://www.youtube.com/embed/${yt[1]}` };
  if (/\.mp4($|\?)/i.test(u)) return { kind: "mp4", src: u };
  return { kind: "link", src: u };
}

export default function BookPage() {
  const [host, setHost] = useState<HostView>({ firstName: HOST.firstName, lastName: HOST.lastName, business: HOST.business, role: HOST.role, slug: HOST.slug });
  const [avatar, setAvatar] = useState<string | null>(null);
  const [cover, setCover] = useState<string | null>(null);
  const [video, setVideo] = useState("");
  const [bio, setBio] = useState("");
  const [gallery, setGallery] = useState<string[]>([]);

  useEffect(() => {
    try {
      const h = localStorage.getItem("sessionly_host");
      if (h) { const p = JSON.parse(h); setHost((cur) => ({ ...cur, ...p })); }
      setAvatar(localStorage.getItem("sessionly_avatar"));
      const b = localStorage.getItem("sessionly_bookingpage");
      if (b) { const bp = JSON.parse(b); setCover(bp.coverPhoto ?? null); setVideo(bp.videoUrl ?? ""); setBio(bp.bio ?? ""); setGallery(bp.gallery ?? []); }
    } catch { /* ignore */ }
  }, []);

  const services = useMemo(() => getServices().filter((s) => s.active), []);
  const embed = videoEmbed(video);
  const initials = (host.firstName[0] ?? "") + (host.lastName[0] ?? "");

  const [step, setStep] = useState<"landing" | "time" | "details" | "done">("landing");
  const [service, setService] = useState<Service | null>(null);
  const [slot, setSlot] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", email: "", phone: "" });
  const canConfirm = form.name.trim() && (form.email.trim() || form.phone.trim());

  function pickService(s: Service) { setService(s); setStep("time"); window.scrollTo({ top: 0 }); }
  function pickSlot(sl: string) { setSlot(sl); setStep("details"); window.scrollTo({ top: 0 }); }

  return (
    <div className="min-h-screen bg-canvas">
      <div className="max-w-[640px] mx-auto pb-16">
        {/* Cover */}
        <div className="h-40 sm:h-52 w-full overflow-hidden" style={{ background: cover ? undefined : "#2B3A4A" }}>
          {cover && <img src={cover} alt="" className="w-full h-full object-cover" />}
        </div>

        {/* Header */}
        <div className="px-5">
          <div className="-mt-10 mb-3"><Avatar initials={initials} photo={avatar} size={80} ring /></div>
          <h1 className="text-xl font-semibold tracking-tight">{host.business || `${host.firstName} ${host.lastName}`.trim() || "Your booking page"}</h1>
          {host.role && <p className="text-[13px] text-muted mt-0.5">{host.role}</p>}
          {bio && <p className="text-[14px] text-ink/85 leading-relaxed mt-3">{bio}</p>}

          {embed && step === "landing" && (
            <div className="mt-4">
              {embed.kind === "youtube" && <div className="relative w-full rounded-[14px] overflow-hidden" style={{ paddingTop: "56.25%" }}><iframe src={embed.src} title="Intro" className="absolute inset-0 w-full h-full" allowFullScreen /></div>}
              {embed.kind === "mp4" && <video src={embed.src} controls className="w-full rounded-[14px]" />}
              {embed.kind === "link" && <a href={embed.src} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-[13px] text-accent font-medium">▶ Watch intro</a>}
            </div>
          )}

          {gallery.length > 0 && step === "landing" && (
            <div className="grid grid-cols-3 gap-2 mt-4">
              {gallery.map((g, i) => <img key={i} src={g} alt="" className="w-full aspect-square object-cover rounded-[10px]" />)}
            </div>
          )}
        </div>

        {/* Steps */}
        <div className="px-5 mt-6">
          {step === "landing" && (
            <>
              <h2 className="text-lg font-semibold mb-3">Choose a service</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {services.map((s) => (
                  <button key={s.id} onClick={() => pickService(s)} className="text-left">
                    <div className="bg-surface border border-line rounded-xl2 p-4 hover:border-[#cfcfca] h-full flex flex-col">
                      <div className="w-1.5 h-1.5 rounded-full mb-2" style={{ background: s.color }} />
                      <div className="font-medium">{s.name}</div>
                      <div className="text-[13px] text-muted mt-0.5">{s.duration} min</div>
                      <div className="mt-3 flex items-center justify-between">
                        <span className="text-[15px] font-semibold">{s.price ? `$${s.price}` : "Free"}</span>
                        <span className="text-[12px] text-accent font-medium">Book →</span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </>
          )}

          {step === "time" && service && (
            <>
              <button onClick={() => setStep("landing")} className="text-[13px] text-accent font-medium mb-3">‹ Back</button>
              <div className="bg-surface border border-line rounded-xl2 p-4 mb-4">
                <div className="font-medium">{service.name}</div>
                <div className="text-[13px] text-muted">{service.duration} min · {service.price ? `$${service.price}` : "Free"}{service.deposit ? ` · $${service.deposit} deposit` : ""}</div>
              </div>
              <h2 className="text-lg font-semibold mb-3">Pick a time</h2>
              <div className="grid grid-cols-2 gap-2">
                {SLOTS.map((sl) => (
                  <button key={sl} onClick={() => pickSlot(sl)} className="bg-surface border border-line rounded-[10px] p-3 text-[13px] font-medium hover:border-accent hover:text-accent">{sl}</button>
                ))}
              </div>
            </>
          )}

          {step === "details" && service && (
            <>
              <button onClick={() => setStep("time")} className="text-[13px] text-accent font-medium mb-3">‹ Back</button>
              <div className="bg-surface border border-line rounded-xl2 p-4 mb-4">
                <div className="font-medium">{service.name}</div>
                <div className="text-[13px] text-muted">{slot} · {service.duration} min</div>
              </div>
              <h2 className="text-lg font-semibold mb-3">Your details</h2>
              <div className="space-y-3">
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Full name" className="inp" />
                <div className="grid grid-cols-2 gap-2">
                  <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="Email" className="inp" />
                  <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="Phone" className="inp" />
                </div>
                {service.deposit > 0 && (
                  <div className="bg-surface border border-line rounded-xl2 p-4">
                    <div className="text-[13px] font-medium">Hold your spot</div>
                    <p className="text-[12px] text-muted mt-0.5">A ${service.deposit} deposit secures this time and comes off your ${service.price} total. {service.cancelWindow}h cancellation policy.</p>
                    <input placeholder="Card number" className="inp mt-2.5" />
                  </div>
                )}
                <Btn size="lg" className={cx("w-full", canConfirm ? "" : "opacity-50 pointer-events-none")} onClick={() => { setStep("done"); window.scrollTo({ top: 0 }); }}>
                  {service.deposit > 0 ? `Confirm & pay $${service.deposit} deposit` : "Confirm booking"}
                </Btn>
                <p className="text-[11px] text-faint text-center">This is a demo. No card is charged.</p>
              </div>
            </>
          )}

          {step === "done" && service && (
            <div className="text-center py-10">
              <div className="w-14 h-14 rounded-full bg-goodSoft text-good flex items-center justify-center mx-auto mb-4"><Icon.check className="w-7 h-7" /></div>
              <h2 className="text-xl font-semibold">You&apos;re booked</h2>
              <p className="text-[14px] text-muted mt-2">{service.name} with {host.firstName}<br />{slot}</p>
              <p className="text-[13px] text-muted mt-4">A confirmation is on its way{form.email ? ` to ${form.email}` : ""}. {host.firstName} will see you then.</p>
              <Btn variant="secondary" className="mt-6" onClick={() => { setStep("landing"); setService(null); setSlot(null); }}>Book another</Btn>
            </div>
          )}
        </div>

        <div className="text-center text-[11px] text-faint mt-12">Powered by Sessionly</div>
      </div>
    </div>
  );
}
