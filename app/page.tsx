import { redirect } from "next/navigation";

// SaaS-first: the root sends you straight into the app, not a marketing page.
export default function Home() {
  redirect("/app/today");
}
