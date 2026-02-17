import { createFileRoute } from "@tanstack/react-router";
import { AppLayout } from "@/components/app-layout";
import { checkRoleAccess } from "@/lib/rbac";
import {ErrorBoundary} from "@/components/error-boundary.tsx";

export const Route = createFileRoute("/_protected")({
  component: ProtectedLayout,
  beforeLoad: async () => {
    await checkRoleAccess(window.location.pathname);
  },
  errorComponent: ({ error }) => (
    <ErrorBoundary fallback={<div>Something went wrong: {error.message}</div>}>
      <div />
    </ErrorBoundary>
  )
});

function ProtectedLayout() {
  return <AppLayout />;
}
