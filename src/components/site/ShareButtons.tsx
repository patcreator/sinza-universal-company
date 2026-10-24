"use client";

import { useEffect, useState } from "react";
import { Link2, Share2, Check, MessageCircle, Send, Mail } from "lucide-react";
import { SocialIcon } from "@/components/site/Icons";

const Facebook = ({ size = 16 }: { size?: number }) => <SocialIcon platform="facebook" size={size} />;

export function ShareButtons({
  url,
  title,
  compact = false,
}: {
  url: string;
  title: string;
  compact?: boolean;
}) {
  const [fullUrl, setFullUrl] = useState(url);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (url.startsWith("http")) setFullUrl(url);
    else setFullUrl(`${window.location.origin}${url}`);
  }, [url]);

  const encoded = encodeURIComponent(fullUrl);
  const text = encodeURIComponent(title);

  const links = [
    {
      label: "Facebook",
      href: `https://www.facebook.com/sharer/sharer.php?u=${encoded}`,
      icon: (props: { size?: number }) => <SocialIcon platform="facebook" size={props.size ?? 16} />,
    },
    { label: "X", href: `https://x.com/intent/tweet?url=${encoded}&text=${text}`, icon: Share2 },
    { label: "WhatsApp", href: `https://wa.me/?text=${text}%20${encoded}`, icon: MessageCircle },
    { label: "Telegram", href: `https://t.me/share/url?url=${encoded}&text=${text}`, icon: Send },
    { label: "Email", href: `mailto:?subject=${text}&body=${encoded}`, icon: Mail },
  ];

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(fullUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard unavailable */
    }
  };

  return (
    <div className={`flex items-center ${compact ? "gap-1.5" : "gap-2.5"} flex-wrap`}>
      {links.map((l) => (
        <a
          key={l.label}
          href={l.href}
          target="_blank"
          rel="noreferrer noopener"
          aria-label={`Share on ${l.label}`}
          title={`Share on ${l.label}`}
          className={`grid place-items-center rounded-full border border-line text-muted transition-all duration-300 hover:-translate-y-0.5 hover:border-primary hover:text-primary ${
            compact ? "h-8 w-8" : "h-10 w-10"
          }`}
        >
          <l.icon size={compact ? 14 : 16} />
        </a>
      ))}
      <button
        onClick={copy}
        aria-label="Copy link"
        title="Copy link"
        className={`grid place-items-center rounded-full border transition-all duration-300 hover:-translate-y-0.5 ${
          copied ? "border-primary bg-primary text-white" : "border-line text-muted hover:border-primary hover:text-primary"
        } ${compact ? "h-8 w-8" : "h-10 w-10"}`}
      >
        {copied ? <Check size={compact ? 14 : 16} /> : <Link2 size={compact ? 14 : 16} />}
      </button>
    </div>
  );
}
