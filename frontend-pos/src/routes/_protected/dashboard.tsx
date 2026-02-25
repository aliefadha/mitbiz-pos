import { createFileRoute } from "@tanstack/react-router";
import { useAuth } from "@/contexts/auth-context";

export const Route = createFileRoute("/_protected/dashboard")({
  component: DashboardPage,
});

function DashboardPage() {
  const { role } = useAuth();

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
