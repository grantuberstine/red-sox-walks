import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "WooSox Walk Tracker",
    short_name: "WooSox",
    description:
      "Worcester Red Sox pitcher walks, strikeouts, velocity & No Pass Fund.",
    start_url: "/",
    display: "standalone",
    background_color: "#0a1020",
    theme_color: "#bd3039",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
      {
        src: "/apple-icon",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  };
}
