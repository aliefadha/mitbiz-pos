import { createFileRoute } from "@tanstack/react-router";
import { ProductPage } from "@/components/products/product-page";

export const Route = createFileRoute("/_protected/products/")({
  component: ProductPage,
});
