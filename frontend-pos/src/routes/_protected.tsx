import { createFileRoute, redirect } from "@tanstack/react-router";
import { AppLayout } from "@/components/app-layout";
import { authClient } from "@/lib/auth-client";
import {ErrorBoundary} from "@/components/error-boundary.tsx";

export const Route = createFileRoute("/_protected")({
  component: ProtectedLayout,
  beforeLoad: async () => {
    const { data: session } = await authClient.getSession();
    if (!session) {
      throw redirect({ to: "/login" });
    }
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
