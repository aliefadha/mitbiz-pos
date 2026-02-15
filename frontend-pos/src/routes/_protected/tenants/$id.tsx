import { createFileRoute } from "@tanstack/react-router";
import { TenantDetailPage } from "@/components/tenants/tenant-detail-page";

export const Route = createFileRoute("/_protected/tenants/$id")({
  component: TenantDetailPage,
});
