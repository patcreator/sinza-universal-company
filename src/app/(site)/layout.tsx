import { Nav, Spine, type Social } from "@/components/site/Nav";
import { Footer } from "@/components/site/Footer";
import { PlayerDock } from "@/components/site/PlayerDock";
import { VideoLightbox, type VideoItem } from "@/components/site/VideoLightbox";
import { getMedia, getSite } from "@/lib/queries";
import { defaultSite, defaultTheme } from "@/lib/settings";

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const data = await getSite().catch(() => ({
    site: defaultSite as Record<string, any>,
    theme: defaultTheme as Record<string, any>,
    seo: {},
    payments: {},
    schedule: {},
    socials: [] as Social[],
  }));
  const media = await getMedia().catch(() => []);
  const videos = JSON.parse(
    JSON.stringify(media.filter((m) => m.type === "video")),
  ) as VideoItem[];

  return (
    <div className="relative min-h-screen">
      <Nav
        socials={data.socials as Social[]}
        allowModeSwitch={data.theme?.allowModeSwitch !== false}
        showStore={data.site?.showStore !== false}
        showNews={data.site?.showNews !== false}
      />
      <main>{children}</main>
      <Footer site={data.site} socials={data.socials as Social[]} />
      <PlayerDock />
      <VideoLightbox videos={videos} />
    </div>
  );
}
