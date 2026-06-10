export function to12(hhmm: string): string {
  let [h, m] = hhmm.split(":").map(Number);
  const ap = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  return `${h}${m ? ":" + String(m).padStart(2, "0") : ""} ${ap}`;
}

export function toMin(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

const DOW = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function dow(d: string): string {
  return DOW[new Date(d + "T00:00:00").getDay()];
}

export function dnum(d: string): number {
  return Number(d.split("-")[2]);
}

export function fmtDay(d: string, today = "2026-06-09"): string {
  if (d === today) return "Today";
  if (d === "2026-06-10") return "Tomorrow";
  return dow(d) + " " + dnum(d);
}

export function money(n: number): string {
  return "$" + n.toLocaleString();
}
