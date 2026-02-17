import { createFileRoute } from "@tanstack/react-router";
import { NewProductPage } from "@/components/tenants/new-product-page";

export const Route = createFileRoute("/_protected/tenants/$id/products/new")({
  component: NewProductPage,
});
