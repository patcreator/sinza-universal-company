import { redirect } from "next/navigation";
import { AdminShell } from "@/components/admin/AdminShell";
import { getAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await getAdmin().catch(() => null);
  if (!admin) redirect("/admin/login");
  return (
    <AdminShell admin={{ username: admin.username, role: admin.role }}>
      {children}
    </AdminShell>
  );
}
