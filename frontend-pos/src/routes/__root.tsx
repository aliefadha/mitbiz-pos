import { Outlet, createRootRouteWithContext } from "@tanstack/react-router";
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";
import { TanStackDevtools } from "@tanstack/react-devtools";
import { QueryClient } from "@tanstack/react-query";
import { App, notification } from "antd";

import TanStackQueryDevtools from "../integrations/tanstack-query/devtools";
import { AuthProvider } from "../contexts/auth-context";

interface MyRouterContext {
  queryClient: QueryClient;
}

export const Route = createRootRouteWithContext<MyRouterContext>()({
  component: () => (
    <AuthProvider>
      <App>
        <Layout />
      </App>
    </AuthProvider>
  ),
});

function Layout() {
  const [, contextHolder] = notification.useNotification();

  return (
    <>
      {contextHolder}
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
