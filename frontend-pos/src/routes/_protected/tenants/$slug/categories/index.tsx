import { createFileRoute } from "@tanstack/react-router";
import { TenantCategoriesPage } from "@/components/tenants/tenant-categories-page";

export const Route = createFileRoute("/_protected/tenants/$slug/categories/")({
  component: TenantCategoriesPage,
});
