import { MusicView } from "./MusicView";
import { getAlbums, getSite, getTracks } from "@/lib/queries";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Music & Albums",
  description:
    "Stream and buy every record by Jado Sinza & Esther — Yego Niyo, Yankijije Burundu, Ni Nziza, Imbabazi, Aragukunda, Umwizera and Golgotha.",
  alternates: { canonical: "/music" },
};

export default async function MusicPage() {
  const [tracks, albums, site] = await Promise.all([
    getTracks().catch(() => []),
    getAlbums().catch(() => []),
    getSite().catch(() => ({ socials: [] as any[] })),
  ]);

  return (
    <MusicView
      tracks={JSON.parse(JSON.stringify(tracks))}
      albums={JSON.parse(JSON.stringify(albums))}
      socials={JSON.parse(JSON.stringify(site.socials))}
    />
  );
}
