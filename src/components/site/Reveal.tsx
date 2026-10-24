import { cn } from "@/lib/format";

/** Entrance animation driven by IntersectionObserver — no library needed. */
export function Reveal({
  children,
  className = "",
  delay = 0,
  as: Tag = "div",
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  as?: any;
}) {
  return (
    <Tag className={cn("reveal", className)} style={{ transitionDelay: `${delay}ms` }}>
      {children}
    </Tag>
  );
}

export function Eyebrow({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <span className={cn("eyebrow", className)}>{children}</span>;
}
