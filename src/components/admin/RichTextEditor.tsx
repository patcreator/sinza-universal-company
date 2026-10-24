"use client";

import { useEffect, useRef, useState } from "react";
import {
  Bold,
  Italic,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Link2,
  Image as ImageIcon,
  Video,
  Minus,
  Undo2,
  Redo2,
  Code,
} from "lucide-react";

/**
 * Lightweight rich text editor for articles, pages and newsletters.
 * Stores HTML. Supports headings, lists, quotes, links, images and video embeds.
 */
export function RichTextEditor({
  value,
  onChange,
  placeholder = "Start writing…",
}: {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [html, setHtml] = useState(value || "");
  const [source, setSource] = useState(false);

  useEffect(() => {
    if (ref.current && ref.current.innerHTML !== value) {
      ref.current.innerHTML = value || "";
    }
  }, [value]);

  const exec = (command: string, arg?: string) => {
    ref.current?.focus();
    document.execCommand(command, false, arg);
    const next = ref.current?.innerHTML ?? "";
    setHtml(next);
    onChange(next);
  };

  const insert = (snippet: string) => {
    exec("insertHTML", snippet);
  };

  const addImage = () => {
    const url = window.prompt("Image URL (use the File Manager to upload first)", "/images/news-crowd.jpg");
    if (url) insert(`<p><img src="${url}" alt="" /></p>`);
  };

  const addVideo = () => {
    const url = window.prompt("YouTube video URL or ID", "https://www.youtube.com/watch?v=Uy0blMiY4mU");
    if (!url) return;
    const match = url.match(/(?:v=|youtu\.be\/|embed\/)([A-Za-z0-9_-]{6,20})/);
    const id = match ? match[1] : url.trim();
    insert(`<div class="ratio ratio-16x9"><iframe src="https://www.youtube.com/embed/${id}" allowfullscreen></iframe></div>`);
  };

  const addLink = () => {
    const url = window.prompt("Link URL", "https://");
    if (url) exec("createLink", url);
  };

  const buttons = [
    { icon: Bold, label: "Bold", action: () => exec("bold") },
    { icon: Italic, label: "Italic", action: () => exec("italic") },
    { icon: Heading2, label: "Heading 2", action: () => exec("formatBlock", "<h2>") },
    { icon: Heading3, label: "Heading 3", action: () => exec("formatBlock", "<h3>") },
    { icon: Quote, label: "Quote", action: () => exec("formatBlock", "<blockquote>") },
    { icon: List, label: "Bulleted list", action: () => exec("insertUnorderedList") },
    { icon: ListOrdered, label: "Numbered list", action: () => exec("insertOrderedList") },
    { icon: Link2, label: "Insert link", action: addLink },
    { icon: ImageIcon, label: "Insert image", action: addImage },
    { icon: Video, label: "Insert video", action: addVideo },
    { icon: Minus, label: "Divider", action: () => insert("<hr/>") },
    { icon: Undo2, label: "Undo", action: () => exec("undo") },
    { icon: Redo2, label: "Redo", action: () => exec("redo") },
    { icon: Code, label: source ? "Visual" : "HTML", action: () => setSource((v) => !v) },
  ];

  return (
    <div className="overflow-hidden rounded-2xl border border-line">
      <div className="flex flex-wrap gap-1 border-b border-line bg-surface-2 p-2">
        {buttons.map((b) => (
          <button
            key={b.label}
            type="button"
            title={b.label}
            aria-label={b.label}
            onClick={b.action}
            className="grid h-9 w-9 place-items-center rounded-lg text-muted transition-colors hover:bg-primary hover:text-white"
          >
            <b.icon size={16} />
          </button>
        ))}
      </div>

      {source ? (
        <textarea
          value={html}
          onChange={(e) => {
            setHtml(e.target.value);
            onChange(e.target.value);
          }}
          rows={16}
          className="w-full bg-bg p-4 font-mono text-[0.85rem] text-text outline-none"
        />
      ) : (
        <div
          ref={ref}
          contentEditable
          suppressContentEditableWarning
          data-placeholder={placeholder}
          className="prose-sinza min-h-[280px] max-w-none bg-bg p-5 outline-none"
          onInput={() => {
            const next = ref.current?.innerHTML ?? "";
            setHtml(next);
            onChange(next);
          }}
        />
      )}
    </div>
  );
}
