import { createFileRoute } from "@tanstack/react-router";
import { TenantOutletsPage } from "@/components/tenants/tenant-outlets-page";

export const Route = createFileRoute("/_protected/tenants/$id/outlets/")({
  component: TenantOutletsPage,
});
