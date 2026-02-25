import { Outlet, createRootRouteWithContext } from "@tanstack/react-router";
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";
import { TanStackDevtools } from "@tanstack/react-devtools";
import { QueryClient } from "@tanstack/react-query";
import { Toaster } from "sonner";

import TanStackQueryDevtools from "../integrations/tanstack-query/devtools";
import { AuthProvider } from "../contexts/auth-context";
import { TenantProvider } from "../contexts/tenant-context";

interface MyRouterContext {
  queryClient: QueryClient;
}

export const Route = createRootRouteWithContext<MyRouterContext>()({
  component: () => (
    <AuthProvider>
      <TenantProvider>
        <Layout />
      </TenantProvider>
    </AuthProvider>
  ),
  errorComponent: ({ error, reset }) => (
    <div className="flex min-h-[400px] items-center justify-center p-4">
      <div className="text-center">
        <h2 className="text-xl font-semibold">Router Error</h2>
        <p className="text-gray-500">{error.message}</p>
        <button onClick={reset}>Retry</button>
      </div>
    </div>
  ),
});

function Layout() {
  return (
    <>
      <Toaster position="bottom-right" richColors />
      <Outlet />
      <TanStackDevtools
        config={{
          position: "bottom-right",
        }}
        plugins={[
          {
            name: "TanStack Router",
            render: <TanStackRouterDevtoolsPanel />,
          },
          TanStackQueryDevtools,
        ]}
      />
    </>
  );
}
