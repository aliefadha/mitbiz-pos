import { createFileRoute } from "@tanstack/react-router";
import { OutletDetailPage } from "@/components/outlets/outlet-detail-page";

export const Route = createFileRoute("/_protected/tenants/$id/outlets/$outletId")({
  component: OutletDetailPage,
});
