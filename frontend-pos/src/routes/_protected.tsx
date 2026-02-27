import { createFileRoute } from "@tanstack/react-router";
import { AppLayout } from "@/components/app-layout";
import { checkRoleAccess } from "@/lib/rbac";
import { ErrorPage } from "@/components/error-page";

export const Route = createFileRoute("/_protected")({
  component: ProtectedLayout,
  beforeLoad: async ({ location }) => {
    await checkRoleAccess(location.pathname);
  },
  errorComponent: ({ error, reset }) => (
    <ErrorPage error={error} reset={reset} />
  ),
});

function ProtectedLayout() {
  return <AppLayout />;
}
