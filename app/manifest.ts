import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Sessionly",
    short_name: "Sessionly",
    description: "Everything that happens before, during, and after an appointment.",
    start_url: "/app/today",
    display: "standalone",
    orientation: "portrait",
    background_color: "#F6F6F4",
    theme_color: "#1C1C1E",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
