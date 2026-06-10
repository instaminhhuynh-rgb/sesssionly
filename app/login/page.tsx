"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Btn } from "@/components/ui";
import { createClient, supabaseConfigured } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [firstName, setFirstName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function submit() {
    setErr(null);
    setMsg(null);
    if (!email.trim() || !password) { setErr("Email and password are required."); return; }
    setBusy(true);
    try {
      const supabase = createClient();
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: { data: { first_name: firstName.trim() } },
        });
        if (error) throw error;
        if (data.session) {
          router.push("/app/today");
          router.refresh();
        } else {
          setMsg("Check your email to confirm your account, then sign in.");
          setMode("signin");
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (error) throw error;
        router.push("/app/today");
        router.refresh();
      }
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-canvas flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-2.5 justify-center mb-6">
          <div className="w-7 h-7 rounded-[8px] bg-ink flex items-center justify-center"><div className="w-3 h-3 rounded-full border-2 border-white" /></div>
          <span className="font-semibold tracking-tight text-lg">Sessionly</span>
        </div>

        <div className="bg-surface border border-line rounded-xl2 p-6">
          {!supabaseConfigured ? (
            <div className="text-center">
              <h1 className="text-lg font-semibold">Accounts aren&apos;t set up yet</h1>
              <p className="text-[13px] text-muted mt-2 leading-relaxed">This is running in demo mode. Add your Supabase keys to turn on real sign-in. For now, you can use the app directly.</p>
              <Btn className="mt-4 w-full" onClick={() => router.push("/app/today")}>Open the app</Btn>
            </div>
          ) : (
            <>
              <h1 className="text-lg font-semibold">{mode === "signin" ? "Welcome back" : "Create your account"}</h1>
              <p className="text-[13px] text-muted mt-0.5">{mode === "signin" ? "Sign in to your Sessionly." : "Start running your appointments in one place."}</p>

              <div className="space-y-3 mt-5">
                {mode === "signup" && <input value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="First name" className="inp" />}
                <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="Email" className="inp" />
                <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" placeholder="Password" className="inp" onKeyDown={(e) => e.key === "Enter" && submit()} />
              </div>

              {err && <p className="text-[12px] text-bad mt-2">{err}</p>}
              {msg && <p className="text-[12px] text-good mt-2">{msg}</p>}

              <Btn className="w-full mt-4" onClick={submit}>{busy ? "Please wait…" : mode === "signin" ? "Sign in" : "Create account"}</Btn>

              <button onClick={() => { setMode(mode === "signin" ? "signup" : "signin"); setErr(null); setMsg(null); }} className="text-[13px] text-accent font-medium mt-4 block mx-auto">
                {mode === "signin" ? "New here? Create an account" : "Already have an account? Sign in"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
