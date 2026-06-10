"use client";

import * as React from "react";
import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { Avatar, cx } from "./ui";
import { HOST } from "@/lib/mock-data";

/**
 * Host profile photo. Stored as a small data URL on the device (localStorage)
 * until the real backend lands, then it moves to Supabase storage. HostAvatar
 * shows the photo everywhere it represents the host, falling back to initials.
 */
export interface HostInfo {
  firstName: string;
  lastName: string;
  business: string;
  role: string;
  email: string;
  phone: string;
  address: string;
  slug: string;
}

const DEFAULT_HOST: HostInfo = {
  firstName: HOST.firstName,
  lastName: HOST.lastName,
  business: HOST.business,
  role: HOST.role,
  email: "",
  phone: "",
  address: "",
  slug: HOST.slug,
};

export interface BookingPage {
  coverPhoto: string | null;
  videoUrl: string;
  bio: string;
  gallery: string[];
}
const DEFAULT_BOOKING: BookingPage = { coverPhoto: null, videoUrl: "", bio: "", gallery: [] };

interface ProfileCtx {
  photo: string | null;
  setPhoto: (p: string | null) => void;
  host: HostInfo;
  setHost: (h: HostInfo) => void;
  bookingPage: BookingPage;
  setBookingPage: (b: BookingPage) => void;
}
const Ctx = createContext<ProfileCtx>({ photo: null, setPhoto: () => {}, host: DEFAULT_HOST, setHost: () => {}, bookingPage: DEFAULT_BOOKING, setBookingPage: () => {} });
const KEY = "sessionly_avatar";
const HOST_KEY = "sessionly_host";
const BOOKING_KEY = "sessionly_bookingpage";

export function useProfile(): ProfileCtx {
  return useContext(Ctx);
}

export function ProfileProvider({ children }: { children: React.ReactNode }) {
  const [photo, setPhotoState] = useState<string | null>(null);
  const [host, setHostState] = useState<HostInfo>(DEFAULT_HOST);
  const [bookingPage, setBookingPageState] = useState<BookingPage>(DEFAULT_BOOKING);

  useEffect(() => {
    try {
      const v = localStorage.getItem(KEY);
      if (v) setPhotoState(v);
      const h = localStorage.getItem(HOST_KEY);
      if (h) setHostState({ ...DEFAULT_HOST, ...JSON.parse(h) });
      const b = localStorage.getItem(BOOKING_KEY);
      if (b) setBookingPageState({ ...DEFAULT_BOOKING, ...JSON.parse(b) });
    } catch {
      /* ignore */
    }
  }, []);

  const setBookingPage = useCallback((b: BookingPage) => {
    setBookingPageState(b);
    try {
      localStorage.setItem(BOOKING_KEY, JSON.stringify(b));
    } catch {
      /* ignore */
    }
  }, []);

  const setPhoto = useCallback((p: string | null) => {
    setPhotoState(p);
    try {
      if (p) localStorage.setItem(KEY, p);
      else localStorage.removeItem(KEY);
    } catch {
      /* ignore */
    }
  }, []);

  const setHost = useCallback((h: HostInfo) => {
    setHostState(h);
    try {
      localStorage.setItem(HOST_KEY, JSON.stringify(h));
    } catch {
      /* ignore */
    }
  }, []);

  return <Ctx.Provider value={{ photo, setPhoto, host, setHost, bookingPage, setBookingPage }}>{children}</Ctx.Provider>;
}

/** The host's avatar: their uploaded photo, or their initials as a fallback. */
export function HostAvatar({ size = 36, ring = false }: { size?: number; ring?: boolean }) {
  const { photo } = useProfile();
  if (photo) {
    return (
      <img
        src={photo}
        alt={`${HOST.firstName} ${HOST.lastName}`}
        className={cx("object-cover shrink-0", ring && "ring-2 ring-white shadow-sm")}
        style={{ width: size, height: size, borderRadius: size / 3 }}
      />
    );
  }
  return <Avatar initials={HOST.initials} color="#3E5C76" size={size} ring={ring} />;
}

/**
 * Reads an image File, downscales it to <=256px, and returns a compact JPEG
 * data URL so it fits comfortably in localStorage.
 */
export function readImageScaled(file: File, max = 256): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("read failed"));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("decode failed"));
      img.onload = () => {
        const scale = Math.min(1, max / Math.max(img.width, img.height));
        const w = Math.round(img.width * scale);
        const h = Math.round(img.height * scale);
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("no canvas"));
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL("image/jpeg", 0.85));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}
