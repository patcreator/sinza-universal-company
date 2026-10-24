import { HomeView } from "./HomeView";
import { getAlbums, getConcerts, getMedia, getPosts, getProducts, getSite, getTracks } from "@/lib/queries";
import { defaultSite, defaultTheme } from "@/lib/settings";
import type { VideoItem } from "@/components/site/VideoLightbox";

export const dynamic = "force-dynamic";

export default async function HomePage({ searchParams }: { searchParams?: Promise<Record<string, string>> }) {
  const params = (await searchParams) ?? {};
  const [site, tracks, albums, concerts, products, posts, media] = await Promise.all([
    getSite().catch(() => ({ site: defaultSite, theme: defaultTheme, seo: {}, payments: {}, schedule: {}, socials: [] })),
    getTracks().catch(() => []),
    getAlbums().catch(() => []),
    getConcerts("upcoming").catch(() => []),
    getProducts().catch(() => []),
    getPosts(6).catch(() => []),
    getMedia().catch(() => []),
  ]);

  const videos = media.filter((m) => m.type === "video") as unknown as VideoItem[];

  return (
    <HomeView
      theme={site.theme}
      site={site.site}
      tracks={JSON.parse(JSON.stringify(tracks))}
      albums={JSON.parse(JSON.stringify(albums))}
      concerts={JSON.parse(JSON.stringify(concerts))}
      products={JSON.parse(JSON.stringify(products))}
      posts={JSON.parse(JSON.stringify(posts))}
      videos={JSON.parse(JSON.stringify(videos))}
      lang={params.lang ?? "en"}
    />
  );
}
