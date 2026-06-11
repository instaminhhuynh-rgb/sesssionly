"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Btn, Card, Pill, SectionTitle, Segmented, Toggle, cx } from "@/components/ui";
import { createClient, supabaseConfigured } from "@/lib/supabase/client";
import { paymentsConfigured } from "@/lib/payments/config";
import { Icon } from "@/components/icons";
import { PageIntro } from "@/components/page-intro";
import { useToast } from "@/components/toast";
import { HostAvatar, useProfile, readImageScaled } from "@/components/profile";

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <SectionTitle>{title}</SectionTitle>
      <Card className="space-y-4">{children}</Card>
    </div>
  );
}
function Row({ label, desc, children }: { label: string; desc?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="min-w-0"><div className="text-[14px] font-medium">{label}</div>{desc && <div className="text-[12px] text-muted">{desc}</div>}</div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

export default function SettingsPage() {
  const toast = useToast();
  const router = useRouter();
  const { photo, setPhoto, host, setHost, bookingPage, setBookingPage } = useProfile();
  async function signOut() {
    try { await createClient().auth.signOut(); } catch { /* ignore */ }
    router.push("/login");
    router.refresh();
  }
  const fileRef = useRef<HTMLInputElement>(null);
  const coverRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);
  const [editingProfile, setEditingProfile] = useState(false);
  const [pf, setPf] = useState(host);
  async function onPickCover(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    try { setBookingPage({ ...bookingPage, coverPhoto: await readImageScaled(f, 1000) }); toast("Cover updated"); } catch { toast("Could not load that image"); }
  }
  async function onPickGallery(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    e.target.value = "";
    const imgs: string[] = [];
    for (const f of files) { try { imgs.push(await readImageScaled(f, 600)); } catch { /* skip */ } }
    if (imgs.length) setBookingPage({ ...bookingPage, gallery: [...bookingPage.gallery, ...imgs].slice(0, 6) });
  }
  async function onPickPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    try {
      setPhoto(await readImageScaled(f));
      toast("Profile photo updated");
    } catch {
      toast("Could not load that image");
    }
  }

  const [theme, setTheme] = useState("calm");
  const [font, setFont] = useState("default");
  const [layout, setLayout] = useState("focus");
  const [cancelWin, setCancelWin] = useState("24");
  const [t, setT] = useState({ sms: true, email: true, push: false, deposit: true, autoReminder: true, reduceMotion: false });
  const tog = (k: keyof typeof t) => setT((o) => ({ ...o, [k]: !o[k] }));

  return (
    <div className="space-y-6 max-w-[760px]">
      <PageIntro id="settings" tag="Settings" title="Make it yours" body="Your booking profile, appearance, calendar health, notifications, and payment defaults. Set these once and get back to work." />
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Settings</h1>
        <p className="text-sm text-muted">Appearance, calendar health, notifications, payments &amp; privacy.</p>
      </div>

      <Group title="Profile">
        <div className="flex items-center gap-3.5">
          <button onClick={() => fileRef.current?.click()} className="relative group rounded-[17px] overflow-hidden shrink-0" title="Change photo" style={{ width: 52, height: 52 }}>
            <HostAvatar size={52} />
            <span className="absolute inset-0 bg-black/0 group-hover:bg-black/35 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity">
              <Icon.pencil className="w-4 h-4" />
            </span>
          </button>
          <div className="flex-1 min-w-0">
            <div className="font-medium truncate">{host.firstName || host.lastName ? `${host.firstName} ${host.lastName}`.trim() : "Add your name"}</div>
            <div className="text-[13px] text-muted truncate">{host.business || "Your business"} · sessionlyhq.com/{host.slug}</div>
            {host.address && <div className="text-[12px] text-faint truncate">{host.address}</div>}
          </div>
          <div className="flex gap-2 shrink-0">
            {photo && <Btn size="sm" variant="secondary" onClick={() => { setPhoto(null); toast("Photo removed"); }}>Remove</Btn>}
            <Btn size="sm" variant="secondary" onClick={() => fileRef.current?.click()}>{photo ? "Photo" : "Add photo"}</Btn>
            <Btn size="sm" variant="secondary" onClick={() => { setPf(host); setEditingProfile((v) => !v); }}>{editingProfile ? "Close" : "Edit"}</Btn>
          </div>
          <input ref={fileRef} type="file" accept="image/*" onChange={onPickPhoto} className="hidden" />
        </div>

        {editingProfile && (
          <div className="space-y-3 pt-3 border-t border-line">
            <div className="grid grid-cols-2 gap-2">
              <input value={pf.firstName} onChange={(e) => setPf({ ...pf, firstName: e.target.value })} placeholder="First name" className="inp !text-[13px]" />
              <input value={pf.lastName} onChange={(e) => setPf({ ...pf, lastName: e.target.value })} placeholder="Last name" className="inp !text-[13px]" />
            </div>
            <input value={pf.business} onChange={(e) => setPf({ ...pf, business: e.target.value })} placeholder="Business name" className="inp !text-[13px]" />
            <input value={pf.role} onChange={(e) => setPf({ ...pf, role: e.target.value })} placeholder="What you do (e.g. Leadership Coach)" className="inp !text-[13px]" />
            <div className="grid grid-cols-2 gap-2">
              <input value={pf.email} onChange={(e) => setPf({ ...pf, email: e.target.value })} placeholder="Email" className="inp !text-[13px]" />
              <input value={pf.phone} onChange={(e) => setPf({ ...pf, phone: e.target.value })} placeholder="Phone" className="inp !text-[13px]" />
            </div>
            <input value={pf.address} onChange={(e) => setPf({ ...pf, address: e.target.value })} placeholder="Business address (used for travel & directions)" className="inp !text-[13px]" />
            <div className="flex items-center gap-1 text-[13px]">
              <span className="text-muted shrink-0">sessionlyhq.com/</span>
              <input value={pf.slug} onChange={(e) => setPf({ ...pf, slug: e.target.value.replace(/[^a-z0-9-]/gi, "").toLowerCase() })} placeholder="you" className="inp !text-[13px]" />
            </div>
            <div className="flex justify-end gap-2"><Btn size="sm" variant="secondary" onClick={() => setEditingProfile(false)}>Cancel</Btn><Btn size="sm" onClick={() => { setHost(pf); setEditingProfile(false); toast("Profile saved"); }}>Save</Btn></div>
          </div>
        )}
      </Group>

      <Group title="Your booking page">
        <p className="text-[13px] text-muted">What clients see at sessionlyhq.com/{host.slug}. Add a cover, a short intro video, a bio, and photos of your work.</p>
        <div>
          <div className="text-[12px] font-semibold text-faint uppercase mb-1.5">Cover photo</div>
          <button onClick={() => coverRef.current?.click()} className="block w-full h-28 rounded-[12px] overflow-hidden border border-line relative" style={{ background: bookingPage.coverPhoto ? undefined : "#2B3A4A" }}>
            {bookingPage.coverPhoto ? <img src={bookingPage.coverPhoto} alt="" className="w-full h-full object-cover" /> : <span className="absolute inset-0 flex items-center justify-center text-white/80 text-[13px]">Tap to add a cover photo</span>}
          </button>
          <input ref={coverRef} type="file" accept="image/png,image/jpeg,image/webp" onChange={onPickCover} className="hidden" />
          <div className="flex items-center justify-between mt-1">
            <span className="text-[11px] text-faint">JPG, PNG, or WebP. A wide (landscape) photo looks best.</span>
            {bookingPage.coverPhoto && <button onClick={() => setBookingPage({ ...bookingPage, coverPhoto: null })} className="text-[12px] text-accent">Remove</button>}
          </div>
        </div>
        <div>
          <div className="text-[12px] font-semibold text-faint uppercase mb-1.5">Intro video</div>
          <input value={bookingPage.videoUrl} onChange={(e) => setBookingPage({ ...bookingPage, videoUrl: e.target.value })} placeholder="Paste a YouTube, Vimeo, or .mp4 link" className="inp !text-[13px]" />
        </div>
        <div>
          <div className="text-[12px] font-semibold text-faint uppercase mb-1.5">Bio</div>
          <textarea value={bookingPage.bio} onChange={(e) => setBookingPage({ ...bookingPage, bio: e.target.value })} rows={3} placeholder="A few lines about you and what you do." className="inp !text-[13px] resize-none" />
        </div>
        <div>
          <div className="text-[12px] font-semibold text-faint uppercase mb-1.5">Photos of your work</div>
          <div className="grid grid-cols-4 gap-2">
            {bookingPage.gallery.map((g, i) => (
              <div key={i} className="relative group aspect-square">
                <img src={g} alt="" className="w-full h-full object-cover rounded-[8px]" />
                <button onClick={() => setBookingPage({ ...bookingPage, gallery: bookingPage.gallery.filter((_, idx) => idx !== i) })} className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/55 text-white flex items-center justify-center opacity-0 group-hover:opacity-100"><Icon.x className="w-3 h-3" /></button>
              </div>
            ))}
            {bookingPage.gallery.length < 6 && <button onClick={() => galleryRef.current?.click()} className="aspect-square rounded-[8px] border border-dashed border-line flex items-center justify-center text-faint hover:text-ink hover:bg-[#FAFAF8]"><Icon.plus className="w-5 h-5" /></button>}
          </div>
          <input ref={galleryRef} type="file" accept="image/png,image/jpeg,image/webp" multiple onChange={onPickGallery} className="hidden" />
        </div>
        <a href={`/book/${host.slug}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-[13px] text-accent font-medium">View your booking page →</a>
      </Group>

      <Group title="Payments">
        <div className="flex items-center gap-3">
          <span className={cx("w-2 h-2 rounded-full", paymentsConfigured ? "bg-good" : "bg-[#C9C9C4]")} />
          <div className="flex-1 min-w-0">
            <div className="text-[13px] font-medium">{paymentsConfigured ? "Connected via Stripe" : "Demo mode"}</div>
            <div className="text-[12px] text-muted">
              {paymentsConfigured
                ? "Deposits and no-show fees charge real cards. You keep 100% of your clients — no commission."
                : "Deposits and no-show charges are simulated. Add your Stripe keys to take real payments."}
            </div>
          </div>
          <Btn size="sm" variant="secondary" onClick={() => toast(paymentsConfigured ? "Opening Stripe dashboard is coming soon" : "Connect Stripe to take real payments")}>
            {paymentsConfigured ? "Manage" : "Connect"}
          </Btn>
        </div>
      </Group>

      <Group title="Style Studio">
        <Row label="Theme" desc="Coming soon"><Segmented size="sm" value={theme} onChange={(v) => { setTheme(v); toast("Themes are coming soon"); }} options={[{ value: "calm", label: "Calm" }, { value: "light", label: "Light" }, { value: "mono", label: "Mono" }]} /></Row>
        <Row label="Font size" desc="Coming soon"><Segmented size="sm" value={font} onChange={(v) => { setFont(v); toast("Font sizing is coming soon"); }} options={[{ value: "compact", label: "S" }, { value: "default", label: "M" }, { value: "large", label: "L" }]} /></Row>
      </Group>

      <Group title="Dashboard layout">
        <p className="text-[13px] text-muted">Choose how Today is arranged.</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {[["focus", "Focus Day", "Sessions first"], ["revenue", "Revenue First", "Payments first"], ["care", "Client Care", "Follow-ups first"]].map(([v, n, d]) => (
            <button key={v} onClick={() => setLayout(v)} className={cx("text-left p-3 rounded-[10px] border", layout === v ? "border-accent bg-accentSoft" : "border-line hover:bg-[#FAFAF8]")}>
              <div className="text-[13px] font-medium">{n}</div><div className="text-[11px] text-muted">{d}</div>
            </button>
          ))}
        </div>
      </Group>

      <Group title="Calendar Health">
        <div className="space-y-2.5">
          {[["Google Calendar", "Connected · synced 4 min ago", "good"], ["Outlook", "Connected · synced 1 hr ago", "good"], ["Apple Calendar", "Not connected", "neutral"]].map(([n, s, tone]) => (
            <div key={n} className="flex items-center gap-3">
              <span className={cx("w-2 h-2 rounded-full", tone === "good" ? "bg-good" : "bg-[#C9C9C4]")} />
              <div className="flex-1"><div className="text-[13px] font-medium">{n}</div><div className="text-[12px] text-muted">{s}</div></div>
              <Btn size="sm" variant="secondary" onClick={() => toast("Calendar sync is coming soon")}>{tone === "good" ? "Manage" : "Connect"}</Btn>
            </div>
          ))}
          <div className="mt-2 p-3 rounded-[10px] bg-goodSoft border border-[#C9EBD4] flex items-center gap-2.5">
            <Icon.check className="w-4 h-4 text-good" /><span className="text-[13px] text-good font-medium">Safe to share. No conflicts detected, permissions OK.</span>
          </div>
        </div>
      </Group>

      <Group title="Notifications">
        {([["sms", "SMS reminders", "Sent to clients before sessions"], ["email", "Email confirmations", ""], ["push", "Push notifications", "In your browser"], ["autoReminder", "Auto follow-up reminders", ""]] as const).map(([k, n, d]) => (
          <Row key={k} label={n} desc={d}><Toggle on={t[k]} onClick={() => tog(k)} /></Row>
        ))}
      </Group>

      <Group title="Payment defaults">
        <Row label="Require deposit by default" desc="New paid services start with a deposit."><Toggle on={t.deposit} onClick={() => tog("deposit")} /></Row>
        <Row label="Default cancellation window"><Segmented size="sm" value={cancelWin} onChange={setCancelWin} options={[{ value: "12", label: "12h" }, { value: "24", label: "24h" }, { value: "48", label: "48h" }]} /></Row>
      </Group>

      <Group title="Privacy & accessibility">
        <Row label="Reduce motion"><Toggle on={t.reduceMotion} onClick={() => tog("reduceMotion")} /></Row>
        <Row label="Session Score visibility" desc="Host-only for now. Clients never see scores."><Pill tone="info">Host-only</Pill></Row>
        <Row label="Export my data"><Btn size="sm" variant="secondary" onClick={() => toast("Data export is coming soon")}>Request export</Btn></Row>
      </Group>

      <Group title="Account">
        {supabaseConfigured
          ? <Row label="Sign out" desc="End your session on this device."><Btn size="sm" variant="secondary" onClick={signOut}>Sign out</Btn></Row>
          : <Row label="Accounts" desc="Running in demo mode. Add Supabase keys to turn on sign-in."><Pill tone="neutral">Demo mode</Pill></Row>}
      </Group>
    </div>
  );
}
