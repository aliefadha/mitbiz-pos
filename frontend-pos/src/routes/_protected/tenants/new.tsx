import { createFileRoute } from "@tanstack/react-router";
import { CreateTenantPage } from "@/components/tenants/create-tenant-page";

export const Route = createFileRoute("/_protected/tenants/new")({
  component: CreateTenantPage,
});
