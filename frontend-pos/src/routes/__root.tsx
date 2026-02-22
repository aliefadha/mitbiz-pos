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
