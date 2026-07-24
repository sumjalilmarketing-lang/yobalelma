import type { MetadataRoute } from "next";
export default function manifest(): MetadataRoute.Manifest {
  return { name: "Yobalelma Collection", short_name: "Collection", description: "Transport interne Yobalelma", start_url: "/collection", display: "standalone", background_color: "#fcfaf5", theme_color: "#ff6600", icons: [{ src: "/brand/yobalelma-mark.svg", sizes: "any", type: "image/svg+xml" }] };
}
