import { TanStackDevtools } from '@tanstack/react-devtools';
import { QueryClient } from '@tanstack/react-query';
import { createRootRouteWithContext, Outlet } from '@tanstack/react-router';
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools';
import { Toaster } from 'sonner';
import { AuthProvider } from '../contexts/auth-context';
import TanStackQueryDevtools from '../integrations/tanstack-query/devtools';

interface MyRouterContext {
  queryClient: QueryClient;
}

export const Route = createRootRouteWithContext<MyRouterContext>()({
  component: () => (
    <AuthProvider>
      <Layout />
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
          position: 'bottom-right',
        }}
        plugins={[
          {
            name: 'TanStack Router',
            render: <TanStackRouterDevtoolsPanel />,
          },
          TanStackQueryDevtools,
        ]}
      />
    </>
  );
}
