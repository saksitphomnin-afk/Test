import { NavBar } from "@/components/NavBar";
import { requireUser } from "@/lib/auth-helpers";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();

  return (
    <div className="min-h-screen">
      <NavBar name={user.name} role={user.role} />
      <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
    </div>
  );
}
