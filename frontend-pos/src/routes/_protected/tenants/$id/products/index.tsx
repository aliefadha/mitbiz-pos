import { createFileRoute } from "@tanstack/react-router";
import { TenantProductsPage } from "@/components/tenants/tenant-products-page";

export const Route = createFileRoute("/_protected/tenants/$id/products/")({
  component: TenantProductsPage,
});
