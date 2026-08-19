import { AppSidebar } from "@/components/AppSidebar";
import { NavBar } from "@/components/NavBar";
import { requireUser } from "@/lib/auth-helpers";

export const dynamic = "force-dynamic";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();

  return (
    <div className="flex min-h-screen">
      <AppSidebar name={user.name} role={user.role} />
      <div className="flex min-h-screen flex-1 flex-col">
        <NavBar name={user.name} role={user.role} />
        <main className="mx-auto w-full max-w-6xl px-4 py-6">{children}</main>
      </div>
    </div>
  );
}
