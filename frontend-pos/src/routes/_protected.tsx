import { createFileRoute } from "@tanstack/react-router";
import { AppLayout } from "@/components/app-layout";
import { checkRoleAccess } from "@/lib/rbac";

export const Route = createFileRoute("/_protected")({
  component: ProtectedLayout,
  beforeLoad: async ({ location }) => {
    await checkRoleAccess(location.pathname);
  },
  errorComponent: ({ error, reset }) => (
    <div className="flex min-h-[400px] items-center justify-center p-4">
      <div className="text-center">
        <h2 className="text-xl font-semibold">Something went wrong</h2>
        <p className="text-gray-500">{error.message}</p>
        <button onClick={reset}>Retry</button>
      </div>
    </div>
  ),
});

function ProtectedLayout() {
  return <AppLayout />;
}
