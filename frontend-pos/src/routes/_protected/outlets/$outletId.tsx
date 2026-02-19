import { createFileRoute } from "@tanstack/react-router";
import { OutletStockPage } from "@/components/outlets/outlet-stock-page";

export const Route = createFileRoute("/_protected/outlets/$outletId")({
  component: OutletStockPage,
});
