import { createFileRoute } from "@tanstack/react-router";
import { authClient } from "@/lib/auth-client";

export const Route = createFileRoute("/_protected/dashboard")({
  component: DashboardPage,
  loader: async () => {
    const { data: session } = await authClient.getSession();
    if (!session) {
      return { role: "cashier" };
    }
    const role = (session.user.role as string) || "cashier";
    return { role };
  },
});

function DashboardPage() {
  const { role } = Route.useLoaderData();

  if (role === "admin") {
    return <AdminDashboard />;
  }

  if (role === "owner") {
    return <OwnerDashboard />;
  }

  return <CashierDashboard />;
}

function AdminDashboard() {
  return (
    <div className="flex flex-col gap-6">
      <h1>Admin Dashboard</h1>
    </div>
  );
}

function OwnerDashboard() {
  return (
    <div className="flex flex-col gap-6">
      <h1>Owner Dashboard</h1>
    </div>
  );
}

function CashierDashboard() {
  return (
    <div className="flex flex-col gap-6">
      <h1>Cashier Dashboard</h1>
    </div>
  );
}
