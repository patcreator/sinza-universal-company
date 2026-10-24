"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { LayoutDashboard, Palette, LogOut, Menu, X, ExternalLink, Send, RefreshCw, Home } from "lucide-react";
import { SinzaMark } from "@/components/site/Logo";
import { NAV_GROUPS, RESOURCES } from "@/lib/admin-resources";
import { cn } from "@/lib/format";

export function AdminShell({ children, admin }: { children: React.ReactNode; admin: { username: string; role: string } }) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);

  const logout = async () => {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  };

  const runSync = async () => {
    setBusy("sync");
    await fetch("/api/admin/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ source: "all" }),
    });
    setBusy(null);
    router.refresh();
  };

  const sendNewsletter = async () => {
    setBusy("send");
    await fetch("/api/cron/newsletter?force=1", { method: "GET" });
    setBusy(null);
    router.refresh();
  };

  return (
    <div className="flex min-h-screen bg-bg">
      {/* sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-[70] w-[268px] overflow-y-auto border-r border-line bg-surface transition-transform duration-300 lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex items-center gap-3 border-b border-line px-6 py-5">
          <SinzaMark size={32} />
          <div>
            <p className="font-display text-[1.05rem] leading-none">Sinza Universal</p>
            <p className="mt-1 text-[0.66rem] uppercase tracking-[0.2em] text-muted">Admin console</p>
          </div>
          <button onClick={() => setOpen(false)} className="ml-auto text-muted lg:hidden" aria-label="Close menu">
            <X size={18} />
          </button>
        </div>

        <nav className="p-4">
          <Link
            href="/admin"
            className={cn(
              "flex items-center gap-3 rounded-xl px-4 py-2.5 text-[0.9rem] transition-colors",
              pathname === "/admin" ? "bg-primary text-white" : "text-muted hover:bg-surface-2 hover:text-text",
            )}
          >
            <LayoutDashboard size={16} /> Dashboard
          </Link>
          <Link
            href="/admin/appearance"
            className={cn(
              "mt-1 flex items-center gap-3 rounded-xl px-4 py-2.5 text-[0.9rem] transition-colors",
              pathname === "/admin/appearance" ? "bg-primary text-white" : "text-muted hover:bg-surface-2 hover:text-text",
            )}
          >
            <Palette size={16} /> Appearance & settings
          </Link>

          {NAV_GROUPS.map((group) => (
            <div key={group.label} className="mt-7">
              <p className="px-4 text-[0.62rem] uppercase tracking-[0.24em] text-muted">{group.label}</p>
              <ul className="mt-2.5 space-y-0.5">
                {group.items.map((key) => {
                  const config = RESOURCES[key];
                  if (!config) return null;
                  const href = `/admin/${key}`;
                  const active = pathname.startsWith(href);
                  return (
                    <li key={key}>
                      <Link
                        href={href}
                        className={cn(
                          "flex items-center justify-between rounded-xl px-4 py-2.5 text-[0.88rem] transition-colors",
                          active ? "bg-primary/12 text-primary" : "text-muted hover:bg-surface-2 hover:text-text",
                        )}
                      >
                        {config.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        <div className="sticky bottom-0 border-t border-line bg-surface p-4">
          <div className="rounded-xl bg-surface-2 p-4">
            <p className="text-[0.72rem] uppercase tracking-[0.18em] text-muted">Signed in as</p>
            <p className="mt-1.5 font-medium">{admin.username}</p>
            <p className="text-[0.78rem] capitalize text-muted">{admin.role}</p>
          </div>
          <button onClick={logout} className="mt-3 flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-[0.88rem] text-muted transition-colors hover:bg-surface-2 hover:text-primary">
            <LogOut size={16} /> Sign out
          </button>
        </div>
      </aside>

      {/* main */}
      <div className="flex min-w-0 flex-1 flex-col lg:ml-[268px]">
        <header className="sticky top-0 z-[60] flex items-center gap-3 border-b border-line bg-bg/85 px-5 py-4 backdrop-blur-md sm:px-8">
          <button onClick={() => setOpen(true)} className="lg:hidden" aria-label="Open menu">
            <Menu size={20} />
          </button>
          <div className="ml-auto flex flex-wrap items-center gap-2">
            <button onClick={runSync} disabled={busy === "sync"} className="btn btn-ghost h-10 px-4 text-[0.8rem]">
              <RefreshCw size={15} className={busy === "sync" ? "animate-spin" : ""} /> Sync socials
            </button>
            <button onClick={sendNewsletter} disabled={busy === "send"} className="btn btn-ghost h-10 px-4 text-[0.8rem]">
              <Send size={15} /> Send newsletter
            </button>
            <Link href="/" className="btn btn-primary h-10 px-4 text-[0.8rem]">
              <Home size={15} /> View site <ExternalLink size={13} />
            </Link>
          </div>
        </header>

        <main className="flex-1 px-5 py-8 sm:px-8">{children}</main>
      </div>
    </div>
  );
}
