"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import type { SocialVideo } from "@/lib/socialVideos";

export function SocialPlayer({
  video,
  onClose,
}: {
  video: SocialVideo | null;
  onClose: () => void;
}) {
  const [failed, setFailed] = useState(false);

  useEffect(() => setFailed(false), [video?.id]);

  useEffect(() => {
    if (!video) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [video, onClose]);

  if (!video) return null;

  const useFile = !!video.videoUrl && !failed;
  const isYouTube = video.source === "YouTube";

  return (
    <div
      className="fixed inset-0 z-[100] grid place-items-center bg-black/90 p-4"
      onClick={onClose}
    >
      <div className="relative" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute -top-12 right-0 grid h-10 w-10 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20"
        >
          <X size={18} />
        </button>

        {isYouTube ? (
          <div className="aspect-video w-[min(92vw,1000px)] overflow-hidden rounded-2xl bg-black">
            <iframe
              src={video.embedUrl}
              className="h-full w-full"
              allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
              allowFullScreen
              title={video.title}
            />
          </div>
        ) : useFile ? (
          <video
            key={video.id}
            src={video.videoUrl}
            poster={video.thumbnailUrl || undefined}
            controls
            autoPlay
            playsInline
            onError={() => setFailed(true)}
            className="max-h-[82vh] w-auto max-w-[92vw] rounded-2xl bg-black"
          />
        ) : video.embedUrl ? (
          // Facebook / X fallback, still plays inside the modal
          <div
            className={
              video.source === "X"
                ? "h-[80vh] w-[min(92vw,550px)] overflow-hidden rounded-2xl bg-white"
                : "aspect-video w-[min(92vw,900px)] overflow-hidden rounded-2xl bg-black"
            }
          >
            <iframe
              src={video.embedUrl}
              className="h-full w-full"
              allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
              allowFullScreen
              title={video.title}
            />
          </div>
        ) : (
          <div className="grid h-[40vh] w-[min(92vw,420px)] place-items-center rounded-2xl bg-white/10 p-6 text-center text-white/80">
            This video couldn't be loaded. Please run the sync again.
          </div>
        )}
      </div>
    </div>
  );
}