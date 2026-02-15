import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_protected/dashboard")({
  component: DashboardPage,
});

function DashboardPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1>Dashboard bitches</h1>
    </div>
  );
}
