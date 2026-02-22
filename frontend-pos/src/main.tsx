import { StrictMode } from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider, createRouter } from "@tanstack/react-router";
import { TooltipProvider } from "@/components/ui/tooltip";

import * as TanStackQueryProvider from "./integrations/tanstack-query/root-provider.tsx";

import { routeTree } from "./routeTree.gen";

// Import Plus Jakarta Sans font
import "@fontsource/plus-jakarta-sans/400.css";
import "@fontsource/plus-jakarta-sans/500.css";
import "@fontsource/plus-jakarta-sans/600.css";
import "@fontsource/plus-jakarta-sans/700.css";

import "./styles.css";
import reportWebVitals from "./reportWebVitals.ts";
import { ErrorBoundary } from "./components/error-boundary.tsx";

// Create a new router instance

const TanStackQueryProviderContext = TanStackQueryProvider.getContext();
const router = createRouter({
  routeTree,
  context: {
    ...TanStackQueryProviderContext,
  },
  defaultPreload: "intent",
  scrollRestoration: true,
  defaultStructuralSharing: true,
  defaultPreloadStaleTime: 0,
});

// Register the router instance for type safety
declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

// Render the app
const rootElement = document.getElementById("app");
if (rootElement && !rootElement.innerHTML) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <StrictMode>
      <ErrorBoundary>
        <TanStackQueryProvider.Provider {...TanStackQueryProviderContext}>
          <TooltipProvider>
            <RouterProvider router={router} />
          </TooltipProvider>
        </TanStackQueryProvider.Provider>
      </ErrorBoundary>
    </StrictMode>,
  );
}

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
