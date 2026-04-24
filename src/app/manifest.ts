import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "The Patch",
    short_name: "Patch",
    description: "The Traveling Patch — disc golf tracker",
    start_url: "/",
    display: "standalone",
    background_color: "#f6f7f5",
    theme_color: "#305036",
    icons: [
      { src: "/icon", sizes: "512x512", type: "image/png" },
    ],
    share_target: {
      action: "/add",
      method: "GET",
      params: {
        url: "udiscUrl",
        text: "text",
        title: "title",
      },
    },
  } as MetadataRoute.Manifest;
}
