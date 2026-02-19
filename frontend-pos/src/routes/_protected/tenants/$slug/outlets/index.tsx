import { TenantOutletsPage } from "@/components/tenants/tenant-outlets-page";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_protected/tenants/$slug/outlets/")({
  component: TenantOutletsPage,
});
